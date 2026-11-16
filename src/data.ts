import raw from './data/projects.generated.json'

// ── Types ───────────────────────────────────────────────────
export type Tag = 'built' | 'render' | 'drawing' | 'detail'
export interface Img {
  id: string
  tag: Tag
  alt: string
  src: string
  srcset: string
  w: number
  h: number
  placeholder: string
  hidden?: boolean // composites made for one section (e.g. Process); kept out of case-study galleries
}
export interface Room { name: string; note: string; images: string[]; rank?: number }
/** Journal spread (Site journal carousel). x / y / w are % of the whole open spread. */
export interface SpreadPrint { id: string; x: number; y: number; w: number; rotate?: number; caption?: string; tape?: boolean }
export interface SpreadNote { x: number; y: number; w: number; title?: string; body?: string; rotate?: number; style?: 'card' | 'ink' }
export interface Spread { label: string; bg: string; imagePosition?: string; prints?: SpreadPrint[]; notes?: SpreadNote[] }
export interface Project {
  slug: string
  title: string
  location: string
  year: number
  category: 'kitchen' | 'wardrobe'
  status: 'Built' | 'Visualised' | 'In progress'
  ongoing?: boolean
  spreads?: Spread[]
  role: string
  summary: string
  specs: { label: string; value: string }[]
  cover: string
  compare?: { before: string; after: string }
  rooms?: Room[]
  images: Img[]
}

const all = raw as Project[]
/** Finished work: grid, rooms, case studies. */
export const projects = all.filter((p) => !p.ongoing)
/** Work in progress: shown only in the Site journal. */
export const journal = all.filter((p) => p.ongoing)

export const img = (p: Project, id: string): Img => {
  const found = p.images.find((i) => i.id === id)
  if (!found) throw new Error(`image ${id} missing in ${p.slug}`)
  return found
}
export const cover = (p: Project) => img(p, p.cover)
export const bySlug = (slug: string) => projects.find((p) => p.slug === slug)

export const categories = [
  { key: 'all', label: 'All work' },
  { key: 'kitchen', label: 'Kitchens' },
  { key: 'wardrobe', label: 'Wardrobes & rooms' },
] as const
export type CategoryKey = (typeof categories)[number]['key']

// ── Site facts (source: the resume PDF) ─────────────────────
// Only city-level location is published; street/PIN from the resume is left out on purpose.
export const site = {
  name: 'Mehul Saini',
  role: 'Interior Designer',
  base: 'Delhi NCR, India',
  coords: '28.70° N · 77.10° E',
  since: 2019,
  email: 'mehulsaini36@gmail.com',
  phone: '+91 99993 14172',
  phoneHref: 'tel:+919999314172',
  whatsapp: 'https://wa.me/919999314172',
  resume: 'resume/Mehul_Saini_Resume.pdf',
  summary:
    'Interior designer specialising in modular kitchens, wardrobe systems and luxury residential interiors — known for translating a client’s vision into functional, finely detailed rooms, with strict quality standards and on-time delivery.',
  experience: [
    {
      from: 'Jul 2026', to: 'Present', role: 'Product Consultant', company: 'Oppein Delhi',
      points: [
        'Consultative selling of modular kitchen and wardrobe ranges, from first contact to conversion',
        'Hosts in-store tours for prospective clients and builds the pipeline through outreach and referrals',
      ],
    },
    {
      from: 'Oct 2022', to: 'Jun 2026', role: 'Design Head', company: 'Magppie Living Pvt. Ltd',
      points: [
        'Led and mentored the design team, setting creative direction across all projects',
        'Oversaw end-to-end design operations — client brief and concept to final delivery',
        'Defined design standards, workflows and quality benchmarks for the kitchen and wardrobe verticals',
        'Managed key client relationships and escalations to keep service at a premium standard',
      ],
    },
    {
      from: 'Feb 2021', to: 'Oct 2022', role: 'Furniture Designer', company: 'Snaidero by Eucasa',
      points: [
        'Designed and delivered premium Italian kitchens for luxury residential and hospitality projects',
        'Space planning, ergonomics and material selection with clients across Delhi NCR',
        'Managed timelines, client expectations and post-installation support',
      ],
    },
    {
      from: 'May 2019', to: 'Feb 2021', role: 'Interior Designer', company: 'Otex Interiors',
      points: [
        'Kitchen and wardrobe projects from concept to completion',
        'Presented design proposals and led material walkthroughs with clients',
        'Hands-on exposure to design, production, installation and execution',
      ],
    },
  ],
  // Published with the owner's go-ahead (2026-11-17). Text only — never paired with project imagery.
  clients: [
    { who: 'Director', org: 'DLF', home: 'Apartment', where: 'The Camellias, Gurugram' },
    { who: 'Director', org: 'Hero Group', home: 'Apartment', where: 'The Camellias, Gurugram' },
    { who: 'Founder', org: 'Cars24', home: 'Apartment', where: 'The Camellias, Gurugram' },
    { who: 'Director', org: 'Jaquar', home: 'Farmhouse', where: 'Rajokri, New Delhi' },
    { who: 'Architect', org: 'Nikhil Gupta', home: 'Residence', where: 'Noida' },
    { who: 'Owner', org: 'Jindal Supreme India', home: 'Farmhouse', where: 'Chhatarpur, New Delhi' },
    { who: 'Owner', org: 'Dainik Jagran', home: 'Apartment', where: 'The Aralias, Gurugram' },
    { who: 'Directors', org: 'Relaxo Group', home: 'Apartment', where: 'The Camellias, Gurugram' },
    { who: 'Residence', org: 'Gadkari', home: 'House', where: 'Nagpur' },
    { who: 'MD', org: 'JLPL', home: 'Farmhouse', where: 'Mohali' },
  ],
  skills: [
    'Kitchen Design', 'Wardrobe Design', 'Space Planning', 'Project Management', 'Client Relations',
    'Material Sourcing', 'Vendor Management', 'Site Supervision', 'Design Presentations',
  ],
  software: ['AutoCAD', '3ds Max + V-Ray', 'KD Max', 'SketchUp', 'Palette CAD', 'Adobe Photoshop', 'Adobe Premiere Pro', 'Microsoft Office'],
  education: [
    { year: '2019', title: 'Diploma in Interior Design & Architecture' },
    { year: '2021', title: 'Bachelor of Commerce' },
  ],
}

export const asset = (path: string) => import.meta.env.BASE_URL + path
export const srcset = (s: string) =>
  s.split(', ').map((part) => import.meta.env.BASE_URL + part).join(', ')
