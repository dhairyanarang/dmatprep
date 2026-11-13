/**
 * The difficulty rubric, checked against real items and against the shapes it
 * exists to recognise in material we have not written yet.
 *
 * Two properties matter more than any individual threshold. The rubric must
 * measure the question rather than read its label — otherwise it is a mirror
 * and can never disagree. And it must recognise nonlinear relations, which the
 * committed bank contains none of: a detector with no positive case in the
 * bank is a detector nobody has ever seen fire.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { calibrate, calibrateMathEquations } from '../lib/calibrate.mjs'
import { readBank } from '../lib/bank.mjs'

const pick = (section, id) => {
  const q = readBank(section).find((x) => x.id === id)
  assert.ok(q, `${id} is not in the bank — update this fixture rather than deleting the test`)
  return q
}

/* ------------------------------------------------------- it measures, not reads */

test('the stored difficulty label does not influence the measurement', () => {
  for (const [section, id] of [
    ['figure-sequences', 'fs-low-002'],
    ['mathematical-equations', 'me-high-001'],
    ['latin-squares', 'ls-high-001'],
  ]) {
    const q = pick(section, id)
    const asIs = calibrate(q)
    for (const label of ['low', 'medium', 'high']) {
      const relabelled = calibrate({ ...structuredClone(q), difficulty: label })
      assert.deepEqual(
        relabelled.suggested,
        asIs.suggested,
        `${id}: the measurement moved when the label moved`,
      )
      assert.deepEqual(relabelled.measures, asIs.measures)
    }
  }
})

test('calibrating does not mutate the question', () => {
  const q = pick('mathematical-equations', 'me-high-001')
  const before = JSON.stringify(q)
  calibrate(q)
  assert.equal(JSON.stringify(q), before)
})

/* ------------------------------------------------------------ representative items */

test('a single symbol carrying one or two rules measures low', () => {
  const r = calibrate(pick('figure-sequences', 'fs-low-002'))
  assert.equal(r.measures.symbols, 1)
  assert.equal(r.suggested, 'low')
})

test('three symbols carrying eight rules measures high', () => {
  const r = calibrate(pick('figure-sequences', 'fs-high-b5-003'))
  assert.equal(r.measures.symbols, 3)
  assert.equal(r.measures.activeRules, 8)
  assert.equal(r.measures.peakLoad, 3)
  assert.equal(r.suggested, 'high')
})

test('a two-letter chain resolved in one step measures low', () => {
  const r = calibrate(pick('mathematical-equations', 'me-low-005'))
  assert.equal(r.measures.variables, 2)
  assert.equal(r.measures.substitutionSteps, 1)
  assert.equal(r.suggested, 'low')
})

test('a four-letter system that substitution cannot crack measures high', () => {
  const r = calibrate(pick('mathematical-equations', 'me-high-001'))
  assert.equal(r.measures.requiresElimination, true)
  assert.equal(r.measures.substitutionSteps, null)
  assert.equal(r.measures.effectiveSteps, 3)
  assert.equal(r.suggested, 'high')
})

test('a sparse grid needing a deep chain measures high', () => {
  const r = calibrate(pick('latin-squares', 'ls-high-001'))
  assert.equal(r.measures.givens, 6)
  assert.equal(r.measures.forcedPlacementDepth, 7)
  assert.equal(r.suggested, 'high')
})

test('a dense grid settled in two placements measures low', () => {
  const r = calibrate(pick('latin-squares', 'ls-low-001'))
  assert.ok(r.measures.givens >= 10)
  assert.equal(r.suggested, 'low')
})

/* ------------------------------------- shapes the bank does not contain yet */

test('a variable product is recognised as nonlinear', () => {
  const r = calibrateMathEquations({
    variables: ['A', 'B', 'C'],
    asked: 'C',
    equations: ['A × B = C', 'A + B = 9', 'A − B = 3'],
    solution: { A: 6, B: 3, C: 18 },
  })
  assert.equal(r.measures.variableProduct, true)
  assert.equal(r.measures.nonlinear, true)
  assert.equal(r.suggested, 'high')
})

test('a variable multiplied by itself is recognised as quadratic', () => {
  const r = calibrateMathEquations({
    variables: ['A', 'B'],
    asked: 'B',
    equations: ['A × A = B', 'A + 2 = 5'],
    solution: { A: 3, B: 9 },
  })
  assert.equal(r.measures.quadratic, true)
  assert.equal(r.suggested, 'high')
})

test('a variable divisor is recognised as nonlinear', () => {
  const r = calibrateMathEquations({
    variables: ['A', 'B', 'C'],
    asked: 'C',
    equations: ['A ÷ B = C', 'A = 12', 'B = 4'],
    solution: { A: 12, B: 4, C: 3 },
  })
  assert.equal(r.measures.variableDivisor, true)
  assert.equal(r.suggested, 'high')
})

test('a constant multiplier is not mistaken for a nonlinear relation', () => {
  const r = calibrateMathEquations({
    variables: ['A', 'B'],
    asked: 'B',
    equations: ['17 × A = B', 'A + 1 = 2'],
    solution: { A: 1, B: 17 },
  })
  assert.equal(r.measures.nonlinear, false)
})

/* ------------------------------------------------------------------------- GAM */

test('a GAM question is measured on steps and blocks, not passage length', () => {
  const long = { packId: 'p', meta: { stepCount: 1, blockSpan: 1 }, dependsOn: ['a'] }
  const deep = { packId: 'p', meta: { stepCount: 3, blockSpan: 3 }, dependsOn: ['a', 'b', 'c'] }
  assert.equal(calibrate(long).suggested, 'low')
  assert.equal(calibrate(deep, { adjudication: { recognitionNotTransfer: false } }).suggested, 'high')
})

test('an item an adjudicator answered without the source carries a warning', () => {
  const r = calibrate(
    { packId: 'p', meta: { stepCount: 3, blockSpan: 2 }, dependsOn: ['a'] },
    { adjudication: { recognitionNotTransfer: false, evidence: { ablationVerdict: 'determinable' } } },
  )
  assert.ok(r.reasons.some((x) => /without the source/.test(x)))
})

test('an unknown question shape is refused rather than guessed at', () => {
  assert.throws(() => calibrate({ id: 'mystery' }), /cannot calibrate/)
})
