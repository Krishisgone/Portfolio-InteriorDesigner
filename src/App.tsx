import { useCallback, useEffect, useState } from 'react'
import { bySlug } from './data'
import { ScrollTrigger, lockScroll, startLenis } from './motion'
import { Atmosphere, Cursor, Nav, Preloader } from './ui'
import { Hero, heroPreload } from './sections/Hero'
import { Clientele, Intro, Rooms, RenderToReality } from './sections/Story'
import { Works, CaseStudy } from './sections/Work'
import { Practice, Process, Contact, Footer } from './sections/Practice'
import { Journal } from './sections/Journal'

const slugFromHash = () => {
  const m = window.location.hash.match(/^#\/work\/([\w-]+)$/)
  return m && bySlug(m[1]) ? m[1] : null
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState<{ slug: string; origin?: DOMRect } | null>(null)

  useEffect(() => {
    startLenis()
    lockScroll(true)
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [])

  const onReady = useCallback(() => {
    setReady(true)
    lockScroll(false)
    requestAnimationFrame(() => ScrollTrigger.refresh())
    const s = slugFromHash()
    if (s) setOpen({ slug: s })
  }, [])

  // keep layout-dependent triggers honest once all images have settled
  useEffect(() => {
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  // deep links: #/work/<slug>
  useEffect(() => {
    const onPop = () => {
      const s = slugFromHash()
      setOpen(s ? { slug: s } : null)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const openProject = useCallback((slug: string, origin?: DOMRect) => {
    history.pushState(null, '', `#/work/${slug}`)
    setOpen({ slug, origin })
  }, [])

  const closeProject = useCallback(() => {
    if (slugFromHash()) history.pushState(null, '', window.location.pathname + window.location.search)
    setOpen(null)
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [])

  const project = open ? bySlug(open.slug) : undefined

  return (
    <>
      <a href="#work" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-full focus:bg-[var(--ink)] focus:px-4 focus:py-2 focus:text-[var(--bg)]">
        Skip to work
      </a>
      <Preloader urls={heroPreload} onDone={onReady} />
      <Atmosphere />
      <Cursor />
      <Nav ready={ready} />
      <main className="relative z-[1]" inert={!!project}>
        <Hero ready={ready} onOpen={(s) => openProject(s)} />
        <Clientele />
        <Intro />
        <Works onOpen={openProject} />
        <Rooms onOpen={(s) => openProject(s)} />
        <RenderToReality onOpen={(s) => openProject(s)} />
        <Journal />
        <Practice />
        <Process />
        <Contact />
      </main>
      <Footer />
      {project && (
        <CaseStudy
          key={project.slug}
          project={project}
          origin={open?.origin}
          onClose={closeProject}
          onNavigate={(s) => {
            history.replaceState(null, '', `#/work/${s}`)
            setOpen({ slug: s })
          }}
        />
      )}
    </>
  )
}
