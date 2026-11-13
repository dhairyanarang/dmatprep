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

let totalQuestions = 0
let totalBytes = 0

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

  const json = `${JSON.stringify(solutions)}\n`
  writeFileSync(new URL(`${section}.json`, outDir), json)
  totalQuestions += Object.keys(solutions).length
  totalBytes += json.length
  console.log(`${section.padEnd(24)} ${String(Object.keys(solutions).length).padStart(4)} solutions · ${(json.length / 1024).toFixed(0)}KB`)
}

console.log(`\nwrote ${totalQuestions} solutions, ${(totalBytes / 1024).toFixed(0)}KB total, to public/solutions/`)
