// Share cards and icons for link previews (WhatsApp, LinkedIn, X, Slack, Discord, iMessage).
//   node scripts/build-og.mjs [baseUrl]
// - public/og.jpg          home card: the live hero render without the UI chrome (needs the
//                          production server running at baseUrl, default http://127.0.0.1:4400)
// - public/og/<slug>.jpg   one card per project, from its screenshot or its system diagram
// - public/favicon.ico, public/icon-192.png, public/icon-512.png
// Cards are 1200x630 JPEGs kept well under 300 KB (WhatsApp drops larger previews).
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { chromium } from 'playwright'
import { projects, site } from '../src/content/site.ts'
import { systemArt } from '../src/art/systemArt.ts'

const base = process.argv.find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:4400'
const only = process.argv.includes('--cards') ? 'cards' : process.argv.includes('--home') ? 'home' : 'all'
const domain = new URL(site.url).host
const W = 1200
const H = 630

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})

async function toJpeg(png, out) {
  const buf = await sharp(png).resize(W, H).jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer()
  await writeFile(out, buf)
  console.log(`${out}  ${(buf.length / 1024).toFixed(0)} KB`)
}

// ---------- home card ----------
async function homeCard() {
  const page = await browser.newPage({ viewport: { width: W, height: H } })
  await page.goto(`${base}/?qa`, { waitUntil: 'load' })
  await page.waitForFunction(() => document.documentElement.classList.contains('gl-on'), null, { timeout: 90000 })
  // let the intro text land and the scene settle
  await page.waitForTimeout(5000)
  await page.addStyleTag({
    content: `.frame-corner,.skip-link,.og-hide{display:none!important}
      #og-domain{position:fixed;left:26px;bottom:22px;z-index:200;font:500 15px/1 'JetBrains Mono',monospace;letter-spacing:.02em;color:#eceae4}
      #og-domain b{color:#ff7a1a;font-weight:500}`,
  })
  await page.evaluate((d) => {
    // the "Scroll to forge" hint means nothing in a still image
    for (const n of document.querySelectorAll('main .mono')) if (n.textContent?.includes('Scroll to')) n.classList.add('og-hide')
    const el = document.createElement('div')
    el.id = 'og-domain'
    el.innerHTML = `<b>●</b> ${d}`
    document.body.appendChild(el)
  }, domain)
  await page.waitForTimeout(600)
  await toJpeg(await page.screenshot({ type: 'png' }), 'public/og.jpg')
  await page.close()
}

