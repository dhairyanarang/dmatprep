#!/usr/bin/env node
/**
 * Regenerate all three question banks.
 *
 * Seeded, so the same seed reproduces the same bank byte for byte — a
 * regenerated file diffs cleanly and reviewed items stay reviewed. Bump the
 * seed only when you actually want fresh content.
 */
import { writeFileSync } from 'node:fs'

import { generateFigureSequences } from './generate/figure-sequences.mjs'
import { generateLatinSquares } from './generate/latin-squares.mjs'
import { generateMathEquations } from './generate/math-equations.mjs'
import { makeRng } from './lib/rng.mjs'

const SEED = 20260926

// Per-section quotas. Figure Sequences is weighted towards medium because that
// is the widest band in the official material — Exercises 3 and 4 carry more
// distinct mechanics than the low pair — and because the low tier only supports
// a handful of genuinely different shapes.
const banks = [
  {
    section: 'figure-sequences',
    generate: generateFigureSequences,
    quotas: { low: 12, medium: 18, high: 15 },
  },
  {
    section: 'mathematical-equations',
    generate: generateMathEquations,
    quotas: { low: 15, medium: 15, high: 15 },
  },
  {
    section: 'latin-squares',
    generate: generateLatinSquares,
    quotas: { low: 15, medium: 15, high: 15 },
  },
]

for (const { section, generate, quotas } of banks) {
  // A fresh stream per section, so changing one bank never reshuffles another.
  const rng = makeRng(SEED)
  const questions = generate(rng, quotas)
  const path = new URL(`../content/sections/${section}/questions.json`, import.meta.url)
  writeFileSync(path, `${JSON.stringify(questions, null, 2)}\n`)
  console.log(`${section}: wrote ${questions.length} questions`)
}

console.log('\nNow run: npm run verify:bank')
