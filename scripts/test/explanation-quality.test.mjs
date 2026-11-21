/**
 * An explanation has to support the answer that is keyed, and teach the step
 * that is actually hard.
 *
 * The first is the floor: an explanation that never states the answer, or
 * states a different one, is worse than none — it tells a candidate who got it
 * right that they were wrong. The second is what this sprint found missing: 73
 * of the 125 Latin Squares chains use a pair-elimination step, and every one of
 * them used to render it as a bare "R5C2 must be D", discarding the only part
 * of the deduction worth reading.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { readBank } from '../lib/bank.mjs'

const live = (section) => readBank(section).filter((q) => !q.meta?.quarantined)

test('every Mathematical Equations explanation states the value it keys', () => {
  const bank = live('mathematical-equations')
  assert.ok(bank.length > 100, 'bank did not load')
  for (const q of bank) {
    const keyed = q.options.find((o) => o.id === q.correctOptionId)
    assert.ok(keyed, `${q.id}: correctOptionId matches no option`)
    assert.equal(keyed.value, q.solution[q.asked], `${q.id}: keyed value disagrees with the solved value`)
    assert.match(
      q.explanation,
      new RegExp(`(^|[^0-9])${keyed.value}([^0-9]|$)`),
      `${q.id}: the explanation never states the answer it keys`,
    )
  }
})

test('every Latin Squares explanation names the letter it keys', () => {
  const bank = live('latin-squares')
  for (const q of bank) {
    const keyed = q.options.find((o) => o.id === q.correctOptionId)
    const last = q.solutionSteps?.at(-1)
    assert.ok(last, `${q.id}: no solution steps`)
    assert.equal(last.letter, keyed.letter, `${q.id}: the chain ends on a different letter than the key`)
    assert.match(q.explanation, new RegExp(`\\b${keyed.letter}\\b`), `${q.id}: explanation never names the answer`)
  }
})

test('a pair-elimination step is explained, never asserted', () => {
  const bank = live('latin-squares')
  const withPair = bank.filter((q) => q.solutionSteps?.some((s) => s.technique === 'pair-elimination'))
  assert.ok(withPair.length > 50, `only ${withPair.length} questions use a pair — re-check this expectation`)

  for (const q of withPair) {
    for (const step of q.solutionSteps.filter((s) => s.technique === 'pair-elimination')) {
      // The solver's own reason must appear. A bare "RxCy must be L" in its
      // place is the defect this gate exists to prevent.
      assert.ok(
        q.explanation.includes(step.reason),
        `${q.id}: a pair-elimination step is asserted without its reasoning`,
      )
    }
  }
})

test('no explanation claims an item requires a pair', () => {
  // CLAUDE.md: pair elimination is a faster search, not a stronger technique.
  // On a two-missing line it is the logical dual of a naked single at the
  // partner cell, so no item can require it. Teach it as a shortcut; never
  // claim necessity.
  const forbidden = /\b(needs?|requires?|must use|only way|cannot be solved)\b[^.]{0,40}\bpair\b/i
  for (const q of live('latin-squares')) {
    assert.ok(!forbidden.test(q.explanation), `${q.id}: explanation claims a pair is required`)
  }
})

test('no live Figure Sequences explanation is a stub', () => {
  for (const q of live('figure-sequences')) {
    assert.ok(q.explanation.length >= 60, `${q.id}: explanation is only ${q.explanation.length} characters`)
  }
})

test('NEGATIVE CONTROL: an explanation that keys a different answer is caught', () => {
  const [q] = live('mathematical-equations')
  const keyed = q.options.find((o) => o.id === q.correctOptionId)
  const tampered = { ...q, explanation: q.explanation.replaceAll(String(keyed.value), '99999') }
  assert.ok(
    !new RegExp(`(^|[^0-9])${keyed.value}([^0-9]|$)`).test(tampered.explanation),
    'the check would not notice an explanation that stopped stating its answer',
  )
})
