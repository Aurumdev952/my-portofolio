import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { story, useUI } from '#/motion/story'
import { isMobile, isQA } from '#/motion/engine'
import { loadPortrait } from '../shared/portrait'
import type { PortraitData } from '../shared/portrait'
import { Sparks, sparks } from '../shared/Sparks'
import { Figure, figureState } from './Figure'
import { Forge } from './Forge'
import { Hangar } from './Hangar'
import { Conveyor } from './Conveyor'
import { Stations } from './Stations'
import { GATE_PLINTH, KEYS, KEY_INDEX } from './keys'

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const v = new THREE.Vector3()
const a = new THREE.Vector3()
const b = new THREE.Vector3()
const c = new THREE.Vector3()
const tgt = new THREE.Vector3()

function keyCam(i: number, out: THREE.Vector3, mobile: boolean) {
  const k = KEYS[i]
  out.set(...k.cam)
  if (mobile) {
    v.set(...k.tgt)
    out.sub(v).multiplyScalar(1.5).add(v)
  }
  return out
}
function keyTgt(i: number, out: THREE.Vector3, mobile: boolean) {
  out.set(...KEYS[i].tgt)
  if (mobile) out.y -= 0.45
  return out
}

export function HomeScene({ quality, onReady }: { quality: 'high' | 'low'; onReady: () => void }) {
  const [data, setData] = useState<PortraitData | null>(null)
  const figure = useRef<THREE.Group>(null)
  const forgeGroup = useRef<THREE.Group>(null)
  const conveyorGroup = useRef<THREE.Group>(null)
  const stationsGroup = useRef<THREE.Group>(null)
  const key = useRef<THREE.PointLight>(null)
  const forgeActive = useRef(true)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)

  useEffect(() => {
    let alive = true
    loadPortrait().then((d) => alive && setData(d))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (data) onReady()
  }, [data, onReady])

  useEffect(() => {
    sparks.budget = quality === 'high' ? 1 : 0.45
  }, [quality])

  const mobileRef = useRef(false)
  useEffect(() => {
    mobileRef.current = isMobile()
  }, [size])

  const labels = useMemo(() => KEYS.map((k) => k.name), [])
  const qa = useMemo(() => isQA(), [])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const t = state.clock.elapsedTime
    const mobile = mobileRef.current
    story.kSmooth += (story.k - story.kSmooth) * (1 - Math.exp(-dt * 3.2))
    if (qa) story.kSmooth = story.k
    const kk = THREE.MathUtils.clamp(story.kSmooth, 0, KEYS.length - 1)
    const i = Math.min(KEYS.length - 2, Math.floor(kk))
    const f = kk - i
    const e = ease(f)
    const A = KEYS[i]
    const B = KEYS[i + 1]

    // camera path (quadratic bezier through `via` when the move must clear something)
    keyCam(i, a, mobile)
    keyCam(i + 1, b, mobile)
    if (B.via) {
      c.set(...B.via)
      const u = 1 - e
      v.copy(a).multiplyScalar(u * u).addScaledVector(c, 2 * u * e).addScaledVector(b, e * e)
    } else v.copy(a).lerp(b, e)
    keyTgt(i, a, mobile)
    keyTgt(i + 1, b, mobile)
    tgt.copy(a).lerp(b, e)

    // pointer parallax + idle drift
    v.x += story.px * 0.18 + Math.sin(t * 0.21) * 0.05
    v.y += -story.py * 0.08 + Math.sin(t * 0.33) * 0.03
    camera.position.copy(v)
    camera.lookAt(tgt)

    const shift = mobile ? 0 : THREE.MathUtils.lerp(A.shift, B.shift, e)
    const w = state.size.width
    const h = state.size.height
    camera.setViewOffset(w, h, -shift * w, 0, w, h)

    if (key.current) key.current.position.set(v.x + 1.2, v.y + 1.8, v.z + 0.6)

    // figure: same place → stay, different place → burn away, jump, reform
    const samePlace = A.fig.id === B.fig.id
    const place = samePlace || f < 0.5 ? A.fig : B.fig
    figureState.dissolve = samePlace ? 0 : Math.pow(Math.sin(Math.PI * THREE.MathUtils.clamp(f * 1.15 - 0.075, 0, 1)), 0.6)
    figureState.forge = THREE.MathUtils.lerp(A.forge, B.forge, e)
    if (figure.current) {
      figure.current.position.set(...place.pos)
      figure.current.scale.setScalar(place.scale)
      figure.current.rotation.y = story.px * 0.1 + Math.sin(t * 0.4) * 0.03
    }

    // only draw what is near the camera
    forgeActive.current = kk < KEY_INDEX.stack + 0.6
    if (forgeGroup.current) forgeGroup.current.visible = kk < KEY_INDEX.firstStation
    if (conveyorGroup.current) conveyorGroup.current.visible = kk > KEY_INDEX.stack - 1.2 && kk < KEY_INDEX.firstStation + 0.8
    if (stationsGroup.current) stationsGroup.current.visible = kk > KEY_INDEX.stack + 0.3

    useUI.getState().setLabel(labels[Math.round(kk)])
  })

  return (
    <>
      <color attach="background" args={['#0b0c0e']} />
      <fogExp2 attach="fog" args={['#0b0c0e', 0.05]} />
      <hemisphereLight args={['#9fb4d6', '#0b0c0e', 0.45]} />
      <pointLight ref={key} intensity={7} distance={12} decay={1.4} color="#e8eefc" />
      <Environment resolution={128} frames={1} environmentIntensity={0.55}>
        <Lightformer form="rect" intensity={3} color="#cfdcff" position={[0, 6, -6]} scale={[12, 3, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#ffd6b0" position={[-6, 3, 4]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#9fb4d6" position={[6, 2, 2]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="ring" intensity={2.5} color="#ff9a3c" position={[0, 1.5, 2.5]} scale={1.2} />
      </Environment>
      <Hangar quality={quality} />
      <group ref={forgeGroup}>{data && <Forge data={data} quality={quality} active={forgeActive} />}</group>
      <group ref={conveyorGroup}>
        <Conveyor />
      </group>
      <group ref={stationsGroup}>
        <Stations />
      </group>
      {/* plinth at the gate */}
      <mesh position={[GATE_PLINTH.x, GATE_PLINTH.h / 2, GATE_PLINTH.z]}>
        <cylinderGeometry args={[0.75, 0.85, GATE_PLINTH.h, 48]} />
        <meshStandardMaterial color="#1c1e22" metalness={0.8} roughness={0.4} />
      </mesh>
      <group ref={figure}>{data && <Figure data={data} quality={quality} />}</group>
      <Sparks />
    </>
  )
}
