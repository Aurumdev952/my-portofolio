// Dev helper: measures delivered frame rate and long tasks during every interaction of the DOM
// layer (smooth scroll, text reveals, card transitions, doors, gallery, hovers).
// The WebGL layer is switched off with ?nogl because this machine has no GPU; its cost is
// measured separately by qa-perf.mjs.
//   node scripts/qa-smooth.mjs [baseUrl] [--mobile]
import { chromium } from 'playwright'

const base = process.argv.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:4400'
const mobile = process.argv.includes('--mobile')
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const ctx = await browser.newContext(
  mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1440, height: 900 } },
)
const page = await ctx.newPage()
if (mobile) {
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
}
await page.addInitScript(() => {
  const w = window
  w.__frames = []
  w.__long = []
  let last = performance.now()
  const loop = (t) => {
    w.__frames.push(t - last)
    last = t
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => w.__long.push(e.duration))).observe({ type: 'longtask', buffered: true })
  } catch {}
})

const rows = []
async function phase(name, fn) {
  await page.evaluate(() => {
    window.__frames.length = 0
    window.__long.length = 0
  })
  await fn()
  const r = await page.evaluate(() => ({ f: window.__frames.slice(1), l: window.__long.slice() }))
  const f = r.f
  const avg = f.reduce((a, b) => a + b, 0) / Math.max(1, f.length)
  const sorted = [...f].sort((a, b) => a - b)
  rows.push({
    phase: name,
    frames: f.length,
    'avg fps': +(1000 / avg).toFixed(0),
    'p95 frame ms': +sorted[Math.floor(sorted.length * 0.95)]?.toFixed(1),
    'dropped (>25ms) %': +((f.filter((x) => x > 25).length / Math.max(1, f.length)) * 100).toFixed(1),
    'long tasks': r.l.length,
    'longest task ms': r.l.length ? Math.round(Math.max(...r.l)) : 0,
  })
}

await page.goto(`${base}/?nogl`, { waitUntil: 'load' })
await phase('loader + hero intro', () => page.waitForTimeout(3000))
await phase('smooth scroll through the story', async () => {
  for (let i = 0; i < 70; i++) {
    if (mobile) await page.evaluate(() => window.scrollBy(0, 260))
    else await page.mouse.wheel(0, 320)
    await page.waitForTimeout(110)
  }
  await page.waitForTimeout(800)
})
await phase('scroll back up (header returns)', async () => {
  for (let i = 0; i < 12; i++) {
    if (mobile) await page.evaluate(() => window.scrollBy(0, -260))
    else await page.mouse.wheel(0, -320)
    await page.waitForTimeout(110)
  }
  await page.waitForTimeout(600)
})
await phase('doors transition to /work', async () => {
  await page.getByRole('link', { name: 'Work', exact: true }).first().click()
  await page.waitForURL('**/work')
  await page.waitForTimeout(2200)
})
await phase('gallery: keys, filters, hovers', async () => {
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(450)
  }
  await page.getByRole('button', { name: 'AI', exact: true }).click()
  await page.waitForTimeout(700)
  await page.getByRole('button', { name: 'All', exact: true }).click()
  if (!mobile) {
    for (const name of ['Backend', 'Infra', 'Public sector']) {
      await page.getByRole('button', { name, exact: true }).hover()
      await page.waitForTimeout(300)
    }
  }
  await page.waitForTimeout(800)
})
await phase('open case study (doors)', async () => {
  await page.getByRole('link', { name: /Open case study/ }).click()
  await page.waitForURL('**/work/*')
  await page.waitForTimeout(2200)
})
await phase('case study scroll + reveals', async () => {
  for (let i = 0; i < 25; i++) {
    if (mobile) await page.evaluate(() => window.scrollBy(0, 240))
    else await page.mouse.wheel(0, 300)
    await page.waitForTimeout(110)
  }
  await page.waitForTimeout(800)
})

console.log(mobile ? 'Phone (390 px, 4x CPU throttle)' : 'Desktop (1440 px)')
console.table(rows)
await browser.close()
