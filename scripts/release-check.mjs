#!/usr/bin/env node
/**
 * The release-candidate audit.
 *
 *   npm run release:check
 *
 * Six questions, asked of the production build rather than of the source, each
 * answered by measurement. It does not decide whether to release — it reports
 * what is true, and says plainly that a green run is not a clearance.
 *
 * Run `npm run build` first: this reads `.next/server/app`.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const BUILD = join(root, '.next/server/app')
const read = (p) => readFileSync(join(root, p), 'utf8')

if (!existsSync(BUILD)) {
  console.error('✗ no production build. Run `npm run build` first — this audits the build, not the source.')
  process.exit(1)
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return name === 'cache' ? [] : walk(full)
    return /\.(html|rsc)$/.test(full) ? [full] : []
  })

const payloads = walk(BUILD)
const allText = payloads.map((f) => readFileSync(f, 'utf8')).join('\n')

const findings = []
const check = (name, ok, detail) => {
  findings.push({ name, ok, detail })
  const mark = ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'
  console.log(`${mark} ${name}`)
  console.log(`    ${detail}`)
}

/* 1 — quarantined and retired content cannot reach a candidate */
{
  const SECTIONS = ['figure-sequences', 'mathematical-equations', 'latin-squares']
  let quarantined = 0
  let leakedIds = []
  let leakedProse = []
  let retiredLeaks = []

  for (const section of SECTIONS) {
    const bank = JSON.parse(read(`content/sections/${section}/questions.json`))
    const solutions = JSON.parse(read(`public/solutions/${section}.json`))
    for (const q of bank.filter((x) => x.meta?.quarantined)) {
      quarantined++
      if (allText.includes(q.id)) leakedIds.push(q.id)
      if (q.explanation && allText.includes(q.explanation)) leakedProse.push(q.id)
      if (solutions[q.id]) leakedProse.push(`${q.id} (solution published)`)
    }
    let retired = []
    try {
      retired = JSON.parse(read(`content/sections/${section}/retired.json`))
    } catch {
      /* a section may have none */
    }
    for (const entry of retired) {
      const q = entry.question ?? entry
      if (q?.explanation && q.explanation.length > 80 && allText.includes(q.explanation)) {
        retiredLeaks.push(entry.id ?? q.id)
      }
    }
  }

  check(
    'No quarantined or retired question can enter an active set',
    leakedIds.length === 0 && leakedProse.length === 0 && retiredLeaks.length === 0,
    `${quarantined} quarantined questions: 0 ids, 0 explanations and 0 published solutions in the build. ` +
      `Retired content: ${retiredLeaks.length} found.` +
      (leakedIds.length ? ` LEAKED IDS: ${leakedIds.join(', ')}` : ''),
  )
}

/* 2 — no unapproved draft reaches the build */
{
  const draftDirs = readdirSync(join(root, 'drafts')).filter((d) =>
    statSync(join(root, 'drafts', d)).isDirectory(),
  )
  const ids = []
  for (const dir of draftDirs) {
    const file = join(root, 'drafts', dir, '_selected.json')
    if (!existsSync(file)) continue
    for (const q of JSON.parse(readFileSync(file, 'utf8'))) ids.push(q.id)
  }
  const leaked = ids.filter((id) => allText.includes(id))
  check(
    'No unapproved draft reaches the production build',
    leaked.length === 0,
    `${draftDirs.length} draft folders, ${ids.length} draft question ids — ${leaked.length} in the build.` +
      (leaked.length ? ` LEAKED: ${leaked.join(', ')}` : ''),
  )
}

/* 3 — answers are delivered after the question, not with it */
{
  const KEYS = ['correctOptionId', 'explanation', 'distractorNotes', 'walkthrough', 'solutionSteps', 'rules', 'solution']
  const count = (text) =>
    KEYS.reduce((n, k) => n + (text.split(`"${k}\\"`).length - 1) + (text.split(`"${k}":`).length - 1), 0)

  // Only routes where a candidate ANSWERS. A section overview is a guide, and
  // its worked examples show their answers because that is what a worked
  // example is — counting those as a leak would be wrong.
  // Core only. Module B is a separate, labelled pilot and is explicitly not
  // split, so folding it in here would hide the Core result behind it.
  const practice = payloads.filter(
    (f) => !f.includes('/module-b/') && (/\/practice[./]/.test(f) || /module-a\/[^/]+\/practice/.test(f)),
  )
  const worst = practice
    .map((f) => ({ route: f.slice(BUILD.length), n: count(readFileSync(f, 'utf8')) }))
    .sort((a, b) => b.n - a.n)[0]

  const overviews = payloads
    .filter((f) => /module-a\/[^/]+\/overview\.html$/.test(f))
    .reduce((n, f) => n + count(readFileSync(f, 'utf8')), 0)

  let peak = { n: 0, route: '' }
  for (const f of payloads) {
    const n = count(readFileSync(f, 'utf8'))
    if (n > peak.n) peak = { n, route: f.slice(BUILD.length) }
  }

  check(
    'Answers are not shipped with the question on any Core practice route',
    (worst?.n ?? 0) === 0,
    `${practice.length} Core practice payloads, worst carries ${worst?.n ?? 0}. ` +
      `Section overviews carry ${overviews} between them, which is their worked examples and is intended. ` +
      `Build-wide peak ${peak.n} at ${peak.route} — Module B, not split.`,
  )
}

