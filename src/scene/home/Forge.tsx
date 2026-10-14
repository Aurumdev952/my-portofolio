import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { RobotArm } from './RobotArm'
import { qaOff } from '#/motion/engine'
import type { ArmDrive } from './RobotArm'
import { figureState } from './Figure'
import { Glow, LightShaft } from './Hangar'
import type { PortraitData } from '../shared/portrait'
import { sparks } from '../shared/Sparks'

export const PLATFORM = { y: 0.55, x: 0, z: 0 }

type Seam = { a: [number, number]; b: [number, number]; back?: boolean }

// Weld paths in portrait uv space (u right, v up). Rear arms weld outlines from behind.
const SEAMS: Seam[][] = [
  [
    { a: [0.3, 0.32], b: [0.42, 0.22] },
    { a: [0.36, 0.55], b: [0.4, 0.68] },
    { a: [0.2, 0.18], b: [0.33, 0.1] },
  ],
  [
    { a: [0.7, 0.3], b: [0.58, 0.2] },
    { a: [0.62, 0.58], b: [0.58, 0.72] },
    { a: [0.82, 0.16], b: [0.66, 0.08] },
  ],
  [
    { a: [0.37, 0.78], b: [0.45, 0.86], back: true },
    { a: [0.16, 0.3], b: [0.26, 0.36], back: true },
  ],
  [
    { a: [0.63, 0.78], b: [0.55, 0.86], back: true },
    { a: [0.86, 0.3], b: [0.74, 0.36], back: true },
  ],
]

const ARM_BASES: [number, number, number][] = [
  [-2.55, 0, 0.55],
  [2.55, 0, 0.55],
  [-2.0, 0, -1.45],
  [2.0, 0, -1.45],
]
const REST: [number, number, number][] = [
  [-2.3, 3.0, 0.9],
  [2.3, 3.0, 0.9],
  [-1.9, 3.1, -1.7],
  [1.9, 3.1, -1.7],
]

const tmp = new THREE.Vector3()
const tmp2 = new THREE.Vector3()

export function Forge({ data, quality, active }: { data: PortraitData; quality: 'high' | 'low'; active: { current: boolean } }) {
  const drives = useMemo<ArmDrive[]>(
    () =>
      ARM_BASES.map(() => ({ target: new THREE.Vector3(0, 2, 1), weld: 0, throwDir: new THREE.Vector3(0, 0.3, 1) })),
    [],
  )
  const phase = useRef(ARM_BASES.map((_, i) => ({ seam: i % 2, t: Math.random(), wait: i * 0.6 })))
  const armCount = quality === 'high' ? 4 : 2

  useMemo(() => {
    sparks.setFloors([{ y: PLATFORM.y, minX: -1.4, maxX: 1.4, minZ: -0.95, maxZ: 0.95 }])
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30)
    const working = active.current && figureState.forge < 0.78
    const retract = THREE.MathUtils.smoothstep(figureState.forge, 0.62, 0.86)
    for (let i = 0; i < armCount; i++) {
      const ph = phase.current[i]
      const d = drives[i]
      const seams = SEAMS[i]
      const seam = seams[ph.seam % seams.length]
      if (ph.wait > 0) {
        ph.wait -= dt
        d.weld = Math.max(0, d.weld - dt * 6)
      } else {
        ph.t += dt * 0.22
        d.weld = working ? Math.min(1, d.weld + dt * 5) : Math.max(0, d.weld - dt * 4)
        if (ph.t >= 1) {
          ph.t = 0
          ph.seam++
          ph.wait = 0.5 + Math.random() * 0.9
        }
      }
      const u = THREE.MathUtils.lerp(seam.a[0], seam.b[0], ph.t) + Math.sin(ph.t * 40) * 0.004
      const v = THREE.MathUtils.lerp(seam.a[1], seam.b[1], ph.t)
      data.surface(u, v, tmp)
      if (seam.back) tmp.z = -0.04
      else tmp.z += 0.02
      // local -> world (figure sits on the platform)
      tmp.y += PLATFORM.y
      // hover off the surface while moving between seams
      if (ph.wait > 0) tmp.z += seam.back ? -0.25 : 0.25
      tmp2.set(...REST[i])
      d.target.copy(tmp).lerp(tmp2, retract)
      d.throwDir.set(seam.back ? 0 : (i % 2 ? 0.5 : -0.5), 0.6, seam.back ? -0.8 : 0.9)
      // hot spot on the figure surface
      figureState.weld[i].set(tmp.x, tmp.y - PLATFORM.y, tmp.z, d.weld * (1 - retract))
    }
    for (let i = armCount; i < 4; i++) figureState.weld[i].w = 0
  })

  return (
    <group>
      {/* forge table */}
      <RoundedBox args={[2.8, PLATFORM.y, 1.9]} radius={0.04} position={[0, PLATFORM.y / 2, 0]}>
        <meshStandardMaterial color="#17181c" metalness={0.8} roughness={0.38} />
      </RoundedBox>
      <mesh position={[0, PLATFORM.y + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.7, 1.8]} />
        <meshStandardMaterial color="#24262b" metalness={0.9} roughness={0.25} />
      </mesh>
      {/* hazard edge */}
      <mesh position={[0, PLATFORM.y - 0.05, 0.951]}>
        <planeGeometry args={[2.8, 0.018]} />
        <meshBasicMaterial color="#c2560f" toneMapped={false} />
      </mesh>
      {ARM_BASES.slice(0, armCount).map((p, i) => (
        <RobotArm key={i} position={p} drive={drives[i]} lights={i < 2} />
      ))}
      {/* back light that turns the figure into a silhouette */}
      <Glow position={[0, 2.2, -2.6]} scale={[7, 7]} color="#9fc2ff" opacity={0.55} />
      {!qaOff('shaft') && <LightShaft position={[0, 4.6, 0]} height={9} radius={2.2} strength={0.12} />}
      <Glow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[6, 4]} color="#ff7a1a" opacity={0.12} />
      <pointLight position={[0, 2.4, -2.2]} intensity={14} distance={7} color="#9fc2ff" />
    </group>
  )
}
