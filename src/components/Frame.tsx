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
      <header className="frame-corner frame-corner--top left-0 right-0 top-0 flex items-start justify-between px-[var(--gutter)] pt-4 mix-blend-difference">
        <ForgeLink to="/" className="draw gap-3 text-[15px] font-semibold tracking-tight" aria-label={`${site.name}, home`}>
          <span className="display text-[22px] leading-none" style={{ fontStretch: '62%' }}>
            {site.initials}
          </span>
          <span className="hidden sm:inline">{site.name}</span>
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
              <ForgeLink to="/" scrollHash="contact" className="draw">
                Contact
              </ForgeLink>
            </li>
          </ul>
        </nav>
      </header>
      <div
        className="frame-corner frame-corner--bottom pointer-events-none bottom-0 left-0 right-0 flex items-end justify-between px-[var(--gutter)] pb-4 mix-blend-difference"
        aria-hidden="true"
      >
        <span className="mono text-[var(--ink)]">{label}</span>
        <span className="mono hidden text-right text-[var(--ink)] sm:block">
          {site.coords} <span className="opacity-60">·</span> <KigaliClock />
        </span>
      </div>
    </>
  )
}
