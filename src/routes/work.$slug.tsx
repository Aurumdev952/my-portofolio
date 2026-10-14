import { createFileRoute, notFound } from '@tanstack/react-router'
import { useRef } from 'react'
import { projects, site, stack } from '#/content/site'
import type { ProjectArt } from '#/content/site'
import { ForgeLink } from '#/components/ForgeLink'
import { Logo } from '#/components/Logo'
import { useReveal } from '#/motion/reveal'
import { artDataUri } from '#/art/systemArt'

const DIAGRAMS: ProjectArt[] = ['routes', 'tutor', 'pipeline', 'vault', 'mesh', 'gate']

const iconFor = (name: string) => {
  for (const g of stack) for (const it of g.items) if (it.name.toLowerCase() === name.toLowerCase()) return it.icon
  return null
}

export const Route = createFileRoute('/work/$slug')({
  loader: ({ params }) => {
    const i = projects.findIndex((p) => p.slug === params.slug)
    if (i < 0) throw notFound()
    return { i }
  },
  head: ({ loaderData }) => {
    const p = loaderData ? projects[loaderData.i] : undefined
    if (!p) return {}
    return {
      meta: [
        { title: `${p.title} · ${site.name}` },
        { name: 'description', content: `${p.summary} ${p.role} at ${p.org}.`.slice(0, 160) },
        { property: 'og:title', content: `${p.title} · ${site.name}` },
        { property: 'og:description', content: p.summary },
        { property: 'og:url', content: `${site.url}/work/${p.slug}` },
      ],
      links: [{ rel: 'canonical', href: `${site.url}/work/${p.slug}` }],
    }
  },
  component: CaseStudy,
})

