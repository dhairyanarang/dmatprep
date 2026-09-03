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

const quotas = { low: 2, medium: 2, high: 2 }

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
