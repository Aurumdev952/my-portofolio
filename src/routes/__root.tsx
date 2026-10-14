import { HeadContent, Outlet, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router'
import { Component, Suspense, lazy, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import appCss from '../styles.css?url'
import { site } from '#/content/site'
import { Doors } from '#/components/Doors'
import { Frame } from '#/components/Frame'
import { transition } from '#/components/ForgeLink'
import { NotFound } from '#/components/NotFound'
import { boot, resizeScroll, scrollTo } from '#/motion/engine'
import { openDoors } from '#/motion/doors'
import { useUI } from '#/motion/story'
import type { SceneName } from '#/motion/story'

const Stage = lazy(() => import('#/scene/Stage'))

// Runs before first paint: flags JS + motion so hidden-before-reveal styles never flash, and
// a safety net reveals everything if the app never boots.
// It also decides WebGL before paint, so the static fallbacks never flash on capable devices,
// and inner pages opened directly show their text at once instead of waiting for the intro.
const HEAD_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('js');if(location.pathname!=='/')d.classList.add('skip-loader','no-intro');var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!rm)d.classList.add('motion');var sd=(navigator.connection&&navigator.connection.saveData)||/[?&]nogl/.test(location.search);if(!rm&&!sd){try{var c=document.createElement('canvas');if(c.getContext('webgl2')||c.getContext('webgl'))d.classList.add('gl-try')}catch(e){}}setTimeout(function(){if(!d.classList.contains('is-loaded')){d.classList.add('is-revealed-all','is-loaded');var x=document.getElementById('loader');if(x)x.style.display='none'}},6000)})();`

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.name,
  jobTitle: site.role,
  url: site.url,
  email: `mailto:${site.email}`,
  address: { '@type': 'PostalAddress', addressLocality: 'Kigali', addressCountry: 'RW' },
  sameAs: site.socials.map((s) => s.href),
  knowsAbout: ['Backend engineering', 'Distributed systems', 'PostgreSQL', 'Kubernetes', 'Retrieval augmented generation'],
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: '#0b0c0e' },
      { title: `${site.name} · Software engineer` },
      { name: 'description', content: site.description },
      { property: 'og:site_name', content: site.name },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: `${site.url}/og.png` },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: `${site.url}/og.png` },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'preload', href: '/fonts/archivo-100_900-normal.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
    scripts: [
      { children: HEAD_SCRIPT },
      { type: 'application/ld+json', children: JSON.stringify(personJsonLd) },
    ],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function sceneFor(pathname: string, notFound: boolean): SceneName {
  if (notFound) return 'ambient'
  if (pathname === '/') return 'home'
  if (pathname === '/work' || pathname === '/work/') return 'gallery'
  return 'ambient'
}

/** If the 3D stage fails, drop to the designed static version instead of a blank page. */
class GlBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    document.documentElement.classList.remove('gl-try', 'gl-on')
    useUI.getState().setGlReady(true)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const hash = useRouterState({ select: (s) => s.location.hash })
  const notFound = useRouterState({ select: (s) => s.matches.some((m) => m.status === 'notFound') })
  const [gl, setGl] = useState(false)
  const loaded = useUI((s) => s.loaded)
  const scene = sceneFor(pathname, notFound)

  useEffect(() => {
    boot()
    // the head script already decided before paint
    if (document.documentElement.classList.contains('gl-try')) setGl(true)
  }, [])

  useEffect(() => {
    useUI.getState().setScene(scene)
  }, [scene])

  // After a route change: reset scroll under the closed doors, then open them.
  useEffect(() => {
    if (!transition.pending) return
    transition.pending = false
    scrollTo(0, { immediate: true })
    requestAnimationFrame(() => {
      resizeScroll()
      openDoors().then(() => {
        if (hash) scrollTo(`#${hash}`)
      })
    })
  }, [pathname, hash])

  useEffect(() => {
    if (!hash || transition.pending) return
    const id = window.setTimeout(() => scrollTo(`#${hash}`), useUI.getState().loaded ? 0 : 2600)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {/* The 3D hangar mounts as the doors open and fades in: text paints first, the
          shader work never holds the loader. */}
      {gl && loaded && (
        <div className="gl-canvas" aria-hidden="true">
          <GlBoundary>
            <Suspense fallback={null}>
              <Stage />
            </Suspense>
          </GlBoundary>
        </div>
      )}
      <Frame />
      <main id="main" tabIndex={-1} className="relative z-10 outline-none">
        <Outlet />
      </main>
      <Doors />
    </>
  )
}
