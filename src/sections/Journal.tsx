import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { asset, img, journal, srcset, type Project, type Spread } from '../data'
import { useGSAP, revealLines, preloadNear } from '../motion'
import { SectionLabel, Arrow } from '../ui'

/* ════════════════════════════════════════════════════════════
   Site journal — ongoing work as an open sketchbook.
   Page-turn geometry adapted from the "journal spread carousel" reference:
   the centre spread lies open, neighbours fold shut and stack to each side.
   ════════════════════════════════════════════════════════════ */

const OPEN = 5 // slight V at the spine of the centre spread, degrees
const SIDE = 80 // how far a stacked page turns toward the middle
const FOLD = 174 // a page folding shut over its partner

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v)
const spreadAspect = (w: number, h: number) => (w < 640 && h > w ? 0.86 : 1.25)
function spreadWidth(w: number, h: number) {
  if (w <= 0 || h <= 0) return 0
  return Math.round(Math.min(w * (w < 640 ? 0.84 : 0.54), h * 0.9 * spreadAspect(w, h), 980))
}
function poseFor(p: number, w: number) {
  const d = Math.abs(p)
  const a = d < 1 ? d : 1
  const s = p < 0 ? -1 : 1
  const out = d > 1 ? d - 1 : 0
  const x = s * (a * (w * 0.5 + w * 0.03) + out * w * 0.055)
  const z = -(a * w * 0.42 + out * w * 0.06)
  const fold = a * a // fold eases in so leaving and arriving spreads overlap mid-turn
  const left = p > 0 ? OPEN + (FOLD - OPEN) * fold : OPEN + (SIDE - OPEN) * a
  const right = p < 0 ? -(OPEN + (FOLD - OPEN) * fold) : -(OPEN + (SIDE - OPEN) * a)
  const shade = (deg: number) => clamp((Math.abs(deg) - OPEN) / 95, 0, 0.62)
  return { x, z, left, right, shadeLeft: shade(left), shadeRight: shade(right), opacity: clamp(7.2 - d, 0, 1), hidden: d > 7.2 }
}
const settle = (pos: number, v: number, n: number) => clamp(Math.round(pos + clamp(v * 0.18, -1.5, 1.5)), 0, Math.max(0, n - 1))
const durationFor = (steps: number) => (steps <= 0 ? 0 : Math.round(620 * Math.sqrt(Math.min(steps, 12))))
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

function Sheet({ project, spread, eager }: { project: Project; spread: Spread; eager: boolean }) {
  const bg = img(project, spread.bg)
  return (
    <div className="jsc-sheet">
      <img
        className="jsc-bg"
        src={asset(bg.src)}
        srcSet={srcset(bg.srcset)}
        sizes="(min-width: 768px) 980px, 90vw"
        alt=""
        draggable={false}
        decoding="async"
        loading={eager ? 'eager' : 'lazy'}
        style={{ objectPosition: spread.imagePosition }}
      />
      {spread.prints?.map((p, k) => {
        const im = img(project, p.id)
        return (
          <figure key={k} className="jsc-print" data-tape={p.tape ? '' : undefined}
            style={{ left: p.x + '%', top: p.y + '%', width: p.w + '%', transform: `rotate(${p.rotate ?? 0}deg)` }}>
            <img src={asset(im.src)} srcSet={srcset(im.srcset)} sizes="260px" alt="" draggable={false} decoding="async" loading={eager ? 'eager' : 'lazy'} />
            {p.caption ? <figcaption>{p.caption}</figcaption> : null}
          </figure>
        )
      })}
      {spread.notes?.map((t, k) => (
        <div key={k} className="jsc-note" data-style={t.style ?? 'card'}
          style={{ left: t.x + '%', top: t.y + '%', width: t.w + '%', transform: `rotate(${t.rotate ?? 0}deg)` }}>
          {t.title ? <b>{t.title}</b> : null}
          {t.body ? <span>{t.body}</span> : null}
        </div>
      ))}
    </div>
  )
}

