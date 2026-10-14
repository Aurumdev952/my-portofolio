// Share cards and icons for link previews (WhatsApp, LinkedIn, X, Slack, Discord, iMessage).
//   node scripts/build-og.mjs [--home | --cards]
// - public/og.jpg          home card: the portrait with the stack floating around it, name,
//                          title and handles
// - public/og/<slug>.jpg   one card per project, from its screenshot or its system diagram
// - public/favicon.ico, public/icon-192.png, public/icon-512.png
// Cards are 1200x630 JPEGs kept well under 300 KB (WhatsApp drops larger previews).
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { chromium } from 'playwright'
import * as si from 'simple-icons'
import { projects, site } from '../src/content/site.ts'
import { systemArt } from '../src/art/systemArt.ts'

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

/** A page on a private origin that serves public/ files and the card HTML, so fonts load same-origin. */
async function cardPage(html) {
  const page = await browser.newPage({ viewport: { width: W, height: H } })
  await page.route(`${ORIGIN}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/card') return route.fulfill({ contentType: 'text/html', body: html() })
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
  return page
}

async function shoot(page) {
  await page.goto(`${ORIGIN}/card`)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0))
}

async function projectCards() {
  await mkdir('public/og', { recursive: true })
  let current = null
  const page = await cardPage(() => cardHtml(current))
  for (const p of projects) {
    current = p
    await shoot(page)
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

// ---------- home card ----------
// The stack that floats around the portrait: [simple-icons key, centre x, centre y, size, tilt, depth]
// depth 1 = sharp and bright, lower = further back (smaller, softer). The face stays clear.
const ORBIT = [
  ['siPython', 704, 128, 66, -8, 1],
  ['siGo', 846, 54, 48, 6, 0.8],
  ['siDocker', 1002, 40, 44, -5, 0.6],
  ['siKubernetes', 1118, 104, 62, 9, 1],
  ['siPostgresql', 1150, 262, 60, -6, 1],
  ['siRedis', 1092, 404, 50, 7, 0.85],
  ['siApachekafka', 1160, 540, 46, -9, 0.7],
  ['siTypescript', 664, 296, 58, 7, 1],
  ['siHuggingface', 616, 196, 40, -4, 0.55],
  ['siNestjs', 690, 452, 52, -7, 0.9],
  ['siPytorch', 760, 560, 40, 10, 0.6],
  ['siTerraform', 598, 372, 36, -4, 0.55],
  ['siLangchain', 1170, 182, 34, 5, 0.5],
]

function iconColor(hex) {
  const n = parseInt(hex, 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  // very dark brand colours (Kafka, Next.js) would vanish on graphite: use ink instead
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 70 ? '#eceae4' : `#${hex}`
}

function handle(href) {
  return new URL(href).pathname.split('/').filter(Boolean).pop() ?? href
}

function homeHtml() {
  const gh = site.socials.find((s) => s.label === 'GitHub')
  const li = site.socials.find((s) => s.label === 'LinkedIn')
  const plates = ORBIT.map(([key, x, y, size, tilt, depth]) => {
    const icon = si[key]
    const blur = depth < 0.7 ? (0.7 - depth) * 6 : 0
    return `<div class="plate" style="left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;transform:rotate(${tilt}deg);opacity:${0.45 + depth * 0.55};filter:blur(${blur.toFixed(1)}px)">
      <svg viewBox="0 0 24 24" fill="${iconColor(icon.hex)}"><path d="${icon.path}"/></svg></div>`
  }).join('')
  const [first, middle, ...rest] = site.name.split(' ')
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Archivo;src:url(${ORIGIN}/fonts/archivo-100_900-normal.woff2) format('woff2');font-weight:100 900;font-stretch:62% 125%}
@font-face{font-family:Mono;src:url(${ORIGIN}/fonts/jetbrains-mono-400-normal.woff2) format('woff2')}
*{margin:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;background:#0b0c0e;color:#eceae4;overflow:hidden}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:48px 48px;
  -webkit-mask-image:radial-gradient(70% 90% at 75% 45%,#000,transparent 75%);mask-image:radial-gradient(70% 90% at 75% 45%,#000,transparent 75%)}
.glow{position:absolute;inset:0;background:radial-gradient(34% 52% at 74% 40%,rgba(191,217,255,.22),transparent 70%),radial-gradient(30% 30% at 92% 96%,rgba(255,122,26,.16),transparent 70%)}
.ring{position:absolute;left:600px;top:20px;width:620px;height:600px;border:1px dashed rgba(191,217,255,.16);border-radius:50%;transform:rotate(-14deg)}
.ring.b{left:650px;top:70px;width:520px;height:500px;border-color:rgba(255,122,26,.12);transform:rotate(20deg)}
.me{position:absolute;right:-30px;bottom:0;height:600px;
  filter:drop-shadow(0 0 1.5px rgba(191,217,255,.9)) drop-shadow(0 0 26px rgba(191,217,255,.35));
  -webkit-mask-image:linear-gradient(#000 82%,transparent);mask-image:linear-gradient(#000 82%,transparent)}
.plate{position:absolute;display:grid;place-items:center;border-radius:22%;
  background:linear-gradient(160deg,#22252b,#121317);border:1px solid rgba(255,255,255,.12);
  box-shadow:0 10px 24px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.08)}
.plate svg{width:56%;height:56%}
.text{position:absolute;left:64px;top:54px;bottom:46px;width:560px;display:flex;flex-direction:column}
.mono{font:400 17px/1.3 Mono,monospace;letter-spacing:.02em;color:#a3a6ab}
.mono b{color:#ff7a1a;font-weight:400}
h1{font-family:Archivo;font-weight:820;font-stretch:72%;text-transform:uppercase;letter-spacing:-.03em;line-height:.88;font-size:100px;margin-top:30px}
.role{display:flex;align-items:center;gap:14px;margin-top:30px;font-family:Archivo;font-weight:640;font-size:34px;letter-spacing:-.01em}
.role i{width:40px;height:3px;background:#ff7a1a}
.sub{font-family:Archivo;font-weight:450;font-size:22px;color:#c9c7c1;margin-top:10px}
.handles{margin-top:auto;display:flex;flex-direction:column;gap:12px}
.row{display:flex;gap:22px;align-items:center}
.h{display:flex;align-items:center;gap:10px;font:400 18px/1 Mono,monospace;color:#eceae4}
.h svg{width:22px;height:22px}
.in{width:22px;height:22px;border-radius:4px;background:#eceae4;color:#0b0c0e;display:grid;place-items:center;font:800 14px/1 Archivo;letter-spacing:-.02em}
</style></head><body>
<div class="grid"></div><div class="glow"></div><div class="ring"></div><div class="ring b"></div>
<img class="me" src="${ORIGIN}/portrait/color.webp" alt="">
${plates}
<div class="text">
  <div class="mono"><b>●</b> ${esc(site.location)}</div>
  <h1>${esc(first)}<br>${esc(middle)}<br>${esc(rest.join(' '))}</h1>
  <div class="role"><i></i>${esc(site.role)}</div>
  <div class="sub">Backends that scale · Platform · AI</div>
  <div class="handles">
    <div class="row">
      ${gh ? `<span class="h"><svg viewBox="0 0 24 24" fill="#eceae4"><path d="${si.siGithub.path}"/></svg>${esc(handle(gh.href))}</span>` : ''}
      ${li ? `<span class="h"><span class="in">in</span>${esc(handle(li.href))}</span>` : ''}
    </div>
    <div class="mono"><b>●</b> ${esc(domain)}</div>
  </div>
</div>
</body></html>`
}

async function homeCard() {
  const page = await cardPage(homeHtml)
  await shoot(page)
  await toJpeg(await page.screenshot({ type: 'png' }), 'public/og.jpg')
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
