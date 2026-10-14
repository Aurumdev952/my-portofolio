// Writes public/sitemap.xml from the project slugs in src/content/site.ts.
import { readFileSync, writeFileSync } from 'node:fs'

const url = (process.env.VITE_SITE_URL ?? 'https://benjamin-ishimwe.vercel.app').replace(/\/$/, '')
const src = readFileSync('src/content/site.ts', 'utf8')
const slugs = [...src.matchAll(/slug: '([a-z0-9-]+)'/g)].map((m) => m[1])
const paths = ['/', '/work', ...slugs.map((s) => `/work/${s}`)]
const today = new Date().toISOString().slice(0, 10)
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${url}${p === '/' ? '' : p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
writeFileSync('public/sitemap.xml', xml)
writeFileSync('public/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n`)
console.log(`sitemap: ${paths.length} urls`)
