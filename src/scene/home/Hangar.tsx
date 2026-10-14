import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { story } from '#/motion/story'
import { qaOff } from '#/motion/engine'

// Large flat surfaces use Lambert shading: they are dark, rough and mostly in fog, so full
// physically based shading costs a lot of fill rate for no visible difference.
const steel = new THREE.MeshLambertMaterial({ color: '#2a2d33' })
const darkSteel = new THREE.MeshLambertMaterial({ color: '#16181c' })

function floorTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')!
  g.fillStyle = '#0d0e11'
  g.fillRect(0, 0, 512, 512)
  g.strokeStyle = 'rgba(255,255,255,0.05)'
  g.lineWidth = 2
  for (let i = 0; i <= 512; i += 128) {
    g.beginPath()
    g.moveTo(i, 0)
    g.lineTo(i, 512)
    g.moveTo(0, i)
    g.lineTo(512, i)
    g.stroke()
  }
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`
    g.fillRect(Math.random() * 512, Math.random() * 512, 2 + Math.random() * 12, 1)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(24, 24)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** Instanced columns and roof trusses along the hall. */
function Structure() {
  const cols = useRef<THREE.InstancedMesh>(null)
  const beams = useRef<THREE.InstancedMesh>(null)
  const lamps = useRef<THREE.InstancedMesh>(null)
  const zs = useMemo(() => Array.from({ length: 9 }, (_, i) => 8 - i * 6), [])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    let i = 0
    for (const z of zs) {
      for (const x of [-21, 21]) {
        m.makeTranslation(x, 6, z)
        cols.current!.setMatrixAt(i++, m)
      }
    }
    cols.current!.instanceMatrix.needsUpdate = true
    i = 0
    for (const z of zs) {
      m.makeTranslation(0, 11.6, z)
      beams.current!.setMatrixAt(i++, m)
    }
    beams.current!.instanceMatrix.needsUpdate = true
    i = 0
    for (const z of zs) {
      for (const x of [-12, -4.5, 4.5, 12]) {
        m.makeTranslation(x, 11.1, z - 3)
        lamps.current!.setMatrixAt(i++, m)
      }
    }
    lamps.current!.instanceMatrix.needsUpdate = true
  }, [zs])
  return (
    <>
      <instancedMesh ref={cols} args={[undefined, steel, zs.length * 2]}>
        <boxGeometry args={[0.6, 12, 0.6]} />
      </instancedMesh>
      <instancedMesh ref={beams} args={[undefined, darkSteel, zs.length]}>
        <boxGeometry args={[42.6, 0.5, 0.4]} />
      </instancedMesh>
      <instancedMesh ref={lamps} args={[undefined, undefined, zs.length * 4]}>
        <boxGeometry args={[2.2, 0.06, 0.3]} />
        <meshBasicMaterial color="#cfe0ff" toneMapped={false} />
      </instancedMesh>
    </>
  )
}

/** Fake volumetric light: additive cone with a soft vertical falloff. */
export function LightShaft({
  position,
  height = 9,
  radius = 2.4,
  color = '#bfd9ff',
  strength = 0.22,
}: {
  position: [number, number, number]
  height?: number
  radius?: number
  color?: string
  strength?: number
}) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uColor: { value: new THREE.Color(color) }, uStrength: { value: strength }, uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main(){ vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uStrength; uniform float uTime;
          varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main(){
            float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
            float fall = smoothstep(0., .9, vUv.y) * smoothstep(1., .75, vUv.y);
            float dust = .85 + .15 * sin(vUv.y * 40. + uTime * .6);
            gl_FragColor = vec4(uColor * edge * fall * uStrength * dust, 1.);
          }`,
      }),
    [color, strength],
  )
  useFrame((s) => (mat.uniforms.uTime.value = s.clock.elapsedTime))
  return (
    <mesh position={position} material={mat}>
      <cylinderGeometry args={[0.15, radius, height, 40, 1, true]} />
    </mesh>
  )
}

