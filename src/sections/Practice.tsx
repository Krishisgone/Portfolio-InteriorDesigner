import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { asset, bySlug, img, site } from '../data'
import { gsap, useGSAP, revealLines, revealImage, reduceMotion, scrollToTarget, preloadNear } from '../motion'
import { Picture, SectionLabel, Arrow, Monogram } from '../ui'

/* ════════════════════════════════════════════════════════════
   05 — Practice: experience ledger, tools, education
   ════════════════════════════════════════════════════════════ */
export function Practice() {
  const root = useRef<HTMLElement>(null)
  const [open, setOpen] = useState<number | null>(1)

  useGSAP(() => {
    const el = root.current!
    revealLines(el.querySelector('.practice-title'))
    if (reduceMotion()) return
    el.querySelectorAll('.ledger-row').forEach((row) => {
      gsap.from(row.querySelector('.ledger-rule'), { scaleX: 0, duration: 1.4, ease: 'arch', scrollTrigger: { trigger: row, start: 'top 92%', once: true } })
      gsap.from(row.querySelectorAll('.ledger-in'), { yPercent: 100, opacity: 0, duration: 1, stagger: 0.05, scrollTrigger: { trigger: row, start: 'top 92%', once: true } })
    })
    gsap.from(el.querySelectorAll('.tool'), { y: 24, opacity: 0, duration: 0.9, stagger: 0.04, scrollTrigger: { trigger: el.querySelector('.tools'), start: 'top 90%', once: true } })
  }, { scope: root })

  return (
    <section id="practice" ref={root} className="section" aria-labelledby="practice-title">
      <div className="wrap grid grid-cols-1 gap-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="md:sticky md:top-28">
            <SectionLabel index="06">Practice</SectionLabel>
            <h2 id="practice-title" className="practice-title title mt-6">
              From drawing board to <span className="italic-accent">design head</span>
            </h2>
            <p className="mt-6 max-w-[40ch] text-[var(--ink-2)]">
              Four studios since {site.since} — residential interiors, premium Italian kitchens, and leading the design team of a luxury kitchen and wardrobe brand.
            </p>
            <a href={asset(site.resume)} download className="btn btn-solid mt-8" data-magnetic>
              Download résumé <Arrow dir="down" />
            </a>
          </div>
        </div>

        <div className="md:col-span-7 md:col-start-6">
          <ol>
            {site.experience.map((x, i) => {
              const isOpen = open === i
              return (
                <li key={x.company} className="ledger-row">
                  <div className="ledger-rule hairline origin-left" />
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`role-${i}`}
                    className="grid w-full grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 py-6 text-left md:grid-cols-[9rem_1fr_auto]"
                  >
                    <span className="line-mask"><span className="ledger-in meta block text-[var(--muted)]">{x.from} — {x.to}</span></span>
                    <span className="line-mask col-start-1 md:col-start-2">
                      <span className="ledger-in block text-[clamp(1.5rem,2.4vw,2.2rem)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                        {x.role} <span className="text-[var(--muted)]">·</span> <span className="italic-accent">{x.company}</span>
                      </span>
                    </span>
                    <span className="col-start-2 row-span-2 row-start-1 grid h-9 w-9 place-items-center self-center rounded-full border border-[var(--line-strong)] md:col-start-3 md:row-span-1" aria-hidden="true">
                      <span className="relative block h-3 w-3">
                        <span className="absolute left-0 top-1/2 h-px w-full bg-current" />
                        <span className="absolute left-1/2 top-0 h-full w-px bg-current transition-transform duration-500" style={{ transform: isOpen ? 'scaleY(0)' : 'none' }} />
                      </span>
                    </span>
                  </button>
                  <Collapse open={isOpen} id={`role-${i}`}>
                    <ul className="grid gap-3 pb-8 md:pl-[calc(9rem+1.5rem)]">
                      {x.points.map((pt) => (
                        <li key={pt} className="flex gap-3 text-[var(--ink-2)]">
                          <span className="mt-[0.8em] h-px w-4 shrink-0 bg-[var(--accent)]" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </Collapse>
                </li>
              )
            })}
          </ol>
          <div className="hairline" />

          <div className="tools mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2">
            <div>
              <p className="meta text-[var(--muted)]">Software</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {site.software.map((s) => <li key={s} className="tool chip">{s}</li>)}
              </ul>
            </div>
            <div>
              <p className="meta text-[var(--muted)]">Core skills</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {site.skills.map((s) => <li key={s} className="tool chip">{s}</li>)}
              </ul>
            </div>
            <div className="sm:col-span-2">
              <p className="meta text-[var(--muted)]">Education</p>
              <ul className="mt-5 grid gap-3">
                {site.education.map((e) => (
                  <li key={e.title} className="tool flex items-baseline gap-6 border-t border-[var(--line)] pt-3">
                    <span className="meta text-[var(--accent)]">{e.year}</span>
                    <span>{e.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Collapse({ open, id, children }: { open: boolean; id: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  useEffect(() => {
    const el = ref.current!
    if (first.current) {
      first.current = false
      gsap.set(el, { height: open ? 'auto' : 0 })
      return
    }
    gsap.to(el, { height: open ? 'auto' : 0, duration: reduceMotion() ? 0 : 0.8, ease: 'arch' })
  }, [open])
  return (
    <div ref={ref} id={id} className="overflow-hidden" inert={!open}>
      {children}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   06 — Process: one kitchen followed from plan to handover
   ════════════════════════════════════════════════════════════ */
const sky = bySlug('skylit-kitchen')!
const stages = [
  {
    t: 'Brief & space planning',
    d: 'Client brief, site measurements and a space plan built around ergonomics — how the family cooks, stores and moves through the room.',
    image: img(sky, 'process-sheet'),
    contain: false,
  },
  {
    t: 'Material curation',
    d: 'Stone, glass, profiles and hardware chosen with the client in material walkthroughs, then specified down to the profile finish and handle.',
    image: img(sky, 'process-board'),
    contain: false,
  },
  {
    t: '3D visualisation & production drawings',
    d: 'Photoreal renders in 3ds Max + V-Ray for approval, followed by dimensioned plans and elevations that production can build from.',
    image: img(sky, 'render-island'),
    contain: false,
  },
  {
    t: 'Execution & handover',
    d: 'Vendor coordination, site supervision and installation — then post-installation support until the room is in daily use.',
    image: img(sky, 'built-island'),
    contain: false,
  },
]

export function Process() {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  useGSAP(() => {
    const el = root.current!
    revealLines(el.querySelector('.process-title'))
    preloadNear(el.querySelector('.proc-pin'))
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
      const frames = gsap.utils.toArray<HTMLElement>('.proc-frame', el)
      frames.forEach((f, i) => gsap.set(f, { clipPath: i ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 0% 0%)' }))
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el.querySelector('.proc-pin'),
          start: 'top top',
          end: `+=${stages.length * 85}%`,
          pin: true,
          scrub: 1,
          onUpdate: (s) => setActive(Math.min(stages.length - 1, Math.floor(s.progress * stages.length * 0.999))),
        },
      })
      frames.forEach((f, i) => {
        if (!i) return
        tl.to(f, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'arch' })
          .fromTo(f.querySelector('img'), { scale: 1.25 }, { scale: 1, duration: 1 }, '<')
          .to(frames[i - 1].querySelector('img'), { scale: 1.1, yPercent: -6, duration: 1 }, '<')
          .to({}, { duration: 0.4 })
      })
      return () => setActive(0)
    })
    mm.add('(max-width: 1023px)', () => {
      el.querySelectorAll('.proc-m-frame').forEach((f) => revealImage(f))
    })
  }, { scope: root })

  return (
    <section id="process" ref={root} className="section !pb-0" aria-labelledby="process-title">
      <div className="wrap grid grid-cols-1 items-end gap-8 md:grid-cols-12">
        <div className="md:col-span-8">
          <SectionLabel index="07">Process</SectionLabel>
          <h2 id="process-title" className="process-title title mt-6">
            One kitchen, <span className="italic-accent">plan to handover</span>
          </h2>
        </div>
        <p className="text-[var(--ink-2)] md:col-span-4">
          Every stage below comes from a single project — {sky.title}, {sky.location.split(',')[0]} — shown as it moved from drawing to finished room.
        </p>
      </div>

      {/* desktop: pinned stepper */}
      <div className="proc-pin relative hidden h-[100svh] items-center lg:flex" aria-hidden="true">
        <div className="wrap grid w-full grid-cols-12 items-center gap-6">
          <ol className="col-span-5">
            {stages.map((s, i) => (
              <li key={s.t} className="grid grid-cols-[3rem_1fr] border-t border-[var(--line)] py-5 last:border-b">
                <span className={`meta pt-2 transition-colors duration-500 ${active === i ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>0{i + 1}</span>
                <div>
                  <p className={`text-[clamp(1.5rem,2.2vw,2.1rem)] leading-tight transition-opacity duration-500 ${active === i ? 'opacity-100' : 'opacity-35'}`} style={{ fontFamily: 'var(--font-display)' }}>
                    {s.t}
                  </p>
                  <div className="grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(0.7,0,0.2,1)]" style={{ gridTemplateRows: active === i ? '1fr' : '0fr' }}>
                    <div className="overflow-hidden">
                      <p className="max-w-[44ch] pt-3 text-[var(--ink-2)]">{s.d}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="relative col-span-6 col-start-7 aspect-[4/5] max-h-[80svh] w-full overflow-hidden">
            {stages.map((s, i) => (
              <div key={s.t} className="proc-frame absolute inset-0 overflow-hidden" style={{ zIndex: i }}>
                <Picture image={s.image} contain={s.contain} sizes="45vw" className={`!absolute inset-0 h-full w-full ${s.contain ? '!bg-white' : ''}`} />
              </div>
            ))}
            <span className="meta absolute bottom-4 left-4 z-10 rounded-full bg-black/50 px-3 py-1 text-white backdrop-blur-sm">
              Stage 0{active + 1} — {stages[active].t}
            </span>
          </div>
        </div>
      </div>

      {/* mobile / tablet (and screen readers on all sizes) */}
      <ol className="wrap mt-12 grid gap-16 pb-[clamp(6rem,15vh,12rem)] max-lg:not-sr-only lg:sr-only">
        {stages.map((s, i) => (
          <li key={s.t}>
            <Picture image={s.image} contain={s.contain} sizes="100vw" className={`proc-m-frame aspect-[4/5] ${s.contain ? '!bg-white' : ''}`} />
            <p className="meta mt-5 text-[var(--accent)]">Stage 0{i + 1}</p>
            <h3 className="mt-2 text-[1.9rem] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>{s.t}</h3>
            <p className="mt-3 text-[var(--ink-2)]">{s.d}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════
   07 — Contact: direct lines + mailto inquiry composer
   ════════════════════════════════════════════════════════════ */
const words = ['kitchen', 'wardrobe', 'dressing room', 'home']
type FormState = 'idle' | 'error' | 'composed'

export function Contact() {
  const root = useRef<HTMLElement>(null)
  const [w, setW] = useState(0)
  const [state, setState] = useState<FormState>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const status = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (reduceMotion()) return
    const id = setInterval(() => setW((x) => (x + 1) % words.length), 2600)
    return () => clearInterval(id)
  }, [])

  useGSAP(() => {
    const el = root.current!
    revealLines(el.querySelector('.contact-title'))
    if (reduceMotion()) return
    gsap.from(el.querySelectorAll('.contact-in'), { y: 40, opacity: 0, duration: 1.1, stagger: 0.07, scrollTrigger: { trigger: el.querySelector('.contact-grid'), start: 'top 85%', once: true } })
  }, { scope: root })

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    const v = Object.fromEntries(['name', 'email', 'phone', 'type', 'location', 'message'].map((k) => [k, String(f.get(k) ?? '').trim()]))
    const errs: Record<string, string> = {}
    if (!v.name) errs.name = 'Please add your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) errs.email = 'Please add a valid email address.'
    if (v.message.length < 10) errs.message = 'A line or two about the space helps.'
    setErrors(errs)
    if (Object.keys(errs).length) {
      setState('error')
      form.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus()
      return
    }
    const subject = `Project inquiry — ${v.type || 'Interior'} — ${v.name}`
    const body = [
      `Name: ${v.name}`, `Email: ${v.email}`, v.phone ? `Phone: ${v.phone}` : '', `Project: ${v.type}`,
      v.location ? `City: ${v.location}` : '', '', v.message,
    ].filter((x, i, a) => x !== '' || (i > 0 && a[i - 1] !== '')).join('\n')
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setState('composed')
    requestAnimationFrame(() => status.current?.focus())
  }

  const field = 'w-full border-0 border-b border-[var(--line-strong)] bg-transparent py-3 text-[1.05rem] outline-none transition-colors duration-300 focus:border-[var(--accent)]'

  return (
    <section id="contact" ref={root} className="section bg-[var(--bg-2)]" aria-labelledby="contact-title">
      <div className="wrap">
        <SectionLabel index="08">Private consultation</SectionLabel>
        <h2 id="contact-title" className="mt-8">
          <span className="contact-title display block text-[clamp(3.2rem,9vw,9rem)]">Let’s plan your</span>
          <span className="display block text-[clamp(3.2rem,9vw,9rem)]">
            <span className="line-mask inline-block align-bottom">
              <span key={w} className="italic-accent rise inline-block">{words[w]}.</span>
            </span>
          </span>
        </h2>

        <div className="contact-grid mt-[clamp(3rem,10vh,7rem)] grid grid-cols-1 gap-16 md:grid-cols-12">
          <div className="md:col-span-5">
            <ul className="grid gap-8">
              <li className="contact-in">
                <p className="meta text-[var(--muted)]">Email</p>
                <a href={`mailto:${site.email}`} className="ulink mt-2 inline-block break-all text-[clamp(1.4rem,2.4vw,2.2rem)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>{site.email}</a>
              </li>
              <li className="contact-in">
                <p className="meta text-[var(--muted)]">Phone & WhatsApp</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                  <a href={site.phoneHref} className="ulink text-[clamp(1.4rem,2.4vw,2.2rem)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>{site.phone}</a>
                  <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="meta ulink inline-flex items-center gap-2 pb-1">WhatsApp <Arrow dir="up-right" /></a>
                </div>
              </li>
              <li className="contact-in">
                <p className="meta text-[var(--muted)]">Based in</p>
                <p className="mt-2">{site.base}</p>
              </li>
              <li className="contact-in flex flex-wrap gap-3 pt-2">
                <a href={asset(site.resume)} download className="btn" data-magnetic>Résumé (PDF) <Arrow dir="down" /></a>
                <button type="button" onClick={() => scrollToTarget('#work')} className="btn" data-magnetic>See the work <Arrow /></button>
              </li>
            </ul>
          </div>

          <div className="contact-in md:col-span-6 md:col-start-7">
            {state === 'composed' ? (
              <div className="border border-[var(--line-strong)] p-8">
                <p ref={status} tabIndex={-1} className="text-[clamp(1.8rem,3vw,2.6rem)] leading-tight outline-none" style={{ fontFamily: 'var(--font-display)' }} role="status">
                  Your message is ready in your email app.
                </p>
                <p className="mt-4 text-[var(--ink-2)]">
                  Press send there to reach Mehul. If no email app opened, write directly to{' '}
                  <a href={`mailto:${site.email}`} className="ulink text-[var(--ink)]">{site.email}</a> or message on{' '}
                  <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="ulink text-[var(--ink)]">WhatsApp</a>.
                </p>
                <button type="button" className="btn mt-8" onClick={() => setState('idle')}>Write another message</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="grid gap-7" aria-describedby="form-note">
                <div className="grid gap-7 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="meta text-[var(--muted)]">Name *</span>
                    <input name="name" autoComplete="name" className={field} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'err-name' : undefined} />
                    {errors.name && <span id="err-name" className="text-sm text-[#c0563d]">{errors.name}</span>}
                  </label>
                  <label className="grid gap-1">
                    <span className="meta text-[var(--muted)]">Email *</span>
                    <input name="email" type="email" autoComplete="email" className={field} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'err-email' : undefined} />
                    {errors.email && <span id="err-email" className="text-sm text-[#c0563d]">{errors.email}</span>}
                  </label>
                  <label className="grid gap-1">
                    <span className="meta text-[var(--muted)]">Phone</span>
                    <input name="phone" type="tel" autoComplete="tel" className={field} />
                  </label>
                  <label className="grid gap-1">
                    <span className="meta text-[var(--muted)]">City</span>
                    <input name="location" autoComplete="address-level2" className={field} />
                  </label>
                </div>
                <fieldset>
                  <legend className="meta text-[var(--muted)]">Project</legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['Kitchen', 'Wardrobes', 'Full residence', 'Other'].map((t, i) => (
                      <label key={t} className="cursor-pointer">
                        <input type="radio" name="type" value={t} defaultChecked={i === 0} className="peer sr-only" />
                        <span className="chip transition-colors duration-300 peer-checked:!border-[var(--ink)] peer-checked:bg-[var(--ink)] peer-checked:!text-[var(--bg)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--accent)]">{t}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="grid gap-1">
                  <span className="meta text-[var(--muted)]">About the space *</span>
                  <textarea name="message" rows={4} className={`${field} resize-none`} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'err-message' : undefined} />
                  {errors.message && <span id="err-message" className="text-sm text-[#c0563d]">{errors.message}</span>}
                </label>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p id="form-note" className="meta max-w-[34ch] text-[var(--muted)]">Opens your email app with the message ready. Nothing is stored on this site.</p>
                  <button type="submit" className="btn btn-solid" data-magnetic>Compose inquiry <Arrow /></button>
                </div>
                {state === 'error' && <p className="sr-only" role="alert">Please fix the highlighted fields.</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Footer ───────────────────────────────────────────────── */
export function Footer() {
  return (
    <footer className="relative border-t border-[var(--line)] bg-[var(--bg-2)]">
      <div className="wrap grid grid-cols-1 items-center gap-6 py-10 md:grid-cols-3">
        <div className="flex items-center gap-4">
          <Monogram size={36} />
          <span className="meta">© {new Date().getFullYear()} {site.name}</span>
        </div>
        <p className="meta text-[var(--muted)] md:text-center">Project imagery shown with client details removed.</p>
        <button type="button" onClick={() => scrollToTarget(0)} className="meta ulink justify-self-start pb-1 md:justify-self-end" data-magnetic>
          Back to top ↑
        </button>
      </div>
    </footer>
  )
}
