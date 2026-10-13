// Abstract system drawings for projects whose screens are private (public sector work).
// They show the architecture that was built, not an invented UI. Shared by the DOM (as an
// <img>) and the 3D holo screens (as a texture).
import type { ProjectArt } from '#/content/site'

const W = 1600
const H = 1000
const INK = '#ECEAE4'
const MUTED = '#9A9DA3'
const LINE = 'rgba(236,234,228,0.16)'
const HEAT = '#FF7A1A'
const ARC = '#BFD9FF'
const FONT = `font-family="JetBrains Mono, monospace"`

function frame(title: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(236,234,228,0.05)" stroke-width="1"/></pattern>
  <radialGradient id="v" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#15171b"/><stop offset="1" stop-color="#0b0c0e"/></radialGradient>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#v)"/><rect width="${W}" height="${H}" fill="url(#g)"/>
<text x="64" y="84" ${FONT} font-size="22" fill="${MUTED}" letter-spacing="2">SYSTEM VIEW</text>
<text x="64" y="120" ${FONT} font-size="30" fill="${INK}">${title}</text>
<rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${LINE}"/>
${body}
</svg>`
}

function label(x: number, y: number, t: string, color = MUTED, size = 20, anchor = 'middle') {
  return `<text x="${x}" y="${y}" ${FONT} font-size="${size}" fill="${color}" text-anchor="${anchor}">${t}</text>`
}

function vault() {
  let s = ''
  // incoming record streams
  for (let i = 0; i < 7; i++) {
    const y = 300 + i * 70
    s += `<path d="M120 ${y} C 330 ${y}, 360 520, 520 520" fill="none" stroke="${i === 3 ? HEAT : LINE}" stroke-width="${i === 3 ? 3 : 2}"/>`
    s += `<circle cx="${170 + i * 18}" cy="${y}" r="5" fill="${i === 3 ? HEAT : ARC}"/>`
  }
  s += label(240, 270, 'REST API · REGISTRIES')
  // columnar store
  s += `<rect x="520" y="300" width="520" height="440" fill="rgba(191,217,255,0.04)" stroke="${ARC}" stroke-width="2"/>`
  for (let c = 0; c < 8; c++) {
    for (let r = 0; r < 9; r++) {
      const h = 18 + ((c * 7 + r * 13) % 5) * 4
      const on = (c * 3 + r) % 11 === 0
      s += `<rect x="${548 + c * 62}" y="${330 + r * 44}" width="44" height="${h}" fill="${on ? HEAT : 'rgba(191,217,255,0.32)'}"/>`
    }
  }
  s += label(780, 780, 'POLARS → PARQUET · COLUMNAR')
  // k8s ring
  const cx = 1290
  const cy = 520
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const x = cx + Math.cos(a) * 150
    const y = cy + Math.sin(a) * 150
    const pts = Array.from({ length: 6 }, (_, k) => {
      const b = (k / 6) * Math.PI * 2 + Math.PI / 6
      return `${(x + Math.cos(b) * 34).toFixed(1)},${(y + Math.sin(b) * 34).toFixed(1)}`
    }).join(' ')
    s += `<polygon points="${pts}" fill="rgba(236,234,228,0.04)" stroke="${i === 2 ? HEAT : INK}" stroke-width="2"/>`
    s += `<circle cx="${x}" cy="${y}" r="6" fill="${i === 2 ? HEAT : ARC}"/>`
  }
  s += `<path d="M1040 520 H1120" stroke="${ARC}" stroke-width="2"/>`
  s += label(cx, cy - 6, '99.9%', INK, 44)
  s += label(cx, cy + 34, 'UPTIME')
  s += label(cx, 760, 'KUBERNETES · HA')
  s += label(64, 930, 'Records in, audited, stored by column, served from replicated pods.', MUTED, 20, 'start')
  return frame('National regulation platform', s)
}

function mesh() {
  const nodes: [number, number, string, boolean?][] = [
    [300, 330, 'STUDENTS'],
    [300, 620, 'SCHOOLS'],
    [560, 820, 'COMPANIES'],
    [800, 250, 'AUTH'],
    [1060, 820, 'CONTRACTS', true],
    [1300, 330, 'SDMS'],
    [1300, 620, 'TMIS'],
  ]
  let s = ''
  // message bus
  s += `<rect x="440" y="470" width="720" height="44" fill="rgba(255,122,26,0.08)" stroke="${HEAT}" stroke-width="2"/>`
  s += label(800, 500, 'RABBITMQ', HEAT, 20)
  for (const [x, y, t, hot] of nodes) {
    const by = y < 492 ? 470 : 514
    const bx = Math.min(1160, Math.max(440, x))
    s += `<path d="M${x} ${y} L${bx} ${by}" stroke="${LINE}" stroke-width="2"/>`
    s += `<circle cx="${x}" cy="${y}" r="58" fill="#111317" stroke="${hot ? HEAT : ARC}" stroke-width="2"/>`
    s += `<circle cx="${(x + bx) / 2}" cy="${(y + by) / 2}" r="6" fill="${hot ? HEAT : ARC}"/>`
    s += label(x, y + 7, t, INK, 17)
  }
  // MoU document with stamp
  s += `<g transform="translate(1180 120) rotate(4)"><rect width="250" height="320" fill="#16181c" stroke="${LINE}" stroke-width="2"/>`
  for (let i = 0; i < 9; i++) s += `<rect x="28" y="${40 + i * 24}" width="${150 + ((i * 37) % 50)}" height="6" fill="rgba(236,234,228,0.18)"/>`
  s += `<circle cx="180" cy="262" r="40" fill="none" stroke="${HEAT}" stroke-width="4"/><text x="180" y="268" ${FONT} font-size="15" fill="${HEAT}" text-anchor="middle">SIGNED</text></g>`
  s += label(64, 930, 'Spring Boot services on one message bus, validated against state registries.', MUTED, 20, 'start')
  return frame('Dual TVET management information system', s)
}

function gate() {
  let s = ''
  const steps = ['ARRIVE', 'SCAN', 'VERIFY', 'BADGE', 'HOST']
  for (let i = 0; i < steps.length; i++) {
    const x = 220 + i * 290
    s += `<rect x="${x - 90}" y="420" width="180" height="180" fill="#111317" stroke="${i === 2 ? HEAT : ARC}" stroke-width="2"/>`
    s += label(x, 518, steps[i], INK, 20)
    if (i < steps.length - 1) {
      s += `<path d="M${x + 90} 510 H${x + 200}" stroke="${LINE}" stroke-width="2"/><path d="M${x + 190} 502 L${x + 200} 510 L${x + 190} 518" fill="none" stroke="${INK}" stroke-width="2"/>`
    }
  }
  // scan beam
  s += `<rect x="420" y="380" width="160" height="4" fill="${HEAT}" filter="url(#glow)"/>`
  for (let i = 0; i < 18; i++) {
    s += `<rect x="${130 + i * 74}" y="700" width="40" height="${20 + ((i * 29) % 70)}" fill="${i % 6 === 0 ? HEAT : 'rgba(191,217,255,0.3)'}"/>`
  }
  s += label(64, 860, 'CHECK IN TIME', MUTED, 18, 'start')
  s += label(64, 930, 'A check in flow tuned step by step, covered by tests before it shipped.', MUTED, 20, 'start')
  return frame('Visitor management system', s)
}


function routes() {
  let s = ''
  // clients
  const clients = ['RIDER APP', 'DRIVER APP', 'MERCHANT', 'ADMIN']
  clients.forEach((c, i) => {
    const y = 260 + i * 130
    s += `<rect x="90" y="${y - 40}" width="200" height="80" fill="#111317" stroke="${i === 1 ? HEAT : ARC}" stroke-width="2"/>`
    s += label(190, y + 7, c, INK, 17)
    s += `<path d="M290 ${y} C 380 ${y}, 400 500, 470 500" fill="none" stroke="${LINE}" stroke-width="2"/>`
  })
  // gateway + realtime
  s += `<rect x="470" y="420" width="220" height="160" fill="rgba(191,217,255,0.05)" stroke="${ARC}" stroke-width="2"/>`
  s += label(580, 492, 'API GATEWAY', INK, 19) + label(580, 522, 'WEBSOCKETS', MUTED, 16)
  const services = [
    ['BOOKING', 250],
    ['ROUTING', 380],
    ['WALLET', 510, true],
    ['NOTIFY', 640],
    ['TENANTS', 770],
  ]
  for (const [name, y, hot] of services as [string, number, boolean?][]) {
    s += `<path d="M690 500 C 760 500, 760 ${y}, 820 ${y}" fill="none" stroke="${LINE}" stroke-width="2"/>`
    s += `<rect x="820" y="${y - 34}" width="190" height="68" fill="#111317" stroke="${hot ? HEAT : INK}" stroke-width="2"/>`
    s += label(915, y + 7, name, INK, 17)
  }
  // ledger + postgis
  s += `<path d="M1010 510 H1120" stroke="${HEAT}" stroke-width="2"/>`
  s += `<rect x="1120" y="440" width="190" height="140" fill="rgba(255,122,26,0.06)" stroke="${HEAT}" stroke-width="2"/>`
  s += label(1215, 500, 'LEDGER', HEAT, 19) + label(1215, 530, 'PAYMENTS', MUTED, 15)
  s += `<path d="M1010 380 C 1080 380, 1080 300, 1150 300" fill="none" stroke="${LINE}" stroke-width="2"/>`
  s += `<ellipse cx="1260" cy="300" rx="120" ry="70" fill="#111317" stroke="${ARC}" stroke-width="2"/>`
  s += label(1260, 296, 'POSTGRESQL', INK, 17) + label(1260, 322, 'POSTGIS INDEX', MUTED, 15)
  // geofence
  s += `<circle cx="1360" cy="720" r="90" fill="none" stroke="${HEAT}" stroke-width="2" stroke-dasharray="6 8"/>`
  s += `<circle cx="1360" cy="720" r="7" fill="${HEAT}"/>` + label(1360, 840, 'GEOFENCE', MUTED, 16)
  s += label(64, 930, 'Apps talk over one gateway; money moves through a ledger; location lives in PostGIS.', MUTED, 20, 'start')
  return frame('Tujyane platform', s)
}

function tutor() {
  let s = ''
  s += `<rect x="90" y="420" width="210" height="140" fill="#111317" stroke="${INK}" stroke-width="2"/>`
  s += label(195, 482, 'STUDENT', INK, 19) + label(195, 512, 'NEXT.JS CHAT', MUTED, 15)
  s += `<path d="M300 490 H420" stroke="${LINE}" stroke-width="2"/>`
  s += `<rect x="420" y="400" width="240" height="180" fill="rgba(191,217,255,0.05)" stroke="${ARC}" stroke-width="2"/>`
  s += label(540, 470, 'CONTEXT ENGINE', INK, 18) + label(540, 500, 'MULTI TURN', MUTED, 15) + label(540, 525, 'HISTORY', MUTED, 15)
  // retrieval
  s += `<path d="M660 450 C 740 450, 740 300, 820 300" fill="none" stroke="${HEAT}" stroke-width="2"/>`
  s += `<rect x="820" y="230" width="260" height="140" fill="rgba(255,122,26,0.06)" stroke="${HEAT}" stroke-width="2"/>`
  s += label(950, 292, 'RETRIEVAL', HEAT, 19) + label(950, 322, 'VECTOR SEARCH', MUTED, 15)
  for (let i = 0; i < 6; i++) {
    s += `<rect x="${1150 + (i % 3) * 70}" y="${220 + Math.floor(i / 3) * 90}" width="52" height="68" fill="#16181c" stroke="${LINE}" stroke-width="2"/>`
  }
  s += label(1255, 410, 'CURRICULUM', MUTED, 15)
  s += `<path d="M1080 300 H1140" stroke="${LINE}" stroke-width="2"/>`
  // model
  s += `<path d="M660 530 C 740 530, 740 680, 820 680" fill="none" stroke="${ARC}" stroke-width="2"/>`
  s += `<rect x="820" y="610" width="260" height="140" fill="#111317" stroke="${ARC}" stroke-width="2"/>`
  s += label(950, 672, 'OPEN SOURCE LLM', INK, 18) + label(950, 702, 'GROUNDED ANSWER', MUTED, 15)
  s += `<path d="M1080 680 C 1200 680, 1200 560, 1300 560" fill="none" stroke="${LINE}" stroke-width="2"/>`
  s += label(1330, 552, '−45%', HEAT, 40, 'start') + label(1330, 590, 'HALLUCINATIONS', MUTED, 15, 'start')
  s += label(64, 930, 'Every answer is built from retrieved curriculum passages, then written by the model.', MUTED, 20, 'start')
  return frame('UWERA AI tutor', s)
}

function pipeline() {
  let s = ''
  s += `<rect x="90" y="420" width="220" height="140" fill="#111317" stroke="${INK}" stroke-width="2"/>`
  s += label(200, 482, 'RELEASE', INK, 19) + label(200, 512, 'CI BUILD', MUTED, 15)
  s += `<path d="M310 490 H440" stroke="${HEAT}" stroke-width="2"/>`
  s += `<rect x="440" y="400" width="240" height="180" fill="rgba(255,122,26,0.06)" stroke="${HEAT}" stroke-width="2"/>`
  s += label(560, 470, 'PACKAGER', HEAT, 19) + label(560, 500, 'STACK BUNDLE', MUTED, 15)
  const targets = [
    ['CLOUD', 250, ARC],
    ['ON PREMISE A', 490, INK],
    ['ON PREMISE B', 730, INK],
  ] as const
  for (const [name, y, c] of targets) {
    s += `<path d="M680 490 C 780 490, 780 ${y}, 880 ${y}" fill="none" stroke="${LINE}" stroke-width="2"/>`
    s += `<rect x="880" y="${y - 70}" width="240" height="140" fill="#111317" stroke="${c}" stroke-width="2"/>`
    s += label(1000, y - 8, name, INK, 18)
    for (let k = 0; k < 4; k++) s += `<rect x="${910 + k * 52}" y="${y + 18}" width="40" height="8" fill="${k === 1 ? HEAT : 'rgba(191,217,255,0.4)'}"/>`
  }
  s += `<rect x="1220" y="380" width="260" height="220" fill="#111317" stroke="${ARC}" stroke-width="2"/>`
  s += label(1350, 450, 'DASHBOARDS', INK, 18)
  for (let k = 0; k < 7; k++) s += `<rect x="${1250 + k * 30}" y="${560 - ((k * 37) % 90)}" width="18" height="${(k * 37) % 90 + 10}" fill="${k === 4 ? HEAT : 'rgba(191,217,255,0.4)'}"/>`
  s += `<path d="M1120 490 H1220" stroke="${LINE}" stroke-width="2"/>`
  s += label(64, 930, 'One pipeline ships the same stack to the cloud or a client’s own servers.', MUTED, 20, 'start')
  return frame('Uzabox distribution pipeline', s)
}

export function systemArt(kind: ProjectArt, title = ''): string {
  if (kind === 'vault') return vault()
  if (kind === 'mesh') return mesh()
  if (kind === 'gate') return gate()
  if (kind === 'routes') return routes()
  if (kind === 'tutor') return tutor()
  if (kind === 'pipeline') return pipeline()
  return frame(title, label(W / 2, H / 2, title.toUpperCase(), INK, 40))
}

export const artDataUri = (kind: ProjectArt, title = '') =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(systemArt(kind, title))}`
