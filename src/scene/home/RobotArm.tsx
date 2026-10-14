import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { sparks } from '../shared/Sparks'

export type ArmDrive = {
  /** world target for the torch tip */
  target: THREE.Vector3
  /** 0..1 welding intensity */
  weld: number
  /** direction sparks are thrown (world) */
  throwDir: THREE.Vector3
}

const SHOULDER_Y = 0.78
const L1 = 1.25
const L2 = 1.1
const TORCH = 0.32

const bodyMat = new THREE.MeshStandardMaterial({ color: '#2a2c31', metalness: 0.75, roughness: 0.32 })
const darkMat = new THREE.MeshStandardMaterial({ color: '#111215', metalness: 0.6, roughness: 0.5 })
const paintMat = new THREE.MeshStandardMaterial({ color: '#b84a12', metalness: 0.35, roughness: 0.45 })
const chromeMat = new THREE.MeshStandardMaterial({ color: '#9aa0a8', metalness: 1, roughness: 0.18 })

const tmpV = new THREE.Vector3()
const tipW = new THREE.Vector3()

export function RobotArm({
  position,
  drive,
  lights = true,
  stampMode = false,
}: {
  position: [number, number, number]
  drive: ArmDrive
  lights?: boolean
  stampMode?: boolean
}) {
  const turret = useRef<THREE.Group>(null)
  const shoulder = useRef<THREE.Group>(null)
  const elbow = useRef<THREE.Group>(null)
  const wrist = useRef<THREE.Group>(null)
  const tip = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const glow = useRef<THREE.Mesh>(null)
  const base = useMemo(() => new THREE.Vector3(...position), [position])
  const smooth = useRef(new THREE.Vector3().copy(drive.target))

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    smooth.current.lerp(drive.target, 1 - Math.exp(-dt * 6))
    tmpV.copy(smooth.current).sub(base)
    const yaw = Math.atan2(-tmpV.z, tmpV.x)
    const r = Math.max(0.2, Math.hypot(tmpV.x, tmpV.z))
    const h = tmpV.y - SHOULDER_Y
    const L2e = L2 + TORCH
    const d = Math.min(L1 + L2e - 0.01, Math.max(0.3, Math.hypot(r, h)))
    const cosE = (L1 * L1 + L2e * L2e - d * d) / (2 * L1 * L2e)
    const bend = Math.PI - Math.acos(THREE.MathUtils.clamp(cosE, -1, 1))
    const cosS = (L1 * L1 + d * d - L2e * L2e) / (2 * L1 * d)
    const a = Math.atan2(h, r) + Math.acos(THREE.MathUtils.clamp(cosS, -1, 1))
    if (turret.current) turret.current.rotation.y = yaw
    if (shoulder.current) shoulder.current.rotation.z = a - Math.PI / 2
    if (elbow.current) elbow.current.rotation.z = -bend
    if (wrist.current) wrist.current.rotation.x = Math.sin(t * 7.3) * 0.08 * drive.weld

    const w = drive.weld
    const flicker = w * (0.55 + 0.45 * Math.sin(t * 61.0) * Math.sin(t * 23.7 + 1.3))
    if (light.current) light.current.intensity = flicker * 9
    if (glow.current) {
      glow.current.scale.setScalar(0.25 + flicker * 0.45)
      ;(glow.current.material as THREE.MeshBasicMaterial).opacity = Math.min(1, flicker * 1.3)
    }
    if (w > 0.05 && tip.current) {
      tip.current.getWorldPosition(tipW)
      sparks.emit(tipW, (stampMode ? 160 : 90) * dt * w * (0.4 + Math.random()), drive.throwDir, stampMode ? 3.6 : 3)
    }
  })

  return (
    <group position={position}>
      {/* base */}
      <mesh material={darkMat} position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.42, 0.48, 0.12, 32]} />
      </mesh>
      <mesh material={bodyMat} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.3, 0.36, 0.18, 32]} />
      </mesh>
      <group ref={turret} position={[0, 0.29, 0]}>
        <mesh material={paintMat} position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.27, 0.3, 0.4, 32]} />
        </mesh>
        <RoundedBox args={[0.5, 0.36, 0.5]} radius={0.06} position={[0, 0.45, 0]} material={bodyMat} />
        {/* shoulder */}
        <group ref={shoulder} position={[0, SHOULDER_Y - 0.29, 0]}>
          <mesh material={darkMat} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.56, 28]} />
          </mesh>
          <RoundedBox args={[0.26, L1, 0.3]} radius={0.07} position={[0, L1 / 2, 0]} material={paintMat} />
          <mesh material={chromeMat} position={[0.17, L1 * 0.45, 0]}>
            <cylinderGeometry args={[0.035, 0.035, L1 * 0.7, 12]} />
          </mesh>
          {/* elbow */}
          <group ref={elbow} position={[0, L1, 0]}>
            <mesh material={darkMat} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.42, 24]} />
            </mesh>
            <RoundedBox args={[0.2, L2, 0.22]} radius={0.06} position={[0, L2 / 2, 0]} material={bodyMat} />
            {/* wrist + torch */}
            <group ref={wrist} position={[0, L2, 0]}>
              <mesh material={darkMat}>
                <sphereGeometry args={[0.1, 20, 16]} />
              </mesh>
              <mesh material={stampMode ? bodyMat : chromeMat} position={[0, TORCH / 2, 0]}>
                {stampMode ? <boxGeometry args={[0.3, TORCH, 0.3]} /> : <cylinderGeometry args={[0.025, 0.06, TORCH, 16]} />}
              </mesh>
              <group ref={tip} position={[0, TORCH, 0]}>
                <mesh ref={glow}>
                  <sphereGeometry args={[0.04, 12, 10]} />
                  <meshBasicMaterial color="#fff1d6" transparent toneMapped={false} />
                </mesh>
                {lights && <pointLight ref={light} color="#ff9a3c" distance={4.5} decay={1.6} intensity={0} />}
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
