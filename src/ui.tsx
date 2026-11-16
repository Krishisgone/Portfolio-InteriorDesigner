import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { asset, srcset, site, type Img } from './data'
import { gsap, useGSAP, reduceMotion, scrollToTarget, toggleTheme, currentTheme, type Theme } from './motion'

/* ── Responsive image with blurred placeholder ───────────────── */
export function Picture({
  image,
  sizes = '100vw',
  className = '',
  style,
  eager = false,
  contain = false,
  parallax = false,
  natural = false,
}: {
  image: Img
  sizes?: string
  className?: string
  style?: CSSProperties
  eager?: boolean
  contain?: boolean
  parallax?: boolean
  natural?: boolean // keep intrinsic aspect ratio
}) {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth) setLoaded(true)
  }, [])
  return (
    <div
      className={`img-frame img-ph ${contain ? 'img-contain' : ''} ${className}`}
      style={{
        backgroundImage: contain ? undefined : `url(${image.placeholder})`,
        aspectRatio: natural ? `${image.w} / ${image.h}` : undefined,
        ...style,
      }}
    >
      <img
        ref={ref}
        src={asset(image.src)}
        srcSet={srcset(image.srcset)}
        sizes={sizes}
        width={image.w}
        height={image.h}
        alt={image.alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : undefined}
        draggable={false}
        onLoad={() => setLoaded(true)}
        className={`${loaded ? 'is-loaded' : ''} ${parallax ? 'parallax-target' : ''}`}
        style={parallax ? { top: '-12%', height: '124%' } : undefined}
      />
    </div>
  )
}

/* ── Monogram: MS inside a drawing-sheet frame with corner ticks ── */
export function Monogram({ size = 44, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <rect x="4.5" y="4.5" width="39" height="39" stroke="currentColor" strokeWidth="1" />
      <path d="M1 8V1h7M40 1h7v7M47 40v7h-7M8 47H1v-7" stroke="var(--accent-soft)" strokeWidth="1" />
      <text x="24" y="30.5" textAnchor="middle" fill="currentColor"
        style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 400, letterSpacing: '0.04em' }}>
        MS
      </text>
    </svg>
  )
}

/* ── Atmosphere: blueprint column guides + paper grain ───────── */
export function Atmosphere() {
  return (
    <>
      <div className="guides hidden md:block" aria-hidden="true">
        <div className="wrap">
          {Array.from({ length: 12 }, (_, i) => <span key={i} />)}
        </div>
      </div>
      <div className="grain" aria-hidden="true" />
    </>
  )
}

/* ── Custom cursor with labels + magnetic targets ────────────── */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')
  const [hover, setHover] = useState(false)

  useEffect(() => {
    if (reduceMotion() || window.matchMedia('(pointer: coarse)').matches) return
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3' })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3' })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.55, ease: 'power3' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.55, ease: 'power3' })
    let magnet: HTMLElement | null = null

    const move = (e: PointerEvent) => {
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY)
      if (magnet) {
        const r = magnet.getBoundingClientRect()
        gsap.to(magnet, {
          x: (e.clientX - (r.left + r.width / 2)) * 0.3,
          y: (e.clientY - (r.top + r.height / 2)) * 0.3,
          duration: 0.6, ease: 'power3',
        })
      }
    }
    const over = (e: PointerEvent) => {
      const t = e.target as HTMLElement
      const labelled = t.closest<HTMLElement>('[data-cursor]')
      setLabel(labelled?.dataset.cursor ?? '')
      setHover(!labelled && !!t.closest('a, button, [role="button"], input, select, textarea'))
      const m = t.closest<HTMLElement>('[data-magnetic]')
      if (m !== magnet) {
        if (magnet) gsap.to(magnet, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' })
        magnet = m
      }
    }
    const leave = () => gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.3 })
    const enter = () => gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.3 })
    window.addEventListener('pointermove', move)
    document.addEventListener('pointerover', over)
    document.documentElement.addEventListener('pointerleave', leave)
    document.documentElement.addEventListener('pointerenter', enter)
    return () => {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerover', over)
      document.documentElement.removeEventListener('pointerleave', leave)
      document.documentElement.removeEventListener('pointerenter', enter)
    }
  }, [])

  return (
    <div aria-hidden="true">
      <div ref={dot} className="cursor cursor-dot" />
      <div ref={ring} className="cursor">
        <div className={`cursor-ring ${label ? 'is-label' : ''} ${hover ? 'is-hover' : ''}`} />
        <div className={`cursor-pill ${label ? 'is-on' : ''}`}>
          <i />
          {label}
        </div>
      </div>
    </div>
  )
}

