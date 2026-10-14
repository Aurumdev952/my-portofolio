// Captures the public project sites used on holo screens and case studies.
// Run: node scripts/shoot-sites.mjs
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import sharp from 'sharp'

const SITES = [
  { slug: 'tujyane', url: 'https://tujyaneltd.com/' },
  { slug: 'uwera', url: 'https://uwera.rw/' },
  { slug: 'uzabox', url: 'https://uzabox.com/' },
]
const OUT = 'public/projects'
await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
})
for (const site of SITES) {
  for (const [kind, viewport, scale] of [
    ['desktop', { width: 1440, height: 900 }, 1],
    ['mobile', { width: 390, height: 844 }, 2],
  ]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: scale })
    try {
      await page.goto(site.url, { waitUntil: 'networkidle', timeout: 45000 })
    } catch {
      console.warn('slow load', site.url)
    }
    await page.waitForTimeout(2500)
    const png = await page.screenshot({ type: 'png' })
    const file = `${OUT}/${site.slug}-${kind}.webp`
    await sharp(png)
      .resize({ width: kind === 'desktop' ? 1600 : 780 })
      .webp({ quality: 82 })
      .toFile(file)
    console.log('saved', file)
    await page.close()
  }
}
await browser.close()
