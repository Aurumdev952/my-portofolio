import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { featured } from '#/content/site'
import type { Project } from '#/content/site'
import { loadTexture, projectCover } from '../shared/textures'
import { Glow } from './Hangar'

export const STATION = {
  z: -16,
  spacing: 7,
  pedestal: { x: -0.95, h: 0.95, scale: 0.6 },
  screen: { x: 1.15, y: 1.85, z: -0.5, w: 2.4 },
}
export const stationX = (i: number) => (i - (featured.length - 1) / 2) * STATION.spacing

const arcMat = new THREE.MeshBasicMaterial({ color: '#bfd9ff', toneMapped: false })
const heatMat = new THREE.MeshBasicMaterial({ color: '#ff7a1a', toneMapped: false })
const steelMat = new THREE.MeshStandardMaterial({ color: '#1c1e22', metalness: 0.8, roughness: 0.4 })
const darkMat = new THREE.MeshStandardMaterial({ color: '#0f1013', metalness: 0.6, roughness: 0.6 })

function HoloScreen({ project }: { project: Project }) {
  const [tex, setTex] = useState<THREE.Texture | null>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useEffect(() => {
    let alive = true
    loadTexture(projectCover(project)).then((t) => alive && setTex(t))
    return () => {
      alive = false
    }
  }, [project])
  const { w } = STATION.screen
  const h = w * 0.625
  useFrame((s) => {
    if (mat.current) mat.current.opacity = 0.9 + Math.sin(s.clock.elapsedTime * 9) * 0.015
  })
  return (
    <group position={[STATION.screen.x, STATION.screen.y, STATION.screen.z]} rotation={[0, -0.14, 0]}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial ref={mat} map={tex ?? undefined} color={tex ? '#ffffff' : '#111317'} transparent toneMapped={false} />
      </mesh>
      {/* frame */}
      {[
        [0, h / 2 + 0.012, w + 0.04, 0.012],
        [0, -h / 2 - 0.012, w + 0.04, 0.012],
      ].map(([x, y, sw, sh], i) => (
        <mesh key={i} position={[x, y, 0.001]} material={arcMat}>
          <planeGeometry args={[sw, sh]} />
        </mesh>
      ))}
      <mesh position={[-w / 2 - 0.012, 0, 0.001]} material={heatMat}>
        <planeGeometry args={[0.012, h * 0.4]} />
      </mesh>
      <Glow position={[0, 0, -0.05]} scale={[w * 1.6, h * 1.9]} color="#bfd9ff" opacity={0.14} />
      {/* stand */}
      <mesh position={[0, -h / 2 - (STATION.screen.y - h / 2) / 2, -0.02]} material={darkMat}>
        <boxGeometry args={[0.08, STATION.screen.y - h / 2, 0.08]} />
      </mesh>
    </group>
  )
}

function useCurve(points: [number, number, number][]) {
  return useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), true), [points])
}

