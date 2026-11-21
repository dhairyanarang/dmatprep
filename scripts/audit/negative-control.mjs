/**
 * Proof that the audit's detectors work.
 *
 * An audit that reports "no problems" is worthless unless it can be shown to
 * report a problem when there is one. Each case below plants a specific defect
 * in a COPY of a real question and asserts the independent checker finds it.
 * Nothing on disk is touched.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

import { solve } from './me-solver.mjs'
import { solveTarget } from './ls-solver.mjs'
import { deriveContinuation, checkImages } from './fs-checker.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const bank = (section) => {
  const raw = JSON.parse(readFileSync(join(root, 'content/sections', section, 'questions.json'), 'utf8'))
  return Array.isArray(raw) ? raw : raw.questions
}
const clone = (x) => JSON.parse(JSON.stringify(x))

const results = []
const check = (name, fn) => {
  try {
    fn()
    results.push(`  PASS  ${name}`)
  } catch (error) {
    results.push(`  FAIL  ${name} — ${error.message}`)
    process.exitCode = 1
  }
}

/* ------------------------------------------------------------------- ME */

const me = bank('mathematical-equations').filter((q) => !q.meta?.quarantined)[0]

check('ME: the solver finds the real answer without reading the key', () => {
  const { solutions } = solve(me)
  assert.equal(solutions.length, 1)
  const stored = me.options.find((o) => o.id === me.correctOptionId).value
  assert.equal(solutions[0][me.asked], stored)
})

check('ME: a flipped key is caught', () => {
  const q = clone(me)
  const other = q.options.find((o) => o.id !== q.correctOptionId)
  q.correctOptionId = other.id
  const derived = solve(q).solutions[0][q.asked]
  const stored = q.options.find((o) => o.id === q.correctOptionId).value
  assert.notEqual(derived, stored, 'the flipped key was not distinguishable')
})

check('ME: an unsatisfiable system is caught', () => {
  const q = clone(me)
  q.equations = [...q.equations, `${q.variables[0]} = 999`]
  assert.equal(solve(q).solutions.length, 0)
})

check('ME: an under-determined system is caught', () => {
  const q = clone(me)
  // Drop every equation that mentions the asked letter, so it floats free.
  q.equations = q.equations.filter((e) => !e.includes(q.asked))
  const { askedValues } = solve(q)
  assert.ok(askedValues.length !== 1, `asked letter still pinned to ${askedValues}`)
})

/* ------------------------------------------------------------------- LS */

const ls = bank('latin-squares').filter((q) => !q.meta?.quarantined)[0]

check('LS: the solver finds the real letter without reading the key', () => {
  const result = solveTarget(ls)
  assert.deepEqual(result.possible, [ls.options.find((o) => o.id === ls.correctOptionId).letter])
})

check('LS: emptying the grid makes the target ambiguous', () => {
  const q = clone(ls)
  q.grid = q.grid.map((row) => row.map(() => null))
  assert.ok(solveTarget(q).possible.length > 1, 'an empty grid was still called unique')
})

check('LS: a contradictory given is caught', () => {
  const q = clone(ls)
  // Force the same letter twice into one row.
  q.grid[0][0] = 'A'
  q.grid[0][1] = 'A'
  assert.ok(solveTarget(q).error, 'a duplicated letter in a row was not reported')
})

/* ------------------------------------------------------------------- FS */

const fsq = bank('figure-sequences').filter((q) => !q.meta?.quarantined)[0]

check('FS: the derivation finds the real option without reading the key', () => {
  const derived = deriveContinuation(fsq)
  assert.ok(!derived.error && !derived.ambiguous)
  for (const image of checkImages(fsq, derived)) {
    assert.deepEqual(image.matches, [image.stored])
  }
})

check('FS: a flipped key is caught', () => {
  const q = clone(fsq)
  const image = q.images[0]
  image.correctOptionId = image.options.find((o) => o.id !== image.correctOptionId).id
  const derived = deriveContinuation(q)
  const checked = checkImages(q, derived).find((c) => c.label === image.label)
  assert.notEqual(checked.matches[0], checked.stored, 'the flipped key was not distinguishable')
})

check('FS: a corrupted fourth matrix stops the rule being derivable', () => {
  const q = clone(fsq)
  const symbol = q.given[3].symbols[0]
  // Move it somewhere no consistent rule reaches.
  symbol.cell = { row: (symbol.cell.row + 2) % 4, col: (symbol.cell.col + 1) % 4 }
  const derived = deriveContinuation(q)
  const broken =
    Boolean(derived.error) ||
    Boolean(derived.ambiguous) ||
    checkImages(q, derived).some((c) => c.matches.length !== 1 || c.matches[0] !== c.stored)
  assert.ok(broken, 'a corrupted sequence still produced the stored answer')
})

check('FS: duplicate options are caught', () => {
  const q = clone(fsq)
  const image = q.images[0]
  image.options[1].panel = clone(image.options[0].panel)
  const derived = deriveContinuation(q)
  const checked = checkImages(q, derived).find((c) => c.label === image.label)
  assert.ok(checked.duplicates.length > 0, 'two identical options were not reported')
})

console.log(results.join('\n'))
console.log(
  process.exitCode ? '\n  NEGATIVE CONTROLS FAILED\n' : `\n  ${results.length} negative controls passed\n`,
)