/* 4 — separation is never mistaken for protection */
{
  // The claim that matters is written down in three places. If any of them
  // loses it, someone will later treat a static asset as a paywall.
  const sources = {
    'docs/CONTENT_EXPOSURE.md': read('docs/CONTENT_EXPOSURE.md'),
    'scripts/build-solutions.mjs': read('scripts/build-solutions.mjs'),
    'lib/content/registry.ts': read('lib/content/registry.ts'),
  }
  const missing = Object.entries(sources)
    .filter(([, text]) => !/hygiene[ ,]+(?:rather than|and not|not)\s+(?:security|protection)/i.test(text))
    .map(([f]) => f)

  const publicAssets = readdirSync(join(root, 'public/solutions'))
  check(
    'Separated files are not treated as protected content',
    missing.length === 0,
    `public/solutions holds ${publicAssets.length} openly fetchable assets. The caveat that this is ` +
      `hygiene and not protection is stated in ${Object.keys(sources).length - missing.length} of ` +
      `${Object.keys(sources).length} places.` + (missing.length ? ` MISSING FROM: ${missing.join(', ')}` : ''),
  )
}

/* 5 — candidate-facing exam facts trace to an official source */
{
  const claims = read('content/exam/claims.ts')
  const sources = read('content/exam/sources.ts')
  const cited = [...claims.matchAll(/id:\s*([A-Z_]+)/g)].map((m) => m[1])
  const aliases = Object.fromEntries(
    [...claims.matchAll(/const ([A-Z_]+) = '([a-z-]+)' as const/g)].map((m) => [m[1], m[2]]),
  )
  const unknown = [...new Set(cited)].filter((c) => !aliases[c] || !sources.includes(`'${aliases[c]}'`))
  // Strip comments first: key-dates.ts explains the bug where the app counted
  // down to a sitting that had passed, and that explanation names the date.
  const keyDates = read('content/exam/key-dates.ts')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
  const stale = /'2026-09-\d\d'|26 September 2026|15 September 2026/.test(keyDates)
  check(
    'Candidate-facing exam facts trace to an official source',
    unknown.length === 0 && !stale,
    `${new Set(cited).size} distinct source ids cited, all resolving to content/exam/sources.ts. ` +
      `Key dates ${stale ? '**STILL CARRY**' : 'carry no'} superseded 2026 sitting.` +
      (unknown.length ? ` UNRESOLVED: ${unknown.join(', ')}` : ''),
  )
}

/* 6 — the disclaimer is on every page and still says what it should */
{
  const html = payloads.filter((f) => f.endsWith('.html'))
  const EXEMPT = new Set(['/_global-error.html'])
  const missing = html
    .map((f) => ({ route: f.slice(BUILD.length), text: readFileSync(f, 'utf8') }))
    .filter((p) => !EXEMPT.has(p.route) && !/not affiliated with, endorsed by, or sponsored by/i.test(p.text))
    .map((p) => p.route)

  // Every point the disclaimer has to make, and the page it has to make it on.
  // Checked against the BUILT html, so a refactor that drops one is caught.
  const home = readFileSync(join(BUILD, 'index.html'), 'utf8')
  const about = existsSync(join(BUILD, 'about.html')) ? readFileSync(join(BUILD, 'about.html'), 'utf8') : ''

  const required = [
    ['independence', /not affiliated with, endorsed by, or sponsored by/i, home],
    ['the name is used only to identify the exam', /used (only|solely) to identify/i, home],
    ['questions are independently developed', /independently developed/i, home],
    ['questions are not official', /not official examination questions/i, home],
    ['the real exam may differ', /may differ in content/i, home],
    ['no outcome is guaranteed', /guarantees no examination result|does not guarantee/i, home],
    ['a fuller statement exists at /about', /not affiliated with, endorsed by, or sponsored by/i, about],
    ['/about says nothing is approved', /has not been signed off by a person/i, about],
  ]
  const absent = required.filter(([, re, text]) => !re.test(text)).map(([name]) => name)

  check(
    'The independence disclaimer is on every page and makes every point it must',
    missing.length === 0 && absent.length === 0 && about.length > 0,
    `${html.length - EXEMPT.size} prerendered pages carry the affiliation statement; ${EXEMPT.size} exempt ` +
      `(Next's global error boundary replaces the root layout). ` +
      `${required.length - absent.length} of ${required.length} required points present.` +
      (missing.length ? ` MISSING FROM: ${missing.slice(0, 5).join(', ')}` : '') +
      (absent.length ? ` POINTS ABSENT: ${absent.join('; ')}` : ''),
  )
}

/* ------------------------------------------------------------------ verdict */

const failed = findings.filter((f) => !f.ok)
console.log()
if (failed.length) {
  console.log(`\x1b[31m✗ ${failed.length} of ${findings.length} release checks failed.\x1b[0m`)
  process.exit(1)
}
console.log(`\x1b[32m✓ all ${findings.length} release checks passed.\x1b[0m`)
console.log('  These are containment checks over the build. They say nothing about whether any')
console.log('  question is correct, and nothing has been signed off by a person.')
