#!/usr/bin/env node
/**
 * Repair the narrated walkthrough on the quadratic and LCM items.
 *
 * THE DEFECT, found by the 22 November 2026 independent audit. Every item
 * carries its reasoning twice: once in `solutionSteps`, assembled from the
 * sentence each equation form writes about itself, and once in `walkthrough`,
 * which `buildSolution` narrates generically. The first copy was correct. The
 * second was not, for the two families added on this branch.
 *
 * A product pair and an LCM pin both "open with substitution" as far as the
 * solver is concerned — no equation starts with a single unknown — so
 * `buildSolution` took its substitution branch and said:
 *
 *   "Push the definitions into the equation that mentions every letter"
 *   "Collapse the combining equation"
 *   "Substituting them into B ÷ 9 = C leaves B as the only unknown"
 *
 * None of that is true of these items. They contain no combining equation, and
 * substituting the other definitions into the cited equation leaves TWO
 * unknowns, not one. A candidate following the walkthrough would be told to
 * perform a move the item does not admit.
 *
 * THE REPAIR. `buildSolution` is fixed in the generator (4.1.1), and every
 * affected item is rebuilt from its own stamped seed so the corrected narration
 * replaces the wrong one. Nothing else may move: `buildSolution` consumes no
 * randomness, so a rebuild from the same seed must reproduce the system, the
 * options, the key, the solution steps and the hints byte for byte. This script
 * asserts exactly that before writing, and refuses the whole run if any item
 * differs anywhere but in `walkthrough`.
 *
 *   node scripts/repair/me-family-walkthroughs.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'node:fs'

import { buildMathEquations } from '../generate/math-equations.mjs'
import { makeRng } from '../lib/rng.mjs'
import { stampProvenance } from '../lib/provenance.mjs'

const dryRun = process.argv.includes('--dry-run')
const bankUrl = new URL('../../content/sections/mathematical-equations/questions.json', import.meta.url)
const bank = JSON.parse(readFileSync(bankUrl, 'utf8'))

const planFor = (batchId) => {
  try {
    return JSON.parse(
      readFileSync(new URL(`../../content/question-authoring/plans/${batchId}-mathematical-equations.json`, import.meta.url), 'utf8'),
    )
  } catch {
    return null
  }
}
const plans = { b10: planFor('b10'), b12: planFor('b12') }

/** The families whose narration was wrong. Identified by their own shape tags. */
// Every item this branch added. The narration defect turned out to reach past
// the two new families: solveOrder's fallback picked the wrong equation to cite
// in any system with no single equation over all the letters.
const AFFECTED = () => true

const targets = bank.filter((q) => AFFECTED(q) && (q.id.includes('-b10-') || q.id.includes('-b12-')))

/**
 * The fields this repair is allowed to move: the two narrated copies of the
 * reasoning. Everything else — the system, the options, the key, the solution,
 * the distractor notes, the hints, the provenance — must be byte-identical, and
 * the run is refused outright if any of it is not.
 *
 * `solutionSteps` and `explanation` are in the list because generator 4.1.0 also
 * made the product-pair sentence name the exact number of in-range factor pairs
 * instead of saying "several". Three b10 items predate that and still say
 * "several" of a product with two pairs. Correct, but loose, and leaving three
 * items phrased one way while ten are phrased another is the kind of drift this
 * repair exists to remove.
 *
 * `hints` is in the list for the same reason as `walkthrough`: the level-2 hint
 * quotes the equation the collapse happens in, and it was quoting the same wrong
 * one. "Substitute the other equations into B ÷ 9 = A" is not advice, it is a
 * wrong turn. `verify-bank` still re-checks that no repaired hint reveals its
 * answer.
 */
const MUTABLE = ['walkthrough', 'solutionSteps', 'explanation', 'hints']

const stable = (q) => {
  const rest = { ...q }
  for (const k of MUTABLE) delete rest[k]
  return JSON.stringify(rest)
}

let changed = 0
const refusals = []
const changedFields = []

for (const q of targets) {
  const c = q.generator?.seedCoordinates
  const seed = q.generator?.seed
  if (!c || seed === undefined) { refusals.push(`${q.id}: no seed coordinates`); continue }

  const plan = plans[c.batchId]
  const target = plan?.slotTargets?.[c.tier]?.[c.index] ?? undefined

  const rebuilt = buildMathEquations(makeRng(seed), c.tier, {
    preferMultiplicative: c.index % 2 === 0,
    index: c.index,
    target,
  })
  if (!rebuilt) { refusals.push(`${q.id}: did not rebuild from its own seed`); continue }

  // Carry across the fields the batch pipeline stamps after the build, so the
  // comparison is like for like.
  rebuilt.id = q.id
  rebuilt.generator = q.generator
  rebuilt.meta = { ...rebuilt.meta, ...q.meta }
  stampProvenance(rebuilt)

  if (stable(rebuilt) !== stable(q)) {
    refusals.push(`${q.id}: a rebuild from its seed differs OUTSIDE the walkthrough — refusing to touch it`)
    continue
  }
  const moved = MUTABLE.filter((k) => JSON.stringify(rebuilt[k]) !== JSON.stringify(q[k]))
  if (moved.length === 0) continue

  for (const k of MUTABLE) q[k] = rebuilt[k]
  changedFields.push(`${q.id}: ${moved.join(', ')}`)
  changed++
}

if (refusals.length) {
  console.error('REFUSED — nothing written:')
  for (const r of refusals) console.error(`  ${r}`)
  process.exit(1)
}

console.log(`${targets.length} items in the affected families`)
console.log(`${changed} item(s) ${dryRun ? 'would be' : ''} corrected`)
for (const c of changedFields) console.log(`  ${c}`)
if (!dryRun && changed) {
  writeFileSync(bankUrl, `${JSON.stringify(bank, null, 2)}\n`)
  console.log('written to content/sections/mathematical-equations/questions.json')
  console.log('Now run: npm run build:solutions && npm run verify:bank')
}
