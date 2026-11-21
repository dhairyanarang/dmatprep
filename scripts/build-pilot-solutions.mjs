#!/usr/bin/env node
/**
 * Generate the PILOT free-solutions set.
 *
 * The committed `public/solutions/*.json` carry every active solution. A
 * production build does not serve them as committed: `prebuild` runs
 * `scripts/build-solutions.mjs`, which rewrites them down to the free 150
 * whenever COMMERCE_ENABLED=1. The pilot runs `next dev`, which never runs
 * `prebuild`, so locally those files still hold all 384 — and testing the
 * entitlement gate needs the opposite, a public set holding only the free 150,
 * so that an unentitled user genuinely cannot retrieve a premium answer.
 *
 * Rather than rewrite the committed files and rely on remembering to restore
 * them, this writes a parallel set to `.pilot/`, which is git-ignored. The
 * production content is never opened for writing.
 *
 *   node scripts/build-pilot-solutions.mjs
 *
 * `next.config.ts` rewrites `/solutions/:section` to a route handler that serves
 * these files, but ONLY when PILOT_SOLUTIONS=1, which `scripts/dev-pilot.mjs`
 * sets and nothing else does.
 *
 * That gate used to be COMMERCE_ENABLED, and this comment used to end "in
 * production there is no rewrite". It stopped being true the moment commerce was
 * switched on in production: the rewrite followed it there, pointed at this
 * git-ignored directory, and took every practice screen down for free and paid
 * users alike.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const SECTIONS = ['figure-sequences', 'mathematical-equations', 'latin-squares']

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'))

const freeSet = read('content/access/free-set.json')
const outDir = new URL('../.pilot/solutions/', import.meta.url)
mkdirSync(outDir, { recursive: true })

let free = 0
let withheld = 0

for (const section of SECTIONS) {
  // Read the committed public half and keep only what the free list names.
  // Derived from the same file the commercial model is measured against, so
  // the pilot cannot drift from the real free selection.
  const published = read(`public/solutions/${section}.json`)
  const ids = new Set(freeSet.sections[section] ?? [])

  const freeOnly = {}
  for (const [id, entry] of Object.entries(published)) {
    if (ids.has(id)) freeOnly[id] = entry
    else withheld += 1
  }

  for (const id of ids) {
    if (!freeOnly[id]) {
      throw new Error(`free question ${id} has no solution in public/solutions/${section}.json`)
    }
  }

  writeFileSync(new URL(`${section}.json`, outDir), `${JSON.stringify(freeOnly)}\n`)
  free += Object.keys(freeOnly).length
  console.log(`${section.padEnd(24)} ${String(Object.keys(freeOnly).length).padStart(3)} free served`)
}

console.log(`\nwrote ${free} free solutions to .pilot/solutions/ (git-ignored)`)
console.log(`${withheld} premium solutions withheld — served only by /api/content/solutions,`)
console.log('which checks the signed-in user’s entitlement on every request.')
console.log('\npublic/solutions/ was read, never written.')
