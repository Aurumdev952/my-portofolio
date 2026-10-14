// One clock for everything: GSAP's ticker drives Lenis, ScrollTrigger and the WebGL frame.
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'
import Lenis from 'lenis'

export const isBrowser = typeof window !== 'undefined'

export const prefersReducedMotion = () =>
  isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const isTouch = () => isBrowser && window.matchMedia('(hover: none)').matches
export const isMobile = () => isBrowser && window.matchMedia('(max-width: 760px)').matches
/** ?qa in the URL: screenshots in slow software GL see final states, not lagging ones */
export const isQA = () => isBrowser && new URLSearchParams(window.location.search).has('qa')
/** QA profiling: ?qa&off=forge,figure,post to switch scene parts off */
export const qaOff = (part: string) =>
  isQA() && (new URLSearchParams(window.location.search).get('off') ?? '').split(',').includes(part)

export const ease = {
  out: 'expo.out',
  inOut: 'expo.inOut',
  soft: 'power3.out',
  forge: 'forge',
}

type ScrollInfo = { y: number; velocity: number; progress: number; limit: number }
type ScrollFn = (s: ScrollInfo) => void
type TickFn = (time: number, delta: number) => void

let lenis: Lenis | null = null
let booted = false
const scrollFns = new Set<ScrollFn>()
const tickFns = new Set<TickFn>()
const scrollState: ScrollInfo = { y: 0, velocity: 0, progress: 0, limit: 1 }

export function boot() {
  if (booted || !isBrowser) return
  booted = true
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase)
  // Heat curve: fast strike, long cool down.
  CustomEase.create('forge', 'M0,0 C0.12,0.6 0.22,0.92 0.42,0.98 0.62,1.01 0.8,1 1,1')
  gsap.defaults({ ease: 'expo.out', duration: 1 })
  gsap.ticker.lagSmoothing(500, 33)
  if (isQA()) gsap.ticker.lagSmoothing(0)

  if (!prefersReducedMotion()) {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95, touchMultiplier: 1.4, autoRaf: false })
    lenis.on('scroll', (l: Lenis) => {
      scrollState.y = l.scroll
      scrollState.velocity = l.velocity
      scrollState.limit = l.limit
      scrollState.progress = l.limit > 1 ? l.scroll / l.limit : 0
      ScrollTrigger.update()
      scrollFns.forEach((fn) => fn(scrollState))
    })
  } else {
    // Native scroll, fed through the same ticker so listeners stay in one place.
    let last = -1
    tickFns.add(() => {
      const y = window.scrollY
      if (y === last) return
      last = y
      const limit = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      scrollState.y = y
      scrollState.velocity = 0
      scrollState.limit = limit
      scrollState.progress = y / limit
      scrollFns.forEach((fn) => fn(scrollState))
    })
  }

  gsap.ticker.add((time, deltaMs) => {
    lenis?.raf(time * 1000)
    tickFns.forEach((fn) => fn(time, deltaMs / 1000))
  })

  // Frame steps aside when scrolling down, returns on scroll up.
  let lastY = 0
  scrollFns.add(({ y }) => {
    if (Math.abs(y - lastY) < 6) return
    document.documentElement.classList.toggle('frame-away', y > 200 && y > lastY)
    lastY = y
  })
}

export function onScroll(fn: ScrollFn) {
  scrollFns.add(fn)
  fn(scrollState)
  return () => {
    scrollFns.delete(fn)
  }
}

export function onTick(fn: TickFn) {
  tickFns.add(fn)
  return () => {
    tickFns.delete(fn)
  }
}

export const getScroll = () => scrollState

export function scrollTo(target: number | string | HTMLElement, opts: { immediate?: boolean; offset?: number } = {}) {
  if (lenis) {
    lenis.scrollTo(target, { immediate: opts.immediate, offset: opts.offset ?? 0, duration: 1.6 })
    return
  }
  let y = 0
  if (typeof target === 'number') y = target
  else {
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
    if (!el) return
    y = el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0)
  }
  window.scrollTo({ top: y, behavior: 'auto' })
}

export function stopScroll() {
  lenis?.stop()
}
export function startScroll() {
  lenis?.start()
}
export function resizeScroll() {
  lenis?.resize()
  ScrollTrigger.refresh()
}

export { gsap, ScrollTrigger, SplitText }
