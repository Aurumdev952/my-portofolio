import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { story, useUI } from '#/motion/story'
import { isMobile, isQA, qaOff } from '#/motion/engine'
import { loadPortrait } from '../shared/portrait'
import type { PortraitData } from '../shared/portrait'
import { Sparks, sparks } from '../shared/Sparks'
import { Figure, figureState } from './Figure'
import { Forge } from './Forge'
import { Hangar, hangarState } from './Hangar'
import { Conveyor, atlasReady } from './Conveyor'
import { Stations } from './Stations'
import { GATE_PLINTH, KEYS, KEY_INDEX } from './keys'
import { featured } from '#/content/site'
import { loadTexture, projectCover } from '../shared/textures'

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
    keyTgt(i, v, true)
    out.x += k.mDx ?? 0
    out.sub(v).multiplyScalar(k.mZoom ?? 1.18).add(v)
  }
  return out
}
function keyTgt(i: number, out: THREE.Vector3, mobile: boolean) {
  const k = KEYS[i]
  out.set(...k.tgt)
  if (mobile) {
    out.y -= 0.45
    out.x += k.mDx ?? 0
  }
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

  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    if (!data) return
    let alive = true
    // Compile every program now (stations, conveyor, gate) so scrolling never hitches on a
    // first-time shader compile. Hidden groups are shown for the compile, then restored.
    const showAll = (on: boolean) => {
      hangarState.showAll = on
      scene.traverse((o) => {
        if (o.userData.gate) o.visible = on || camera.position.z < -9
      })
    }
    const warm = () => {
      const groups = [forgeGroup.current, conveyorGroup.current, stationsGroup.current].filter(Boolean) as THREE.Group[]
      const prev = groups.map((g) => g.visible)
      groups.forEach((g) => (g.visible = true))
      showAll(true)
      return gl
        .compileAsync(scene, camera)
        .catch(() => {})
        .finally(() => {
          groups.forEach((g, i) => (g.visible = prev[i]))
          showAll(false)
        })
    }
    warm().finally(() => alive && onReady())
    // Second pass once every station texture and the logo atlas exist: materials that swap a
    // placeholder for the real map get their final program now, not on first sight.
    // Then draw every story viewpoint once into a tiny hidden target, one per idle slot: this
    // compiles the exact draw paths (two-sided transparency, instancing, points) the real
    // frames will use, so the first scroll through the story never waits on the GPU driver.
    const timers: number[] = []
    const rt = new THREE.WebGLRenderTarget(64, 64)
    const probe = new THREE.PerspectiveCamera(35, 1.6, 0.1, 90)
    const viewpoints = KEYS.map((_, i) => i)
    const drawViewpoint = (i: number) => {
      const groups = [forgeGroup.current, conveyorGroup.current, stationsGroup.current].filter(Boolean) as THREE.Group[]
      const prev = groups.map((g) => g.visible)
      groups.forEach((g) => (g.visible = true))
      showAll(true)
      keyCam(i, probe.position, false)
      probe.lookAt(keyTgt(i, tgt, false))
      const last = gl.getRenderTarget()
      gl.setRenderTarget(rt)
      gl.render(scene, probe)
      gl.setRenderTarget(last)
      groups.forEach((g, j) => (g.visible = prev[j]))
      showAll(false)
    }
    Promise.all([...featured.map((p) => loadTexture(projectCover(p)).catch(() => null)), atlasReady]).then(() => {
      if (!alive) return
      warm().finally(() => {
        viewpoints.forEach((i, n) => timers.push(window.setTimeout(() => alive && drawViewpoint(i), 120 + n * 90)))
      })
    })
    return () => {
      alive = false
      timers.forEach((t) => window.clearTimeout(t))
      rt.dispose()
    }
  }, [data, onReady, gl, scene, camera])

  useEffect(() => {
    sparks.budget = quality === 'high' ? 1 : 0.45
  }, [quality])

  const mobileRef = useRef(false)
  useEffect(() => {
    mobileRef.current = isMobile()
    // phones are tall: a wider lens instead of a camera that backs into the scenery
    camera.fov = mobileRef.current ? 44 : 35
    camera.updateProjectionMatrix()
  }, [size, camera])

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
    // The forge keeps its lights on: hiding a light changes the light count and forces every
    // material to recompile mid scroll. Off screen meshes are frustum culled anyway.
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
      {/* one fixed directional light: cheap, always on, so the light count never changes */}
      <directionalLight position={[2, 6, 8]} intensity={1.1} color="#ffe2c4" />
      {!qaOff('env') && <Environment resolution={128} frames={1} environmentIntensity={0.55}>
        <Lightformer form="rect" intensity={3} color="#cfdcff" position={[0, 6, -6]} scale={[12, 3, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#ffd6b0" position={[-6, 3, 4]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#9fb4d6" position={[6, 2, 2]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="ring" intensity={2.5} color="#ff9a3c" position={[0, 1.5, 2.5]} scale={1.2} />
      </Environment>}
      {!qaOff('hangar') && <Hangar quality={quality} />}
      <group ref={forgeGroup}>{data && !qaOff('forge') && <Forge data={data} quality={quality} active={forgeActive} />}</group>
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
      <group ref={figure}>{data && !qaOff('figure') && <Figure data={data} quality={quality} />}</group>
      {!qaOff('sparks') && <Sparks />}
    </>
  )
}