/** Soft additive glow sprite. */
export function Glow({
  position,
  scale = [6, 6],
  color = '#bfd9ff',
  opacity = 0.5,
  rotation,
}: {
  position: [number, number, number]
  scale?: [number, number]
  color?: string
  opacity?: number
  rotation?: [number, number, number]
}) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grd.addColorStop(0, 'rgba(255,255,255,1)')
    grd.addColorStop(0.25, 'rgba(255,255,255,.45)')
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])
  return (
    <mesh position={position} rotation={rotation} scale={[scale[0], scale[1], 1]}>
      <planeGeometry />
      <meshBasicMaterial
        map={tex}
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

function Dust({ count }: { count: number }) {
  const { geom, mat } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 38
      pos[i * 3 + 1] = Math.random() * 8
      pos[i * 3 + 2] = 8 - Math.random() * 42
    }
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPx: { value: 1 } },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uPx; varying float vA;
        void main(){
          vec3 p = position;
          float s = fract(sin(dot(p.xz, vec2(12.9898,78.233))) * 43758.5453);
          p.y = mod(p.y + uTime * (0.05 + s * .08), 8.);
          p.x += sin(uTime * .2 + s * 6.28) * .4;
          vec4 mv = modelViewMatrix * vec4(p, 1.);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = min(uPx * (1. + s * 2.) * (4. / -mv.z), 5. * uPx);
          vA = .25 + s * .5;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main(){ float r = length(gl_PointCoord - .5); if (r > .5) discard; gl_FragColor = vec4(vec3(.85,.9,1.) * (1. - r * 2.) * vA, 1.); }`,
    })
    return { geom, mat }
  }, [count])
  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime
    mat.uniforms.uPx.value = s.viewport.dpr * 2
  })
  return <points geometry={geom} material={mat} frustumCulled={false} />
}

/** Set while the scene warms up its shaders, so far-away parts are compiled too. */
export const hangarState = { showAll: false }

/** Gate at the end of the hall. Leaves slide open with story.gate. */
function Gate() {
  const left = useRef<THREE.Mesh>(null)
  const right = useRef<THREE.Mesh>(null)
  const beyond = useRef<THREE.Group>(null)
  const root = useRef<THREE.Group>(null)
  const edgeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ff7a1a', transparent: true, opacity: 0, toneMapped: false }), [])
  useFrame((s) => {
    // the gate is 30 m into the fog: draw it only once the camera is in the far hall
    if (root.current) root.current.visible = hangarState.showAll || s.camera.position.z < -9
    const g = THREE.MathUtils.smoothstep(story.gate, 0.05, 0.95)
    if (left.current) left.current.position.x = -3.55 - g * 6.6
    if (right.current) right.current.position.x = 3.55 + g * 6.6
    edgeMat.opacity = g
    if (beyond.current) beyond.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.1) * 0.05
  })
  const leafMat = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 512
    const g = c.getContext('2d')!
    g.fillStyle = '#16171b'
    g.fillRect(0, 0, 256, 512)
    g.fillStyle = 'rgba(255,255,255,0.05)'
    for (let y = 0; y < 512; y += 32) g.fillRect(0, y, 256, 2)
    g.fillStyle = 'rgba(255,122,26,0.55)'
    for (let x = 0; x < 256; x += 32) g.fillRect(x, 470, 16, 28)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return new THREE.MeshStandardMaterial({ map: t, metalness: 0.6, roughness: 0.55 })
  }, [])
  return (
    <group ref={root} position={[0, 0, -32]} userData={{ gate: true }}>
      {/* a glimpse of the gallery beyond the doors */}
      <group ref={beyond} position={[0, 0, -9]}>
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i - 3) * 0.42
          return (
            <group key={i} position={[Math.sin(a) * 6, 1.9, Math.cos(a) * -6 + 6]} rotation={[0, -a, 0]}>
              <mesh>
                <planeGeometry args={[2.4, 1.5]} />
                <meshBasicMaterial color={i === 3 ? '#8aa3cf' : '#3d4d6b'} toneMapped={false} />
              </mesh>
              <mesh position={[0, -0.8, 0.01]}>
                <planeGeometry args={[2.4, 0.02]} />
                <meshBasicMaterial color={i === 3 ? '#ff7a1a' : '#5c6a80'} toneMapped={false} />
              </mesh>
            </group>
          )
        })}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[5.2, 5.24, 128]} />
          <meshBasicMaterial color="#bfd9ff" toneMapped={false} />
        </mesh>
      </group>
      <Glow position={[0, 1.2, -1]} scale={[16, 4]} color="#bfd9ff" opacity={0.16} />
      {[-7.15, 7.15].map((x) => (
        <mesh key={x} position={[x, 4.6, 0.2]} material={edgeMat}>
          <boxGeometry args={[0.06, 9.2, 0.06]} />
        </mesh>
      ))}
      <mesh ref={left} position={[-3.55, 4.6, 0]} material={leafMat}>
        <boxGeometry args={[7.1, 9.2, 0.3]} />
      </mesh>
      <mesh ref={right} position={[3.55, 4.6, 0]} material={leafMat}>
        <boxGeometry args={[7.1, 9.2, 0.3]} />
      </mesh>
      <mesh position={[0, 9.6, 0.1]} material={darkSteel}>
        <boxGeometry args={[22, 0.8, 0.8]} />
      </mesh>
      <mesh position={[-11, 0.2, 2]} material={darkSteel}>
        <boxGeometry args={[8, 0.4, 0.4]} />
      </mesh>
    </group>
  )
}

export function Hangar({ quality }: { quality: 'high' | 'low' }) {
  const floorMap = useMemo(floorTexture, [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -12]} visible={!qaOff('floor')}>
        <planeGeometry args={[46, 70]} />
        <meshLambertMaterial map={floorMap} color="#4a4e57" />
      </mesh>
      {/* back wall + slit of light behind the forge */}
      <mesh position={[0, 6, 14]} rotation={[0, Math.PI, 0]} material={darkSteel}>
        <planeGeometry args={[44, 12]} />
      </mesh>
      <mesh position={[-21.6, 6, -12]} rotation={[0, Math.PI / 2, 0]} material={darkSteel}>
        <planeGeometry args={[70, 12]} />
      </mesh>
      <mesh position={[21.6, 6, -12]} rotation={[0, -Math.PI / 2, 0]} material={darkSteel}>
        <planeGeometry args={[70, 12]} />
      </mesh>
      {/* end wall around the gate */}
      {[-14.4, 14.4].map((x) => (
        <mesh key={x} position={[x, 6, -32.2]} material={darkSteel}>
          <planeGeometry args={[14.6, 12]} />
        </mesh>
      ))}
      {!qaOff('structure') && <Structure />}
      {!qaOff('gate') && <Gate />}
      {!qaOff('dust') && <Dust count={quality === 'high' ? 900 : 380} />}
    </group>
  )
}
