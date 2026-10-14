// Dev helper: screenshots of the story at several scroll positions.
//   node scripts/qa-shots.mjs [baseUrl] [outDir] [--mobile] [--reduced]
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const base = args.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:4400'
const out = args.find((a) => !a.startsWith('http') && !a.startsWith('--')) ?? '.shots/qa'
const mobile = args.includes('--mobile')
const reduced = args.includes('--reduced')
const only = (args.find((a) => a.startsWith('--at=')) ?? '').slice(5)
await mkdir(out, { recursive: true })

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: reduced ? 'reduce' : 'no-preference',
})
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

const tag = `${mobile ? 'm' : 'd'}${reduced ? 'r' : ''}`
await page.goto(`${base}/?qa`, { waitUntil: 'load' })
await page.waitForTimeout(7000)
const sections = await page.evaluate(() =>
  [...document.querySelectorAll('[data-key]')].map((el) => {
    const r = el.getBoundingClientRect()
    return { key: el.getAttribute('data-key'), top: r.top + window.scrollY, h: r.height }
  }),
)
const vh = mobile ? 844 : 900
const stops = [{ name: '00-hero', y: 0 }]
for (const s of sections) {
  if (s.key === '0') continue
  stops.push({ name: `${String(s.key).padStart(2, '0')}-key`, y: s.top + Math.max(0, (s.h - vh) / 2) })
}
for (const stop of stops) {
  if (only && !stop.name.startsWith(only)) continue
  await page.evaluate((y) => window.scrollTo(0, y), stop.y)
  await page.waitForTimeout(3500)
  await page.screenshot({ path: `${out}/${tag}-${stop.name}.png` })
  console.log('shot', stop.name)
}
if (!only) {
  await page.goto(`${base}/work?qa`, { waitUntil: 'load' })
  await page.waitForTimeout(4000)
  await page.screenshot({ path: `${out}/${tag}-work.png` })
  await page.goto(`${base}/work/tujyane?qa`, { waitUntil: 'load' })
  await page.waitForTimeout(3500)
  await page.screenshot({ path: `${out}/${tag}-case.png`, fullPage: false })
}
console.log('errors', JSON.stringify(errors.slice(0, 10), null, 1))
await browser.close()
