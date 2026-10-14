import { useEffect, useRef } from 'react'
import { useReveal } from '#/motion/reveal'
import { ForgeLink } from './ForgeLink'

export function NotFound() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  useEffect(() => {
    document.title = 'Page not found · Ishimwe Mugisha Benjamin'
  }, [])
  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col justify-center px-[var(--gutter)] pb-[8svh] pt-[16svh] sm:justify-end sm:pb-[14svh]">
      {/* React hoists this into <head>: keep missing pages out of search results */}
      <meta name="robots" content="noindex" />
      <p className="mono mb-6 text-[var(--heat)]" data-reveal="fade" data-intro>
        Error 404
      </p>
      <h1 className="display text-[clamp(64px,13vw,220px)]" data-split data-intro>
        Never welded
      </h1>
      <p className="lede mt-8 text-[var(--muted)]" data-reveal="up" data-intro data-delay="0.2">
        This part of the hangar does not exist. The page may have moved, or the link was cut short.
      </p>
      <div className="mt-10 flex flex-wrap gap-3" data-reveal="up" data-intro data-delay="0.3">
        <ForgeLink to="/" className="heat">
          <span className="heat__label">Back to the hangar</span>
        </ForgeLink>
        <ForgeLink to="/work" className="heat">
          <span className="heat__label">See the work</span>
          <span className="heat__arrow" aria-hidden="true">
            →
          </span>
        </ForgeLink>
      </div>
    </section>
  )
}
