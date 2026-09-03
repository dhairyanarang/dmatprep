/**
 * Phases 7-11: Mathematical Equations coverage, decoupling, dedup, distractors
 * and hints.
 *
 * Each structural family below is officially documented — the audit verified all
 * of them against the GAM PDF's worked exercises — and none was reachable by the
 * old generator.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { generateMathEquations } from '../generate/math-equations.mjs'
import { readBank } from '../lib/bank.mjs'
import { parseEquation, solveAll } from '../lib/equations.mjs'
import { equationFingerprint, equationSkeleton, equationTopology } from '../lib/fingerprint.mjs'
import { hintRevealsAnswer, operatorsIn } from '../lib/verify.mjs'

const existing = readBank('mathematical-equations')

/** One decent sample, reused across the coverage assertions. */
const sample = generateMathEquations({
  batchId: 'b9',
  quotas: { low: 14, medium: 14, high: 14 },
  existing,
  verifiedAt: '2026-09-03',
}).questions

const allEquations = sample.flatMap((q) => q.equations)
const some = (re) => allEquations.filter((e) => re.test(e))

describe('mathematical equations — official structural coverage', () => {
  test('bare pin, e.g. `B = 6` (official Example 1)', () => {
    assert.ok(some(/^[A-Z] = \d+$/).length > 0)
  })

  test('two unknowns equal a constant, e.g. `A + C = 8` (Ex 3)', () => {
    assert.ok(some(/^[A-Z] [+−] [A-Z] = \d+$/).length > 0)
  })

  test('compound coefficient plus offset, e.g. `3 × C − 1 = B` (Ex 6)', () => {
    assert.ok(some(/^\d+ × [A-Z] [+−] \d+ = [A-Z]$/).length > 0)
  })

  test('multiple multiplicative terms, e.g. `2 × A + 2 × C = B` (Ex 3)', () => {
    assert.ok(some(/^(?:\d+ × )?[A-Z] [+−] (?:\d+ × )?[A-Z] = [A-Z]$/).length > 0)
  })

  test('star topology, e.g. Ex 5 defining A, C and D all from B', () => {
    const topologies = new Set(sample.map((q) => equationTopology(q.equations, q.variables)))
    assert.ok(
      topologies.has('star') || topologies.has('star+combine'),
      `expected a star topology, saw ${[...topologies].join(', ')}`,
    )
  })

  test('combining equations over a subset of the letters (Ex 6 leaves B out)', () => {
    const subset = sample.filter((q) => {
      if (q.variables.length < 4) return false
      return q.equations.some((e) => {
        const letters = new Set(e.match(/[A-Z]/g) ?? [])
        return letters.size === q.variables.length - 1 && !/=\s*[A-Z]/.test(e)
      })
    })
    assert.ok(subset.length > 0, 'no subset-spanning combining equation was generated')
  })
})

describe('mathematical equations — difficulty is decoupled from letter count', () => {
  test('a tier is not a single letter count', () => {
    for (const tier of ['low', 'medium', 'high']) {
      const counts = new Set(sample.filter((q) => q.difficulty === tier).map((q) => q.variables.length))
      assert.ok(counts.size > 1, `${tier} used only ${[...counts]} letters`)
    }
  })

  test('the same letter count appears at more than one difficulty', () => {
    const byCount = new Map()
    for (const q of sample) {
      const set = byCount.get(q.variables.length) ?? new Set()
      set.add(q.difficulty)
      byCount.set(q.variables.length, set)
    }
    const shared = [...byCount.values()].filter((s) => s.size > 1)
    assert.ok(shared.length > 0, 'letter count still predicts difficulty')
  })

  test('the asked letter is not always the same one', () => {
    assert.ok(new Set(sample.map((q) => q.asked)).size > 2)
  })
})

describe('mathematical equations — correctness invariants hold', () => {
  test('every system has exactly one solution over 1..20', () => {
    for (const q of sample) {
      const solutions = solveAll(q.equations.map(parseEquation), q.variables, 2)
      assert.equal(solutions.length, 1, `${q.id} does not have a unique solution`)
      for (const name of q.variables) assert.equal(solutions[0][name], q.solution[name])
    }
  })

  test('every value stays inside the documented 1..20 range', () => {
    for (const q of sample) {
      for (const [name, value] of Object.entries(q.solution)) {
        assert.ok(Number.isInteger(value) && value >= 1 && value <= 20, `${q.id}: ${name} = ${value}`)
      }
    }
  })

  test('no quadratic terms and no operators beyond + − × ÷', () => {
    for (const q of sample) {
      const text = q.equations.join(' ')
      assert.ok(!/[A-Z]\s*[×÷]\s*[A-Z]/.test(text), `${q.id} multiplies two letters`)
      assert.ok(!/[\^%√]|\*\*/.test(text), `${q.id} uses an unsupported construct`)
    }
  })
})

describe('mathematical equations — dedup, distractors and hints', () => {
  test('the fingerprint is independent of equation display order (Phase 9)', () => {
    const q = sample[0]
    const shuffled = { ...q, equations: [...q.equations].reverse() }
    assert.deepEqual(equationSkeleton(shuffled.equations), equationSkeleton(q.equations))
    assert.equal(equationFingerprint(shuffled).systemKey, equationFingerprint(q).systemKey)
    assert.equal(equationFingerprint(shuffled).key, equationFingerprint(q).key)
  })

  test('no two generated items are the same system', () => {
    const keys = sample.map((q) => equationFingerprint(q).systemKey)
    assert.equal(new Set(keys).size, keys.length, 'a duplicate system was generated')
  })

  test('an inverted-operation note only blames an operator the system contains', () => {
    for (const q of sample) {
      const ops = operatorsIn(q.equations)
      for (const [id, family] of Object.entries(q.meta.distractorTypes)) {
        if (family !== 'inverted-operation') continue
        const note = q.distractorNotes[id]
        if (/multiply where the equation divides/.test(note)) {
          assert.ok(ops.has('÷'), `${q.id}/${id} blames division in a system with none`)
        }
        if (/divide where the equation multiplies/.test(note)) {
          assert.ok(ops.has('×'), `${q.id}/${id} blames multiplication in a system with none`)
        }
      }
    }
  })

  test('at most one off-by-one distractor per item', () => {
    for (const q of sample) {
      const n = Object.values(q.meta.distractorTypes).filter((f) => f === 'off-by-one').length
      assert.ok(n <= 1, `${q.id} has ${n} off-by-one distractors`)
    }
  })

  test('no hint states the answer, and level 2 is never one step from it (Phase 11)', () => {
    for (const q of sample) {
      const answer = q.solution[q.asked]
      const text = q.hints.map((h) => h.text).join(' ')
      assert.ok(
        !new RegExp(`(^|[^0-9])${answer}([^0-9]|$)`).test(text),
        `${q.id}: a hint contains the answer ${answer}`,
      )
      assert.equal(hintRevealsAnswer(q), null, `${q.id}: ${hintRevealsAnswer(q)}`)
    }
  })

  test('every wrong option carries a note that opens with its own value', () => {
    for (const q of sample) {
      for (const option of q.options) {
        if (option.id === q.correctOptionId) continue
        const note = q.distractorNotes[option.id]
        assert.ok(note, `${q.id}/${option.id} has no note`)
        assert.ok(note.startsWith(`${option.value} `), `${q.id}/${option.id} note does not open with its value`)
      }
    }
  })
})
