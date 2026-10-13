import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '#/motion/engine'
import { openDoors } from '#/motion/doors'
import { useUI } from '#/motion/story'

const MIN_MS = 1100
const MAX_MS = 2300

/** Loader. Progress is real: fonts, the portrait textures and the 3D scene. */
export function Doors({ waitForGl }: { waitForGl: boolean }) {
  const countRef = useRef<HTMLSpanElement>(null)
  const beadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const start = performance.now()
    let fontsDone = false
    let imagesDone = 0
    const images = ['/portrait/color.webp', '/portrait/depth.webp']
    document.fonts.ready.then(() => (fontsDone = true))
    images.forEach((src) => {
      const img = new Image()
      img.onload = img.onerror = () => imagesDone++
      img.src = src
    })
    const shown = { v: 0 }
    let opened = false
    const tick = () => {
      const elapsed = performance.now() - start
      const gl = !waitForGl || useUI.getState().glReady || !document.documentElement.classList.contains('gl-try')
      const real = ((fontsDone ? 1 : 0) + imagesDone / images.length + (gl ? 1 : 0)) / 3
      const timeCap = Math.min(1, elapsed / MAX_MS)
      const target = Math.max(real, timeCap) * Math.min(1, elapsed / MIN_MS)
      shown.v += (target - shown.v) * 0.18
      const p = Math.min(100, Math.round(shown.v * 100))
      if (countRef.current) countRef.current.textContent = String(p).padStart(3, '0')
      if (beadRef.current) beadRef.current.style.scale = `${shown.v} 1`
      if (!opened && (shown.v > 0.985 || elapsed > MAX_MS + 200)) {
        opened = true
        gsap.ticker.remove(tick)
        useUI.getState().setLoaded(true)
        openDoors()
      }
    }
    if (prefersReducedMotion()) {
      Promise.all([document.fonts.ready]).then(() => {
        useUI.getState().setLoaded(true)
        openDoors()
      })
      return
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div id="doors" className="doors" aria-hidden="true">
      <div className="doors__leaf doors__leaf--l" />
      <div className="doors__leaf doors__leaf--r" />
      <div className="doors__seam" />
      <div className="doors__hud absolute inset-x-0 bottom-[12svh] flex flex-col items-center gap-4 px-6">
        <div className="mono flex w-full max-w-[420px] justify-between text-[var(--muted)]">
          <span>Forging</span>
          <span>
            <span ref={countRef}>000</span>
          </span>
        </div>
        <div className="relative h-px w-full max-w-[420px] bg-[var(--line)]">
          <div
            ref={beadRef}
            className="absolute inset-y-[-1px] left-0 w-full origin-left bg-gradient-to-r from-[#ff5a0a] to-[#ffd29a]"
            style={{ scale: '0 1', boxShadow: '0 0 14px 2px rgba(255,122,26,.65)' }}
          />
        </div>
      </div>
    </div>
  )
}