function JournalCarousel({ project, autoPlay = 4200 }: { project: Project; autoPlay?: number | false }) {
  const spreads = project.spreads ?? []
  const n = spreads.length
  const [index, setIndex] = useState(0)
  const [reduced, setReduced] = useState(false)
  const [dragging, setDragging] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const items = useRef<(HTMLDivElement | null)[]>([])
  const pages = useRef<(HTMLDivElement | null)[]>([])
  const width = useRef(0)
  const pos = useRef(0)
  const target = useRef(0)
  const tween = useRef<null | { from: number; to: number; t0: number; dur: number; ease: (t: number) => number }>(null)
  const raf = useRef(0)
  const drag = useRef<null | { id: number; x: number; from: number; lastX: number; lastT: number; v: number; moved: boolean }>(null)
  const touched = useRef(false)
  const reducedRef = useRef(false)

  const paint = useCallback(() => {
    const w = width.current
    if (!w) return
    for (let i = 0; i < items.current.length; i++) {
      const el = items.current[i]
      if (!el) continue
      const q = poseFor(i - pos.current, w)
      if (q.hidden) { el.style.visibility = 'hidden'; continue }
      el.style.visibility = 'visible'
      el.style.opacity = String(q.opacity)
      el.style.transform = `translate3d(${q.x.toFixed(2)}px,0,${q.z.toFixed(2)}px)`
      const l = pages.current[i * 2]
      const r = pages.current[i * 2 + 1]
      if (l) { l.style.transform = `rotateY(${q.left.toFixed(2)}deg)`; l.style.setProperty('--jsc-s', q.shadeLeft.toFixed(3)) }
      if (r) { r.style.transform = `rotateY(${q.right.toFixed(2)}deg)`; r.style.setProperty('--jsc-s', q.shadeRight.toFixed(3)) }
    }
  }, [])

  const frame = useCallback((t: number) => {
    raf.current = 0
    const tw = tween.current
    if (tw) {
      const k = tw.dur > 0 ? clamp((t - tw.t0) / tw.dur, 0, 1) : 1
      pos.current = tw.from + (tw.to - tw.from) * tw.ease(k)
      if (k >= 1) tween.current = null
    }
    paint()
    if (tween.current) raf.current = requestAnimationFrame(frame)
  }, [paint])

  const kick = useCallback(() => { if (!raf.current) raf.current = requestAnimationFrame(frame) }, [frame])

  const go = useCallback((to: number, ease = easeInOut) => {
    const next = clamp(to, 0, Math.max(0, n - 1))
    if (next !== target.current) { target.current = next; setIndex(next) }
    const dur = reducedRef.current ? 0 : durationFor(Math.abs(next - pos.current))
    tween.current = { from: pos.current, to: next, t0: performance.now(), dur, ease }
    kick()
  }, [n, kick])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => { reducedRef.current = mq.matches; setReduced(mq.matches) }
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // measure once per resize; the frame loop reads only the cache
  useEffect(() => {
    const stage = stageRef.current, root = rootRef.current
    if (!stage || !root) return
    const ro = new ResizeObserver(([entry]) => {
      const { width: sw, height: sh } = entry.contentRect
      const w = spreadWidth(sw, sh)
      width.current = w
      root.style.setProperty('--jsc-w', w + 'px')
      root.style.setProperty('--jsc-h', Math.round(w / spreadAspect(sw, sh)) + 'px')
      paint()
    })
    ro.observe(stage)
    return () => { ro.disconnect(); cancelAnimationFrame(raf.current); raf.current = 0 }
  }, [paint])

  // turns pages on its own until touched; pauses off-screen and in a hidden tab
  useEffect(() => {
    const root = rootRef.current
    if (!autoPlay || reduced || n < 2 || !root) return
    let visible = false
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { threshold: 0.4 })
    io.observe(root)
    const id = window.setInterval(() => {
      if (touched.current || !visible || document.hidden || drag.current) return
      go(target.current >= n - 1 ? 0 : target.current + 1)
    }, autoPlay)
    return () => { window.clearInterval(id); io.disconnect() }
  }, [autoPlay, reduced, n, go])

  const stop = () => { touched.current = true }

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || n < 1) return
    stop()
    tween.current = null
    drag.current = { id: e.pointerId, x: e.clientX, from: pos.current, lastX: e.clientX, lastT: e.timeStamp, v: 0, moved: false }
  }
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current, w = width.current
    if (!d || d.id !== e.pointerId || !w) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) > 6) { d.moved = true; setDragging(true); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
    if (!d.moved) return
    const dt = Math.max(1, e.timeStamp - d.lastT)
    d.v = d.v * 0.6 + (-(e.clientX - d.lastX) / (w * 0.42) / (dt / 1000)) * 0.4
    d.lastX = e.clientX
    d.lastT = e.timeStamp
    pos.current = clamp(d.from - dx / (w * 0.42), -0.3, n - 0.7)
    kick()
  }
  const onPointerUp = (e: PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    setDragging(false)
    if (d.moved) { go(settle(pos.current, d.v, n), easeOut); return }
    const hit = (e.target as HTMLElement).closest('[data-i]')
    go(hit ? Number(hit.getAttribute('data-i')) : target.current)
  }
  const onKeyDown = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowRight: 1, PageDown: 1, ArrowLeft: -1, PageUp: -1 }
    if (e.target !== e.currentTarget) return
    if (e.key in map) go(target.current + map[e.key])
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(n - 1)
    else return
    e.preventDefault()
    stop()
  }

  // trackpads swipe sideways; vertical wheel keeps scrolling the page
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const acc = { v: 0, at: 0 }
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      acc.v += e.deltaX
      if (Math.abs(acc.v) < 40 || e.timeStamp - acc.at < 320) return
      touched.current = true
      acc.at = e.timeStamp
      go(target.current + (acc.v > 0 ? 1 : -1))
      acc.v = 0
    }
    stage.addEventListener('wheel', onWheel, { passive: true })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [go])

  const current = spreads[index]

  return (
    <div
      ref={rootRef}
      className="jsc-root"
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${project.title} — site journal. Use left and right arrow keys to turn pages.`}
      onKeyDown={onKeyDown}
    >
      <div
        ref={stageRef}
        className="jsc-stage"
        data-drag={dragging ? '' : undefined}
        data-cursor="Drag"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="jsc-floor" aria-hidden="true" />
        <div className="jsc-view">
          <div className="jsc-scene">
            {spreads.map((s, i) => (
              <div key={s.label} ref={(el) => { items.current[i] = el }} className="jsc-item" data-i={i}
                role="group" aria-roledescription="spread" aria-label={`${s.label}, ${i + 1} of ${n}`} aria-hidden={i !== index}>
                <span className="sr-only">{img(project, s.bg).alt}</span>
                {(['l', 'r'] as const).map((side, k) => (
                  <div key={side} ref={(el) => { pages.current[i * 2 + k] = el }} className="jsc-page" data-side={side}>
                    <Sheet project={project} spread={s} eager={i < 2} />
                    <div className="jsc-gutter" />
                    <div className="jsc-shade" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="jsc-bar">
        <button type="button" className="jsc-btn" aria-label="Previous spread" onClick={() => { stop(); go(target.current - 1) }} disabled={index === 0} data-magnetic>
          <Arrow dir="left" />
        </button>
        <div className="jsc-caption" aria-live="polite">
          <span className="meta">{String(index + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
          <span className="jsc-caption-title">{current?.label}</span>
        </div>
        <button type="button" className="jsc-btn" aria-label="Next spread" onClick={() => { stop(); go(target.current + 1) }} disabled={index === n - 1} data-magnetic>
          <Arrow />
        </button>
      </div>
    </div>
  )
}

export function Journal() {
  const root = useRef<HTMLElement>(null)
  const project = journal.find((p) => p.spreads?.length)

  useGSAP(() => {
    const el = root.current!
    revealLines(el.querySelector('.journal-title'))
    preloadNear(el)
  }, { scope: root })

  if (!project) return null

  return (
    <section id="journal" ref={root} className="section" aria-labelledby="journal-title">
      <div className="wrap grid grid-cols-1 items-end gap-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <SectionLabel index="05">On site now</SectionLabel>
          <h2 id="journal-title" className="journal-title title mt-6">
            A residence, <span className="italic-accent">in progress</span>
          </h2>
        </div>
        <div className="md:col-span-4">
          <p className="text-[var(--ink-2)]">{project.summary}</p>
          <p className="meta mt-4 flex items-center gap-3 text-[var(--muted)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
            </span>
            {project.status} · {project.location} · {project.year}
          </p>
        </div>
      </div>
      <div className="wrap mt-[clamp(2.5rem,6vh,4.5rem)]">
        <JournalCarousel project={project} />
        <p className="meta mt-4 text-center text-[var(--muted)]">Drag, swipe or use ← → to turn the pages</p>
      </div>
    </section>
  )
}
