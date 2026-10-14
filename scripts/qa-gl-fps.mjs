// Dev helper: delivered frame rate WITH WebGL on, while scrolling the whole story.
//   node scripts/qa-gl-fps.mjs [baseUrl] [--w=1440 --h=900] [--mobile]
import { chromium } from 'playwright'

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=')[1]
const base = process.argv.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:4400'
const mobile = process.argv.includes('--mobile')
const W = +arg('w', mobile ? 390 : 1440)
const H = +arg('h', mobile ? 844 : 900)
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: W, height: H }, isMobile: mobile, hasTouch: mobile })
await page.addInitScript(() => {
  const w = window
  w.__frames = []
  let last = performance.now()
  const loop = (t) => {
    w.__frames.push(t - last)
    last = t
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
})
await page.goto(`${base}/`, { waitUntil: 'load' })
// let the scene mount, warm up and the governor settle
await page.waitForFunction(() => document.documentElement.classList.contains('gl-on'), null, { timeout: 60000 })
await page.waitForTimeout(6000)
const stats = async (label) => {
  const f = await page.evaluate(() => window.__frames.splice(0))
  const s = f.slice(1).sort((a, b) => a - b)
  const avg = s.reduce((a, b) => a + b, 0) / Math.max(1, s.length)
  return {
    phase: label,
    frames: s.length,
    'avg fps': +(1000 / avg).toFixed(1),
    'p50 ms': +s[Math.floor(s.length * 0.5)]?.toFixed(1),
    'p95 ms': +s[Math.floor(s.length * 0.95)]?.toFixed(1),
    'dpr / quality': await page.evaluate(() => `${window.__forgeGov?.dpr ?? '?'} / ${window.__forgeGov?.level ?? '?'}`),
  }
}
const rows = []
await page.evaluate(() => (window.__frames.length = 0))
await page.waitForTimeout(4000)
rows.push(await stats('hero idle (welding)'))
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
const steps = 60
for (let i = 1; i <= steps; i++) {
  if (mobile) await page.evaluate((y) => window.scrollTo({ top: y }), (total * i) / steps)
  else await page.mouse.wheel(0, total / steps)
  await page.waitForTimeout(250)
}
await page.waitForTimeout(1500)
rows.push(await stats('scroll the whole story (3D on)'))
await page.waitForTimeout(3000)
rows.push(await stats('gate idle'))
console.log(`${mobile ? 'Phone' : 'Desktop'} ${W}x${H}, WebGL on (SwiftShader software GPU)`)
console.table(rows)
await browser.close()
