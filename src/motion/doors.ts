// Blast doors: the loader and the page transition are the same object.
import { gsap, prefersReducedMotion } from './engine'
import { playIntro } from './reveal'

const q = (sel: string) => document.querySelector<HTMLElement>(sel)

export function closeDoors(): Promise<void> {
  const root = q('#doors')
  if (!root) return Promise.resolve()
  root.classList.remove('is-open')
  root.style.pointerEvents = 'auto'
  const l = q('.doors__leaf--l')
  const r = q('.doors__leaf--r')
  const seam = q('.doors__seam')
  if (prefersReducedMotion()) {
    return new Promise((done) => {
      gsap.set([l, r], { xPercent: 0 })
      gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'none', onComplete: () => done() })
    })
  }
  gsap.set(root, { opacity: 1 })
  return new Promise((done) => {
    gsap
      .timeline({ onComplete: () => done() })
      .fromTo(l, { xPercent: -101 }, { xPercent: 0, duration: 0.75, ease: 'expo.inOut' }, 0)
      .fromTo(r, { xPercent: 101 }, { xPercent: 0, duration: 0.75, ease: 'expo.inOut' }, 0)
      .fromTo(seam, { opacity: 0, scaleY: 0.2 }, { opacity: 1, scaleY: 1, duration: 0.25, ease: 'power2.out' }, 0.62)
  })
}

export function openDoors(): Promise<void> {
  const root = q('#doors')
  if (!root) return Promise.resolve()
  const l = q('.doors__leaf--l')
  const r = q('.doors__leaf--r')
  const seam = q('.doors__seam')
  const hud = q('.doors__hud')
  const finish = () => {
    root.classList.add('is-open')
    root.style.pointerEvents = 'none'
    document.documentElement.classList.add('is-loaded')
  }
  if (prefersReducedMotion()) {
    return new Promise((done) => {
      gsap.to(root, {
        opacity: 0,
        duration: 0.3,
        ease: 'none',
        onComplete: () => {
          finish()
          playIntro()
          done()
        },
      })
    })
  }
  return new Promise((done) => {
    gsap
      .timeline({
        onComplete: () => {
          finish()
          done()
        },
      })
      .to(hud, { opacity: 0, duration: 0.25, ease: 'none' }, 0)
      .to(seam, { opacity: 1, scaleY: 1, duration: 0.18, ease: 'power2.out' }, 0)
      .to(seam, { opacity: 0, duration: 0.3, ease: 'none' }, 0.32)
      .to(l, { xPercent: -101, duration: 0.95, ease: 'expo.inOut' }, 0.2)
      .to(r, { xPercent: 101, duration: 0.95, ease: 'expo.inOut' }, 0.2)
      .call(playIntro, [], 0.6)
  })
}
