/**
 * Phase 4: the Figure Sequence disambiguation gate.
 *
 * The gate must answer the question the candidate is actually asked — do these
 * four matrices imply one continuation? — rather than re-confirming that our own
 * stored rule produces our own stored answer.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { generateFigureSequences } from '../generate/figure-sequences.mjs'
import { readBank, readRetired } from '../lib/bank.mjs'
import { disambiguationErrors, invertSymbol, looksBorderLinearAmbiguous } from '../lib/fs-inversion.mjs'
import { simulateStates } from '../lib/figures.mjs'
import { feasibleQuota } from './helpers.mjs'

describe('figure sequence disambiguation', () => {
  test('the items retired for ambiguity are genuinely ambiguous', () => {
    // Other items may be retired for other reasons (fs-low-b2-002 was retired
    // after the Phase 5 pilot for an inaccurate explanation, not ambiguity).
    const audited = readRetired('figure-sequences').filter((e) =>
      ['fs-medium-007', 'fs-high-004'].includes(e.id),
    )
    assert.equal(audited.length, 2, 'expected both audited ambiguity retirements')
    for (const entry of audited) {
      const errors = disambiguationErrors(entry.question.given, entry.question.rules)
      assert.ok(errors.length > 0, `${entry.id} should fail the gate`)
      assert.match(errors.join(' '), /legal movement continuations/)
    }
  })

  test('a symbol running an edge without turning is border/linear ambiguous', () => {
    // Straight up column 1, all four cells on the perimeter — readable as either
    // border travel or a linear mover that has not yet met a wall.
    const observed = [
      { id: 's1', shape: 'square', cell: { row: 3, col: 0 }, rotation: 0, colour: 'black' },
      { id: 's1', shape: 'square', cell: { row: 2, col: 0 }, rotation: 0, colour: 'black' },
      { id: 's1', shape: 'square', cell: { row: 1, col: 0 }, rotation: 0, colour: 'black' },
      { id: 's1', shape: 'square', cell: { row: 0, col: 0 }, rotation: 0, colour: 'black' },
    ]
    assert.ok(looksBorderLinearAmbiguous(observed), 'cheap predicate should flag it')
    assert.ok(invertSymbol(observed).movements.size > 1, 'inversion should find more than one reading')
  })

  test('a symbol that rounds a corner is unambiguous', () => {
    // Border travel that turns at the corner — the turn is what disambiguates.
    const observed = [
      { id: 's1', shape: 'square', cell: { row: 0, col: 2 }, rotation: 0, colour: 'black' },
      { id: 's1', shape: 'square', cell: { row: 0, col: 3 }, rotation: 0, colour: 'black' },
      { id: 's1', shape: 'square', cell: { row: 1, col: 3 }, rotation: 0, colour: 'black' },
      { id: 's1', shape: 'square', cell: { row: 2, col: 3 }, rotation: 0, colour: 'black' },
    ]
    assert.ok(!looksBorderLinearAmbiguous(observed))
    assert.equal(invertSymbol(observed).movements.size, 1)
  })

  test('the gate does not consult the stored rule to break a tie', () => {
    // Same ambiguous panels, but presented with each of the two competing rules.
    // Both must be rejected: a tie is a tie regardless of what we intended.
    const start = { id: 's1', shape: 'square', cell: { row: 3, col: 0 }, rotation: 0, colour: 'black' }
    const asLinear = { movement: { type: 'linear', axis: 'vertical', line: 0, direction: 'up', step: 1, boundary: 'bounce' }, rotation: { type: 'none' }, colour: { type: 'constant' } }
    const asBorder = { movement: { type: 'border', direction: 'counter-clockwise', step: 1 }, rotation: { type: 'none' }, colour: { type: 'constant' } }

    for (const rule of [asLinear, asBorder]) {
      const run = simulateStates([{ ...start, direction: rule.movement.direction ?? null }], { s1: rule }, 6)
      assert.ok(run, 'rule should simulate')
      assert.ok(
        disambiguationErrors(run.panels.slice(0, 4), { s1: rule }).length > 0,
        'both readings of an ambiguous sequence must be rejected',
      )
    }
  })

  test('a colour cycle must show every colour in the shown matrices', () => {
    // A 3-colour accelerating cycle never renders its third colour: the colour
    // index runs p(p+1)/2 = 0,1,3,6,10,15, which is 0,1,0,0,1,0 modulo 3.
    const rule = {
      movement: { type: 'linear', axis: 'horizontal', line: 1, direction: 'right', step: 1, boundary: 'bounce' },
      rotation: { type: 'none' },
      colour: { type: 'cycle', colours: ['black', 'green', 'blue'], accelerating: true },
    }
    const start = { id: 's1', shape: 'square', cell: { row: 1, col: 0 }, rotation: 0, colour: 'black', direction: 'right' }
    const run = simulateStates([start], { s1: rule }, 6)
    const shown = run.panels.slice(0, 4).map((p) => p.symbols[0].colour)
    assert.ok(!shown.includes('blue'), 'precondition: the third colour is never shown')
    assert.match(
      disambiguationErrors(run.panels.slice(0, 4), { s1: rule }).join(' '),
      /never appears in the four shown matrices/,
    )
  })

  test('every newly generated item passes the gate', () => {
    const existing = readBank('figure-sequences')
    const { questions } = generateFigureSequences({
      batchId: 'b9',
      quotas: feasibleQuota(generateFigureSequences, existing, { low: 4, medium: 6, high: 6 }),
      existing,
      verifiedAt: '2026-09-03',
    })
    for (const q of questions) {
      assert.deepEqual(disambiguationErrors(q.given, q.rules), [], `${q.id} is ambiguous`)
    }
  })

  test('no newly generated item exceeds four symbols or uses an accelerating colour cycle', () => {
    const existing = readBank('figure-sequences')
    const { questions } = generateFigureSequences({
      batchId: 'b8',
      quotas: feasibleQuota(generateFigureSequences, existing, { low: 3, medium: 6, high: 6 }),
      existing,
      verifiedAt: '2026-09-03',
    })
    for (const q of questions) {
      const n = q.given[0].symbols.length
      assert.ok(n >= 1 && n <= 4, `${q.id} has ${n} symbols`)
      for (const rule of Object.values(q.rules)) {
        assert.ok(!rule.colour.accelerating, `${q.id} uses an accelerating colour cycle`)
        // Only border travel is attested above one field per step.
        if (rule.movement.type === 'linear' || rule.movement.type === 'diagonal') {
          assert.ok(
            rule.movement.step === 1 || rule.movement.step === 'x+1',
            `${q.id} moves ${rule.movement.step} fields per step`,
          )
        }
      }
    }
  })

  test('symbol count is not a proxy for difficulty', () => {
    const existing = readBank('figure-sequences')
    const { questions } = generateFigureSequences({
      batchId: 'b7',
      quotas: feasibleQuota(generateFigureSequences, existing, { low: 3, medium: 12, high: 12 }),
      existing,
      verifiedAt: '2026-09-03',
    })
    const counts = (tier) =>
      new Set(questions.filter((q) => q.difficulty === tier).map((q) => q.given[0].symbols.length))
    assert.ok(counts('medium').size > 1, 'medium should span more than one symbol count')
    assert.ok(counts('high').size > 1, 'high should span more than one symbol count')
  })

  test('x+1 is not universal in the high tier', () => {
    const existing = readBank('figure-sequences')
    const { questions } = generateFigureSequences({
      batchId: 'b6',
      quotas: feasibleQuota(generateFigureSequences, existing, { low: 0, medium: 0, high: 14 }),
      existing,
      verifiedAt: '2026-09-03',
    })
    const accelerating = questions.filter((q) =>
      Object.values(q.rules).some((r) => r.movement.step === 'x+1' || r.rotation.accelerating),
    )
    assert.ok(accelerating.length > 0, 'x+1 should still appear at high')
    assert.ok(
      accelerating.length < questions.length,
      'x+1 must not appear in every high item — it is a calibration signal, not a documented rule',
    )
  })
})
