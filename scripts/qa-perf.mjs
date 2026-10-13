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
await page.waitForTimeout(7000)
const keys = await page.evaluate(() =>
  [...document.querySelectorAll('[data-key]')].map((el) => {
    const r = el.getBoundingClientRect()
    return { key: el.getAttribute('data-key'), y: r.top + window.scrollY + Math.max(0, (r.height - window.innerHeight) / 2) }
  }),
)
const rows = []
for (const k of keys) {
  await page.evaluate((y) => window.scrollTo(0, y), k.key === '0' ? 0 : k.y)
  await page.waitForTimeout(2500)
  const p = await page.evaluate(() => ({ ...window.__forge }))
  rows.push({ key: k.key, calls: p.calls, tris: p.tris, lights: p.lights, programs: p.programs, cpuMs: +p.frameMs.toFixed(1) })
}
for (const path of ['/work?qa', '/work/tujyane?qa']) {
  await page.goto(base + path, { waitUntil: 'load' })
  await page.waitForTimeout(5000)
  const p = await page.evaluate(() => ({ ...window.__forge }))
  rows.push({ key: path, calls: p.calls, tris: p.tris, lights: p.lights, programs: p.programs, cpuMs: +p.frameMs.toFixed(1) })
}
console.table(rows)
await browser.close()
