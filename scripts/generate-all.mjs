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
const QUOTAS = { low: 14, medium: 13, high: 13 }

const banks = [
  { section: 'figure-sequences', generate: generateFigureSequences },
  { section: 'mathematical-equations', generate: generateMathEquations },
  { section: 'latin-squares', generate: generateLatinSquares },
]

for (const { section, generate } of banks) {
  // A fresh stream per section, so changing one bank never reshuffles another.
  const rng = makeRng(SEED)
  const questions = generate(rng, QUOTAS)
  const path = new URL(`../content/sections/${section}/questions.json`, import.meta.url)
  writeFileSync(path, `${JSON.stringify(questions, null, 2)}\n`)
  console.log(`${section}: wrote ${questions.length} questions`)
}

console.log('\nNow run: npm run verify:bank')