// ---------- project cards ----------
const ORIGIN = 'https://og.local'
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function cardHtml(p) {
  const img = p.image ? `${ORIGIN}${p.image.src}` : `${ORIGIN}/art/${p.slug}.svg`
  const kinds = p.kind.join(' · ')
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Archivo;src:url(${ORIGIN}/fonts/archivo-100_900-normal.woff2) format('woff2');font-weight:100 900;font-stretch:62% 125%}
@font-face{font-family:Mono;src:url(${ORIGIN}/fonts/jetbrains-mono-400-normal.woff2) format('woff2')}
*{margin:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;background:#0b0c0e;color:#eceae4;overflow:hidden}
.shot{position:absolute;top:0;right:0;width:560px;height:${H}px;object-fit:cover;object-position:${p.image ? 'top center' : 'center'};
  -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 30%);mask-image:linear-gradient(90deg,transparent 0,#000 30%);opacity:${p.image ? 0.92 : 1}}
.glow{position:absolute;inset:0;background:radial-gradient(60% 80% at 82% 40%,rgba(191,217,255,.10),transparent 70%)}
.text{position:absolute;left:64px;top:56px;bottom:52px;width:540px;display:flex;flex-direction:column}
.mono{font:400 17px/1.3 Mono,monospace;letter-spacing:.02em;color:#a3a6ab}
.mono b{color:#ff7a1a;font-weight:400}
h1{font-family:Archivo;font-weight:820;font-stretch:72%;text-transform:uppercase;letter-spacing:-.03em;line-height:.9;margin-top:auto;font-size:var(--fs,104px)}
p{font-family:Archivo;font-weight:450;font-size:25px;line-height:1.35;color:#c9c7c1;margin-top:22px;max-width:520px}
.foot{margin-top:auto;display:flex;align-items:center;gap:14px;padding-top:28px}
.bar{width:44px;height:3px;background:#ff7a1a}
.name{font-family:Archivo;font-weight:640;font-size:20px;letter-spacing:-.01em}
</style></head><body>
<img class="shot" src="${img}" alt="">
<div class="glow"></div>
<div class="text">
  <div class="mono"><b>●</b> Case study · ${esc(kinds)}</div>
  <h1>${esc(p.title)}</h1>
  <p>${esc(p.summary)}</p>
  <div class="foot"><span class="bar"></span><span class="name">${esc(site.name)}</span><span class="mono">${esc(domain)}</span></div>
</div>
</body></html>`
}

async function projectCards() {
  await mkdir('public/og', { recursive: true })
  const page = await browser.newPage({ viewport: { width: W, height: H } })
  let current = null
  await page.route(`${ORIGIN}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/card') return route.fulfill({ contentType: 'text/html', body: cardHtml(current) })
    const art = path.match(/^\/art\/(.+)\.svg$/)
    if (art) {
      const p = projects.find((x) => x.slug === art[1])
      return route.fulfill({ contentType: 'image/svg+xml', body: systemArt(p.art, p.title) })
    }
    try {
      const body = await readFile(`public${decodeURIComponent(path)}`)
      const type = path.endsWith('.woff2') ? 'font/woff2' : path.endsWith('.webp') ? 'image/webp' : 'application/octet-stream'
      return route.fulfill({ body, contentType: type })
    } catch {
      return route.fulfill({ status: 404, body: '' })
    }
  })
  for (const p of projects) {
    current = p
    await page.goto(`${ORIGIN}/card`)
    await page.evaluate(() => document.fonts.ready)
    await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0))
    // fit the title: shrink until it is at most three lines and no word overflows the column
    await page.evaluate(() => {
      const h = document.querySelector('h1')
      let fs = 104
      const fits = () => {
        const lines = Math.round(h.getBoundingClientRect().height / (fs * 0.9))
        return lines <= (fs > 80 ? 2 : 3) && h.scrollWidth <= h.clientWidth
      }
      h.style.setProperty('--fs', `${fs}px`)
      while (!fits() && fs > 52) {
        fs -= 4
        h.style.setProperty('--fs', `${fs}px`)
      }
    })
    await toJpeg(await page.screenshot({ type: 'png' }), `public/og/${p.slug}.jpg`)
  }
  await page.close()
}

// ---------- icons ----------
async function icons() {
  const svg = await readFile('public/favicon.svg')
  const png = (s) => sharp(svg, { density: 384 }).resize(s, s).png().toBuffer()
  await writeFile('public/icon-192.png', await png(192))
  await writeFile('public/icon-512.png', await png(512))
  // .ico holding PNG images (supported by every current browser and crawler)
  const imgs = await Promise.all([16, 32, 48].map(async (s) => ({ s, data: await png(s) })))
  const head = Buffer.alloc(6 + imgs.length * 16)
  head.writeUInt16LE(0, 0)
  head.writeUInt16LE(1, 2)
  head.writeUInt16LE(imgs.length, 4)
  let offset = head.length
  imgs.forEach(({ s, data }, i) => {
    const o = 6 + i * 16
    head.writeUInt8(s, o)
    head.writeUInt8(s, o + 1)
    head.writeUInt16LE(1, o + 4)
    head.writeUInt16LE(32, o + 6)
    head.writeUInt32LE(data.length, o + 8)
    head.writeUInt32LE(offset, o + 12)
    offset += data.length
  })
  await writeFile('public/favicon.ico', Buffer.concat([head, ...imgs.map((i) => i.data)]))
  console.log('icons: favicon.ico, icon-192.png, icon-512.png')
}

if (only !== 'home') {
  await projectCards()
  await icons()
}
if (only !== 'cards') await homeCard()
await browser.close()
