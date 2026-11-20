#!/usr/bin/env node
/**
 * Split each question bank into a public half and a solution half.
 *
 * The public half — stems, options, panels, grids, hints — ships with the page.
 * The solution half is written here as a static JSON per section and fetched by
 * the browser, so a candidate who has not answered yet has not been handed the
 * answer in the document they are reading.
 *
 * This is hygiene, not security, and the distinction matters. The files this
 * writes are served from `public/` and are publicly retrievable at a predictable
 * URL. That is the right level for the Core bank, which is free and has been in
 * a public Git repository since August. It is NOT sufficient for anything sold:
 * premium content must never be a static asset, and must be delivered only after
 * server-side entitlement verification. See docs/CONTENT_EXPOSURE.md.
 *
 * Runs before `next build`, so the assets exist when the build copies `public/`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const SECTIONS = ['figure-sequences', 'mathematical-equations', 'latin-squares']

/**
 * The free/premium split, and why it is behind a flag.
 *
 * Every Core question is free today. Moving 234 solutions out of `public/`
 * unconditionally would take explanations away from everyone currently using
 * the product, on the next deploy, with no announcement — the exact silent
 * change the access policy forbids. So:
 *
 *   COMMERCE_ENABLED unset  →  public/ gets EVERY active solution. Today's
 *                              behaviour, byte for byte, zero regression.
 *   COMMERCE_ENABLED=1      →  public/ gets the 150 free solutions only, and
 *                              the rest are served by an entitlement check.
 *
 * The premium file is written either way, so the protected path is real and
 * testable before the flag is ever flipped.
 */
/**
 * The two flags that have to agree, and the build that stops if they do not.
 *
 * `COMMERCE_ENABLED` decides whether this script withholds the premium
 * solutions from `public/`. `NEXT_PUBLIC_COMMERCE_ENABLED` decides whether the
 * app behaves as a paid product. They are separate variables because one is
 * read by Node at build time and the other is inlined into the client bundle,
 * and nothing has ever forced them to match.
 *
 * Setting only the second is the dangerous combination: the interface locks
 * questions, shows a price and takes money, while `public/solutions/*.json`
 * still carries every answer it is charging for, at a public URL, with no
 * authentication in front of it. That is not a degraded paywall — it is no
 * paywall, presented as one.
 *
 * So the build refuses. A release that is half-configured fails loudly here
 * rather than shipping and being discovered by whoever opens the URL first.
 */
const SPLIT_ENV = process.env.COMMERCE_ENABLED === '1'
const APP_ENV = process.env.NEXT_PUBLIC_COMMERCE_ENABLED === '1'

if (SPLIT_ENV !== APP_ENV) {
  console.error(
    '\nCOMMERCE CONFIGURATION MISMATCH — refusing to build.\n\n' +
      `  COMMERCE_ENABLED             = ${process.env.COMMERCE_ENABLED ?? '(unset)'}\n` +
      `  NEXT_PUBLIC_COMMERCE_ENABLED = ${process.env.NEXT_PUBLIC_COMMERCE_ENABLED ?? '(unset)'}\n\n` +
      (APP_ENV
        ? '  The app would sell premium questions while public/solutions kept every\n' +
          '  answer at a public URL. Set COMMERCE_ENABLED=1 as well, or unset both.\n'
        : '  The answers would be withheld from public/ while the app behaved as if\n' +
          '  everything were free, so free practice could not be marked. Set\n' +
          '  NEXT_PUBLIC_COMMERCE_ENABLED=1 as well, or unset both.\n'),
  )
  process.exit(1)
}

const SPLIT = SPLIT_ENV

const freeSet = JSON.parse(
  readFileSync(new URL('../content/access/free-set.json', import.meta.url), 'utf8'),
)

/** Everything that answers the question or teaches the answer. */
const SOLUTION_KEYS = [
  'correctOptionId',
  'explanation',
  'distractorNotes',
  'walkthrough',
  'solutionSteps',
  'solution',
  'rules',
]

const outDir = new URL('../public/solutions/', import.meta.url)
mkdirSync(outDir, { recursive: true })

/**
 * Premium solutions live OUTSIDE public/, deliberately.
 *
 * Imported by `app/api/content/solutions/route.ts`, which is server-only, so
 * they are bundled into the handler and never reach a browser that has not
 * passed an entitlement check. They are committed, exactly as the public half
 * is — the 234 premium questions have been in a public Git repository since
 * August, so this is not secrecy. It is the difference between content that is
 * *served* on request and content that is *served only after a check*, and the
 * next content will not be public.
 */
const premiumDir = new URL('../content/access/premium-solutions/', import.meta.url)
mkdirSync(premiumDir, { recursive: true })

let totalQuestions = 0
let totalBytes = 0
let totalPremium = 0

for (const section of SECTIONS) {
  const bank = JSON.parse(
    readFileSync(new URL(`../content/sections/${section}/questions.json`, import.meta.url), 'utf8'),
  )

  const solutions = {}
  for (const q of bank) {
    // Quarantined questions are never served, so their solutions are never
    // needed. Shipping them would be the leak this whole exercise is about.
    if (q.meta?.quarantined) continue

    const entry = {}
    for (const key of SOLUTION_KEYS) if (key in q) entry[key] = q[key]

    // Figure Sequences carries its key per image rather than on the question.
    if (q.kind === 'figure-sequence') {
      entry.imageAnswers = Object.fromEntries(q.images.map((im) => [im.label, im.correctOptionId]))
    }
    solutions[q.id] = entry
  }

  const free = new Set(freeSet.sections[section] ?? [])
  const publicHalf = {}
  const premiumHalf = {}
  for (const [id, entry] of Object.entries(solutions)) {
    if (free.has(id)) publicHalf[id] = entry
    else premiumHalf[id] = entry
  }

  // When the split is off, public/ carries everything — today's behaviour.
  const served = SPLIT ? publicHalf : solutions
  const json = `${JSON.stringify(served)}\n`
  writeFileSync(new URL(`${section}.json`, outDir), json)

  const premiumJson = `${JSON.stringify(premiumHalf)}\n`
  writeFileSync(new URL(`${section}.json`, premiumDir), premiumJson)

  totalQuestions += Object.keys(served).length
  totalPremium += Object.keys(premiumHalf).length
  totalBytes += json.length
  console.log(
    `${section.padEnd(24)} ${String(Object.keys(served).length).padStart(4)} public · ` +
      `${String(Object.keys(premiumHalf).length).padStart(4)} premium · ${(json.length / 1024).toFixed(0)}KB`,
  )
}

console.log(
  `\nwrote ${totalQuestions} public solutions (${(totalBytes / 1024).toFixed(0)}KB) to public/solutions/\n` +
    `      ${totalPremium} premium solutions to content/access/premium-solutions/ (entitlement-gated)\n` +
    `split: ${SPLIT ? 'ON — public carries the free 150 only' : 'OFF — public carries every active solution'}`,
)
