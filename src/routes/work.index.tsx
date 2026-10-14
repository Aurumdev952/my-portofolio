import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useRef } from 'react'
import { projects, site } from '#/content/site'
import { ForgeLink, transition } from '#/components/ForgeLink'
import { useReveal } from '#/motion/reveal'
import { gsap, onScroll, prefersReducedMotion, scrollTo } from '#/motion/engine'
import { story, useUI } from '#/motion/story'
import { closeDoors } from '#/motion/doors'
import { artDataUri } from '#/art/systemArt'

export const Route = createFileRoute('/work/')({
  head: () => ({
    meta: [
      { title: `Work · ${site.name}` },
      {
        name: 'description',
        content: 'Ten projects by Benjamin Ishimwe: ride hailing, AI tutoring, national public sector systems, data pipelines and small language models.',
      },
      { property: 'og:title', content: `Work · ${site.name}` },
      { property: 'og:description', content: 'Ride hailing, AI tutoring, public sector systems, data pipelines and small language models, in one 3D gallery.' },
      { property: 'og:url', content: `${site.url}/work` },
    ],
    links: [{ rel: 'canonical', href: `${site.url}/work` }],
  }),
  component: Work,
})

const FILTERS = ['All', 'AI', 'Backend', 'Infra', 'Public sector'] as const

