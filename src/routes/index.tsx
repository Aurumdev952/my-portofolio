import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { chapters, featured, site, stack } from '#/content/site'
import { ForgeLink } from '#/components/ForgeLink'
import { ContactForm } from '#/components/Contact'
import { Logo } from '#/components/Logo'
import { useReveal } from '#/motion/reveal'
import { startHomeDriver } from '#/motion/homeDriver'
import { onScroll } from '#/motion/engine'
import { story } from '#/motion/story'
import { artDataUri } from '#/art/systemArt'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: `${site.name} · Software engineer in Kigali` },
      { name: 'description', content: site.description },
      { property: 'og:title', content: `${site.name} · Software engineer` },
      { property: 'og:description', content: site.description },
      { property: 'og:url', content: site.url },
    ],
    links: [{ rel: 'canonical', href: site.url }],
  }),
  component: Home,
})

const STACK_KEY = chapters.length + 1
const GATE_KEY = chapters.length + 3 + featured.length
const allItems = stack.flatMap((g, gi) => g.items.map((it) => ({ ...it, gi })))

function Hero() {
  return (
    <section data-key={0} id="top" aria-labelledby="hero-title" className="relative h-[175svh]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-end overflow-clip px-[var(--gutter)] pb-[9svh]">
        <div className="scrim-l pointer-events-none absolute inset-y-0 left-0 w-[70%] opacity-60 sm:w-[48%]" aria-hidden="true" />
        {/* no WebGL: the portrait as a rim lit silhouette */}
        <img
          src="/portrait/poster.webp"
          alt=""
          width={720}
          height={666}
          className="nogl-only pointer-events-none absolute bottom-0 right-[-10%] w-[min(92vw,820px)] opacity-90 [filter:brightness(0.06)_drop-shadow(0_0_1px_#bfd9ff)_drop-shadow(0_0_18px_rgba(191,217,255,0.35))] sm:right-[4%]"
        />
        <div className="relative max-w-[1100px]">
          <p className="mono mb-5 text-[var(--muted)]" data-reveal="fade" data-intro>
            {site.role} · {site.location}
          </p>
          <h1 id="hero-title" className="display text-[clamp(56px,11.2vw,184px)]" data-split data-intro>
            Ishimwe
            <br />
            Mugisha
            <br />
            Benjamin
          </h1>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <p className="lede text-[var(--ink)]" data-reveal="up" data-intro data-delay="0.35">
              {site.line}
            </p>
          </div>
        </div>
        <div className="mono absolute bottom-[9svh] right-[var(--gutter)] hidden items-center gap-3 text-[var(--muted)] md:flex" data-reveal="fade" data-intro data-delay="0.6">
          <span className="inline-block h-8 w-px origin-top animate-pulse bg-[var(--heat)]" aria-hidden="true" />
          Scroll to forge
        </div>
      </div>
    </section>
  )
}

