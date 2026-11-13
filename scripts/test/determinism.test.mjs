/**
 * Phase 22: reproducibility.
 *
 * Same coordinates → identical output; different batch → different content; and
 * a single published item can be rebuilt from its own stamp alone.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { buildFigureSequence, generateFigureSequences, GENERATOR_NAME as FS_GEN } from '../generate/figure-sequences.mjs'
import { buildLatinSquare, generateLatinSquares, GENERATOR_NAME as LS_GEN } from '../generate/latin-squares.mjs'
import { buildMathEquations, generateMathEquations, GENERATOR_NAME as ME_GEN } from '../generate/math-equations.mjs'
import { canonicalHash, readBank } from '../lib/bank.mjs'
import { itemSeed } from '../lib/seed.mjs'
import { makeRng } from '../lib/rng.mjs'

const CASES = [
  ['figure-sequences', generateFigureSequences, buildFigureSequence, FS_GEN],
  ['mathematical-equations', generateMathEquations, buildMathEquations, ME_GEN],
  ['latin-squares', generateLatinSquares, buildLatinSquare, LS_GEN],
]

/**
 * `low: 1`, not 2. Removing `direction-cycle` from FS_CONTRACT.allowed on
 * 2026-11-14 shrank the low-difficulty structure space to the point where
 * Figure Sequences can place at most one new low item per batch. That is a
 * genuine capacity limit, not a flaky gate: generating against the 87 live
 * questions and against all 173 including the quarantined ones both fail
 * identically at the second slot, so it is not the fingerprint budget either.
 * The ceiling is asserted directly in the test below, so that shrinking this
 * quota cannot quietly hide it.
 *
 * These tests are about determinism. They should ask for an amount the
 * generator can actually produce, and leave capacity to the capacity test.
 */
const quotas = { low: 1, medium: 2, high: 2 }

describe('determinism', () => {
  for (const [section, generate, build, generatorName] of CASES) {
    test(`${section}: same batch and quotas produce identical output`, () => {
      const existing = readBank(section)
      const a = generate({ batchId: 'b9', quotas, existing, verifiedAt: '2026-09-03' }).questions
      const b = generate({ batchId: 'b9', quotas, existing, verifiedAt: '2026-09-03' }).questions
      assert.equal(a.length, b.length)
      for (let i = 0; i < a.length; i++) assert.equal(canonicalHash(b[i]), canonicalHash(a[i]))
    })

    test(`${section}: a different batchId produces different content`, () => {
      const existing = readBank(section)
      const a = generate({ batchId: 'b8', quotas, existing, verifiedAt: '2026-09-03' }).questions
      const b = generate({ batchId: 'b9', quotas, existing, verifiedAt: '2026-09-03' }).questions
      const same = a.filter((q, i) => {
        const x = structuredClone(q)
        const y = structuredClone(b[i])
        delete x.id
        delete x.generator
        delete y.id
        delete y.generator
        return canonicalHash(x) === canonicalHash(y)
      })
      assert.equal(same.length, 0, 'a new batch should not reproduce the previous batch content')
    })

    test(`${section}: an item can be reproduced from its own stamp`, () => {
      const existing = readBank(section)
      const { questions } = generate({ batchId: 'b9', quotas, existing, verifiedAt: '2026-09-03' })

      for (const q of questions) {
        const c = q.generator.seedCoordinates
        assert.ok(c, `${q.id} carries no seed coordinates`)

        // The stamped seed must be exactly what the coordinates hash to.
        const seed = itemSeed({ generator: generatorName, ...c })
        assert.equal(seed, q.generator.seed, `${q.id}: stamped seed does not match its coordinates`)

        // And that seed alone must rebuild the item.
        const rebuilt = build(makeRng(seed), c.tier, {
          section: c.section,
          batchId: c.batchId,
          index: c.index,
          attempt: c.attempt,
          preferMultiplicative: c.index % 2 === 0,
        })
        assert.ok(rebuilt, `${q.id} did not rebuild from its seed`)

        const stripped = structuredClone(q)
        delete stripped.id
        delete stripped.generator
        assert.equal(canonicalHash(rebuilt), canonicalHash(stripped), `${q.id} did not rebuild byte-identically`)
      }
    })
  }

  test('itemSeed is a pure function of its coordinates', () => {
    const coords = { generator: 'x', section: 's', tier: 'low', batchId: 'b2', index: 3, attempt: 7 }
    assert.equal(itemSeed(coords), itemSeed({ ...coords }))
    assert.notEqual(itemSeed(coords), itemSeed({ ...coords, index: 4 }))
    assert.notEqual(itemSeed(coords), itemSeed({ ...coords, attempt: 8 }))
    assert.notEqual(itemSeed(coords), itemSeed({ ...coords, batchId: 'b3' }))
    assert.notEqual(itemSeed(coords), itemSeed({ ...coords, tier: 'high' }))
  })

  test('itemSeed rejects incomplete coordinates', () => {
    assert.throws(() => itemSeed({ generator: 'x', section: 's', tier: 'low', index: 0 }), /batchId/)
    assert.throws(
      () => itemSeed({ generator: 'x', section: 's', tier: 'low', batchId: 'b2', index: -1 }),
      /non-negative/,
    )
  })
})

describe('generation capacity', () => {
  /**
   * A standing record of how much room each tier has left, so that a future
   * batch plan is written against measured capacity rather than optimism.
   *
   * Figure Sequences low is the tight one, and it is tight by design: the
   * official rule list is short, a low item stacks one transformation, and
   * MAX_PER_FINGERPRINT caps structural repeats at two. Removing the
   * undocumented `direction-cycle` mechanic took out roughly a third of the
   * movement space, and the low tier had the least slack to give.
   *
   * If this starts passing at a higher number, something widened the allowed
   * structures. That is a decision, and it should be made deliberately.
   */
  test('figure-sequences low generates one item per batch and no more', () => {
    const existing = readBank('figure-sequences')
    const ok = generateFigureSequences({
      batchId: 'cap1',
      quotas: { low: 1, medium: 0, high: 0 },
      existing,
      verifiedAt: '2026-11-14',
    })
    assert.equal(ok.questions.length, 1, 'low can no longer place even one item')

    assert.throws(
      () =>
        generateFigureSequences({
          batchId: 'cap1',
          quotas: { low: 2, medium: 0, high: 0 },
          existing,
          verifiedAt: '2026-11-14',
        }),
      /could not fill low slot 2\/2/,
      'low capacity grew — confirm what widened, do not just raise this number',
    )
  })
})
