/**
 * Phase 21 regression: the key scalability property.
 *
 * Requesting a future batch — of any size — must leave every existing question
 * byte-identical. The old runner mutated 34/45, 36/45 and 40/45 items under
 * their existing ids when a quota changed by five.
 *
 * Nothing here writes to the bank.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { generateFigureSequences } from '../generate/figure-sequences.mjs'
import { generateLatinSquares } from '../generate/latin-squares.mjs'
import { generateMathEquations } from '../generate/math-equations.mjs'
import { canonicalHash, readBank, appendToBank, readRetired } from '../lib/bank.mjs'
import { feasibleQuota, quotaSize } from './helpers.mjs'

const SECTIONS = [
  ['figure-sequences', generateFigureSequences],
  ['mathematical-equations', generateMathEquations],
  ['latin-squares', generateLatinSquares],
]

// The point is invariance under a *change of size*, not how large a batch can
// get. Each requested size is trimmed to what the tier can still produce, so a
// filling bank narrows the batches rather than failing the test — the generator
// refusing to over-fill is correct behaviour, asserted separately.
const REQUESTED = [
  { label: 'small', quotas: { low: 1, medium: 2, high: 2 } },
  { label: 'medium', quotas: { low: 4, medium: 8, high: 8 } },
  { label: 'large', quotas: { low: 6, medium: 12, high: 12 } },
]

/**
 * These generate into a scratch batch, `b900` — a number far beyond anything the
 * bank will reach. It used to be `b9`, which the 5 September 2026 remediation
 * then consumed for a real replacement, so the test began colliding with its own
 * fixture rather than with a genuine defect.
 */
describe('append-only generation', () => {
  for (const [section, generate] of SECTIONS) {
    test(`${section}: existing items survive every batch size`, () => {
      const existing = readBank(section)
      const before = existing.map(canonicalHash)

      for (const { label, quotas: requested } of REQUESTED) {
        const quotas = feasibleQuota(generate, existing, requested)
        if (quotaSize(quotas) === 0) continue
        const { questions } = generate({ batchId: 'b900', quotas, existing, verifiedAt: '2026-09-03' })
        const merged = [...existing, ...questions]
        const after = merged.slice(0, existing.length).map(canonicalHash)

        for (let i = 0; i < before.length; i++) {
          assert.equal(after[i], before[i], `batch of ${label} mutated ${existing[i].id}`)
        }
        assert.equal(questions.length, quotaSize(quotas))
      }
    })

    test(`${section}: growing a batch only extends it`, () => {
      const existing = readBank(section)
      const big = feasibleQuota(generate, existing, { low: 4, medium: 6, high: 6 })
      const half = Object.fromEntries(Object.entries(big).map(([k, v]) => [k, Math.floor(v / 2)]))
      if (quotaSize(half) === 0) return
      const small = generate({ batchId: 'b900', quotas: half, existing, verifiedAt: '2026-09-03' }).questions
      const large = generate({ batchId: 'b900', quotas: big, existing, verifiedAt: '2026-09-03' }).questions

      // Per-tier prefixes must match: slot N does not depend on the batch size.
      for (const tier of ['low', 'medium', 'high']) {
        const a = small.filter((q) => q.difficulty === tier)
        const b = large.filter((q) => q.difficulty === tier)
        for (let i = 0; i < a.length; i++) {
          assert.equal(canonicalHash(b[i]), canonicalHash(a[i]), `${tier} slot ${i} changed when the batch grew`)
        }
      }
    })

    test(`${section}: new ids never collide with existing or retired ids`, () => {
      const existing = readBank(section)
      const taken = new Set([
        ...existing.map((q) => q.id),
        ...readRetired(section).map((e) => e.question?.id ?? e.id),
      ])
      const quotas = feasibleQuota(generate, existing, { low: 2, medium: 2, high: 2 })
      const { questions } = generate({ batchId: 'b900', quotas, existing, verifiedAt: '2026-09-03' })
      for (const q of questions) assert.ok(!taken.has(q.id), `${q.id} collides with an existing or retired id`)
    })
  }

  test('appendToBank refuses to reuse a retired id', () => {
    const retired = readRetired('figure-sequences')
    assert.ok(retired.length > 0, 'expected retired figure-sequence items')
    const clone = structuredClone(retired[0].question)
    assert.throws(
      () => appendToBank('figure-sequences', [clone], { dryRun: true }),
      /already used or retired/,
      'a retired id must never be reassigned',
    )
  })

  test('appendToBank refuses a batch containing a duplicate id', () => {
    const bank = readBank('latin-squares')
    const item = structuredClone(bank[0])
    item.id = 'ls-low-b900-999'
    assert.throws(() => appendToBank('latin-squares', [item, structuredClone(item)], { dryRun: true }), /twice/)
  })
})