/** Tujyane: a live map with routes, cars and geofences. */
function RoutesProp() {
  const routes: [number, number, number][][] = useMemo(
    () => [
      [
        [-1.4, 0.03, 0.2],
        [-0.4, 0.03, 0.9],
        [0.8, 0.03, 0.6],
        [1.5, 0.03, -0.3],
        [0.4, 0.03, -0.7],
        [-0.8, 0.03, -0.4],
      ],
      [
        [-1.0, 0.03, 1.1],
        [0.2, 0.03, 1.3],
        [1.3, 0.03, 1.0],
        [0.9, 0.03, 0.1],
        [-0.3, 0.03, 0.3],
      ],
    ],
    [],
  )
  const c0 = useCurve(routes[0])
  const c1 = useCurve(routes[1])
  const cars = useRef<THREE.Mesh[]>([])
  const fences = useRef<THREE.Mesh[]>([])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    cars.current.forEach((m, i) => {
      if (!m) return
      const c = i % 2 ? c1 : c0
      const p = c.getPointAt(((t * 0.05 + i * 0.27) % 1 + 1) % 1)
      m.position.copy(p)
    })
    fences.current.forEach((m, i) => {
      if (!m) return
      const k = (t * 0.5 + i * 0.5) % 1
      m.scale.setScalar(0.2 + k * 0.6)
      ;(m.material as THREE.MeshBasicMaterial).opacity = 1 - k
    })
  })
  return (
    <group position={[0.3, 0, 0.9]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.2]}>
        <circleGeometry args={[1.9, 64]} />
        <meshBasicMaterial color="#0f141c" transparent opacity={0.85} />
      </mesh>
      <gridHelper args={[3.6, 18, '#2a3a52', '#1a2433']} position={[0, 0.015, 0.2]} />
      <Line points={c0.getPoints(120)} color="#bfd9ff" lineWidth={2} toneMapped={false} />
      <Line points={c1.getPoints(120)} color="#ff7a1a" lineWidth={2} toneMapped={false} />
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} ref={(m) => void (cars.current[i] = m!)} material={i % 2 ? heatMat : arcMat}>
          <boxGeometry args={[0.09, 0.05, 0.05]} />
        </mesh>
      ))}
      {[
        [-0.6, 0.6],
        [0.9, -0.2],
      ].map(([x, z], i) => (
        <mesh key={i} ref={(m) => void (fences.current[i] = m!)} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, z]}>
          <ringGeometry args={[0.95, 1, 64]} />
          <meshBasicMaterial color="#ff7a1a" transparent toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

/** UWERA: documents pulled into a vector store, tokens streaming out. */
function TutorProp() {
  const docs = useRef<THREE.Mesh[]>([])
  const core = useRef<THREE.Mesh>(null)
  const tokens = useRef<THREE.InstancedMesh>(null)
  const m4 = useMemo(() => new THREE.Matrix4(), [])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (core.current) {
      core.current.rotation.y = t * 0.3
      core.current.rotation.x = t * 0.17
    }
    docs.current.forEach((m, i) => {
      if (!m) return
      const k = (t * 0.12 + i / docs.current.length) % 1
      const a = i * 1.7 + t * 0.4
      const r = 1.3 * (1 - k)
      m.position.set(Math.cos(a) * r, 1.3 + Math.sin(a * 0.7) * 0.4 * (1 - k), Math.sin(a) * r)
      m.scale.setScalar(0.2 + (1 - k) * 0.8)
      m.lookAt(0, 1.3, 4)
    })
    if (tokens.current) {
      for (let i = 0; i < 40; i++) {
        const k = (t * 0.35 + i / 40) % 1
        m4.makeTranslation(0.25 + k * 1.4, 1.3 + Math.sin(i * 3.1) * 0.08 + k * 0.4, Math.cos(i * 1.3) * 0.08 - k * 0.5)
        tokens.current.setMatrixAt(i, m4)
      }
      tokens.current.instanceMatrix.needsUpdate = true
    }
  })
  return (
    <group position={[0.2, 0, 0.6]}>
      <mesh ref={core} position={[0, 1.3, 0]}>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshBasicMaterial color="#bfd9ff" wireframe toneMapped={false} />
      </mesh>
      <Glow position={[0, 1.3, 0]} scale={[1.6, 1.6]} color="#bfd9ff" opacity={0.4} />
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} ref={(m) => void (docs.current[i] = m!)}>
          <planeGeometry args={[0.22, 0.28]} />
          <meshBasicMaterial color={i % 3 === 0 ? '#ff7a1a' : '#eceae4'} transparent opacity={0.7} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
      <instancedMesh ref={tokens} args={[undefined, heatMat, 40]}>
        <boxGeometry args={[0.03, 0.03, 0.03]} />
      </instancedMesh>
    </group>
  )
}

