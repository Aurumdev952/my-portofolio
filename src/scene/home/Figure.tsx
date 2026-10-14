import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HEAT, NOISE } from '../shared/glsl'
import { qaOff } from '#/motion/engine'
import { PORTRAIT } from '../shared/portrait'
import type { PortraitData } from '../shared/portrait'

/** Mutable state the scene writes and the figure reads every frame. */
export const figureState = {
  forge: 0,
  dissolve: 0,
  /** torch hot spots in figure local space, w = intensity */
  weld: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()],
  lookX: 0,
  lookY: 0,
}

const COMMON = /* glsl */ `
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform float uForge;
uniform float uDissolve;
uniform float uTime;
uniform float uDepthScale;
uniform vec2 uSize;
${NOISE}
${HEAT}
float bell(float x, float a, float b, float c, float d){ return smoothstep(a, b, x) * (1. - smoothstep(c, d, x)); }
`

const MESH_VERT = /* glsl */ `
${COMMON}
varying vec2 vUv;
varying vec3 vN;
varying vec3 vView;
varying vec3 vLocal;
varying float vDepth;
// The relief is baked into the geometry at load (position.z and normals), so the vertex
// shader reads no textures at all.
attribute float aDepth;
void main(){
  vUv = uv;
  vec3 p = position;
  vN = normalize(normalMatrix * normal);
  vLocal = p;
  vDepth = aDepth;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`

