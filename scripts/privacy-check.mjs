// Fails the build if any client-identifying term from the private blocklist appears in dist/.
// Scans every text asset (html, js, css, json, svg, txt) and every file name.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = join(root, 'private', 'projects.json')
const dist = join(root, 'dist')

if (!existsSync(manifest)) {
  console.log('privacy-check: private/projects.json not present — skipped (build machine without sources).')
  process.exit(0)
}
if (!existsSync(dist)) {
  console.error('privacy-check: dist/ missing — run vite build first.')
  process.exit(1)
}

const cfg = JSON.parse(readFileSync(manifest, 'utf8'))
const terms = cfg.blocklist.map((t) => t.toLowerCase())
// Exact phrases the owner approved for the public Clientele list. They are removed before
// scanning, so the same terms anywhere else (project data, file names) still fail the build.
const allow = (cfg.publicAllow ?? []).map((t) => t.toLowerCase())
const strip = (s) => allow.reduce((acc, a) => acc.split(a).join(' '), s)
const textExt = /\.(html|js|mjs|css|json|svg|txt|xml|map)$/i
const hits = []

const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { walk(p); continue }
    const rel = relative(dist, p)
    for (const t of terms) if (rel.toLowerCase().includes(t)) hits.push(`${rel}  (file name contains "${t}")`)
    if (!textExt.test(name)) continue
    const body = strip(readFileSync(p, 'utf8').toLowerCase())
    for (const t of terms) if (body.includes(t)) hits.push(`${rel}  (contains "${t}")`)
  }
}
walk(dist)

if (hits.length) {
  console.error('privacy-check FAILED — client-identifying text found in build output:')
  for (const h of hits) console.error('  - ' + h)
  process.exit(1)
}
console.log(`privacy-check passed: ${terms.length} blocklisted terms, 0 hits in dist/.`)
