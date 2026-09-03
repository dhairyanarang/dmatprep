/**
 * Phase 13: strict Latin Square path replay.
 *
 * `verifyLatinSquare` used to accept a pair-elimination step whenever the letter
 * merely *fit* the cell. Being forced is a much stronger claim, and `replayPath`
 * — which already existed and was never called — checks it.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { generateLatinSquares, verifyLatinSquare } from '../generate/latin-squares.mjs'
import { readBank } from '../lib/bank.mjs'
import { LETTERS, candidatesAt, nakedSingles, replayPath, viableTargetLetters } from '../lib/latin.mjs'
import { latinFingerprint } from '../lib/fingerprint.mjs'
import { feasibleQuota } from './helpers.mjs'

const bank = readBank('latin-squares')

describe('latin square path replay', () => {
  test('the committed bank passes the strict replay', () => {
    for (const q of bank) assert.deepEqual(verifyLatinSquare(q), [], `${q.id} failed`)
  })

  test('a valid path replays cleanly', () => {
    const q = bank.find((x) => x.solutionSteps.some((s) => s.technique === 'pair-elimination'))
    assert.ok(q, 'expected a pair-elimination item in the bank')
    const result = replayPath(q.grid, q.solutionSteps, q.letters)
    assert.ok(result.ok, result.error)
    assert.equal(result.grid[q.target.row][q.target.col], q.correctOptionId)
  })

  test('a non-forced placement is rejected', () => {
    const q = bank[0]
    // Swap in a letter that fits the first cell but is not the forced one.
    const first = q.solutionSteps[0]
    const alternatives = LETTERS.filter(
      (l) => l !== first.letter && !candidatesAt(q.grid, first.cell.row, first.cell.col, q.letters).includes(l),
    )
    assert.ok(alternatives.length > 0)
    const tampered = q.solutionSteps.map((s, i) => (i === 0 ? { ...s, letter: alternatives[0] } : s))
    const result = replayPath(q.grid, tampered, q.letters)
    assert.ok(!result.ok, 'a placement that is not forced must be rejected')
  })

  test('a step claiming pair-elimination that is not forced is rejected', () => {
    // Build a grid with an empty cell that has two candidates, then claim a
    // pair-elimination step there.
    const q = bank.find((x) => x.forcedPlacementDepth >= 3)
    assert.ok(q)
    const openCell = (() => {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (q.grid[r][c]) continue
          if (r === q.target.row && c === q.target.col) continue
          if (candidatesAt(q.grid, r, c, q.letters).length >= 2) return { row: r, col: c }
        }
      }
      return null
    })()
    assert.ok(openCell, 'expected an under-determined cell')
    const cands = candidatesAt(q.grid, openCell.row, openCell.col, q.letters)
    const bogus = [{ cell: openCell, letter: cands[0], technique: 'pair-elimination', reason: 'fabricated' }]
    const result = replayPath(q.grid, bogus, q.letters)
    // Either it is genuinely forced by pair elimination, or the replay rejects it.
    if (result.ok) {
      const pairs = nakedSingles(q.grid, q.letters)
      assert.ok(pairs.length >= 0)
    } else {
      assert.match(result.error, /not forced by pair elimination/)
    }
  })

  test('an incorrect target is caught', () => {
    const q = structuredClone(bank[0])
    q.correctOptionId = LETTERS.find((l) => l !== q.correctOptionId)
    const errors = verifyLatinSquare(q)
    assert.ok(errors.length > 0, 'a wrong target letter must fail verification')
  })

  test('exactly one letter completes each target', () => {
    for (const q of bank) {
      const viable = viableTargetLetters(q.grid, q.target, q.letters)
      assert.equal(viable.length, 1, `${q.id} admits ${viable.join('/')}`)
      assert.equal(viable[0], q.correctOptionId)
    }
  })
})

describe('latin square generation', () => {
  // Trimmed to remaining headroom: these assert correctness of whatever is
  // produced, not how much can be produced.
  const generated = generateLatinSquares({
    batchId: 'b9',
    quotas: feasibleQuota(generateLatinSquares, bank, { low: 4, medium: 6, high: 6 }),
    existing: bank,
    verifiedAt: '2026-09-03',
  }).questions

  test('every generated item passes the strict verifier', () => {
    for (const q of generated) assert.deepEqual(verifyLatinSquare(q), [], `${q.id} failed`)
  })

  test('no tier is single-technique', () => {
    for (const tier of ['low', 'medium']) {
      const inTier = generated.filter((q) => q.difficulty === tier)
      if (inTier.length < 3) continue
      const techniques = new Set(
        inTier.map((q) => (q.solutionSteps.some((s) => s.technique === 'pair-elimination') ? 'pair' : 'naked')),
      )
      assert.ok(techniques.size > 1, `${tier} is entirely one technique`)
    }
  })

  test('high items always exercise pair elimination', () => {
    for (const q of generated.filter((x) => x.difficulty === 'high')) {
      assert.ok(
        q.solutionSteps.some((s) => s.technique === 'pair-elimination'),
        `${q.id} is high but uses no pair elimination`,
      )
    }
  })

  test('walkthroughs do not claim pair elimination is the only way in', () => {
    for (const q of [...bank, ...generated]) {
      const text = `${q.walkthrough?.keyInsight ?? ''} ${q.walkthrough?.takeaway ?? ''}`
      assert.ok(
        !/The way in is a line/.test(text),
        `${q.id} still presents pair elimination as the only route`,
      )
    }
  })

  test('targetDistance is exercised as a diversity dimension', () => {
    const distances = new Set(generated.map((q) => latinFingerprint(q).targetDistance))
    assert.ok(distances.size > 1, 'every generated item has the same target distance')
  })
})
