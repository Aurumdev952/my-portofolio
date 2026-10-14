import { useCallback, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { gsap, isMobile, isQA, qaOff } from '#/motion/engine'
import { story, useUI } from '#/motion/story'
import { HomeScene } from './home/HomeScene'
import { GalleryScene } from './gallery/GalleryScene'
import { Sparks, sparks } from './shared/Sparks'
import { setTextureUploader } from './shared/textures'
import { Glow } from './home/Hangar'

type Probe = {
  calls: number
  tris: number
  programs: number
  frameMs: number
  renderMs: number
  updateMs: number
  updateMax: number
  samples: number[]
  renders: number[]
  programNames: string[]
  frames: number
  lights: number
}
declare global {
  interface Window {
    __forge?: Probe
  }
}

/** One clock: GSAP's ticker advances the R3F frame. With ?qa it also records frame cost. */
function Driver() {
  const advance = useThree((s) => s.advance)
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const qa = isQA()
    const probe: Probe = { calls: 0, tris: 0, programs: 0, frameMs: 0, renderMs: 0, updateMs: 0, updateMax: 0, samples: [], renders: [], programNames: [], frames: 0, lights: 0 }
    let inRender = 0
    let depth = 0
    if (qa) {
      window.__forge = probe
      gl.info.autoReset = false
      // time spent inside three's render (GPU submission) vs our own per-frame scene code
      const render = gl.render.bind(gl)
      gl.render = (s, c) => {
        const t = performance.now()
        depth++
        render(s, c)
        depth--
        if (depth === 0) inRender += performance.now() - t
      }
    }
    const tick = (time: number) => {
      if (!qa) return advance(time)
      gl.info.reset()
      inRender = 0
      const t0 = performance.now()
      advance(time)
      const ms = performance.now() - t0
      const upd = ms - inRender
      probe.frames++
      probe.frameMs += (ms - probe.frameMs) * 0.1
      probe.renderMs += (inRender - probe.renderMs) * 0.1
      probe.updateMs += (upd - probe.updateMs) * 0.1
      probe.updateMax = Math.max(probe.updateMax, upd)
      probe.samples.push(upd)
      probe.renders.push(inRender)
      if (probe.samples.length > 600) probe.samples.shift()
      if (probe.renders.length > 600) probe.renders.shift()
      probe.calls = gl.info.render.calls
      probe.tris = gl.info.render.triangles
      probe.programs = gl.info.programs?.length ?? 0
      if (probe.frames % 3 === 0) probe.programNames = (gl.info.programs ?? []).map((p) => { const q = p as unknown as { name: string; cacheKey: string }; return `${q.name}|${q.cacheKey.slice(0, 400)}` })
      if (probe.frames % 30 === 0) {
        let n = 0
        scene.traverseVisible((o) => {
          if ((o as THREE.Light).isLight) n++
        })
        probe.lights = n
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [advance, gl, scene])
  return null
}

function Uploader() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    setTextureUploader((t) => gl.initTexture(t))
    return () => setTextureUploader(() => {})
  }, [gl])
  return null
}

function Pointer() {
  useEffect(() => {
    const target = { x: 0, y: 0 }
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      target.x = (e.clientX / window.innerWidth) * 2 - 1
      target.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', move, { passive: true })
    const tick = () => {
      story.px += (target.x - story.px) * 0.06
      story.py += (target.y - story.py) * 0.06
    }
    gsap.ticker.add(tick)
    return () => {
      window.removeEventListener('pointermove', move)
      gsap.ticker.remove(tick)
    }
  }, [])
  return null
}

function Ambient({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady()
    useUI.getState().setLabel('')
  }, [onReady])
  const camera = useThree((s) => s.camera)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    camera.position.set(Math.sin(t * 0.05) * 0.6 + story.px * 0.2, 1.8 - story.py * 0.1, 6)
    camera.lookAt(0, 1.8, 0)
    ;(camera as THREE.PerspectiveCamera).clearViewOffset()
  })
  return (
    <>
      <color attach="background" args={['#0b0c0e']} />
      <fogExp2 attach="fog" args={['#0b0c0e', 0.09]} />
      <Glow position={[0, 1.8, -6]} scale={[14, 9]} color="#9fc2ff" opacity={0.12} />
      <Glow position={[3.5, 0.4, -3]} scale={[5, 3]} color="#ff7a1a" opacity={0.08} />
      <Sparks />
    </>
  )
}

/**
 * Frame-time governor. Holds the frame rate on any device by stepping the render resolution
 * (and spark count) down when frames run long and back up when there is headroom. It only
 * touches things that never recompile a shader, so a step is never itself a hitch.
 */