const MESH_FRAG = /* glsl */ `
${COMMON}
uniform vec4 uWeld[4];
uniform vec3 uArc;
uniform vec3 uHeat;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vView;
varying vec3 vLocal;
varying float vDepth;
void main(){
  vec4 tex = texture2D(uColor, vUv);
  if (tex.a < 0.28) discard;
  float edgeA = smoothstep(0.28, 0.72, tex.a);
  vec3 N = normalize(vN);
  vec3 V = normalize(vView);
  float ndv = max(dot(N, V), 0.);
  float rim = pow(1. - ndv, 2.6);
  float f = uForge;

  float wSil = 1. - smoothstep(0.1, 0.3, f);
  float wBp = bell(f, 0.12, 0.32, 0.46, 0.58);
  float wSpark = bell(f, 0.46, 0.56, 0.62, 0.72);
  float wHot = bell(f, 0.62, 0.72, 0.86, 0.97);
  float wReal = smoothstep(0.86, 0.97, f);

  // Weld hot spots
  vec3 weld = vec3(0.);
  for (int i = 0; i < 4; i++){
    vec3 w = uWeld[i].xyz;
    float dist = length(vLocal.xy - w.xy);
    float spot = exp(-dist * dist / 0.0012) * uWeld[i].w;
    float halo = exp(-dist * dist / 0.012) * uWeld[i].w * .35;
    weld += heatRamp(.75 + spot * .25) * spot * 3. + heatRamp(.35) * halo;
  }
  // Every phase is computed only while its weight is non zero. The weights come from a
  // uniform, so the whole draw takes the same branch and skipped noise costs nothing.
  vec3 col = vec3(0.);
  float sum = 1e-4;

  // 1. Silhouette: soot black, rim lit by the arc light behind, faint welded seams
  if (wSil > 0.001) {
    float seam = 0.;
    if (f < 0.25) {
      float sn = fbm(vec3(vLocal.xy * 3.2, 1.7));
      seam = smoothstep(.49, .5, sn) * (1. - smoothstep(.5, .512, sn));
    }
    vec3 sil = vec3(0.012) + rim * mix(uArc, uHeat, .25) * 1.15 + weld + heatRamp(.45) * seam * 0.55 * clamp(1. - f * 4., 0., 1.);
    col += sil * wSil; sum += wSil;
  }

  // 2. Blueprint: depth contour lines in arc blue
  if (wBp > 0.001) {
    float lines = abs(fract(vDepth * 38. - uTime * .05) - .5);
    float lw = fwidth(vDepth * 38.) * 1.2;
    float contour = 1. - smoothstep(0., lw, lines - .02);
    float scan = smoothstep(.985, 1., sin(vUv.y * 420.)) * .25;
    vec3 bp = vec3(.006, .01, .02) + uArc * (contour * .9 + scan) + rim * uArc * .55 + weld * .6;
    col += bp * wBp; sum += wBp;
  }

  // 3. Spark phase: soot with burning cracks
  if (wSpark > 0.001) {
    float crack = smoothstep(.55, .6, fbm(vec3(vLocal.xy * 5., uTime * .4)));
    vec3 spark = vec3(.02) + heatRamp(.6 + crack * .4) * crack * 1.4 + rim * uHeat * .4;
    col += spark * wSpark; sum += wSpark;
  }

  // 4. Hot metal cooling into skin: a crack network that recedes as it cools
  if (wHot > 0.001) {
    float n = fbm(vec3(vLocal.xy * 2.6, uTime * .08));
    float cool = smoothstep(.66, .95, f);
    float crackLine = 1. - smoothstep(0., .07, abs(n - .5));
    float temp = clamp(crackLine * (1. - cool) * 1.1 + (1. - cool) * .18, 0., 1.);
    vec3 lum = vec3(dot(tex.rgb, vec3(.299, .587, .114)));
    vec3 hot = mix(lum * .7, tex.rgb, cool) * (.55 + .35 * ndv) + heatRamp(temp) * pow(temp, 1.4) * 2.2 + rim * uHeat * (1. - cool) * .5;
    col += hot * wHot; sum += wHot;
  }

  // 5. Real: lit portrait
  if (wReal > 0.001) {
    vec3 L = normalize(vec3(.35, .6, .9));
    float diff = max(dot(N, L), 0.);
    vec3 real = tex.rgb * (.62 + .5 * diff) + rim * uArc * .28;
    col += real * wReal; sum += wReal;
  }
  col /= sum;

  // Dissolve with a burning edge (spark phase and teleports)
  float dis = max(uDissolve, wSpark * .42);
  if (dis > 0.001) {
    float dn = fbm(vec3(vLocal.xy * 6., 3.1)) * .9 + vUv.y * .1;
    float cut = dis * 1.08 - .02;
    if (dn < cut) discard;
    float edge = 1. - smoothstep(0., .05, dn - cut);
    col += heatRamp(.8) * edge * 2.2;
  }

  // feathered silhouette edge; the bust melts into its pedestal instead of a hard crop
  float base = smoothstep(0.0, 0.1, vUv.y);
  gl_FragColor = vec4(col * mix(0.35, 1., base), edgeA * mix(0.0, 1., smoothstep(0.0, 0.05, vUv.y)));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

const POINTS_VERT = /* glsl */ `
${COMMON}
attribute float aSeed;
attribute float aDepth;
uniform float uPixel;
varying float vAlpha;
varying float vTemp;
void main(){
  vec3 base = position;
  float wSpark = bell(uForge, 0.44, 0.56, 0.62, 0.74);
  float amt = max(wSpark * .22, uDissolve);
  float vis = max(wSpark, uDissolve);
  vec3 h = hash33(vec3(aSeed, aSeed * 1.7, aSeed * 3.1)) - .5;
  float t = uTime * (.4 + h.x * .3) + aSeed * 6.28;
  vec3 swirl = vec3(sin(t + base.y * 2.), cos(t * .8 + base.x * 3.), sin(t * 1.3)) * .12;
  vec3 burst = normalize(h + vec3(0., .25, .35)) * (0.6 + h.y * 1.2);
  vec3 p = base + (swirl + burst * amt * 1.15 + vec3(0., amt * amt * .6, 0.)) * amt;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  float flick = .6 + .4 * sin(uTime * 14. + aSeed * 40.);
  vAlpha = vis * flick;
  vTemp = .55 + h.z * .7;
  gl_PointSize = uPixel * (1.2 + h.y * 2.) * (8. / -mv.z) * (0.7 + amt);
}
`

const POINTS_FRAG = /* glsl */ `
${HEAT}
varying float vAlpha;
varying float vTemp;
void main(){
  vec2 c = gl_PointCoord - .5;
  float r = length(c);
  if (r > .5) discard;
  float a = smoothstep(.5, 0., r) * vAlpha;
  gl_FragColor = vec4(heatRamp(vTemp) * a * 2., a);
}
`

export function Figure({ data, quality }: { data: PortraitData; quality: 'high' | 'low' }) {
  const { geometry, points, uniforms } = useMemo(() => {
    const segX = quality === 'high' ? 280 : 170
    const segY = Math.round(segX * (PORTRAIT.height / PORTRAIT.width))
    const geometry = new THREE.PlaneGeometry(PORTRAIT.width, PORTRAIT.height, segX, segY)
    geometry.translate(0, PORTRAIT.height / 2, 0)
    // bake the relief once: depth into z, then normals from the displaced grid
    {
      const pa = geometry.attributes.position as THREE.BufferAttribute
      const ua = geometry.attributes.uv as THREE.BufferAttribute
      const depthArr = new Float32Array(pa.count)
      for (let k = 0; k < pa.count; k++) {
        const d = data.depthFine(ua.getX(k), ua.getY(k))
        depthArr[k] = d
        pa.setZ(k, d * PORTRAIT.depthScale)
      }
      geometry.setAttribute('aDepth', new THREE.BufferAttribute(depthArr, 1))
      geometry.computeVertexNormals()
    }

    // Points: sample the masked surface
    const stepU = quality === 'high' ? 1 / 150 : 1 / 100
    const pos: number[] = []
    const uv: number[] = []
    const seed: number[] = []
    const depthP: number[] = []
    for (let v = 0; v <= 1; v += stepU * (PORTRAIT.width / PORTRAIT.height)) {
      for (let u = 0; u <= 1; u += stepU) {
        const ju = u + (Math.random() - 0.5) * stepU
        const jv = v + (Math.random() - 0.5) * stepU
        if (data.alpha(ju, jv) < 0.6) continue
        const d = data.depthFine(ju, jv)
        pos.push((ju - 0.5) * PORTRAIT.width, jv * PORTRAIT.height, d * PORTRAIT.depthScale)
        uv.push(ju, jv)
        depthP.push(d)
        seed.push(Math.random())
      }
    }
    const pg = new THREE.BufferGeometry()
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    pg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    pg.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1))
    pg.setAttribute('aDepth', new THREE.Float32BufferAttribute(depthP, 1))
    pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, PORTRAIT.height / 2, 0), 4)

    const uniforms = {
      uColor: { value: data.color },
      uDepth: { value: data.depth },
      uForge: { value: 0 },
      uDissolve: { value: 0 },
      uTime: { value: 0 },
      uDepthScale: { value: PORTRAIT.depthScale },
      uSize: { value: new THREE.Vector2(PORTRAIT.width, PORTRAIT.height) },
      uWeld: { value: figureState.weld },
      uArc: { value: new THREE.Color('#bfd9ff') },
      uHeat: { value: new THREE.Color('#ff7a1a') },
      uPixel: { value: 1 },
    }
    return { geometry, points: pg, uniforms }
  }, [data, quality])

  const meshMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: MESH_VERT,
        fragmentShader: MESH_FRAG,
        // front only: a two sided transparent material is drawn twice
        side: THREE.FrontSide,
        transparent: true,
        depthWrite: true,
      }),
    [uniforms],
  )
  const pointsMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: POINTS_VERT,
        fragmentShader: POINTS_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  )

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime
    const f = figureState.forge
    // the cloud stays in the scene (so its shader is warmed up) but draws nothing when unseen
    const on = figureState.dissolve > 0.002 || (f > 0.44 && f < 0.74)
    points.setDrawRange(0, on ? Infinity : 0)
    uniforms.uForge.value = figureState.forge
    uniforms.uDissolve.value = figureState.dissolve
    uniforms.uPixel.value = state.viewport.dpr * (state.size.height / 900) * 1.4
  })

  return (
    <group>
      <mesh geometry={geometry} material={meshMat} frustumCulled={false} visible={!qaOff('figmesh')} />
      <points geometry={points} material={pointsMat} frustumCulled={false} />
    </group>
  )
}
