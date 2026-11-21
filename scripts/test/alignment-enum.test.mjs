/**
 * `dmatAlignment` says how a question's mechanics trace to the official
 * material, and the four values are not interchangeable.
 *
 *   officially_documented   the material says it
 *   reasonable_extrapolation  the material supports the reading
 *   dmat_prep_calibration   we chose it; the material does not settle it
 *   uncertain               nobody has decided — blocks release
 *
 * The distinction that matters here is between the last two. Calibration is an
 * honest declaration and may ship. `uncertain` is an open question and may not.
 * Collapsing them would let undecided material through under a label that
 * sounds deliberate.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { verifyQuestion } from '../lib/verify.mjs'
import { readBank, SECTIONS } from '../lib/bank.mjs'

/** A minimal well-formed item, so only the alignment value is under test. */
const base = () => ({
  id: 'probe-001',
  kind: 'math-equations',
  section: 'mathematical-equations',
  difficulty: 'low',
  equations: ['A + 3 = B', 'A = 4'],
  variables: ['A', 'B'],
  asked: 'B',
  options: [
    { id: 'opt-7', value: 7 },
    { id: 'opt-4', value: 4 },
    { id: 'opt-3', value: 3 },
    { id: 'opt-1', value: 1 },
  ],
  correctOptionId: 'opt-7',
  solution: { A: 4, B: 7 },
  explanation: 'A = 4 is given outright, and A + 3 = B turns that into B = 7.',
  distractorNotes: {
    'opt-4': 'This is 4, the value of A. A + 3 = B asks for three more than that.',
    'opt-3': 'This is 3, the constant in A + 3 = B, not the value of B.',
    'opt-1': 'This is 1, which no equation here produces.',
  },
  meta: { patternType: ['probe'], skill: 'probe', dmatAlignment: 'officially_documented' },
})

const alignmentErrors = (value) => {
  const q = base()
  q.meta.dmatAlignment = value
  return verifyQuestion(q).errors.filter((e) => /dmatAlignment|uncertain/.test(e))
}

test('dmat_prep_calibration is accepted', () => {
  assert.deepEqual(alignmentErrors('dmat_prep_calibration'), [])
})

test('the three previously valid values still pass', () => {
  assert.deepEqual(alignmentErrors('officially_documented'), [])
  assert.deepEqual(alignmentErrors('reasonable_extrapolation'), [])
})

test('uncertain still blocks release, and calibration must not be a way around it', () => {
  const blocked = alignmentErrors('uncertain')
  assert.ok(blocked.length > 0, 'an uncertain item must not pass')
  assert.ok(blocked.some((e) => /human review/.test(e)))
})

test('an unknown alignment value is still rejected', () => {
  const errs = alignmentErrors('made_up_value')
  assert.ok(errs.some((e) => /unknown dmatAlignment/.test(e)))
})

test('no committed question was relabelled by adding the value', () => {
  // The new value exists for material authored from here on. Nothing in the
  // bank moves to it without a deliberate, reviewed commit.
  for (const section of SECTIONS) {
    for (const q of readBank(section)) {
      assert.notEqual(
        q.meta?.dmatAlignment,
        'dmat_prep_calibration',
        `${q.id} was relabelled — that is a content decision, not a schema one`,
      )
    }
  }
})

test('the TypeScript union and the validator allow-list agree', () => {
  const types = readFileSync(new URL('../../lib/types/question.ts', import.meta.url), 'utf8')
  const verify = readFileSync(new URL('../lib/verify.mjs', import.meta.url), 'utf8')
  for (const value of [
    'officially_documented',
    'reasonable_extrapolation',
    'dmat_prep_calibration',
    'uncertain',
  ]) {
    assert.ok(types.includes(`'${value}'`), `${value} missing from the DmatAlignment union`)
    assert.ok(verify.includes(`'${value}'`), `${value} missing from the validator allow-list`)
  }
})