function Chapters() {
  return (
    <div id="story" aria-label="Story">
      <h2 className="sr-only">How I became the engineer I am</h2>
      {chapters.map((c, i) => {
        const right = i % 2 === 1
        return (
          <section key={c.id} data-key={i + 1} aria-labelledby={`ch-${c.id}`} className="relative h-[150svh]">
            <div className={`sticky top-[47svh] flex px-[var(--gutter)] md:top-[18svh] ${right ? 'justify-end' : 'justify-start'}`}>
              <article className="plate w-full max-w-[470px] p-5 sm:p-8">
                <p className="mono flex items-center justify-between text-[var(--heat)]">
                  <span>{c.year}</span>
                  <span className="text-[var(--muted)]">
                    {String(i + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}
                  </span>
                </p>
                <h3 id={`ch-${c.id}`} className="display mt-3 text-[clamp(34px,4.6vw,72px)] sm:mt-5" data-split>
                  {c.title}
                </h3>
                <p className="mt-3 text-[16px] text-[var(--ink)]/90 sm:mt-5 sm:text-[17px]" data-reveal="up">
                  {c.body}
                </p>
                <ul className="mono mt-6 hidden gap-2 border-t sm:grid border-[var(--line)] pt-5 text-[var(--muted)]" data-reveal="up" data-delay="0.1">
                  {c.facts.map((f) => (
                    <li key={f} className="flex gap-3">
                      <span className="text-[var(--heat)]" aria-hidden="true">
                        +
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </section>
        )
      })}
    </div>
  )
}

function Toolbox() {
  const [active, setActive] = useState(0)
  useEffect(
    () =>
      onScroll(() => {
        const i = Math.round(story.stack * (allItems.length - 1))
        setActive((a) => (a === i ? a : i))
      }),
    [],
  )
  const item = allItems[active]
  const group = stack[item.gi]
  return (
    <section data-key={STACK_KEY} id="stack" aria-labelledby="stack-title" className="relative h-[480svh]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-between px-[var(--gutter)] pb-[10svh] pt-[14svh]">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mono text-[var(--heat)]">Toolbox · {allItems.length} tools</p>
            <h2 id="stack-title" className="display mt-4 text-[clamp(44px,6vw,96px)]" data-split>
              Stamped on
              <br />
              the line
            </h2>
          </div>
          <ol className="mono hidden gap-1 text-right md:grid" aria-label="Tool groups">
            {stack.map((g, gi) => (
              <li key={g.id} className={gi === item.gi ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}>
                {g.label} <span className="tabular-nums">{String(g.items.length).padStart(2, '0')}</span>
                <span className={`ml-2 inline-block h-px w-6 align-middle ${gi === item.gi ? 'bg-[var(--heat)]' : 'bg-[var(--line)]'}`} aria-hidden="true" />
              </li>
            ))}
          </ol>
        </div>

        {/* live caption for the plate under the press */}
        <div className="gl-only plate flex max-w-[520px] items-center gap-5 p-5" aria-hidden="true">
          <Logo icon={item.icon} size={40} />
          <div>
            <p className="mono text-[var(--muted)]">{group.label}</p>
            <p className="text-[24px] font-semibold leading-tight">{item.name}</p>
          </div>
        </div>

        {/* the full list: always in the document, the visible grid when there is no WebGL */}
        <div className="nogl-only grid gap-8 md:grid-cols-3">
          {stack.map((g) => (
            <div key={g.id}>
              <h3 className="mono mb-3 text-[var(--muted)]">{g.label}</h3>
              <ul className="flex flex-wrap gap-2">
                {g.items.map((it) => (
                  <li key={it.name} className="flex items-center gap-2 border border-[var(--line)] px-3 py-2 text-[14px]">
                    <Logo icon={it.icon} size={18} />
                    {it.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <ul className="gl-only sr-only">
          {allItems.map((it) => (
            <li key={it.name + it.gi}>{it.name}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Stations() {
  return (
    <div id="work" aria-labelledby="work-title">
      <h2 id="work-title" className="sr-only">
        Selected work
      </h2>
      {featured.map((p, i) => (
        <section key={p.slug} data-key={STACK_KEY + 1 + i} aria-labelledby={`st-${p.slug}`} className="relative h-[150svh]">
          <div className="sticky top-[50svh] px-[var(--gutter)] md:top-[16svh]">
            <article className="plate w-full max-w-[480px] p-5 sm:p-8">
              <p className="mono flex justify-between text-[var(--muted)]">
                <span className="text-[var(--heat)]">Station {String(i + 1).padStart(2, '0')}</span>
                <span>{p.period}</span>
              </p>
              <h3 id={`st-${p.slug}`} className="display mt-3 text-[clamp(32px,4.2vw,66px)] sm:mt-5" data-split>
                {p.title}
              </h3>
              <p className="mono mt-3 text-[var(--muted)]">
                {p.role} · {p.org}
              </p>
              <p className="mt-3 text-[16px] sm:mt-5 sm:text-[17px]" data-reveal="up">
                {p.summary}
              </p>
              <img
                src={p.image?.src ?? artDataUri(p.art, p.title)}
                alt={p.image?.alt ?? `System view of ${p.title}`}
                width={p.image?.w ?? 1600}
                height={p.image?.h ?? 1000}
                loading="lazy"
                decoding="async"
                className="nogl-only mt-6 aspect-[16/10] w-full border border-[var(--line)] object-cover object-top"
              />
              <ul className="mono mt-6 hidden gap-2 border-t border-[var(--line)] pt-5 text-[var(--ink)]/85 sm:grid" data-reveal="up" data-delay="0.1">
                {p.outcome.slice(0, 2).map((o) => (
                  <li key={o} className="flex gap-3">
                    <span className="text-[var(--heat)]" aria-hidden="true">
                      +
                    </span>
                    {o}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 sm:mt-7">
                <ForgeLink to="/work/$slug" params={{ slug: p.slug }} className="heat">
                  <span className="heat__label">Case study</span>
                  <span className="heat__arrow" aria-hidden="true">
                    →
                  </span>
                  <span className="sr-only">: {p.title}</span>
                </ForgeLink>
                {p.link && (
                  <a href={p.link.href} target="_blank" rel="noopener noreferrer" className="link inline-flex min-h-[32px] items-center text-[15px]">
                    {p.link.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </div>
            </article>
          </div>
        </section>
      ))}
    </div>
  )
}

function ContactSection() {
  return (
    <section data-key={GATE_KEY - 1} id="contact" aria-labelledby="contact-title" className="relative min-h-[150svh]">
      <div className="sticky top-[12svh] grid gap-10 px-[var(--gutter)] md:grid-cols-12">
        <div className="plate p-6 sm:p-8 md:col-span-6 lg:col-span-5">
          <p className="mono text-[var(--heat)]">{site.available}</p>
          <h2 id="contact-title" className="display mt-5 text-[clamp(44px,5.4vw,88px)]" data-split>
            Let’s build
            <br />
            something that
            <br />
            holds
          </h2>
          <p className="mt-5 max-w-[46ch] text-[17px] text-[var(--ink)]/85">
            Tell me about the system, the load and the deadline. Or write to{' '}
            <a className="link" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            .
          </p>
          <div className="mt-8">
            <ContactForm />
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--line)] pt-5 text-[15px]">
            {site.socials.map((s) => (
              <li key={s.label}>
                <a className="util inline-flex min-h-[32px] items-center" href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
            <li>
              <a className="util inline-flex min-h-[32px] items-center" href={`mailto:${site.email}`}>
                Email
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

function Gate() {
  return (
    <section data-key={GATE_KEY} id="gate" aria-labelledby="gate-title" className="relative h-[200svh]">
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-end px-[var(--gutter)] pb-[12svh] text-center">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55svh] bg-gradient-to-t from-[rgba(11,12,14,0.92)] via-[rgba(11,12,14,0.6)] to-transparent" aria-hidden="true" />
        <p className="mono relative text-[var(--muted)]">All {featured.length + 4} projects, one room</p>
        <h2 id="gate-title" className="display relative mt-4 text-[clamp(52px,9vw,150px)]" data-split>
          The gallery
        </h2>
        <ForgeLink to="/work" className="heat relative mt-8">
          <span className="heat__label">Enter the gallery</span>
          <span className="heat__arrow" aria-hidden="true">
            →
          </span>
        </ForgeLink>
        <footer className="mono absolute inset-x-0 bottom-4 hidden justify-center gap-6 text-[var(--muted)] sm:flex">
          <span>© {new Date().getFullYear()} {site.name}</span>
          <span>Set in Archivo and JetBrains Mono</span>
        </footer>
      </div>
    </section>
  )
}

function Home() {
  const ref = useRef<HTMLDivElement>(null)
  useReveal(ref)
  useEffect(() => {
    if (!ref.current) return
    return startHomeDriver(ref.current, { stackKey: STACK_KEY, gateKey: GATE_KEY })
  }, [])
  return (
    <div ref={ref}>
      <Hero />
      <Chapters />
      <Toolbox />
      <Stations />
      <ContactSection />
      <Gate />
    </div>
  )
}
