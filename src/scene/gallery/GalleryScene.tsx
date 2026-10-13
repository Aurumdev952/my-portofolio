import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { projects } from '#/content/site'
import type { Project } from '#/content/site'
import { story, useUI } from '#/motion/story'
import { isMobile, isQA } from '#/motion/engine'
import { loadTexture, projectCover } from '../shared/textures'
import { Glow } from '../home/Hangar'

export const GALLERY = { radius: 6.2, step: 0.46, y: 1.7 }

const FRAME_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }
`
const FRAME_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uHas;
uniform float uActive;
uniform float uDim;
uniform float uTime;
uniform vec2 uAspect; // plane aspect / image aspect
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
void main(){
  // cover fit
  vec2 uv = (vUv - .5) * uAspect + .5;
  vec3 col = uHas > .5 ? texture2D(uMap, uv).rgb : vec3(.07);
  float lum = dot(col, vec3(.299,.587,.114));
  // inactive frames read as cooled steel, the active one in full colour
  col = mix(vec3(lum) * vec3(.82,.88,1.), col, uActive);
  col *= mix(.38, 1., uActive) * (1. - uDim * .8);
  // heat seam sweeping across the active frame once it lands
  float sweep = smoothstep(.0, .02, abs(vUv.x - fract(uTime * .12)) ) ;
  col += vec3(1., .48, .1) * (1. - sweep) * uActive * .18;
  float scan = .96 + .04 * sin(vUv.y * 700.);
  gl_FragColor = vec4(col * scan, 1.);
  #include <colorspace_fragment>
}
`

function Frame({ project, index }: { project: Project; index: number }) {
  const [tex, setTex] = useState<THREE.Texture | null>(null)
  const group = useRef<THREE.Group>(null)
  const edge = useRef<THREE.MeshBasicMaterial>(null)
  const W = 2.6
  const H = 1.62
  const uniforms = useMemo(
    () => ({
      uMap: { value: null as THREE.Texture | null },
      uHas: { value: 0 },
      uActive: { value: 0 },
      uDim: { value: 0 },
      uTime: { value: 0 },
      uAspect: { value: new THREE.Vector2(1, 1) },
    }),
    [],
  )
  useEffect(() => {
    let alive = true
    loadTexture(projectCover(project)).then((t) => {
      if (!alive) return
      const img = t.image as HTMLImageElement
      const ia = img.width / img.height
      const pa = W / H
      uniforms.uAspect.value.set(pa > ia ? 1 : pa / ia, pa > ia ? ia / pa : 1)
      uniforms.uMap.value = t
      uniforms.uHas.value = 1
      setTex(t)
    })
    return () => {
      alive = false
    }
  }, [project, uniforms])

  const mat = useMemo(
    () => new THREE.ShaderMaterial({ uniforms, vertexShader: FRAME_VERT, fragmentShader: FRAME_FRAG }),
    [uniforms],
  )

  useFrame((s, dt) => {
    const filter = useUI.getState().galleryFilter
    const match = filter === 'All' || project.kind.includes(filter as never)
    const d = Math.abs(index - story.gSmooth)
    const active = Math.max(0, 1 - d) * (match ? 1 : 0)
    uniforms.uActive.value += (active - uniforms.uActive.value) * (1 - Math.exp(-dt * 8))
    uniforms.uDim.value += ((match ? 0 : 1) - uniforms.uDim.value) * (1 - Math.exp(-dt * 6))
    uniforms.uTime.value = s.clock.elapsedTime
    if (group.current) {
      const sc = 0.82 + uniforms.uActive.value * 0.18 - uniforms.uDim.value * 0.12
      group.current.scale.setScalar(sc)
      group.current.position.y = Math.sin(s.clock.elapsedTime * 0.5 + index) * 0.03
    }
    if (edge.current) edge.current.opacity = 0.15 + uniforms.uActive.value * 0.85
  })

  const a = index * GALLERY.step
  return (
    <group position={[Math.sin(a) * GALLERY.radius, GALLERY.y, -Math.cos(a) * GALLERY.radius]} rotation={[0, -a, 0]}>
      <group ref={group}>
        <mesh material={mat}>
          <planeGeometry args={[W, H]} />
        </mesh>
        <mesh position={[0, -H / 2 - 0.05, 0]}>
          <planeGeometry args={[W, 0.012]} />
          <meshBasicMaterial ref={edge} color="#ff7a1a" transparent toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry args={[W + 0.06, H + 0.06, 0.04]} />
          <meshStandardMaterial color="#121316" metalness={0.8} roughness={0.4} />
        </mesh>
      </group>
      {!tex && null}
    </group>
  )
}

export function GalleryScene({ quality, onReady }: { quality: 'high' | 'low'; onReady: () => void }) {
  const ring = useRef<THREE.Group>(null)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const mobile = useRef(false)
  const qa = useMemo(() => isQA(), [])
  const size = useThree((s) => s.size)
  useEffect(() => {
    mobile.current = isMobile()
  }, [size])
  useEffect(() => {
    onReady()
    useUI.getState().setLabel('')
  }, [onReady])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const t = state.clock.elapsedTime
    story.gSmooth += (story.g - story.gSmooth) * (1 - Math.exp(-dt * 5))
    if (qa) story.gSmooth = story.g
    if (ring.current) ring.current.rotation.y = story.gSmooth * GALLERY.step
    const back = mobile.current ? 3.4 : 1.2
    const fly = story.fly
    camera.position.set(
      story.px * 0.25 + Math.sin(t * 0.2) * 0.04,
      GALLERY.y + 0.05 - story.py * 0.1,
      back - fly * (GALLERY.radius + back - 2.0),
    )
    camera.lookAt(0, GALLERY.y + (mobile.current ? 0.05 : 0), -GALLERY.radius)
    const w = state.size.width
    const h = state.size.height
    camera.setViewOffset(w, h, 0, 0, w, h)
  })

  return (
    <>
      <color attach="background" args={['#0b0c0e']} />
      <fogExp2 attach="fog" args={['#0b0c0e', 0.07]} />
      <hemisphereLight args={['#9fb4d6', '#0b0c0e', 0.5]} />
      <pointLight position={[0, 4, 0]} intensity={10} distance={14} color="#dfe8ff" />
      <Environment resolution={64} frames={1} environmentIntensity={0.5}>
        <Lightformer form="rect" intensity={3} color="#cfdcff" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
      <group ref={ring}>
        {projects.map((p, i) => (
          <Frame key={p.slug} project={p} index={i} />
        ))}
      </group>
      {/* floor + light rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[14, 96]} />
        {quality === 'high' ? (
          <MeshReflectorMaterial blur={[300, 80]} resolution={512} mixBlur={1} mixStrength={3} roughness={0.9} color="#202227" metalness={0.6} mirror={0.6} />
        ) : (
          <meshStandardMaterial color="#17181c" metalness={0.6} roughness={0.5} />
        )}
      </mesh>
      {[GALLERY.radius - 0.9, GALLERY.radius + 1.2].map((r, i) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[r, r + 0.02, 160]} />
          <meshBasicMaterial color={i ? '#bfd9ff' : '#ff7a1a'} transparent opacity={i ? 0.35 : 0.6} toneMapped={false} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.2, 0]}>
        <ringGeometry args={[GALLERY.radius - 0.2, GALLERY.radius, 160]} />
        <meshBasicMaterial color="#dfe8ff" side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <Glow position={[0, 1.6, -GALLERY.radius - 1.6]} scale={[10, 6]} color="#9fc2ff" opacity={0.18} />
    </>
  )
}
