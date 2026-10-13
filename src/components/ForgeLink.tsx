import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import type { LinkComponentProps } from '@tanstack/react-router'
import type { MouseEvent } from 'react'
import { closeDoors } from '#/motion/doors'
import { scrollTo } from '#/motion/engine'

export const transition = { pending: false }

/** Internal link that closes the blast doors before the route changes. */
export function ForgeLink(props: LinkComponentProps<'a'> & { scrollHash?: string }) {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { scrollHash, onClick, ...rest } = props

  const handle = async (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    const href = e.currentTarget.getAttribute('href') ?? ''
    const url = new URL(href, window.location.href)
    if (url.pathname === pathname) {
      e.preventDefault()
      if (scrollHash) scrollTo(`#${scrollHash}`)
      else scrollTo(0)
      return
    }
    e.preventDefault()
    transition.pending = true
    await closeDoors()
    await router.navigate({ href: url.pathname + url.search + url.hash })
  }

  return <Link {...(rest as LinkComponentProps<'a'>)} hash={scrollHash} onClick={handle} />
}
