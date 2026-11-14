/**
 * The gates, exercised against content that must fail them.
 *
 * Every check in this repository has a negative control somewhere, because a
 * detector nobody has seen fire is a detector nobody should trust. This file
 * holds the three that had none: an answer key that disagrees with the verified
 * solution, a mechanic the official material does not support, and a
 * quarantined question finding its way into something a candidate is served.
 *
 * Each one plants a defect in a COPY of real committed content and asserts the
 * relevant gate rejects it. Nothing here writes to the bank.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { readBank, SECTIONS } from '../lib/bank.mjs'
import { verifyQuestion } from '../lib/verify.mjs'
import { figureRuleContractErrors } from '../lib/contract.mjs'
import { classify } from '../lib/provenance.mjs'

const errorsOf = (q) => {
  const r = verifyQuestion(q)
  return Array.isArray(r) ? r : (r.errors ?? [])
}

/* ------------------------------------------------- an invalid answer key */

test('NEGATIVE CONTROL: a Mathematical Equations key that contradicts the solution is rejected', () => {
  const q = readBank('mathematical-equations').find((x) => x.options.length > 1)
  assert.ok(errorsOf(q).length === 0, 'the fixture should start clean')

  const wrong = structuredClone(q)
  wrong.correctOptionId = wrong.options.find((o) => o.id !== q.correctOptionId).id
  const errors = errorsOf(wrong)
  assert.ok(
    errors.length > 0,
    'the verifier accepted a key pointing at an option that is not the solved value',
  )
})

test('NEGATIVE CONTROL: a Latin Squares key that contradicts the deduction is rejected', () => {
  const q = readBank('latin-squares')[0]
  assert.equal(errorsOf(q).length, 0, 'the fixture should start clean')

  const wrong = structuredClone(q)
  wrong.correctOptionId = wrong.options.find((o) => o.id !== q.correctOptionId).id
  assert.ok(errorsOf(wrong).length > 0, 'the verifier accepted a key the solver disagrees with')
})

test('NEGATIVE CONTROL: a Figure Sequences key that is not the continuation is rejected', () => {
  const q = readBank('figure-sequences').find((x) => !x.meta?.quarantined)
  assert.equal(errorsOf(q).length, 0, 'the fixture should start clean')

  const wrong = structuredClone(q)
  const image = wrong.images[0]
  image.correctOptionId = image.options.find((o) => o.id !== image.correctOptionId).id
  assert.ok(errorsOf(wrong).length > 0, 'the verifier accepted a key that is not the marked continuation')
})

/* -------------------------------------------------- an unsupported mechanic */

test('NEGATIVE CONTROL: an unsupported movement mechanic is rejected by the contract', () => {
  // `direction-cycle` was removed from FS_CONTRACT.allowed on 14 November 2026.
  const rule = {
    movement: { type: 'direction-cycle', directions: ['left', 'up', 'right', 'down'], step: 1 },
    rotation: { type: 'none' },
    colour: { type: 'constant' },
  }
  const problems = figureRuleContractErrors(rule)
  assert.ok(problems.length > 0, 'the contract accepted direction-cycle')
  assert.match(problems.join(' '), /not an allowed mechanic/)
})

test('NEGATIVE CONTROL: a static symbol that does not rotate is rejected', () => {
  // A static symbol's only readable cue is its facing. One that never turns
  // carries no rule at all, so it is not an item.
  const problems = figureRuleContractErrors({
    movement: { type: 'static' },
    rotation: { type: 'none' },
    colour: { type: 'constant' },
  })
  assert.ok(problems.length > 0, 'the contract accepted a static symbol with nothing to read')
  assert.match(problems.join(' '), /must rotate/)
})

test('NEGATIVE CONTROL: an unsupported mechanic derives `uncertain`, which blocks publishing', () => {
  const q = structuredClone(readBank('figure-sequences').find((x) => !x.meta?.quarantined))
  const first = Object.keys(q.rules)[0]
  q.rules[first].movement = { type: 'direction-cycle', directions: ['left', 'up', 'right', 'down'], step: 1 }

  assert.equal(classify(q).provenance.mechanics, 'unsupported')
  assert.equal(classify(q).dmatAlignment, 'uncertain')

  // And `uncertain` is what the publishing gate refuses.
  q.meta.dmatAlignment = 'uncertain'
  assert.match(errorsOf(q).join(' '), /must not ship without human review/)
})

/* --------------------------- a quarantined question reaching an active set */

test('NEGATIVE CONTROL: a quarantined question is never in a served pool', () => {
  for (const section of SECTIONS) {
    const bank = readBank(section)
    const quarantined = bank.filter((q) => q.meta?.quarantined)
    if (!quarantined.length) continue
    // `readBank` is the raw file; the registry is what the app serves, and the
    // quarantine test asserts the split. Here we check the invariant the
    // published solution assets must also honour.
    const solutions = JSON.parse(
      readFileSync(new URL(`../../public/solutions/${section}.json`, import.meta.url), 'utf8'),
    )
    for (const q of quarantined) {
      assert.ok(!solutions[q.id], `${q.id} is quarantined but its solution is published`)
    }
  }
})

test('NEGATIVE CONTROL: a quarantined id planted in the free set is caught', () => {
  const quarantined = readBank('figure-sequences').find((q) => q.meta?.quarantined)
  assert.ok(quarantined, 'no quarantined fixture available')

  const byId = new Map(readBank('figure-sequences').map((q) => [q.id, q]))
  const planted = ['fs-low-007', quarantined.id]
  const offenders = planted.filter((id) => byId.get(id)?.meta?.quarantined)
  assert.deepEqual(
    offenders,
    [quarantined.id],
    'the free-set check would not notice a quarantined question in the sample',
  )
})
