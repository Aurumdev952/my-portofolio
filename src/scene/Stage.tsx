import { useCallback, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { gsap, isMobile } from '#/motion/engine'
import { story, useUI } from '#/motion/story'
import { HomeScene } from './home/HomeScene'
import { GalleryScene } from './gallery/GalleryScene'
import { Sparks } from './shared/Sparks'
import { Glow } from './home/Hangar'

/** One clock: GSAP's ticker advances the R3F frame. */
function Driver() {
  const advance = useThree((s) => s.advance)
  useEffect(() => {
    const tick = (time: number) => advance(time)
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [advance])
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
  useEffect(() => onReady(), [onReady])
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

export default function Stage() {
  const scene = useUI((s) => s.scene)
  const quality = useUI((s) => s.quality)
  const setQuality = useUI((s) => s.setQuality)
  const [dpr, setDpr] = useState(1.5)

  useEffect(() => {
    const mobile = isMobile()
    const cores = navigator.hardwareConcurrency || 4
    if (mobile || cores <= 4) setQuality('low')
    setDpr(Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75))
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
      <Pointer />
      <PerformanceMonitor
        onDecline={() => {
          setQuality('low')
          setDpr((d) => Math.max(1, d - 0.25))
        }}
      />
      {scene === 'home' && <HomeScene quality={quality} onReady={onReady} />}
      {scene === 'gallery' && <GalleryScene quality={quality} onReady={onReady} />}
      {scene === 'ambient' && <Ambient onReady={onReady} />}
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom mipmapBlur intensity={quality === 'high' ? 1.05 : 0.8} luminanceThreshold={0.85} luminanceSmoothing={0.2} radius={0.72} />
        <Vignette eskil={false} offset={0.22} darkness={0.75} />
        <Noise opacity={0.045} premultiply />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  )
}
