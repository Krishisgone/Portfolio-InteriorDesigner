import { useEffect, useRef, useState } from 'react'
import { bySlug, img, projects, site } from '../data'
import { gsap, useGSAP, SplitText, revealLines, revealImage, parallax, preloadNear } from '../motion'
import { Picture, SectionLabel, Arrow } from '../ui'
import { CompareSlider } from './Work'

const PIN_QUERY = '(min-width: 768px) and (prefers-reduced-motion: no-preference)'
function usePinMode() {
  const [on, setOn] = useState(() => window.matchMedia(PIN_QUERY).matches)
  useEffect(() => {
    const m = window.matchMedia(PIN_QUERY)
    const f = () => setOn(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return on
}

/* ════════════════════════════════════════════════════════════
   Selected clientele — text only, never paired with project imagery
   ════════════════════════════════════════════════════════════ */
export function Clientele() {
  const root = useRef<HTMLElement>(null)
  const names = site.clients.map((c) => c.org)

  useGSAP(() => {
    const el = root.current!
    revealLines(el.querySelector('.clients-title'))
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      el.querySelectorAll('.client-row').forEach((row) => {
        gsap.from(row.querySelector('.client-rule'), { scaleX: 0, duration: 1.3, ease: 'arch', scrollTrigger: { trigger: row, start: 'top 94%', once: true } })
        gsap.from(row.querySelectorAll('.client-in'), { yPercent: 105, duration: 1, stagger: 0.05, scrollTrigger: { trigger: row, start: 'top 94%', once: true } })
      })
    })
  }, { scope: root })

  return (
    <section id="clients" ref={root} className="relative pb-[clamp(5rem,12vh,9rem)]" aria-labelledby="clients-title">
      {/* brand marquee */}
      <div className="marquee border-y border-[var(--line)] py-5" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {names.map((n) => (
                <span key={n + copy} className="flex items-center whitespace-nowrap px-[clamp(1.25rem,3vw,2.75rem)] text-[clamp(1.6rem,3.2vw,3rem)] italic text-[var(--ink-2)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {n}
                  <span className="ml-[clamp(1.25rem,3vw,2.75rem)] h-1.5 w-1.5 rotate-45 bg-[var(--accent-soft)]" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="wrap mt-[clamp(4rem,10vh,7rem)] grid grid-cols-1 gap-10 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="md:sticky md:top-28">
            <p className="meta flex items-center gap-4 text-[var(--muted)]">
              <span className="h-px w-10 bg-[var(--line-strong)]" />Selected clientele
            </p>
            <h2 id="clients-title" className="clients-title title mt-6">
              Trusted with <span className="italic-accent">their homes</span>
            </h2>
            <p className="mt-6 max-w-[36ch] text-[var(--ink-2)]">
              Apartments, farmhouses and private residences designed for some of the country’s leading families and business houses.
            </p>
          </div>
        </div>
        <ol className="md:col-span-8">
          {site.clients.map((c, i) => (
            <li key={c.org} className="client-row group relative">
              <div className="client-rule hairline !bg-[var(--line)] origin-left" />
              <div className="grid grid-cols-[2.4rem_1fr] items-baseline gap-x-4 gap-y-1 py-5 md:grid-cols-[2.6rem_1fr_auto] md:py-6">
                <span className="line-mask"><span className="client-in meta block text-[var(--accent)]">{String(i + 1).padStart(2, '0')}</span></span>
                <span className="line-mask">
                  <span className="client-in block text-[clamp(1.5rem,2.6vw,2.4rem)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    <span className="block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2">
                      {c.org} <span className="italic text-[var(--muted)]">— {c.who}</span>
                    </span>
                  </span>
                </span>
                <span className="line-mask col-start-2 md:col-start-3 md:text-right">
                  <span className="client-in meta block text-[var(--muted)]">{c.home} · {c.where}</span>
                </span>
              </div>
              <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-[var(--accent-soft)] transition-transform duration-700 ease-[cubic-bezier(0.7,0,0.2,1)] group-hover:scale-x-100" aria-hidden="true" />
            </li>
          ))}
          <li aria-hidden="true"><div className="hairline !bg-[var(--line)]" /></li>
        </ol>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   01 — Intro statement with word-scrubbed reading + floating pair
   ════════════════════════════════════════════════════════════ */
export function Intro() {
  const root = useRef<HTMLElement>(null)
  const a = img(bySlug('skylit-kitchen')!, 'built-detail')
  const b = img(bySlug('mohali-bedrooms')!, 'b7-a')
  const years = Math.max(6, new Date().getFullYear() - site.since)
  const stats = [
    { n: `${years}+`, l: 'Years in practice' },
    { n: '04', l: 'Studios & brands' },
    { n: String(projects.length).padStart(2, '0'), l: 'Featured projects' },
  ]

  useGSAP(() => {
    const el = root.current!
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const split = SplitText.create(el.querySelector('.intro-statement')!, { type: 'words', aria: 'none' })
      gsap.fromTo(split.words, { opacity: 0.42 }, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: el.querySelector('.intro-statement'), start: 'top 78%', end: 'bottom 50%', scrub: true },
      })
      gsap.from(el.querySelectorAll('.stat-n'), {
        yPercent: 110, duration: 1.2, stagger: 0.08,
        scrollTrigger: { trigger: el.querySelector('.stats'), start: 'top 88%', once: true },
      })
      gsap.from(el.querySelectorAll('.stat-rule'), {
        scaleX: 0, duration: 1.4, ease: 'arch', stagger: 0.08,
        scrollTrigger: { trigger: el.querySelector('.stats'), start: 'top 90%', once: true },
      })
      // the pair drifts at different speeds — depth without a 3D library
      gsap.to(el.querySelector('.float-a'), { yPercent: -14, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
      gsap.to(el.querySelector('.float-b'), { yPercent: 16, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
      return () => split.revert()
    })
    revealLines(el.querySelector('.intro-sub'))
    el.querySelectorAll('.intro-frame').forEach((f, i) => { revealImage(f, { from: i ? 'top' : 'bottom' }); parallax(f, 8) })
  }, { scope: root })

  return (
    <section ref={root} className="section" aria-label="About the practice">
      <div className="wrap">
        <SectionLabel index="01">The practice</SectionLabel>
        <p className="intro-statement mt-10 max-w-[22ch] text-[clamp(2.1rem,4.6vw,4.8rem)] font-light leading-[1.06] tracking-[-0.01em] md:max-w-[26ch]" style={{ fontFamily: 'var(--font-display)' }}>
          {years}+ years of kitchens, wardrobes and luxury residences — from the first brief and space plan to <em className="italic-accent">site supervision</em> and the final installation.
        </p>

        <div className="mt-[clamp(4rem,12vh,9rem)] grid grid-cols-1 items-start gap-16 md:grid-cols-12 md:gap-10">
          <div className="relative pb-[20%] md:col-span-6">
            <div className="float-a relative w-[76%]">
              <Picture image={a} sizes="40vw" className="intro-frame aspect-[3/4]" parallax />
            </div>
            <div className="float-b absolute bottom-0 right-0 w-[46%] shadow-[0_30px_80px_-30px_var(--shade)]">
              <Picture image={b} sizes="25vw" className="intro-frame aspect-[4/5]" parallax />
            </div>
          </div>
          <div className="md:col-span-5 md:col-start-8 md:pt-[8vh]">
            <p className="intro-sub lead">{site.summary}</p>
            <div className="stats mt-14 grid grid-cols-3 gap-x-6 gap-y-10">
              {stats.map((s) => (
                <div key={s.l} className="flex flex-col-reverse">
                  <p className="meta mt-3 text-[var(--muted)]">{s.l}</p>
                  <p className="line-mask"><span className="stat-n block text-[clamp(3rem,5vw,4.6rem)] font-light leading-none" style={{ fontFamily: 'var(--font-display)' }}>{s.n}</span></p>
                  <div className="stat-rule hairline mb-4 origin-left" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   03 — Room by room: pinned horizontal gallery
   ════════════════════════════════════════════════════════════ */
// best-looking rooms first (rank set in the private manifest); unranked/new rooms follow
const roomList = projects
  .flatMap((p) => (p.rooms ?? []).map((r) => ({ project: p, room: r, image: img(p, r.images[0]) })))
  .sort((a, b) => (a.room.rank ?? 999) - (b.room.rank ?? 999))

export function Rooms({ onOpen }: { onOpen: (slug: string) => void }) {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const pin = usePinMode()

  useGSAP(() => {
    const el = root.current!
    revealLines(el.querySelector('.rooms-title'))
    preloadNear(el)
    if (!pin) return
    const t = track.current!
    const distance = () => t.scrollWidth - window.innerWidth
    const tween = gsap.to(t, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: el.querySelector('.rooms-pin'),
        start: 'top top',
        end: () => '+=' + distance(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (s) => {
          setActive(Math.min(roomList.length - 1, Math.round(s.progress * (roomList.length - 1))))
          gsap.set(el.querySelector('.rooms-progress'), { scaleX: s.progress })
        },
      },
    })
    t.querySelectorAll<HTMLElement>('.room-panel').forEach((panel) => {
      const im = panel.querySelector('img')
      if (im) {
        gsap.set(im, { width: '118%', left: '-9%' })
        gsap.fromTo(im, { xPercent: 7 }, {
          xPercent: -7, ease: 'none',
          scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
        })
      }
      gsap.from(panel.querySelectorAll('.room-in'), {
        yPercent: 100, opacity: 0, duration: 1, stagger: 0.06,
        scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left 80%', once: true },
      })
    })
  }, { scope: root, dependencies: [pin], revertOnUpdate: true })

  return (
    <section id="rooms" ref={root} className="relative bg-[var(--bg-2)] pt-[clamp(6rem,15vh,12rem)]" aria-labelledby="rooms-title">
      <div className="wrap grid grid-cols-1 items-end gap-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <SectionLabel index="03">Room by room</SectionLabel>
          <h2 id="rooms-title" className="rooms-title title mt-6">
            {roomList.length} rooms, each with its own <span className="italic-accent">material story</span>
          </h2>
        </div>
        <p className="text-[var(--ink-2)] md:col-span-4">
          Dressing rooms, guest suites and bedroom wardrobes — fluted glass, ribbed lacquer, walnut, oak and brass, composed differently for every person who uses the room.
        </p>
      </div>

      <div className={`rooms-pin relative ${pin ? 'h-[100svh] overflow-hidden' : ''}`}>
        <div className="flex h-full flex-col justify-center py-12 md:py-0">
          <div ref={track} className={`flex gap-[clamp(16px,2.5vw,40px)] px-[clamp(16px,4vw,64px)] ${pin ? '' : 'rail snap-x snap-mandatory overflow-x-auto'}`}>
            {roomList.map(({ project, room, image }, i) => (
              <button
                key={project.slug + room.name}
                type="button"
                onClick={() => onOpen(project.slug)}
                className="room-panel group w-[84vw] shrink-0 snap-center text-left md:w-[min(60vw,940px)]"
                data-cursor="Open"
                aria-label={`${room.name} — ${project.title}. Open case study`}
              >
                <div className="relative overflow-hidden">
                  <Picture image={image} sizes="(min-width: 768px) 60vw, 84vw" className="aspect-[16/10] transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]" />
                </div>
                <div className="mt-5 grid grid-cols-[2.2rem_1fr] gap-x-3">
                  <span className="line-mask"><span className="room-in meta block pt-2 text-[var(--accent)]">{String(i + 1).padStart(2, '0')}</span></span>
                  <span className="line-mask">
                    <span className="room-in block text-[clamp(1.6rem,2.4vw,2.3rem)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>{room.name}</span>
                  </span>
                  <span />
                  <span className="line-mask">
                    <span className="room-in block max-w-[56ch] text-[0.95rem] text-[var(--ink-2)]">{room.note}</span>
                  </span>
                  <span />
                  <span className="line-mask">
                    <span className="room-in meta mt-2 flex items-center gap-2 text-[var(--muted)]">{project.title} <Arrow /></span>
                  </span>
                </div>
              </button>
            ))}
          </div>
          {pin && (
            <div className="wrap mt-8 flex items-center gap-6">
              <span className="meta tabular-nums">{String(active + 1).padStart(2, '0')} / {String(roomList.length).padStart(2, '0')}</span>
              <div className="h-px flex-1 bg-[var(--line)]">
                <div className="rooms-progress h-px origin-left bg-[var(--accent)]" style={{ transform: 'scaleX(0)' }} />
              </div>
              <span className="meta text-[var(--muted)]">Scroll</span>
            </div>
          )}
        </div>
      </div>
      {!pin && <div className="h-[clamp(4rem,10vh,8rem)]" />}
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   04 — Render to reality: scroll-scrubbed wipe from visual to site photo
   ════════════════════════════════════════════════════════════ */
const pairs = projects
  .filter((p) => p.compare)
  .map((p) => ({ project: p, before: img(p, p.compare!.before), after: img(p, p.compare!.after) }))

export function RenderToReality({ onOpen }: { onOpen: (slug: string) => void }) {
  const root = useRef<HTMLElement>(null)
  const pin = usePinMode()

  useGSAP(() => {
    const el = root.current!
    revealLines(el.querySelector('.rtr-title'))
    preloadNear(el)
    if (!pin) return
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: el.querySelector('.rtr-pin'), start: 'top top', end: `+=${pairs.length * 130}%`, pin: true, scrub: 1 },
    })
    const stages = el.querySelectorAll<HTMLElement>('.rtr-stage')
    const captions = el.querySelectorAll<HTMLElement>('.rtr-caption')
    stages.forEach((stage, i) => {
      if (i > 0) {
        tl.fromTo(stage, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'arch' })
          .fromTo(stage.querySelector('img'), { scale: 1.2 }, { scale: 1, duration: 0.6 }, '<')
          .to(captions[i - 1], { autoAlpha: 0, y: -30, duration: 0.25 }, '<')
          .fromTo(captions[i], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.25 }, '<0.3')
      }
      tl.fromTo(stage.querySelector('.rtr-after'), { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1 })
        .fromTo(stage.querySelector('.rtr-line'), { left: '100%' }, { left: '0%', duration: 1 }, '<')
        .to({}, { duration: 0.25 })
    })
  }, { scope: root, dependencies: [pin], revertOnUpdate: true })

  if (!pairs.length) return null

  return (
    <section ref={root} className="section !pb-0" aria-labelledby="rtr-title">
      <div className="wrap grid grid-cols-1 items-end gap-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <SectionLabel index="04">Render to reality</SectionLabel>
          <h2 id="rtr-title" className="rtr-title title mt-6">
            What was drawn <span className="italic-accent">is what was built</span>
          </h2>
        </div>
        <p className="text-[var(--ink-2)] md:col-span-4">
          The approved visual and the finished room. {pin ? 'Keep scrolling to wipe from render to site photo.' : 'Drag the handle to compare.'}
        </p>
      </div>

      {pin ? (
        <div className="rtr-pin relative flex h-[100svh] items-center">
          <div className="wrap grid w-full grid-cols-12 items-center gap-6">
            <div className="relative col-span-3 h-56">
              {pairs.map(({ project }, i) => (
                <div key={project.slug} className="rtr-caption absolute inset-0" style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? 'visible' : 'hidden' }}>
                  <p className="meta text-[var(--accent)]">{String(i + 1).padStart(2, '0')} / {String(pairs.length).padStart(2, '0')}</p>
                  <p className="mt-3 text-[clamp(1.8rem,2.8vw,2.8rem)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>{project.title}</p>
                  <p className="meta mt-2 text-[var(--muted)]">{project.location} — {project.year}</p>
                  <button type="button" onClick={() => onOpen(project.slug)} className="ulink meta mt-6 inline-flex items-center gap-2 pb-1">Case study <Arrow /></button>
                </div>
              ))}
            </div>
            <div className="relative col-span-9 aspect-[16/9] max-h-[78svh] overflow-hidden">
              {pairs.map(({ project, before, after }, i) => (
                <div key={project.slug} className="rtr-stage absolute inset-0 overflow-hidden" style={{ zIndex: i, clipPath: i ? 'inset(100% 0% 0% 0%)' : undefined }}>
                  <Picture image={before} sizes="75vw" className="!absolute inset-0 h-full w-full" />
                  <div className="rtr-after absolute inset-0" style={{ clipPath: 'inset(0% 0% 0% 100%)' }}>
                    <Picture image={after} sizes="75vw" className="!absolute inset-0 h-full w-full" />
                  </div>
                  <div className="rtr-line absolute inset-y-0 w-px bg-white/90" style={{ left: '100%' }} />
                  <span className="meta absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1 text-white backdrop-blur-sm">Render</span>
                  <span className="meta absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1 text-white backdrop-blur-sm">Built</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="wrap mt-12 grid gap-14 pb-[clamp(6rem,15vh,12rem)]">
          {pairs.map(({ project, before, after }) => (
            <div key={project.slug}>
              <CompareSlider before={before} after={after} className="aspect-[4/5] sm:aspect-[16/10]" />
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <p className="text-[1.6rem] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>{project.title}</p>
                <button type="button" onClick={() => onOpen(project.slug)} className="meta ulink pb-1">Case study</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
