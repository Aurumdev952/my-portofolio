// Blast doors: the loader and the page transition are the same object.
// They move with CSS transitions so they stay smooth on the compositor even while the main
// thread is busy compiling shaders or hydrating the next page.
import { prefersReducedMotion } from './engine'
import { playIntro } from './reveal'

const CLOSE_MS = 760
const OPEN_MS = 900

const root = () => document.querySelector<HTMLElement>('#loader')
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))

export async function closeDoors(): Promise<void> {
  const el = root()
  if (!el) return
  el.hidden = false
  el.dataset.mode = 'transition'
  el.style.pointerEvents = 'auto'
  await nextFrame()
  el.dataset.state = 'closed'
  await wait(prefersReducedMotion() ? 260 : CLOSE_MS)
}

export async function openDoors(): Promise<void> {
  const el = root()
  if (!el) return
  el.hidden = false
  await nextFrame()
  el.dataset.state = 'open'
  el.style.pointerEvents = 'none'
  document.documentElement.classList.add('is-loaded')
  const reduced = prefersReducedMotion()
  window.setTimeout(playIntro, reduced ? 0 : 340)
  await wait(reduced ? 300 : OPEN_MS)
  el.hidden = true
}

/** Pages other than the first home visit skip the loader entirely. */
export function skipLoader() {
  const el = root()
  document.documentElement.classList.add('is-loaded')
  if (el) {
    el.dataset.state = 'open'
    el.hidden = true
  }
  playIntro()
}