/* ── Theme toggle: half-filled disc that turns ───────────────── */
function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() => currentTheme())
  useEffect(() => {
    const mo = new MutationObserver(() => setTheme(currentTheme()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => mo.disconnect()
  }, [])
  return theme
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      data-magnetic
      onClick={(e) => toggleTheme({ x: e.clientX || window.innerWidth - 48, y: e.clientY || 40 })}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={`relative grid h-11 w-11 place-items-center rounded-full border border-[var(--line-strong)] ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"
        style={{ transition: 'transform 0.9s cubic-bezier(0.7,0,0.2,1)', transform: `rotate(${theme === 'dark' ? 180 : 0}deg)` }}>
        <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M10 1.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
      </svg>
    </button>
  )
}

/* ── Navigation ──────────────────────────────────────────────── */
const links = [
  { href: '#work', label: 'Work' },
  { href: '#rooms', label: 'Rooms' },
  { href: '#journal', label: 'On site' },
  { href: '#practice', label: 'Practice' },
  { href: '#process', label: 'Process' },
  { href: '#contact', label: 'Contact' },
]

export function Nav({ ready }: { ready: boolean }) {
  const bar = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  const menu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const hide = y > last && y > 160 && !open
      gsap.to(bar.current, { yPercent: hide ? -110 : 0, duration: 0.7, ease: 'arch', overwrite: true })
      bar.current?.classList.toggle('is-scrolled', y > 40)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [open])

  useGSAP(() => {
    if (!ready || reduceMotion()) return
    gsap.from(bar.current!.querySelectorAll('.nav-in'), { yPercent: -120, opacity: 0, duration: 1.2, stagger: 0.06, delay: 0.5 })
  }, { dependencies: [ready], scope: bar })

  useGSAP(() => {
    if (!open || !menu.current || reduceMotion()) return
    gsap.fromTo(menu.current, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'arch' })
    gsap.from(menu.current.querySelectorAll('.menu-item'), { yPercent: 110, duration: 1, stagger: 0.06, delay: 0.25 })
  }, { dependencies: [open] })

  const setMenu = (o: boolean) => {
    setOpen(o)
    document.documentElement.style.overflow = o ? 'hidden' : ''
  }
  const go = (href: string) => {
    setMenu(false)
    scrollToTarget(href)
  }

  return (
    <>
      <header ref={bar} className="fixed inset-x-0 top-0 z-[70] transition-[background-color,backdrop-filter] duration-500 [&.is-scrolled]:bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] [&.is-scrolled]:backdrop-blur-md">
        <nav className="wrap flex h-[76px] items-center justify-between gap-6" aria-label="Primary">
          <a href="#top" onClick={(e) => { e.preventDefault(); go('#top') }} className="nav-in flex items-center gap-3" aria-label="Mehul Saini, back to top">
            <Monogram size={40} />
            <span className="meta hidden sm:block">Mehul Saini</span>
          </a>
          <ul className="hidden items-center gap-9 lg:flex">
            {links.map((l, i) => (
              <li key={l.href} className="nav-in">
                <a href={l.href} onClick={(e) => { e.preventDefault(); go(l.href) }} className="meta ulink pb-1">
                  <span className="text-[var(--muted)]">0{i + 1}</span> {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <ThemeToggle className="nav-in" />
            <a href="#contact" onClick={(e) => { e.preventDefault(); go('#contact') }} className="nav-in btn hidden !py-2.5 md:inline-flex" data-magnetic>
              Start a project
            </a>
            <button
              type="button"
              className="nav-in grid h-11 w-11 place-items-center rounded-full border border-[var(--line-strong)] lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setMenu(!open)}
            >
              <span className="relative block h-3 w-5">
                <span className="absolute left-0 top-0 h-px w-full bg-current transition-transform duration-500" style={{ transform: open ? 'translateY(6px) rotate(45deg)' : undefined }} />
                <span className="absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-500" style={{ transform: open ? 'translateY(-5px) rotate(-45deg)' : undefined }} />
              </span>
            </button>
          </div>
        </nav>
      </header>
      {open && (
        <div id="mobile-menu" ref={menu} className="fixed inset-0 z-[65] flex flex-col justify-end bg-[var(--bg-2)] pb-12 pt-28 lg:hidden">
          <ul className="wrap">
            {links.map((l, i) => (
              <li key={l.href} className="line-mask border-b border-[var(--line)]">
                <a href={l.href} onClick={(e) => { e.preventDefault(); go(l.href) }} className="menu-item flex items-baseline justify-between py-4">
                  <span className="display text-[clamp(2.8rem,12vw,5rem)]">{l.label}</span>
                  <span className="meta text-[var(--muted)]">0{i + 1}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="wrap meta mt-8 text-[var(--muted)]">{site.email}</p>
        </div>
      )}
    </>
  )
}

/* ── Preloader: counter tied to real asset loading, curtain exit ── */
export function Preloader({ urls, onDone }: { urls: string[]; onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const count = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const reduce = reduceMotion()
    const state = { p: 0 }
    let loaded = 0
    const total = urls.length + 1
    const render = () => {
      if (count.current) count.current.textContent = String(Math.round(state.p)).padStart(3, '0')
      if (bar.current) bar.current.style.transform = `scaleX(${state.p / 100})`
    }
    const bump = () => {
      loaded++
      gsap.to(state, { p: (loaded / total) * 100, duration: reduce ? 0.1 : 0.9, ease: 'power2.out', onUpdate: render, overwrite: true })
    }
    urls.forEach((u) => {
      const im = new Image()
      im.onload = im.onerror = bump
      im.src = u
    })
    document.fonts.ready.then(bump)

    const minTime = new Promise((r) => setTimeout(r, reduce ? 150 : 1700))
    const allLoaded = new Promise<void>((r) => {
      const check = () => (loaded >= total ? r() : setTimeout(check, 60))
      check()
    })
    const cap = new Promise((r) => setTimeout(r, 5000)) // never trap the visitor on a slow network
    Promise.all([minTime, Promise.race([allLoaded, cap])]).then(() => {
      gsap.to(state, { p: 100, duration: reduce ? 0 : 0.5, onUpdate: render, overwrite: true })
      const tl = gsap.timeline({ delay: reduce ? 0 : 0.55, onComplete: () => { if (root.current) root.current.style.display = 'none' } })
      if (reduce) {
        tl.call(onDone).to(root.current, { opacity: 0, duration: 0.3 })
      } else {
        tl.to(root.current!.querySelectorAll('.pre-in'), { yPercent: -110, duration: 0.8, ease: 'arch', stagger: 0.04 })
          .to(root.current, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.3, ease: 'arch' }, '-=0.25')
          .call(onDone, [], '-=1.05')
      }
    })
    if (!reduce) gsap.from(root.current!.querySelectorAll('.pre-in'), { yPercent: 110, duration: 1, stagger: 0.08, delay: 0.1 })
  }, { scope: root })

  return (
    <div ref={root} className="fixed inset-0 z-[200] flex flex-col justify-between bg-[#161615] p-[clamp(16px,4vw,64px)] text-[#f4f1ea]" style={{ clipPath: 'inset(0% 0% 0% 0%)' }} role="status" aria-label="Loading portfolio">
      <div className="flex justify-between gap-4">
        <span className="line-mask"><span className="pre-in meta block">Mehul Saini</span></span>
        <span className="line-mask"><span className="pre-in meta block">{site.coords}</span></span>
      </div>
      <div className="flex flex-col items-center gap-8">
        <span className="line-mask"><span className="pre-in block"><Monogram size={72} /></span></span>
        <span className="line-mask">
          <span ref={count} className="pre-in block text-[clamp(4rem,10vw,8rem)] font-light leading-none tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>000</span>
        </span>
      </div>
      <div>
        <div className="mb-4 h-px w-full bg-white/15">
          <div ref={bar} className="h-px origin-left bg-[#b08d57]" style={{ transform: 'scaleX(0)' }} />
        </div>
        <div className="flex justify-between gap-4">
          <span className="line-mask"><span className="pre-in meta block">Interior Designer</span></span>
          <span className="line-mask"><span className="pre-in meta block text-right">Kitchens · Wardrobes · Residences</span></span>
        </div>
      </div>
    </div>
  )
}

/* ── Small shared bits ───────────────────────────────────────── */
export function SectionLabel({ index, children }: { index: string; children: ReactNode }) {
  return (
    <div className="meta flex items-center gap-4 text-[var(--muted)]">
      <span className="text-[var(--accent)]">{index}</span>
      <span className="h-px w-10 bg-[var(--line-strong)]" />
      <span>{children}</span>
    </div>
  )
}

export function Arrow({ className = '', dir = 'right' }: { className?: string; dir?: 'right' | 'down' | 'up-right' | 'left' }) {
  const rot = { right: 0, down: 90, 'up-right': -45, left: 180 }[dir]
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true" className={className} style={{ transform: `rotate(${rot}deg)`, transition: 'transform 0.5s' }}>
      <path d="M0 6h16M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
