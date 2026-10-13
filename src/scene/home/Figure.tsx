import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HEAT, NOISE } from '../shared/glsl'
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
void main(){
  vUv = uv;
  float d = texture2D(uDepth, uv).r;
  vec3 p = position;
  p.z += d * uDepthScale;
  float e = 1.5 / 512.;
  float dx = texture2D(uDepth, uv + vec2(e, 0.)).r - texture2D(uDepth, uv - vec2(e, 0.)).r;
  float dy = texture2D(uDepth, uv + vec2(0., e)).r - texture2D(uDepth, uv - vec2(0., e)).r;
  vec3 n = normalize(vec3(-dx * uDepthScale / (2. * e * uSize.x), -dy * uDepthScale / (2. * e * uSize.y), 1.));
  vN = normalize(normalMatrix * n);
  vLocal = p;
  vDepth = d;
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
  // Seams that have been welded keep a faint glow while hot
  float sn = fbm(vec3(vLocal.xy * 3.2, 1.7));
  float seam = smoothstep(.49, .5, sn) * (1. - smoothstep(.5, .512, sn));

  // 1. Silhouette: soot black, rim lit by the arc light behind
  vec3 sil = vec3(0.012) + rim * mix(uArc, uHeat, .25) * 1.15 + weld + heatRamp(.45) * seam * 0.55 * clamp(1. - f * 4., 0., 1.);

  // 2. Blueprint: depth contour lines in arc blue
  float lines = abs(fract(vDepth * 38. - uTime * .05) - .5);
  float lw = fwidth(vDepth * 38.) * 1.2;
  float contour = 1. - smoothstep(0., lw, lines - .02);
  float scan = smoothstep(.985, 1., sin(vUv.y * 420.)) * .25;
  vec3 bp = vec3(.006, .01, .02) + uArc * (contour * .9 + scan) + rim * uArc * .55 + weld * .6;

  // 3. Hot metal cooling into skin: a crack network that recedes as it cools
  float n = fbm(vec3(vLocal.xy * 2.6, uTime * .08));
  float cool = smoothstep(.66, .95, f);
  float crackLine = 1. - smoothstep(0., .07, abs(n - .5));
  float temp = clamp(crackLine * (1. - cool) * 1.1 + (1. - cool) * .18, 0., 1.);
  vec3 lum = vec3(dot(tex.rgb, vec3(.299, .587, .114)));
  vec3 hot = mix(lum * .7, tex.rgb, cool) * (.55 + .35 * ndv) + heatRamp(temp) * pow(temp, 1.4) * 2.2 + rim * uHeat * (1. - cool) * .5;

  // 4. Real: lit portrait
  vec3 L = normalize(vec3(.35, .6, .9));
  float diff = max(dot(N, L), 0.);
  vec3 real = tex.rgb * (.62 + .5 * diff) + rim * uArc * .28;

  // Spark phase: soot with burning cracks
  float crack = smoothstep(.55, .6, fbm(vec3(vLocal.xy * 5., uTime * .4)));
  vec3 spark = vec3(.02) + heatRamp(.6 + crack * .4) * crack * 1.4 + rim * uHeat * .4;

  float sum = wSil + wBp + wSpark + wHot + wReal + 1e-4;
  vec3 col = (sil * wSil + bp * wBp + spark * wSpark + hot * wHot + real * wReal) / sum;

  // Dissolve with a burning edge (spark phase and teleports)
  float dis = max(uDissolve, wSpark * .42);
  float dn = fbm(vec3(vLocal.xy * 6., 3.1)) * .9 + vUv.y * .1;
  float cut = dis * 1.08 - .02;
  if (dn < cut) discard;
  float edge = 1. - smoothstep(0., .05, dn - cut);
  col += heatRamp(.8) * edge * step(.001, dis) * 2.2;

  // feathered silhouette edge
  gl_FragColor = vec4(col, edgeA);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

const POINTS_VERT = /* glsl */ `
${COMMON}
attribute float aSeed;
uniform float uPixel;
varying float vAlpha;
varying float vTemp;
void main(){
  vec2 uv0 = uv;
  float d = texture2D(uDepth, uv0).r;
  vec3 base = position;
  base.z += d * uDepthScale;
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

    // Points: sample the masked surface
    const stepU = quality === 'high' ? 1 / 150 : 1 / 100
    const pos: number[] = []
    const uv: number[] = []
    const seed: number[] = []
    for (let v = 0; v <= 1; v += stepU * (PORTRAIT.width / PORTRAIT.height)) {
      for (let u = 0; u <= 1; u += stepU) {
        const ju = u + (Math.random() - 0.5) * stepU
        const jv = v + (Math.random() - 0.5) * stepU
        if (data.alpha(ju, jv) < 0.6) continue
        pos.push((ju - 0.5) * PORTRAIT.width, jv * PORTRAIT.height, 0)
        uv.push(ju, jv)
        seed.push(Math.random())
      }
    }
    const pg = new THREE.BufferGeometry()
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    pg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    pg.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1))
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
        side: THREE.DoubleSide,
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
    uniforms.uForge.value = figureState.forge
    uniforms.uDissolve.value = figureState.dissolve
    uniforms.uPixel.value = state.viewport.dpr * (state.size.height / 900) * 1.4
  })

  return (
    <group>
      <mesh geometry={geometry} material={meshMat} frustumCulled={false} />
      <points geometry={points} material={pointsMat} frustumCulled={false} />
    </group>
  )
}
