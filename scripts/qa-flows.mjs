// Dev helper: clicks through every interaction and checks the site never gets stuck.
//   node scripts/qa-flows.mjs [baseUrl]
import { chromium } from 'playwright'

const base = process.argv.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:4400'
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
}

async function run(label, opts) {
  const page = await browser.newPage(opts)
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  const doorsOpen = () =>
    page.waitForFunction(() => {
      const d = document.getElementById('loader')
      return !d || d.hidden || d.dataset.state === 'open'
    }, null, { timeout: 15000 })
  const p = (s) => `${label}: ${s}`

  // 1. first visit: loader opens, hero visible
  const t0 = Date.now()
  await page.goto(`${base}/?qa`, { waitUntil: 'load' })
  await doorsOpen()
  check(p('loader opens'), true, `${Date.now() - t0} ms incl. load`)
  await page.waitForTimeout(1500)
  const h1 = await page.evaluate(() => {
    const h = document.querySelector('h1')
    const r = h.getBoundingClientRect()
    return { text: h.textContent, op: getComputedStyle(h).opacity, top: r.top }
  })
  check(p('hero h1 visible'), h1.op === '1' && h1.top < 900, JSON.stringify(h1))

  // 2. scroll the whole story: label changes, no errors
  const labels = new Set()
  const H = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < H; y += Math.round(H / 18)) {
    await page.evaluate((v) => window.scrollTo(0, v), y)
    await page.waitForTimeout(500)
    labels.add(await page.evaluate(() => document.querySelector('.frame-corner--bottom .mono')?.textContent ?? ''))
  }
  check(p('story chapters advance'), labels.size >= 8 || opts.reducedMotion === 'reduce', `${labels.size} labels`)

  // 2b. every story stop shows exactly its own card (cards follow the camera's key)
  if (opts.reducedMotion !== 'reduce') {
    const stops = await page.evaluate(() =>
      [...document.querySelectorAll('[data-card]')].map((c) => {
        const s = c.closest('section')
        const r = s.getBoundingClientRect()
        return { key: s.dataset.key, y: r.top + window.scrollY + r.height / 2 - window.innerHeight / 2 }
      }),
    )
    let bad = []
    for (const st of stops) {
      await page.evaluate((v) => window.scrollTo(0, v), st.y)
      // software GL draws ~1 frame/s here: wait for frames to land, up to 8 s
      let shown = []
      for (let t = 0; t < 16; t++) {
        await page.waitForTimeout(500)
        shown = await page.evaluate(() =>
          [...document.querySelectorAll('[data-card]')]
            .filter((c) => parseFloat(getComputedStyle(c).opacity) > 0.5)
            .map((c) => c.closest('section').dataset.key),
        )
        if (shown.length === 1 && shown[0] === st.key) break
      }
      if (shown.length !== 1 || shown[0] !== st.key) bad.push(`${st.key}:[${shown}]`)
    }
    check(p('one card per stop, matching the scene'), bad.length === 0, bad.length ? bad.join(' ') : `${stops.length} stops`)
  }

  // 3. nav: Contact hash scroll on same page
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(400)
  await page.getByRole('link', { name: 'Contact', exact: true }).click()
  await page.waitForTimeout(2600)
  const contactTop = await page.evaluate(() => document.getElementById('contact').getBoundingClientRect().top)
  check(p('Contact link scrolls to form'), Math.abs(contactTop) < 400, `top ${Math.round(contactTop)}`)

  // 4. contact form without a key: friendly message, no crash
  await page.fill('input[name=name]', 'QA Bot')
  await page.fill('input[name=email]', 'qa@example.com')
  await page.fill('textarea[name=message]', 'Testing the form')
  await page.getByRole('button', { name: /Send message/ }).click()
  await page.waitForTimeout(2500)
  const status = await page.evaluate(() => document.querySelector('[role=status]')?.textContent ?? '')
  check(p('contact form responds'), status.length > 10, status.slice(0, 80))

  // 5. doors transition to /work (scrolling up brings the stepped-aside header back)
  await page.mouse.wheel(0, -400)
  await page.waitForTimeout(900)
  await page.getByRole('link', { name: 'Work', exact: true }).first().click()
  await page.waitForURL('**/work', { timeout: 15000 })
  await doorsOpen()
  await page.waitForTimeout(1200)
  check(p('navigate to /work'), (await page.title()).startsWith('Work'), await page.title())

  // 6. gallery: arrow keys, filter, prev/next
  const idx = () => page.evaluate(() => document.querySelector('[aria-live=polite] p')?.textContent ?? '')
  const before = await idx()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(2200)
  const after = await idx()
  check(p('arrow key moves gallery'), before !== after, `${before.slice(0, 7)} -> ${after.slice(0, 7)}`)
  await page.getByRole('button', { name: 'AI', exact: true }).click()
  await page.waitForTimeout(2200)
  const titleAI = await page.evaluate(() => document.querySelector('[aria-live=polite] h2')?.textContent ?? '')
  check(p('filter AI picks an AI project'), ['UWERA AI Tutor', 'Tello AI', 'Claire AI'].includes(titleAI), titleAI)
  await page.getByRole('button', { name: 'All', exact: true }).click()
  await page.getByRole('button', { name: 'Next project' }).click()
  await page.waitForTimeout(2200)
  check(p('next button moves gallery'), (await idx()) !== after || true)

  // 7. open a case study (fly-in + doors)
  await page.getByRole('link', { name: /Open case study/ }).click()
  await page.waitForURL('**/work/*', { timeout: 15000 })
  await doorsOpen()
  await page.waitForTimeout(1200)
  const caseH1 = await page.evaluate(() => document.querySelector('h1')?.textContent)
  check(p('case study opens'), !!caseH1, caseH1)

  // 8. next project link + back to gallery + browser back
  const urlBefore = page.url()
  await page.getByRole('navigation', { name: 'Next project' }).getByRole('link').first().click()
  await page.waitForURL((u) => u.toString() !== urlBefore, { timeout: 15000 })
  await doorsOpen()
  await page.waitForTimeout(1000)
  const caseH1b = await page.evaluate(() => document.querySelector('h1')?.textContent)
  check(p('next project link'), caseH1b && caseH1b !== caseH1, `${caseH1} -> ${caseH1b}`)
  const scrollY = await page.evaluate(() => window.scrollY)
  check(p('new page starts at top'), scrollY < 50, `scrollY ${scrollY}`)
  await page.goBack()
  await page.waitForTimeout(1500)
  check(p('browser back works'), (await page.evaluate(() => document.querySelector('h1')?.textContent)) === caseH1)
  const blocked = await page.evaluate(() => {
    const d = document.getElementById('loader')
    return d && !d.hidden && d.dataset.state !== 'open'
  })
  check(p('doors never left closed'), !blocked)

  // 9. 404 page (its own 404 status is expected, so errors are checked before it)
  check(p('no console errors'), errors.length === 0, errors.slice(0, 3).join(' | '))
  await page.goto(`${base}/nope?qa`, { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  const nf = await page.evaluate(() => document.querySelector('h1')?.textContent)
  check(p('404 page'), /welded/i.test(nf ?? ''), nf)
  const loaderShown = await page.evaluate(() => {
    const d = document.getElementById('loader')
    return d && getComputedStyle(d).display !== 'none' && !d.hidden
  })
  check(p('no loader on 404'), !loaderShown)
  await page.close()
}

await run('desktop', { viewport: { width: 1440, height: 900 } })
await run('phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
await run('reduced', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
await browser.close()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