function CaseStudy() {
  const { i } = Route.useLoaderData()
  const p = projects[i]
  const next = projects[(i + 1) % projects.length]
  const ref = useRef<HTMLElement>(null)
  useReveal(ref, [p.slug])
  const cover = p.image?.src ?? artDataUri(p.art, p.title)

  return (
    <article ref={ref} key={p.slug} className="px-[var(--gutter)] pb-10 pt-[18svh]">
      <header className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <p className="mono text-[var(--heat)]" data-reveal="fade" data-intro>
            Case study · {String(i + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
          </p>
          <h1 className="display mt-4 text-[clamp(52px,9vw,150px)]" data-split data-intro>
            {p.title}
          </h1>
          <p className="lede mt-6 max-w-[40ch] text-[var(--ink)]" data-reveal="up" data-intro data-delay="0.25">
            {p.summary}
          </p>
        </div>
        <dl className="mono grid content-end gap-4 text-[var(--muted)] md:col-span-4" data-reveal="up" data-intro data-delay="0.35">
          <div>
            <dt className="text-[var(--muted)]">Organisation</dt>
            <dd className="text-[var(--ink)]">{p.org}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Role</dt>
            <dd className="text-[var(--ink)]">{p.role}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">When</dt>
            <dd className="text-[var(--ink)]">{p.period}</dd>
          </div>
          {p.link && (
            <div>
              <dt className="text-[var(--muted)]">Live</dt>
              <dd>
                <a className="link inline-flex min-h-[28px] items-center text-[var(--ink)]" href={p.link.href} target="_blank" rel="noopener noreferrer">
                  {p.link.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </dd>
            </div>
          )}
        </dl>
      </header>

      <figure className="mt-14" data-reveal="clip" data-intro data-delay="0.3">
        <img
          src={cover}
          alt={p.image?.alt ?? `System view of ${p.title}: the architecture, drawn without private data`}
          width={p.image?.w ?? 1600}
          height={p.image?.h ?? 1000}
          fetchPriority="high"
          decoding="async"
          className="aspect-[16/9] w-full border border-[var(--line)] object-cover object-top"
        />
        <figcaption className="mono mt-3 text-[var(--muted)]">
          {p.image ? `${p.title}, public site` : 'System view. The real screens are private, this is how the system fits together.'}
        </figcaption>
      </figure>

      <div className="mt-24 grid gap-16 md:grid-cols-12">
        <section className="md:col-span-4" aria-labelledby="ctx">
          <h2 id="ctx" className="mono text-[var(--heat)]">
            Context
          </h2>
          <p className="mt-4 text-[19px] leading-relaxed" data-reveal="up">
            {p.context}
          </p>
          {p.image?.mobile && (
            <figure className="mt-10" data-reveal="up">
              <img
                src={p.image.mobile}
                alt={`${p.title} on a phone`}
                width={780}
                height={1688}
                loading="lazy"
                decoding="async"
                className="w-full max-w-[260px] border border-[var(--line)]"
              />
              <figcaption className="mono mt-3 text-[var(--muted)]">The same site on a 390 px phone screen.</figcaption>
            </figure>
          )}
        </section>
        <section className="md:col-span-7 md:col-start-6" aria-labelledby="built">
          <h2 id="built" className="mono text-[var(--heat)]">
            What I built
          </h2>
          <ol className="mt-4 grid gap-0">
            {p.built.map((b, k) => (
              <li key={b} className="grid grid-cols-[48px_1fr] gap-4 border-t border-[var(--line)] py-5 text-[18px]" data-reveal="up" data-delay={String(k * 0.05)}>
                <span className="mono pt-1 text-[var(--muted)]">{String(k + 1).padStart(2, '0')}</span>
                <span>{b}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {p.image && DIAGRAMS.includes(p.art) && (
        <section className="mt-24" aria-labelledby="sys">
          <h2 id="sys" className="mono text-[var(--heat)]">
            System view
          </h2>
          <figure className="mt-5" data-reveal="clip">
            <img
              src={artDataUri(p.art, p.title)}
              alt={`Architecture of ${p.title}, drawn as a diagram`}
              width={1600}
              height={1000}
              loading="lazy"
              className="aspect-[16/10] w-full border border-[var(--line)]"
            />
          </figure>
        </section>
      )}

      <section className="mt-24 grid gap-10 md:grid-cols-12" aria-labelledby="out">
        <h2 id="out" className="mono text-[var(--heat)] md:col-span-4">
          Outcome
        </h2>
        <ul className="grid gap-6 md:col-span-8 md:grid-cols-2">
          {p.outcome.map((o) => (
            <li key={o} className="plate p-6 text-[20px] leading-snug" data-reveal="up">
              {o}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-24" aria-labelledby="tools">
        <h2 id="tools" className="mono text-[var(--heat)]">
          Tools
        </h2>
        <ul className="mt-5 flex flex-wrap gap-2">
          {p.stack.map((s) => {
            const icon = iconFor(s)
            return (
              <li key={s} className="flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-[15px]">
                {icon && <Logo icon={icon} size={18} />}
                {s}
              </li>
            )
          })}
        </ul>
      </section>

      <nav className="mt-32 border-t border-[var(--line)] pt-10" aria-label="Next project">
        <p className="mono text-[var(--muted)]">Next project</p>
        <ForgeLink to="/work/$slug" params={{ slug: next.slug }} className="next-link group mt-3 block">
          <span className="display relative block text-[clamp(44px,8vw,132px)]">
            <span className="next-link__label">{next.title}</span>
            <span className="next-link__arrow ml-4 inline-block" aria-hidden="true">
              →
            </span>
          </span>
          <span className="next-link__bar" aria-hidden="true" />
        </ForgeLink>
        <div className="mt-10 flex flex-wrap gap-3">
          <ForgeLink to="/work" className="heat">
            <span className="heat__label">Back to the gallery</span>
          </ForgeLink>
          <ForgeLink to="/" scrollHash="contact" className="heat">
            <span className="heat__label">Start a conversation</span>
          </ForgeLink>
        </div>
      </nav>
    </article>
  )
}
