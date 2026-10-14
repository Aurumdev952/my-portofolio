import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { site } from '#/content/site'
import { useUI } from '#/motion/story'
import { ForgeLink } from './ForgeLink'

function KigaliClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Kigali',
    })
    const update = () => setTime(fmt.format(new Date()))
    update()
    const id = window.setInterval(update, 20_000)
    return () => window.clearInterval(id)
  }, [])
  return <span suppressHydrationWarning>{time || '--:--'} CAT</span>
}

/** Corner UI. Steps aside while scrolling down, returns on scroll up. */
export function Frame() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const label = useUI((s) => s.label)
  const onWork = pathname.startsWith('/work')

  return (
    <>
      <header className="frame-corner frame-corner--top left-0 right-0 top-0 flex items-start justify-between px-[var(--gutter)] pb-6 pt-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[rgba(11,12,14,0.92)] via-[rgba(11,12,14,0.62)] to-transparent backdrop-blur-[2px] [mask-image:linear-gradient(#000_55%,transparent)]"
        />
        <ForgeLink to="/" className="draw gap-3 text-[15px] font-semibold tracking-tight">
          <span className="display text-[22px] leading-none" style={{ fontStretch: '62%' }}>
            {site.initials}
          </span>
          <span className="sr-only sm:not-sr-only">{site.name}</span>
        </ForgeLink>
        <nav aria-label="Main">
          <ul className="flex gap-5 text-[15px] font-medium sm:gap-8">
            <li>
              <ForgeLink to="/" scrollHash="story" className="draw" aria-current={pathname === '/' ? 'page' : undefined}>
                Story
              </ForgeLink>
            </li>
            <li>
              <ForgeLink to="/work" className="draw" aria-current={onWork ? 'page' : undefined}>
                Work
              </ForgeLink>
            </li>
            <li>
              <ForgeLink to="/" scrollHash="contact" className="draw" activeOptions={{ includeHash: true }} activeProps={{ 'aria-current': undefined }}>
                Contact
              </ForgeLink>
            </li>
          </ul>
        </nav>
      </header>
      <div
        className="frame-corner frame-corner--bottom pointer-events-none bottom-0 left-0 right-0 flex items-end justify-between px-[var(--gutter)] pb-4 [text-shadow:0_1px_8px_rgba(0,0,0,0.9)]"
        aria-hidden="true"
      >
        {label && <span className="mono bg-[rgba(11,12,14,0.72)] px-2 py-0.5 text-[var(--ink)]">{label}</span>}
        <span className="mono hidden bg-[rgba(11,12,14,0.72)] px-2 py-0.5 text-right text-[var(--ink)] sm:block">
          {site.coords} <span className="opacity-60">·</span> <KigaliClock />
        </span>
      </div>
    </>
  )
}
