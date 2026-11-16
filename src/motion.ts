import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Flip } from 'gsap/Flip'
import { CustomEase } from 'gsap/CustomEase'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, CustomEase, useGSAP)
CustomEase.create('arch', '0.7,0,0.2,1') // architectural in-out
CustomEase.create('soft', '0.16,1,0.3,1') // long, settling ease-out
gsap.defaults({ ease: 'soft', duration: 1.2 })

export { gsap, ScrollTrigger, SplitText, Flip, useGSAP }

export const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ── Smooth scroll (one RAF loop shared with GSAP) ───────────
let lenis: Lenis | null = null

export function startLenis() {
  if (lenis || reduceMotion()) return lenis
  lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis?.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export function scrollToTarget(target: string | number | HTMLElement) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) })
    return
  }
  if (typeof target === 'number') window.scrollTo({ top: target, behavior: reduceMotion() ? 'auto' : 'smooth' })
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    el?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' })
  }
}

export function lockScroll(lock: boolean) {
  if (lock) lenis?.stop()
  else lenis?.start()
  document.documentElement.style.overflow = lock ? 'hidden' : ''
}

// ── Text reveal: masked line-by-line rise, re-splits on resize/font load ──
export function revealLines(
  el: Element | null,
  opts: { trigger?: Element; delay?: number; stagger?: number; start?: string; immediate?: boolean } = {},
) {
  if (!el || reduceMotion()) return
  SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    aria: 'none', // keep the real text readable; aria-label is not allowed on <p>/<span>
    autoSplit: true,
    onSplit(self) {
      return gsap.from(self.lines, {
        yPercent: 110,
        duration: 1.3,
        stagger: opts.stagger ?? 0.08,
        delay: opts.delay ?? 0,
        ease: 'soft',
        scrollTrigger: opts.immediate
          ? undefined
          : { trigger: opts.trigger ?? el, start: opts.start ?? 'top 85%', once: true },
      })
    },
  })
}

// ── Image reveal: curtain clip-path + settle from 1.22 scale ──
export function revealImage(frame: Element | null, opts: { from?: 'bottom' | 'left' | 'top'; delay?: number } = {}) {
  if (!frame || reduceMotion()) return
  const inner = frame.querySelector('img')
  const clip = {
    bottom: 'inset(100% 0% 0% 0%)',
    top: 'inset(0% 0% 100% 0%)',
    left: 'inset(0% 100% 0% 0%)',
  }[opts.from ?? 'bottom']
  const tl = gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 88%', once: true }, delay: opts.delay ?? 0 })
  tl.fromTo(frame, { clipPath: clip }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'arch' })
  if (inner) tl.fromTo(inner, { scale: 1.22 }, { scale: 1, duration: 2, ease: 'soft' }, 0)
}

// ── Parallax drift of an image inside its frame ─────────────
// The image is pre-scaled so the drift never exposes the frame edge.
export function parallax(frame: Element | null, amount = 8) {
  if (!frame || reduceMotion()) return
  const inner = frame.querySelector('.parallax-target') ?? frame.querySelector('img')
  if (!inner) return
  gsap.fromTo(
    inner,
    { yPercent: -amount },
    { yPercent: amount, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } },
  )
}

// ── Pinned/clipped galleries: fetch their images before the visitor arrives ──
// (horizontally offset or clip-path-hidden layers never cross the browser's lazy-load margin in time)
export function preloadNear(section: Element | null, selector = 'img') {
  if (!section) return
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom+=1400',
    once: true,
    onEnter: () => section.querySelectorAll<HTMLImageElement>(selector).forEach((i) => { i.loading = 'eager' }),
  })
}

// ── Theme switch with a circular reveal from the click point ──
export type Theme = 'light' | 'dark'
export const currentTheme = (): Theme =>
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'

export function toggleTheme(origin?: { x: number; y: number }) {
  const root = document.documentElement
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
  const apply = () => {
    root.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* storage blocked: theme still applies for this visit */
    }
  }
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }
  if (!doc.startViewTransition || reduceMotion()) {
    apply()
    return
  }
  const x = origin?.x ?? window.innerWidth - 48
  const y = origin?.y ?? 40
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  const vt = doc.startViewTransition(apply)
  vt.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 950, easing: 'cubic-bezier(0.7, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
    )
  })
}
