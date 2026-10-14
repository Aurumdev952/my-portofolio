import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '#/motion/engine'
import { openDoors, skipLoader } from '#/motion/doors'
import { LATE_MS, playIntro } from '#/motion/reveal'
import { useUI } from '#/motion/story'

const MIN_MS = 800
const MAX_MS = 1400
/** the 3D warm-up gets this long behind the doors; after it the page opens on the poster */
const GL_CAP_MS = 6500

/** Loader. Progress is real: fonts, the portrait textures, then the 3D scene warming up. */
export function Doors() {
  const countRef = useRef<HTMLSpanElement>(null)
  const beadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const html = document.documentElement
    const el = document.getElementById('loader')
    if (html.classList.contains('skip-loader')) {
      useUI.getState().setLoaded(true)
      skipLoader()
      return
    }
    if (html.classList.contains('late-boot') || performance.now() > LATE_MS) {
      // The CSS fallback is already opening the doors: let it finish, then hand over.
      html.classList.add('is-loaded')
      useUI.getState().setLoaded(true)
      // if the page registered its intro just before the cut-off, play it with the doors
      const intro = window.setTimeout(playIntro, 300)
      const handOver = () => {
        if (!el || el.hidden) return
        el.hidden = true
        el.dataset.js = '1'
        el.dataset.state = 'open'
        el.dataset.mode = 'transition'
      }
      const leaf = el?.querySelector('.doors__leaf--l')
      leaf?.addEventListener('animationend', handOver, { once: true })
      const id = window.setTimeout(handOver, 2600)
      return () => {
        window.clearTimeout(id)
        window.clearTimeout(intro)
        leaf?.removeEventListener('animationend', handOver)
      }
    }
    if (el) el.dataset.js = '1'
    const start = performance.now()
    let fontsDone = false
    let imagesDone = 0
    // the static fallback does not need the 3D textures, so it does not wait for them
    const withGl = html.classList.contains('gl-try')
    const images = withGl ? ['/portrait/color.webp', '/portrait/depth.webp'] : []
    document.fonts.ready.then(() => (fontsDone = true))
    images.forEach((src) => {
      const img = new Image()
      img.onload = img.onerror = () => imagesDone++
      img.src = src
    })
    const shown = { v: 0 }
    let opened = false
    let last = start
    const tick = () => {
      const now = performance.now()
      const elapsed = now - start
      // time-based easing: a busy main thread (3D warming up) cannot slow the bar's finish
      const ease = 1 - Math.exp(-(now - last) / 200)
      last = now
      const glDone = !withGl || useUI.getState().glReady
      const assets = ((fontsDone ? 1 : 0) + (images.length ? imagesDone / images.length : 1)) / 2
      const real = withGl ? assets * 0.4 + (glDone ? 0.6 : 0) : assets
      // time keeps the bar moving while the scene warms up, but only the real finish fills it
      const timeCap = withGl ? Math.min(0.9, elapsed / 2600) : Math.min(1, elapsed / MAX_MS)
      const target = Math.max(real, timeCap) * Math.min(1, elapsed / MIN_MS)
      shown.v += (target - shown.v) * ease
      const p = Math.min(100, Math.round(shown.v * 100))
      if (countRef.current) countRef.current.textContent = String(p).padStart(3, '0')
      if (beadRef.current) beadRef.current.style.scale = `${shown.v} 1`
      const finished = withGl ? glDone && shown.v > 0.97 : shown.v > 0.97 || elapsed > MAX_MS
      if (!opened && (finished || elapsed > GL_CAP_MS)) {
        opened = true
        window.clearInterval(id)
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
    const id = window.setInterval(tick, 40)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div id="loader" className="doors" data-mode="loader" data-state="closed" aria-hidden="true">
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
