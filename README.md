# THE FORGE · Ishimwe Mugisha Benjamin

Personal site of a software engineer in Kigali. A dark hangar where robot arms weld a
silhouette, and scrolling cools it into the real person, then walks through the tools and
the systems he built, ending in a 3D gallery of the work.

Concept, palette, type and motion rules live in [`DESIGN.md`](./DESIGN.md).

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19, Vite, file routes, server functions)
- three.js through React Three Fiber, drei and postprocessing
- GSAP (ScrollTrigger, SplitText, CustomEase) and Lenis, all on one ticker
- Tailwind CSS v4 plus plain CSS tokens
- Resend for the contact form

## Run

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # writes the sitemap, then builds to .output/
node .output/server/index.mjs
```

Copy `.env.example` to `.env` and fill in:

| Variable | What it does |
|---|---|
| `RESEND_API_KEY` | Enables the contact form. Without it the form asks people to email directly |
| `CONTACT_TO` | Inbox that receives messages |
| `CONTACT_FROM` | Verified sender in Resend |
| `VITE_SITE_URL` | Production URL used for canonical links, OG tags and the sitemap |

## Content

Everything visible is in [`src/content/site.ts`](./src/content/site.ts): bio, chapters,
toolbox, projects and case studies. Logos come from `simple-icons`
(`src/content/logos.ts`); tools without an official icon get a monogram plate.

Government projects have no public screens, so they use the system drawings in
`src/art/systemArt.ts` instead of screenshots.

## Assets

```bash
pnpm assets   # portrait cut out + depth map, screenshots of the public project sites
```

- `scripts/prepare-portrait.mjs` reads `assets-src/portrait.jpg`, removes the background
  (BiRefNet) and estimates depth (Depth Anything v2), writing `public/portrait/*.webp`.
- `scripts/shoot-sites.mjs` captures tujyaneltd.com, uwera.rw and uzabox.com.
- `pnpm og` builds the link preview cards (`public/og.jpg`, `public/og/<slug>.jpg`, 1200x630,
  under 300 KB for WhatsApp) and the icons. The home card renders the live hero, so run
  the production server on :4400 first; `--cards` skips it. Re-run after changing a
  project's title or summary.
- `scripts/qa-shots.mjs` screenshots every story key. Add `?qa` to any URL to make the
  camera snap to its target, which helps in slow software WebGL.

## Structure

```
src/
  routes/          /, /work, /work/$slug, root layout + 404
  scene/           WebGL: home hangar (figure, arms, sparks, conveyor, stations), gallery
  motion/          engine (Lenis + GSAP), scroll driver, reveals, blast doors
  components/      frame UI, doors, links, contact form, logos
  content/         site.ts, logos
  server/          contact server function
```

## Accessibility and fallbacks

- Reduced motion: native scroll, no WebGL, no scrubbing, short fades. All content is in the
  HTML.
- No WebGL or Save-Data: designed static versions (rim lit portrait, logo grid, screenshots).
- Keyboard: skip link, visible focus, arrow keys in the gallery.
