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

export function systemArt(kind: ProjectArt, title = ''): string {
  if (kind === 'vault') return vault()
  if (kind === 'mesh') return mesh()
  if (kind === 'gate') return gate()
  return frame(title, label(W / 2, H / 2, title.toUpperCase(), INK, 40))
}

export const artDataUri = (kind: ProjectArt, title = '') =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(systemArt(kind, title))}`
