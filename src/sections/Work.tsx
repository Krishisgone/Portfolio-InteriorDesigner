import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as RKE } from 'react'
import { categories, cover, img, projects, type CategoryKey, type Img, type Project } from '../data'
import { gsap, useGSAP, Flip, ScrollTrigger, reduceMotion, revealImage, revealLines, parallax, lockScroll } from '../motion'
import { Picture, SectionLabel, Arrow } from '../ui'

/* ════════════════════════════════════════════════════════════
   Selected work grid
   ════════════════════════════════════════════════════════════ */
const layout = [
  { col: 'md:col-span-7', aspect: 'aspect-[5/4]' },
  { col: 'md:col-span-4 md:col-start-9 md:mt-[22vh]', aspect: 'aspect-[4/5]' },
  { col: 'md:col-span-5 md:col-start-2', aspect: 'aspect-[4/5]' },
  { col: 'md:col-span-6 md:col-start-7 md:mt-[14vh]', aspect: 'aspect-[5/4]' },
]

export function Works({ onOpen }: { onOpen: (slug: string, rect?: DOMRect) => void }) {
  const root = useRef<HTMLElement>(null)
  const [filter, setFilter] = useState<CategoryKey>('all')
  const flipState = useRef<Flip.FlipState | null>(null)

  const visible = useMemo(
    () => projects.filter((p) => filter === 'all' || p.category === filter).map((p) => p.slug),
    [filter],
  )
  const counts = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.key, c.key === 'all' ? projects.length : projects.filter((p) => p.category === c.key).length])),
    [],
  )

  useGSAP(() => {
    const el = root.current!
    revealLines(el.querySelector('.work-title'))
    el.querySelectorAll('.work-frame').forEach((f) => { revealImage(f); parallax(f, 7) })
    if (!reduceMotion()) {
      el.querySelectorAll('.work-card').forEach((card) => {
        gsap.from(card.querySelectorAll('.card-in'), {
          yPercent: 100, opacity: 0, duration: 1.1, stagger: 0.06,
          scrollTrigger: { trigger: card.querySelector('.card-meta'), start: 'top 92%', once: true },
        })
      })
    }
  }, { scope: root })

  const changeFilter = (key: CategoryKey) => {
    if (key === filter) return
    flipState.current = Flip.getState(root.current!.querySelectorAll('.work-card'))
    setFilter(key)
  }

  useLayoutEffect(() => {
    if (!flipState.current) return
    const state = flipState.current
    flipState.current = null
    if (reduceMotion()) { ScrollTrigger.refresh(); return }
    Flip.from(state, {
      duration: 1.1,
      ease: 'arch',
      absolute: true,
      scale: false,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 1.1, delay: 0.25 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, y: -40, duration: 0.5, ease: 'arch' }),
      onComplete: () => ScrollTrigger.refresh(),
    })
  }, [filter])

  return (
    <section id="work" ref={root} className="section" aria-labelledby="work-title">
      <div className="wrap">
        <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <SectionLabel index="02">Selected work</SectionLabel>
            <h2 id="work-title" className="work-title title mt-6">
              Rooms built to be <span className="italic-accent">lived in</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 md:col-span-5 md:justify-end" role="group" aria-label="Filter projects">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-pressed={filter === c.key}
                onClick={() => changeFilter(c.key)}
                className={`chip transition-colors duration-500 ${filter === c.key ? '!border-[var(--ink)] bg-[var(--ink)] !text-[var(--bg)]' : 'hover:!border-[var(--line-strong)]'}`}
              >
                {c.label} <sup className="ml-1 font-mono text-[0.6rem] opacity-70">{counts[c.key]}</sup>
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-[clamp(3rem,8vh,6rem)] grid grid-cols-1 gap-x-6 gap-y-[clamp(3.5rem,9vh,7rem)] md:grid-cols-12">
          {projects.map((p) => {
            const vi = visible.indexOf(p.slug)
            const L = layout[(vi < 0 ? 0 : vi) % layout.length]
            return (
              <li key={p.slug} data-flip-id={p.slug} className={`work-card ${L.col}`} style={{ display: vi < 0 ? 'none' : undefined }}>
                <WorkCard project={p} index={projects.indexOf(p)} aspect={L.aspect} onOpen={onOpen} />
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function WorkCard({ project: p, index, aspect, onOpen }: { project: Project; index: number; aspect: string; onOpen: (slug: string, rect?: DOMRect) => void }) {
  const frame = useRef<HTMLDivElement>(null)
  const open = () => onOpen(p.slug, frame.current?.getBoundingClientRect())
  return (
    <a
      href={`#/work/${p.slug}`}
      onClick={(e) => { e.preventDefault(); open() }}
      className="group block"
      data-cursor="View"
      aria-label={`${p.title}, ${p.location}, ${p.year}. Open case study`}
    >
      <div ref={frame} className={`work-frame ticks relative overflow-hidden ${aspect}`}>
        <div className="absolute inset-0 transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]">
          <Picture image={cover(p)} parallax sizes="(min-width: 768px) 55vw, 100vw" className="h-full w-full" />
        </div>
        <span className="meta absolute left-4 top-4 z-[2] rounded-full bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] px-3 py-1 backdrop-blur-sm">
          {p.status}
        </span>
      </div>
      <div className="card-meta mt-5 grid grid-cols-[auto_1fr_auto] items-baseline gap-x-4 border-t border-[var(--line)] pt-4">
        <span className="line-mask"><span className="card-in meta block text-[var(--accent)]">{String(index + 1).padStart(2, '0')}</span></span>
        <span className="line-mask">
          <span className="card-in block text-[clamp(1.6rem,2.4vw,2.4rem)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            {p.title}
          </span>
        </span>
        <span className="line-mask"><span className="card-in meta block text-[var(--muted)]">{p.year}</span></span>
        <span />
        <span className="line-mask col-span-2">
          <span className="card-in meta mt-1 flex items-center justify-between text-[var(--muted)]">
            {p.location}
            <span className="flex items-center gap-2 text-[var(--ink)] transition-transform duration-500 group-hover:translate-x-1">
              Case study <Arrow />
            </span>
          </span>
        </span>
      </div>
    </a>
  )
}

/* ════════════════════════════════════════════════════════════
   Render ↔ built comparison slider (pointer + keyboard)
   ════════════════════════════════════════════════════════════ */
export function CompareSlider({ before, after, className = '' }: { before: Img; after: Img; className?: string }) {
  const [split, setSplit] = useState(50)
  const box = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const setFromX = (x: number) => {
    const r = box.current!.getBoundingClientRect()
    setSplit(Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100)))
  }
  const onKey = (e: RKE) => {
    const step = e.shiftKey ? 10 : 2
    if (e.key === 'ArrowLeft') { e.preventDefault(); setSplit((s) => Math.max(0, s - step)) }
    if (e.key === 'ArrowRight') { e.preventDefault(); setSplit((s) => Math.min(100, s + step)) }
    if (e.key === 'Home') setSplit(0)
    if (e.key === 'End') setSplit(100)
  }

  return (
    <div
      ref={box}
      className={`relative select-none overflow-hidden touch-pan-y ${className}`}
      onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); setFromX(e.clientX) }}
      onPointerMove={(e) => { if (dragging.current) setFromX(e.clientX) }}
      onPointerUp={() => { dragging.current = false }}
      onPointerCancel={() => { dragging.current = false }}
      data-cursor="Drag"
    >
      <Picture image={before} sizes="(min-width: 768px) 80vw, 100vw" className="!absolute inset-0 h-full w-full" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
        <Picture image={after} sizes="(min-width: 768px) 80vw, 100vw" className="!absolute inset-0 h-full w-full" />
      </div>
      <span className="meta pointer-events-none absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1 text-white backdrop-blur-sm">Render</span>
      <span className="meta pointer-events-none absolute right-4 top-4 rounded-full bg-black/45 px-3 py-1 text-white backdrop-blur-sm">Built</span>
      <div className="pointer-events-none absolute inset-y-0 w-px bg-white/90" style={{ left: `${split}%` }} />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Compare render and built photo"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(split)}
        aria-valuetext={`${Math.round(100 - split)}% built photo visible`}
        onKeyDown={onKey}
        className="absolute top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-black/35 text-white backdrop-blur-md"
        style={{ left: `${split}%` }}
      >
        <svg width="22" height="10" viewBox="0 0 22 10" aria-hidden="true"><path d="M5 1L1 5l4 4M17 1l4 4-4 4" stroke="currentColor" fill="none" strokeWidth="1.2" /></svg>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   Case study overlay
   ════════════════════════════════════════════════════════════ */
const groupLabels: Record<Img['tag'], string> = {
  built: 'On site',
  render: 'Visualisation',
  drawing: 'Drawings',
  detail: 'Material details',
}

export function CaseStudy({
  project: p,
  origin,
  onClose,
  onNavigate,
}: {
  project: Project
  origin?: DOMRect
  onClose: () => void
  onNavigate: (slug: string) => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const closing = useRef(false)

  const roomIds = new Set(p.rooms?.flatMap((r) => r.images) ?? [])
  const rest = p.images.filter((i) => !roomIds.has(i.id) && i.id !== p.cover && !i.hidden)
  const groups = (['built', 'render', 'drawing', 'detail'] as const)
    .map((tag) => ({ tag, items: rest.filter((i) => i.tag === tag) }))
    .filter((g) => g.items.length)
  const flat: Img[] = [cover(p), ...(p.rooms?.flatMap((r) => r.images.map((id) => img(p, id))) ?? []), ...groups.flatMap((g) => g.items)]
    .filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i)
  const next = projects[(projects.indexOf(p) + 1) % projects.length]

  useEffect(() => {
    lockScroll(true)
    const prevFocus = document.activeElement as HTMLElement | null
    closeBtn.current?.focus({ preventScroll: true })
    return () => { lockScroll(false); prevFocus?.focus?.({ preventScroll: true }) }
  }, [])

  const close = () => {
    if (closing.current) return
    closing.current = true
    if (reduceMotion()) { onClose(); return }
    gsap.to(root.current, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.9, ease: 'arch', onComplete: onClose })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightbox !== null) return
      if (e.key === 'Escape') close()
      if (e.key === 'Tab' && root.current) {
        const f = root.current.querySelectorAll<HTMLElement>('a[href], button, [tabindex="0"]')
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // entrance: expand from the clicked card, then choreograph content inside the overlay's own scroller
  useGSAP(() => {
    const el = root.current!
    el.scrollTop = 0
    closing.current = false
    if (reduceMotion()) return
    const vw = window.innerWidth, vh = window.innerHeight
    const from = origin
      ? `inset(${(origin.top / vh) * 100}% ${((vw - origin.right) / vw) * 100}% ${((vh - origin.bottom) / vh) * 100}% ${(origin.left / vw) * 100}%)`
      : 'inset(100% 0% 0% 0%)'
    const tl = gsap.timeline()
    tl.fromTo(el, { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15, ease: 'arch' })
      .fromTo(el.querySelector('.cs-hero img'), { scale: 1.3 }, { scale: 1.06, duration: 1.9, ease: 'soft' }, 0)
      .from(el.querySelectorAll('.cs-in'), { yPercent: 110, duration: 1.1, stagger: 0.05 }, 0.55)

    const st = { scroller: el }
    gsap.to(el.querySelector('.cs-hero img'), { yPercent: 12, ease: 'none', scrollTrigger: { ...st, trigger: el.querySelector('.cs-hero'), start: 'top top', end: 'bottom top', scrub: true } })
    el.querySelectorAll('.cs-reveal').forEach((f) => {
      const inner = f.querySelector('img')
      const t = gsap.timeline({ scrollTrigger: { ...st, trigger: f, start: 'top 90%', once: true } })
      t.fromTo(f, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'arch' })
      if (inner) t.fromTo(inner, { scale: 1.2 }, { scale: 1, duration: 1.8 }, 0)
    })
    el.querySelectorAll('.cs-text').forEach((t) =>
      gsap.from(t, { y: 40, opacity: 0, duration: 1.1, scrollTrigger: { ...st, trigger: t, start: 'top 92%', once: true } }),
    )
  }, { scope: root, dependencies: [p.slug] })

  const openLb = (image: Img) => setLightbox(flat.findIndex((f) => f.id === image.id))
  const thumb = (image: Img) => (
    <button key={image.id} type="button" onClick={() => openLb(image)} className="group block w-full text-left" data-cursor="Expand" aria-label={`Enlarge: ${image.alt}`}>
      <div className="overflow-hidden">
        <Picture
          image={image}
          natural
          contain={image.tag === 'drawing'}
          sizes="(min-width: 768px) 50vw, 100vw"
          className={`cs-reveal transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] ${image.tag === 'drawing' ? '!bg-white' : ''}`}
        />
      </div>
      <span className="meta mt-3 block text-[var(--muted)]">{image.alt}</span>
    </button>
  )

  return (
    <div ref={root} className="overlay" data-lenis-prevent role="dialog" aria-modal="true" aria-labelledby="cs-title" style={{ clipPath: 'inset(0% 0% 0% 0%)' }}>
      <div className="sticky top-0 z-10 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] backdrop-blur-md">
        <div className="wrap flex h-16 items-center justify-between gap-4">
          <span className="meta truncate text-[var(--muted)]">Case study — {p.title}</span>
          <button ref={closeBtn} type="button" onClick={close} className="btn !py-2" data-magnetic>
            Close <span aria-hidden="true">✕</span>
          </button>
        </div>
      </div>

      <div className="cs-hero relative h-[min(78svh,880px)] overflow-hidden">
        <Picture image={cover(p)} eager sizes="100vw" className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
        <div className="wrap absolute inset-x-0 bottom-0 pb-[clamp(1.5rem,5vh,3.5rem)] text-[#f4f1ea]">
          <p className="line-mask"><span className="cs-in meta block opacity-85">{p.location} — {p.year}</span></p>
          <h2 id="cs-title" className="line-mask display mt-3 text-[clamp(3rem,9vw,8.5rem)]">
            <span className="cs-in block">{p.title}</span>
          </h2>
        </div>
      </div>

      <div className="wrap grid grid-cols-1 gap-12 py-[clamp(4rem,10vh,8rem)] md:grid-cols-12">
        <dl className="cs-text grid grid-cols-2 gap-x-6 gap-y-6 self-start md:col-span-4">
          {[
            ['Location', p.location],
            ['Year', String(p.year)],
            ['Status', p.status],
            ['Category', p.category === 'kitchen' ? 'Kitchen' : 'Wardrobes & rooms'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="meta text-[var(--muted)]">{k}</dt>
              <dd className="mt-1">{v}</dd>
            </div>
          ))}
          <div className="col-span-2">
            <dt className="meta text-[var(--muted)]">Role</dt>
            <dd className="mt-1">{p.role}</dd>
          </div>
        </dl>
        <div className="md:col-span-7 md:col-start-6">
          <p className="cs-text text-[clamp(1.5rem,2.6vw,2.4rem)] font-light leading-[1.3]" style={{ fontFamily: 'var(--font-display)' }}>
            {p.summary}
          </p>
          <div className="mt-12">
            <p className="meta text-[var(--muted)]">Specification</p>
            <dl className="mt-4 border-b border-[var(--line)]">
              {p.specs.map((s) => (
                <div key={s.label} className="cs-text grid grid-cols-[minmax(8rem,0.6fr)_1fr] gap-4 border-t border-[var(--line)] py-4">
                  <dt className="meta pt-1 text-[var(--muted)]">{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {p.compare && (
        <div className="wrap pb-[clamp(4rem,10vh,8rem)]">
          <div className="cs-text mb-6 flex items-end justify-between gap-6">
            <h3 className="title !text-[clamp(2rem,4vw,3.6rem)]">Render <span className="italic-accent">to</span> reality</h3>
            <p className="meta hidden max-w-[28ch] text-right text-[var(--muted)] md:block">Drag to compare the approved visual with the finished room</p>
          </div>
          <CompareSlider before={img(p, p.compare.before)} after={img(p, p.compare.after)} className="cs-reveal aspect-[4/5] md:aspect-[16/9]" />
        </div>
      )}

      {p.rooms && (
        <div className="wrap pb-[clamp(4rem,10vh,8rem)]">
          {p.rooms.map((r, ri) => {
            const [lead, ...others] = r.images.map((id) => img(p, id))
            return (
              <section key={r.name} className="border-t border-[var(--line)] py-[clamp(2.5rem,7vh,5rem)]" aria-label={r.name}>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
                  <div className="cs-text md:col-span-4">
                    <p className="meta text-[var(--accent)]">Room {String(ri + 1).padStart(2, '0')}</p>
                    <h3 className="mt-3 text-[clamp(2rem,3.4vw,3rem)] leading-none" style={{ fontFamily: 'var(--font-display)' }}>{r.name}</h3>
                    <p className="mt-4 max-w-[38ch] text-[var(--ink-2)]">{r.note}</p>
                  </div>
                  <div className="md:col-span-8">
                    {thumb(lead)}
                    {others.length > 0 && <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">{others.map(thumb)}</div>}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}

      {groups.map((g) => (
        <div key={g.tag} className="wrap pb-[clamp(4rem,10vh,8rem)]">
          <div className="cs-text mb-8 flex items-baseline justify-between border-t border-[var(--line)] pt-6">
            <h3 className="text-[clamp(1.8rem,3vw,2.6rem)]" style={{ fontFamily: 'var(--font-display)' }}>{groupLabels[g.tag]}</h3>
            <span className="meta text-[var(--muted)]">{String(g.items.length).padStart(2, '0')} {g.items.length === 1 ? 'image' : 'images'}</span>
          </div>
          <div className={g.items.length > 1 ? 'columns-1 gap-6 md:columns-2' : 'max-w-4xl'}>
            {g.items.map((i) => <div key={i.id} className="mb-8 break-inside-avoid">{thumb(i)}</div>)}
          </div>
        </div>
      ))}

      <button type="button" onClick={() => onNavigate(next.slug)} className="group relative block w-full overflow-hidden border-t border-[var(--line)] text-left" data-cursor="Next">
        <div className="wrap grid grid-cols-1 items-center gap-8 py-[clamp(4rem,12vh,9rem)] md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="meta text-[var(--muted)]">Next project</p>
            <p className="display mt-4 text-[clamp(3rem,8vw,7.5rem)] transition-transform duration-700 group-hover:translate-x-3">{next.title}</p>
            <p className="meta mt-4 text-[var(--muted)]">{next.location} — {next.year}</p>
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <div className="overflow-hidden">
              <Picture image={cover(next)} sizes="35vw" className="aspect-[4/3] transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105" />
            </div>
          </div>
        </div>
      </button>

      {lightbox !== null && <Lightbox images={flat} index={lightbox} onIndex={setLightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   Lightbox
   ════════════════════════════════════════════════════════════ */
function Lightbox({ images, index, onIndex, onClose }: { images: Img[]; index: number; onIndex: (n: number) => void; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const startX = useRef<number | null>(null)
  const n = images.length
  const go = (d: number) => onIndex((index + d + n) % n)
  const image = images[index]

  useEffect(() => { closeRef.current?.focus({ preventScroll: true }) }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  useGSAP(() => {
    if (reduceMotion()) return
    gsap.fromTo(root.current!.querySelector('.lb-img'), { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.8 })
  }, { dependencies: [index], scope: root })

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[150] flex flex-col bg-[#0d0c0b]/95 text-[#f4f1ea] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onPointerDown={(e) => { startX.current = e.clientX }}
      onPointerUp={(e) => {
        if (startX.current === null) return
        const dx = e.clientX - startX.current
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        startX.current = null
      }}
    >
      <div className="wrap flex h-16 shrink-0 items-center justify-between">
        <span className="meta">{String(index + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
        <button ref={closeRef} type="button" onClick={onClose} className="meta rounded-full border border-white/30 px-4 py-2 hover:bg-white/10">Close ✕</button>
      </div>
      <div className="relative min-h-0 flex-1 px-4 pb-4 md:px-20">
        <Picture key={image.id} image={image} contain eager sizes="100vw" className={`lb-img h-full w-full ${image.tag === 'drawing' ? '!bg-white' : '!bg-transparent'}`} />
        <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/30 hover:bg-white/10 md:grid" aria-label="Previous image"><Arrow dir="left" /></button>
        <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/30 hover:bg-white/10 md:grid" aria-label="Next image"><Arrow /></button>
      </div>
      <p className="wrap meta shrink-0 pb-6 text-center opacity-75">{image.alt}</p>
    </div>
  )
}
