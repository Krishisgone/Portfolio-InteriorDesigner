import { useEffect, useRef, useState } from 'react'
import { asset, bySlug, img, site, type Img } from '../data'
import { gsap, useGSAP, SplitText, ScrollTrigger, reduceMotion, scrollToTarget } from '../motion'
import { Picture, Arrow } from '../ui'

const picks: [string, string][] = [
  ['south-delhi-residence', 'gs2-a'],
  ['fluted-island-kitchen', 'built-glass'],
  ['mohali-bedrooms', 'm2-a'],
  ['onyx-kitchen', 'built-wall'],
  ['skylit-kitchen', 'render-corner'],
]
const slides = picks.map(([slug, id]) => {
  const project = bySlug(slug)!
  return { project, image: img(project, id) }
})

const midSrc = (i: Img) => {
  const parts = i.srcset.split(', ').map((s) => s.split(' ')[0])
  return asset(parts.find((p) => p.endsWith('-1280.webp')) ?? parts[parts.length - 1])
}
export const heroPreload = slides.slice(0, 2).map((s) => midSrc(s.image))

const DWELL = 5.5

export function Hero({ ready, onOpen }: { ready: boolean; onOpen: (slug: string) => void }) {
  const root = useRef<HTMLElement>(null)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [inView, setInView] = useState(true)
  const current = useRef(0)
  const busy = useRef(false)
  const timer = useRef<gsap.core.Tween | null>(null)
  const progress = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)

  // ── slide transition: clip-path wipe in, push the previous frame out ──
  const show = (n: number) => {
    const el = root.current
    if (!el || busy.current || n === current.current) return
    const layers = el.querySelectorAll<HTMLElement>('.slide')
    const prev = layers[current.current]
    const next = layers[n]
    const reduce = reduceMotion()
    busy.current = true
    gsap.set(layers, { zIndex: 0 })
    gsap.set(prev, { zIndex: 1 })
    gsap.set(next, { zIndex: 2, visibility: 'visible' })
    const nextImg = next.querySelector('img')
    const prevImg = prev.querySelector('img')
    const tl = gsap.timeline({
      onComplete: () => {
        busy.current = false
        layers.forEach((l, k) => k !== n && gsap.set(l, { visibility: 'hidden' }))
        if (!reduce && nextImg) gsap.to(nextImg, { scale: 1, duration: DWELL + 2, ease: 'none' }) // slow drift
      },
    })
    if (reduce) {
      tl.fromTo(next, { opacity: 0, clipPath: 'inset(0% 0% 0% 0%)' }, { opacity: 1, duration: 0.4 })
    } else {
      tl.fromTo(next, { clipPath: 'inset(0% 0% 0% 100%)', opacity: 1 }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'arch' })
        .fromTo(nextImg, { scale: 1.32, xPercent: 14 }, { scale: 1.08, xPercent: 0, duration: 2.1, ease: 'soft' }, 0)
        .to(prevImg, { xPercent: -16, scale: 1.14, duration: 1.6, ease: 'arch' }, 0)
        .set(prevImg, { xPercent: 0, scale: 1.08 })
    }
    current.current = n
    setIndex(n)
  }
  const advance = (dir = 1) => show((current.current + dir + slides.length) % slides.length)

  // ── autoplay with visible progress; pauses off-screen, when tab hidden, or by the user ──
  useEffect(() => {
    timer.current?.kill()
    const active = ready && playing && inView && !reduceMotion()
    if (!active) {
      gsap.to(progress.current, { scaleX: 0, duration: 0.4 })
      return
    }
    timer.current = gsap.fromTo(progress.current, { scaleX: 0 }, {
      scaleX: 1, duration: DWELL, ease: 'none', onComplete: () => advance(1),
    })
    return () => { timer.current?.kill() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, playing, inView, index])

  useEffect(() => {
    const onVis = () => setInView(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // ── intro + scroll choreography ──
  useGSAP(() => {
    const el = root.current!
    const st = ScrollTrigger.create({ trigger: el, start: 'top top', end: 'bottom top', onToggle: (s) => setInView(s.isActive) })
    if (ready) el.querySelectorAll<HTMLImageElement>('.slide img').forEach((i) => { i.loading = 'eager' })
    if (!ready || reduceMotion()) return () => st.kill()

    const split = SplitText.create(el.querySelector('.hero-name')!, { type: 'chars', mask: 'chars' })
    const tl = gsap.timeline({ delay: 0.15 })
    tl.from(split.chars, { yPercent: 115, duration: 1.6, stagger: 0.045, ease: 'soft' })
      .fromTo(frame.current, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'arch' }, 0.25)
      .fromTo(el.querySelector('.slide img'), { scale: 1.4 }, { scale: 1.08, duration: 2.4, ease: 'soft' }, 0.25)
      .from(el.querySelectorAll('.hero-in'), { yPercent: 110, opacity: 0, duration: 1.1, stagger: 0.06 }, 0.7)
      .from(el.querySelector('.hero-rule'), { scaleX: 0, duration: 1.6, ease: 'arch' }, 0.5)

    // scroll: name lifts away faster than the page, frame lags behind
    gsap.to(el.querySelector('.hero-name'), {
      yPercent: -35, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
    })
    gsap.to(frame.current, {
      yPercent: 10, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
    })
    return () => { st.kill(); split.revert() }
  }, { dependencies: [ready], scope: root })

  const s = slides[index]
  const ctrl = 'grid h-10 w-10 place-items-center rounded-full border border-white/40 backdrop-blur-sm transition-colors hover:bg-white/15'

  return (
    <section id="top" ref={root} className="relative flex min-h-[100svh] flex-col pt-[96px]" aria-label="Introduction">
      <div className="wrap flex flex-1 flex-col">
        <div className="meta grid grid-cols-2 gap-4 text-[var(--muted)] md:grid-cols-4">
          <span className="line-mask"><span className="hero-in block">{site.role}</span></span>
          <span className="line-mask hidden md:block"><span className="hero-in block">{site.base}</span></span>
          <span className="line-mask hidden md:block"><span className="hero-in block">{site.coords}</span></span>
          <span className="line-mask text-right"><span className="hero-in block">Practising since {site.since}</span></span>
        </div>
        <div className="hero-rule hairline mt-4 origin-left" />

        <h1 className="hero-name display mt-[clamp(1rem,3vh,2.5rem)] whitespace-nowrap text-[clamp(3.6rem,15.2vw,17.5rem)]">
          Mehul <span className="italic-accent">Saini</span>
        </h1>

        <div className="mt-[clamp(1.25rem,3vh,2.5rem)] grid flex-1 grid-cols-1 gap-8 pb-10 md:grid-cols-12 md:gap-6">
          <div className="flex flex-col justify-between gap-8 md:col-span-4 lg:col-span-3">
            <p className="line-mask lead max-w-[30ch]">
              <span className="hero-in block">
                Kitchens, wardrobes and the rooms around them — planned to the millimetre, finished in stone, glass and brass, and seen through to installation.
              </span>
            </p>
            <button type="button" onClick={() => scrollToTarget('#work')} className="hidden items-center gap-4 text-left md:flex" data-magnetic>
              <span className="line-mask"><span className="hero-in meta block">Scroll to selected work</span></span>
              <span className="relative h-14 w-px overflow-hidden bg-[var(--line)]">
                <span className="drip absolute inset-x-0 top-0 h-1/2 bg-[var(--accent)]" />
              </span>
            </button>
          </div>

          <div className="md:col-span-8 lg:col-span-9">
            <div
              ref={frame}
              className="relative h-[clamp(300px,56svh,760px)] cursor-pointer overflow-hidden bg-[var(--bg-3)]"
              data-cursor="View"
              role="button"
              tabIndex={0}
              aria-label={`Open project: ${s.project.title}`}
              onClick={() => onOpen(s.project.slug)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(s.project.slug) } }}
            >
              {slides.map((sl, k) => (
                <div key={sl.image.src} className="slide absolute inset-0" style={{ visibility: k === 0 ? 'visible' : 'hidden', zIndex: k === 0 ? 2 : 0 }}>
                  <Picture image={sl.image} eager={k < 2} sizes="(min-width: 768px) 70vw, 100vw" className="h-full w-full" />
                </div>
              ))}
              <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
              <div className="absolute inset-x-0 bottom-0 z-[4] flex items-end justify-between gap-4 p-[clamp(14px,2vw,28px)] text-[#f4f1ea]">
                <div key={index} className="min-w-0">
                  <p className="meta rise opacity-80">
                    {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')} — {s.project.location}
                  </p>
                  <p className="rise rise-2 mt-1 truncate text-[clamp(1.4rem,2.4vw,2.2rem)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    {s.project.title}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => advance(-1)} className={ctrl} aria-label="Previous image"><Arrow dir="left" /></button>
                  <button type="button" onClick={() => setPlaying((p) => !p)} className={ctrl} aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}>
                    {playing ? (
                      <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><path d="M1 0v12M9 0v12" stroke="currentColor" strokeWidth="1.4" /></svg>
                    ) : (
                      <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><path d="M0 0l10 6-10 6z" fill="currentColor" /></svg>
                    )}
                  </button>
                  <button type="button" onClick={() => advance(1)} className={ctrl} aria-label="Next image"><Arrow /></button>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 z-[5] h-[2px] bg-white/15">
                <div ref={progress} className="h-full origin-left bg-[#b08d57]" style={{ transform: 'scaleX(0)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
