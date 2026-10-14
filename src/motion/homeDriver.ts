// Maps page scroll to the story driver: a continuous key index `k` plus section progress.
import { onScroll } from './engine'
import { story } from './story'

type Range = { start: number; end: number }

export function startHomeDriver(root: HTMLElement, opts: { stackKey: number; gateKey: number }) {
  let ranges: Range[] = []

  const measure = () => {
    const vh = window.innerHeight
    const sections = [...root.querySelectorAll<HTMLElement>('[data-key]')].sort(
      (a, b) => Number(a.dataset.key) - Number(b.dataset.key),
    )
    ranges = sections.map((el, i) => {
      const r = el.getBoundingClientRect()
      const top = r.top + window.scrollY
      const bottom = top + r.height
      let start = i === 0 ? 0 : top - vh * 0.1
      let end = bottom - vh * 0.9
      if (end < start) start = end = (start + end) / 2
      return { start, end }
    })
  }

  const update = (y: number, limit: number) => {
    if (!ranges.length) return
    let k = 0
    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i]
      if (y < r.start) {
        const prev = ranges[i - 1]
        k = prev ? i - 1 + (y - prev.end) / Math.max(1, r.start - prev.end) : 0
        break
      }
      if (y <= r.end) {
        k = i
        break
      }
      k = i
    }
    story.k = k
    const s = ranges[opts.stackKey]
    if (s) story.stack = Math.min(1, Math.max(0, (y - s.start) / Math.max(1, s.end - s.start)))
    const g = ranges[opts.gateKey]
    if (g) story.gate = Math.min(1, Math.max(0, (y - g.start) / Math.max(1, limit - g.start)))
  }

  measure()
  const ro = new ResizeObserver(() => measure())
  ro.observe(root)
  const off = onScroll(({ y, limit }) => update(y, limit))
  document.fonts?.ready.then(measure)
  return () => {
    ro.disconnect()
    off()
    story.k = 0
    story.stack = 0
    story.gate = 0
  }
}
