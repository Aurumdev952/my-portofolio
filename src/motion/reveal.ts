import { useEffect } from 'react'
import type { RefObject } from 'react'
import { ScrollTrigger, SplitText, gsap, prefersReducedMotion } from './engine'

// Intro bus: the doors fire it when they finish opening.
const introFns = new Set<() => void>()
let introPlayed = false
export function playIntro() {
  introPlayed = true
  introFns.forEach((fn) => fn())
}
export function resetIntro() {
  introPlayed = false
}
function onIntro(fn: () => void) {
  if (introPlayed) {
    fn()
    return () => {}
  }
  introFns.add(fn)
  return () => {
    introFns.delete(fn)
  }
}

const HOT = '#ffb46b'

/**
 * Forge reveal: text lines strike up from below glowing hot, then cool to ink.
 *   data-split          lines reveal on scroll (or with the intro when data-intro is set)
 *   data-reveal="up"    block rises and fades in
 *   data-reveal="clip"  block wipes up
 *   data-intro          play with the page intro instead of on scroll
 *   data-delay="0.2"
 */
export function useReveal(root: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    if (prefersReducedMotion()) {
      document.documentElement.classList.add('is-revealed-all')
      return
    }
    const splits: SplitText[] = []
    const offs: (() => void)[] = []
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>('[data-split]').forEach((node) => {
        const delay = Number(node.dataset.delay ?? 0)
        let anim: gsap.core.Tween | null = null
        let started = false
        const split = SplitText.create(node, {
          type: 'lines',
          linesClass: 'split-line',
          mask: 'lines',
          autoSplit: true,
          onSplit(self) {
            const ink = getComputedStyle(node).color
            anim = gsap.fromTo(
              self.lines,
              { yPercent: 112, color: HOT },
              {
                yPercent: 0,
                color: ink,
                duration: 1.1,
                stagger: 0.07,
                delay,
                ease: 'expo.out',
                paused: true,
                clearProps: 'color',
              },
            )
            if (started) anim.progress(1)
            return anim
          },
        })
        splits.push(split)
        gsap.set(node, { opacity: 1 })
        const play = () => {
          started = true
          anim?.play()
        }
        if (node.hasAttribute('data-intro')) offs.push(onIntro(play))
        else ScrollTrigger.create({ trigger: node, start: 'top 88%', once: true, onEnter: play })
      })

      el.querySelectorAll<HTMLElement>('[data-reveal]').forEach((node) => {
        const kind = node.dataset.reveal
        const delay = Number(node.dataset.delay ?? 0)
        const from =
          kind === 'clip'
            ? { opacity: 1, clipPath: 'inset(100% 0% 0% 0%)' }
            : kind === 'fade'
              ? { opacity: 0 }
              : { opacity: 0, y: 28 }
        const to =
          kind === 'clip'
            ? { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3 }
            : { opacity: 1, y: 0, duration: 1.1 }
        const tween = gsap.fromTo(node, from, { ...to, delay, ease: 'expo.out', paused: true })
        if (node.hasAttribute('data-intro')) offs.push(onIntro(() => tween.play()))
        else ScrollTrigger.create({ trigger: node, start: 'top 90%', once: true, onEnter: () => tween.play() })
      })
    }, el)
    return () => {
      offs.forEach((f) => f())
      splits.forEach((s) => s.revert())
      ctx.revert()
    }
  }, deps)
}