const DPR_STEPS = [1.5, 1.25, 1, 0.85, 0.7, 0.6, 0.5]
type Gov = { dpr: number; level: number; ema: number }
declare global {
  interface Window {
    __forgeGov?: Gov
  }
}
function Governor({ max, onDpr }: { max: number; onDpr: (d: number) => void }) {
  useEffect(() => {
    const steps = DPR_STEPS.filter((d) => d <= max + 1e-3)
    if (!steps.length || steps[0] < max) steps.unshift(max)
    const gov: Gov = { dpr: steps[0], level: 0, ema: 16.7 }
    window.__forgeGov = gov
    let slowMs = 0
    let fastMs = 0
    let coolMs = 0
    let last = performance.now()
    const tick = () => {
      const now = performance.now()
      const dt = now - last
      last = now
      if (dt > 1500 || document.hidden) return // returning from a hidden tab, not a trend
      gov.ema += (Math.min(dt, 120) - gov.ema) * 0.12
      if (coolMs > 0) {
        coolMs -= dt
        return
      }
      // running under ~45 fps for 0.75 s: step down; over ~70 fps headroom for 4 s: step up
      slowMs = gov.ema > 22 ? slowMs + dt : 0
      fastMs = gov.ema < 14 ? fastMs + dt : 0
      if (slowMs > 750 && gov.level < steps.length - 1) gov.level++
      else if (fastMs > 4000 && gov.level > 0) gov.level--
      else return
      slowMs = fastMs = 0
      coolMs = 500
      gov.dpr = steps[gov.level]
      sparks.budget = gov.level >= 3 ? 0.45 : 1
      onDpr(gov.dpr)
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [max, onDpr])
  return null
}

/** ?fps: live frame rate and governor state, to check smoothness on a real device. */
function FpsMeter() {
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('fps')) return
    const el = document.createElement('div')
    el.setAttribute('aria-hidden', 'true')
    el.style.cssText =
      'position:fixed;right:12px;top:64px;z-index:300;padding:8px 10px;background:rgba(11,12,14,.85);border:1px solid rgba(255,122,26,.5);color:#eceae4;font:12px/1.4 JetBrains Mono,monospace;pointer-events:none;white-space:pre'
    document.body.appendChild(el)
    const frames: number[] = []
    let last = performance.now()
    let shown = 0
    const tick = () => {
      const now = performance.now()
      frames.push(now - last)
      last = now
      if (frames.length > 120) frames.shift()
      if (now - shown < 500) return
      shown = now
      const sorted = [...frames].sort((a, b) => a - b)
      const avg = frames.reduce((a, b) => a + b, 0) / frames.length
      const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0
      const g = window.__forgeGov
      el.textContent = `fps   ${(1000 / avg).toFixed(0)}\np95   ${p95.toFixed(1)} ms\ndpr   ${g?.dpr ?? '-'}  (step ${g?.level ?? 0})`
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      el.remove()
    }
  }, [])
  return null
}

export default function Stage() {
  const scene = useUI((s) => s.scene)
  const quality = useUI((s) => s.quality)
  const setQuality = useUI((s) => s.setQuality)
  const [dpr, setDpr] = useState(1.5)
  const [maxDpr, setMaxDpr] = useState(1.5)

  useEffect(() => {
    const mobile = isMobile()
    const cores = navigator.hardwareConcurrency || 4
    if (mobile || cores <= 4) setQuality('low')
    const m = Math.min(window.devicePixelRatio, 1.5)
    setMaxDpr(m)
    setDpr(m)
  }, [setQuality])

  const onReady = useCallback(() => {
    // give the first frame a moment to compile shaders before the doors open
    gsap.delayedCall(0.25, () => {
      useUI.getState().setGlReady(true)
      document.documentElement.classList.add('gl-on')
    })
  }, [])

  return (
    <Canvas
      frameloop="never"
      dpr={dpr}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false }}
      camera={{ fov: 35, near: 0.1, far: 90, position: [0, 1.7, 6] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NoToneMapping
        gl.setClearColor('#0b0c0e')
      }}
    >
      <Driver />
      <Uploader />
      <Pointer />
      <Governor max={maxDpr} onDpr={setDpr} />
      <FpsMeter />
      {scene === 'home' && <HomeScene quality={quality} onReady={onReady} />}
      {scene === 'gallery' && <GalleryScene quality={quality} onReady={onReady} />}
      {scene === 'ambient' && <Ambient onReady={onReady} />}
      {!qaOff('post') && <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom mipmapBlur levels={5} intensity={quality === 'high' ? 1.05 : 0.85} luminanceThreshold={0.85} luminanceSmoothing={0.2} radius={0.7} />
        <Vignette eskil={false} offset={0.22} darkness={0.75} />
        <Noise opacity={0.045} premultiply />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>}
    </Canvas>
  )
}
