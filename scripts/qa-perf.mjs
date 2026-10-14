// Dev helper: per story key, draw calls / triangles / lights / CPU frame cost (?qa probe).
//   node scripts/qa-perf.mjs [baseUrl] [--mobile]
import { chromium } from 'playwright'

const base = process.argv.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:4400'
const mobile = process.argv.includes('--mobile')
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 } })
await page.goto(`${base}/?qa`, { waitUntil: 'load' })
// wait until the warm-up has finished compiling (program count stable)
let last = -1
for (let i = 0, stable = 0; i < 80 && stable < 4; i++) {
  await page.waitForTimeout(1500)
  const n = await page.evaluate(() => window.__forge?.programs ?? 0)
  stable = n === last && n > 0 ? stable + 1 : 0
  last = n
}
const keys = await page.evaluate(() =>
  [...document.querySelectorAll('[data-key]')].map((el) => {
    const r = el.getBoundingClientRect()
    return { key: el.getAttribute('data-key'), y: r.top + window.scrollY + Math.max(0, (r.height - window.innerHeight) / 2) }
  }),
)
const rows = []
const pct = (a, q) => {
  const s = [...a].sort((x, y) => x - y)
  return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : 0
}
// updateMs = our scene code per frame (camera, IK, sparks, conveyor, shaders' uniforms);
// renderMs = time inside three's render, which here is a software GPU (SwiftShader).
const row = (key, p) => ({
  key,
  calls: p.calls,
  tris: p.tris,
  programs: p.programs,
  'update p50 ms': +pct(p.samples, 0.5).toFixed(2),
  'update p95 ms': +pct(p.samples, 0.95).toFixed(2),
  'render p50 ms (sw gpu)': +pct(p.renders, 0.5).toFixed(0),
})
for (const k of keys) {
  await page.evaluate((y) => window.scrollTo(0, y), k.key === '0' ? 0 : k.y)
  await page.waitForTimeout(2500)
  await page.evaluate(() => {
    window.__forge.samples.length = 0
    window.__forge.renders.length = 0
  })
  await page.waitForTimeout(2500)
  const p = await page.evaluate(() => ({ ...window.__forge }))
  rows.push(row(k.key, p))
}
for (const path of ['/work?qa', '/work/tujyane?qa']) {
  await page.goto(base + path, { waitUntil: 'load' })
  await page.waitForTimeout(5000)
  await page.evaluate(() => (window.__forge.samples.length = 0))
  await page.waitForTimeout(2500)
  const p = await page.evaluate(() => ({ ...window.__forge }))
  rows.push(row(path, p))
}
console.table(rows)
await browser.close()