/** Uzabox: one package, shipped to cloud and on premise racks. */
function PipelineProp() {
  const pkg = useRef<THREE.Mesh>(null)
  const leds = useRef<THREE.MeshBasicMaterial[]>([])
  const path = useCurve([
    [-0.2, 0.25, 0.9],
    [0.6, 0.25, 1.2],
    [1.5, 0.25, 0.9],
    [1.6, 1.5, 0.3],
    [0.6, 0.6, 0.4],
  ])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (pkg.current) {
      pkg.current.position.copy(path.getPointAt((t * 0.12) % 1))
      pkg.current.rotation.y = t
    }
    leds.current.forEach((m, i) => m && (m.opacity = 0.4 + 0.6 * (Math.sin(t * (3 + i) + i) > 0.3 ? 1 : 0)))
  })
  const racks: [number, number, number][] = [
    [-0.2, 0, 1.0],
    [1.5, 0, 1.0],
  ]
  return (
    <group position={[0.1, 0, 0.2]}>
      {racks.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 0.45, 0]} material={steelMat}>
            <boxGeometry args={[0.42, 0.9, 0.42]} />
          </mesh>
          {Array.from({ length: 5 }).map((_, k) => (
            <mesh key={k} position={[0, 0.15 + k * 0.16, 0.215]}>
              <planeGeometry args={[0.3, 0.025]} />
              <meshBasicMaterial ref={(m) => void (leds.current[i * 5 + k] = m!)} color={k === 2 ? '#ff7a1a' : '#bfd9ff'} transparent toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
      {/* cloud node */}
      <group position={[1.6, 1.55, 0.3]}>
        <mesh>
          <icosahedronGeometry args={[0.26, 0]} />
          <meshBasicMaterial color="#bfd9ff" wireframe toneMapped={false} />
        </mesh>
        <Glow position={[0, 0, 0]} scale={[1.2, 1.2]} opacity={0.35} />
      </group>
      <Line points={path.getPoints(100)} color="#3a4454" lineWidth={1.5} />
      <mesh ref={pkg} material={heatMat}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
      </mesh>
    </group>
  )
}

/** Regulation platform: column chunks rising, replicated pods. */
function VaultProp() {
  const cols = useRef<THREE.InstancedMesh>(null)
  const pods = useRef<THREE.Group>(null)
  const m4 = useMemo(() => new THREE.Matrix4(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const sc = useMemo(() => new THREE.Vector3(), [])
  const p = useMemo(() => new THREE.Vector3(), [])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (cols.current) {
      let i = 0
      for (let x = 0; x < 6; x++)
        for (let z = 0; z < 4; z++) {
          const h = 0.15 + (Math.sin(t * 1.2 + x * 0.9 + z * 1.7) * 0.5 + 0.5) * 0.7
          p.set(-0.4 + x * 0.2, h / 2, 0.5 + z * 0.2)
          sc.set(1, h, 1)
          m4.compose(p, q, sc)
          cols.current.setMatrixAt(i++, m4)
        }
      cols.current.instanceMatrix.needsUpdate = true
    }
    if (pods.current) pods.current.rotation.y = t * 0.25
  })
  return (
    <group position={[0.2, 0, -0.2]}>
      <instancedMesh ref={cols} args={[undefined, undefined, 24]}>
        <boxGeometry args={[0.14, 1, 0.14]} />
        <meshStandardMaterial color="#bfd9ff" emissive="#6f8fc4" emissiveIntensity={0.6} metalness={0.3} roughness={0.4} />
      </instancedMesh>
      <group ref={pods} position={[1.6, 0.9, 0.6]}>
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55]} rotation={[Math.PI / 2, 0, 0]} material={i === 0 ? heatMat : arcMat}>
              <cylinderGeometry args={[0.12, 0.12, 0.05, 6]} />
            </mesh>
          )
        })}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.006, 6, 64]} />
          <meshBasicMaterial color="#5c6a80" toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