function Work() {
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const index = useUI((s) => s.galleryIndex)
  const filter = useUI((s) => s.galleryFilter)
  const setFilter = useUI((s) => s.setGalleryFilter)
  const track = useRef<HTMLDivElement>(null)
  useReveal(ref)

  const matches = useCallback(
    (i: number) => filter === 'All' || projects[i].kind.includes(filter as never),
    [filter],
  )

  // scroll position over the track → continuous gallery index
  useEffect(() => {
    story.g = 0
    story.gSmooth = 0
    story.fly = 0
    return onScroll(({ y }) => {
      const el = track.current
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY
      const span = el.offsetHeight - window.innerHeight
      const p = Math.min(1, Math.max(0, (y - top) / Math.max(1, span)))
      story.g = p * (projects.length - 1)
      useUI.getState().setGalleryIndex(Math.round(story.g))
    })
  }, [])

  const go = useCallback(
    (i: number) => {
      const el = track.current
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY
      const span = el.offsetHeight - window.innerHeight
      scrollTo(top + (i / (projects.length - 1)) * span)
    },
    [],
  )

  const step = useCallback(
    (dir: 1 | -1) => {
      let i = index
      for (let n = 0; n < projects.length; n++) {
        i = (i + dir + projects.length) % projects.length
        if (matches(i)) break
      }
      go(i)
    },
    [index, matches, go],
  )

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea')) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        step(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        step(-1)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [step])

  // when a filter hides the current project, move to the nearest one that matches
  useEffect(() => {
    if (matches(index)) return
    for (let d = 1; d < projects.length; d++) {
      if (index + d < projects.length && matches(index + d)) return go(index + d)
      if (index - d >= 0 && matches(index - d)) return go(index - d)
    }
  }, [filter])

  // open: the camera flies into the frame, then the doors close
  const open = async (slug: string) => {
    if (!prefersReducedMotion() && document.documentElement.classList.contains('gl-on')) {
      await new Promise<void>((done) => gsap.to(story, { fly: 1, duration: 0.9, ease: 'expo.in', onComplete: () => done() }))
    }
    transition.pending = true
    document.documentElement.classList.remove('no-intro')
    await closeDoors()
    await router.navigate({ to: '/work/$slug', params: { slug } })
  }

  const p = projects[index]

  return (
    <div ref={ref}>
      <div ref={track} className="relative" style={{ height: `${projects.length * 55 + 100}svh` }}>
        <section aria-labelledby="work-title" className="sticky top-0 flex h-[100svh] flex-col justify-between px-[var(--gutter)] pb-[8svh] pt-[13svh]">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="mono text-[var(--heat)]" data-reveal="fade" data-intro>
                Gallery · {projects.length} projects
              </p>
              <h1 id="work-title" className="display mt-3 text-[clamp(48px,7vw,120px)]" data-split data-intro>
                The work
              </h1>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter projects" data-reveal="up" data-intro data-delay="0.2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={`chip mono ${filter === f ? 'is-active' : ''}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* no WebGL: the current cover on the stage */}
          <img
            key={p.slug}
            src={p.image?.src ?? artDataUri(p.art, p.title)}
            alt={p.image?.alt ?? `System view of ${p.title}`}
            width={p.image?.w ?? 1600}
            height={p.image?.h ?? 1000}
            className="nogl-only absolute left-1/2 top-[44%] aspect-[16/10] w-[min(86vw,620px)] -translate-x-1/2 -translate-y-1/2 border border-[var(--line)] object-cover object-top shadow-[0_0_0_1px_rgba(255,122,26,0.35),0_30px_80px_rgba(0,0,0,0.6)]"
          />
          {/* hit area over the centre frame */}
          <button
            type="button"
            className="gl-only absolute left-1/2 top-1/2 h-[38svh] w-[min(60vw,640px)] -translate-x-[40%] -translate-y-[52%] cursor-pointer max-md:-translate-x-1/2"
            onClick={() => open(p.slug)}
            aria-label={`Open case study: ${p.title}`}
            tabIndex={-1}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[52svh] bg-gradient-to-t from-[rgba(11,12,14,0.94)] via-[rgba(11,12,14,0.55)] to-transparent" aria-hidden="true" />
          <div className="relative grid items-end gap-8 md:grid-cols-12">
            <div className="md:col-span-5" aria-live="polite">
              <p className="mono text-[var(--muted)]">
                {String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')} · {p.period}
              </p>
              <h2 className="display mt-3 text-[clamp(36px,4.4vw,72px)]">{p.title}</h2>
              <p className="mt-3 hidden max-w-[44ch] text-[17px] text-[var(--ink)]/85 sm:block">{p.summary}</p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <a
                  href={`/work/${p.slug}`}
                  className="heat"
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey) return
                    e.preventDefault()
                    open(p.slug)
                  }}
                >
                  <span className="heat__label">Open case study</span>
                  <span className="heat__arrow" aria-hidden="true">
                    →
                  </span>
                </a>
                <span className="flex gap-2">
                  <button type="button" className="heat !min-h-[48px] !px-4" onClick={() => step(-1)} aria-label="Previous project">
                    <span className="heat__label" aria-hidden="true">←</span>
                  </button>
                  <button type="button" className="heat !min-h-[48px] !px-4" onClick={() => step(1)} aria-label="Next project">
                    <span className="heat__label" aria-hidden="true">→</span>
                  </button>
                </span>
                <span className="mono hidden text-[var(--muted)] lg:inline">Scroll, or use the arrow keys</span>
              </div>
            </div>
            <nav aria-label="All projects" className="plate hidden p-3 md:col-span-3 md:col-start-10 md:block">
              <ol className="grid">
                {projects.map((q, i) => (
                  <li key={q.slug} className={matches(i) ? '' : 'opacity-30'}>
                    <ForgeLink
                      to="/work/$slug"
                      params={{ slug: q.slug }}
                      className={`row w-full justify-between gap-4 text-[15px] ${i === index ? 'is-active' : ''}`}
                      onMouseEnter={() => go(i)}
                      onFocus={() => go(i)}
                    >
                      <span className="truncate">{q.title}</span>
                      <span className="mono shrink-0 text-[12px]">{q.kind[0]}</span>
                    </ForgeLink>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </section>
      </div>
      <section className="nogl-only px-[var(--gutter)] pb-24" aria-label="Project covers">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((q) => (
            <li key={q.slug}>
              <ForgeLink to="/work/$slug" params={{ slug: q.slug }} className="group block">
                <img
                  src={q.image?.src ?? artDataUri(q.art, q.title)}
                  alt={q.image?.alt ?? `System view of ${q.title}`}
                  width={q.image?.w ?? 1600}
                  height={q.image?.h ?? 1000}
                  loading="lazy"
                  className="aspect-[16/10] w-full border border-[var(--line)] object-cover object-top"
                />
                <span className="mt-3 block font-semibold">{q.title}</span>
              </ForgeLink>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