/** TVET MIS: services on a bus, messages travelling. */
function MeshProp() {
  const nodes = useMemo(
    () =>
      [
        [0, 1.6, 0],
        [-0.5, 1.1, 0.6],
        [0.6, 1.0, 0.7],
        [1.2, 1.7, 0.2],
        [0.3, 0.55, 1.1],
        [1.4, 0.6, 0.9],
        [-0.3, 2.1, 0.5],
      ].map((v) => new THREE.Vector3(...v)),
    [],
  )
  const edges = useMemo(
    () =>
      [
        [0, 1],
        [0, 2],
        [0, 3],
        [2, 4],
        [2, 5],
        [3, 5],
        [0, 6],
        [1, 4],
      ] as const,
    [],
  )
  const pulses = useRef<THREE.Mesh[]>([])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    pulses.current.forEach((m, i) => {
      if (!m) return
      const [a, b] = edges[i % edges.length]
      const k = (t * 0.6 + i * 0.37) % 1
      m.position.lerpVectors(nodes[a], nodes[b], k)
    })
  })
  return (
    <group position={[0.4, 0, -0.5]} scale={0.8}>
      {nodes.map((n, i) => (
        <mesh key={i} position={n} material={i === 5 ? heatMat : undefined}>
          <icosahedronGeometry args={[0.11, 1]} />
          {i !== 5 && <meshStandardMaterial color="#2a2d33" emissive="#bfd9ff" emissiveIntensity={0.5} metalness={0.6} roughness={0.3} />}
        </mesh>
      ))}
      {edges.map(([a, b], i) => (
        <Line key={i} points={[nodes[a], nodes[b]]} color="#46536a" lineWidth={1.2} />
      ))}
      {edges.map((_, i) => (
        <mesh key={i} ref={(m) => void (pulses.current[i] = m!)} material={i % 3 ? arcMat : heatMat}>
          <sphereGeometry args={[0.028, 8, 6]} />
        </mesh>
      ))}
    </group>
  )
}

/** VMS: a check in gate with a scanning beam. */
function GateProp() {
  const beam = useRef<THREE.Mesh>(null)
  const visitors = useRef<THREE.Mesh[]>([])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (beam.current) beam.current.position.y = 0.2 + (Math.sin(t * 2.2) * 0.5 + 0.5) * 1.4
    visitors.current.forEach((m, i) => {
      if (!m) return
      const k = (t * 0.18 + i / 3) % 1
      m.position.set(0.5, 0.35, 2.0 - k * 2.6)
      const passed = m.position.z < 0.75
      ;(m.material as THREE.MeshBasicMaterial).color.set(passed ? '#ff7a1a' : '#bfd9ff')
    })
  })
  return (
    <group position={[0.85, 0, 1.0]} scale={0.6}>
      {[-0.05, 1.05].map((x) => (
        <mesh key={x} position={[x, 0.9, 0.75]} material={steelMat}>
          <boxGeometry args={[0.12, 1.8, 0.2]} />
        </mesh>
      ))}
      <mesh position={[0.5, 1.82, 0.75]} material={steelMat}>
        <boxGeometry args={[1.24, 0.1, 0.22]} />
      </mesh>
      <mesh ref={beam} position={[0.5, 1, 0.75]}>
        <boxGeometry args={[1.0, 0.01, 0.02]} />
        <meshBasicMaterial color="#ff7a1a" toneMapped={false} />
      </mesh>
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} ref={(m) => void (visitors.current[i] = m!)}>
          <capsuleGeometry args={[0.1, 0.3, 6, 12]} />
          <meshBasicMaterial color="#bfd9ff" toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

const PROPS = {
  routes: RoutesProp,
  tutor: TutorProp,
  pipeline: PipelineProp,
  vault: VaultProp,
  mesh: MeshProp,
  gate: GateProp,
} as const

export function Stations() {
  return (
    <group>
      {featured.map((p, i) => {
        const Prop = PROPS[p.art as keyof typeof PROPS]
        return (
          <group key={p.slug} position={[stationX(i), 0, STATION.z]}>
            {/* pedestal */}
            <mesh position={[STATION.pedestal.x, STATION.pedestal.h / 2, 0]} material={steelMat}>
              <cylinderGeometry args={[0.62, 0.7, STATION.pedestal.h, 48]} />
            </mesh>
            <mesh position={[STATION.pedestal.x, STATION.pedestal.h + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.58, 0.62, 64]} />
              <meshBasicMaterial color="#ff7a1a" toneMapped={false} />
            </mesh>
            <HoloScreen project={p} />
            {Prop && <Prop />}
          </group>
        )
      })}
    </group>
  )
}
