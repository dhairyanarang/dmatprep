/**
 * Phase 5 pilot fixes.
 *
 * Each distractor family asserts *why* a value arises. These tests check the
 * value actually arises that way — the gap that let `misapplied-constant` ship
 * notes citing "the first equation" (wrong in 9 of 17 pilot distractors) and
 * asserting a mechanism that could not produce the number.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { generateMathEquations } from '../generate/math-equations.mjs'
import { generateFigureSequences } from '../generate/figure-sequences.mjs'
import { readBank, readRetired } from '../lib/bank.mjs'
import { verifyQuestion } from '../lib/verify.mjs'
import { feasibleQuota } from './helpers.mjs'

const meBank = readBank('mathematical-equations')
const meSample = generateMathEquations({
  batchId: 'b9',
  quotas: feasibleQuota(generateMathEquations, meBank, { low: 12, medium: 12, high: 12 }),
  existing: meBank,
  verifiedAt: '2026-09-03',
}).questions

const fsBank = readBank('figure-sequences')
const fsSample = generateFigureSequences({
  batchId: 'b9',
  quotas: feasibleQuota(generateFigureSequences, fsBank, { low: 8, medium: 10, high: 10 }),
  existing: fsBank,
  verifiedAt: '2026-09-03',
}).questions

/** Re-run the mistake a note describes, and see where it actually lands. */
function reproduceMisapplication(note, solution) {
  const quoted = /from (.+?) by /.exec(note)
  if (!quoted) return { error: 'names no equation' }
  const rhs = Number(quoted[1].split(' = ')[1])
  const how = /by (.+?)\. Undoing/.exec(note)?.[1] ?? ''
  let m
  if ((m = /multiplying by (\d+) instead of dividing/.exec(how))) return { equation: quoted[1], value: rhs * Number(m[1]) }
  if ((m = /dividing by (\d+) again/.exec(how))) return { equation: quoted[1], value: rhs / Number(m[1]) }
  if ((m = /adding (\d+) instead of subtracting/.exec(how))) return { equation: quoted[1], value: rhs + Number(m[1]) }
  if ((m = /subtracting (\d+) again/.exec(how))) return { equation: quoted[1], value: rhs - Number(m[1]) }
  if ((m = /adding ([A-Z]) instead of subtracting/.exec(how))) return { equation: quoted[1], value: rhs + solution[m[1]] }
  return { error: `unrecognised mechanism: "${how}"` }
}

describe('ME distractor-note mechanism accuracy', () => {
  test('every misapplied-constant note quotes a real equation and lands on its own value', () => {
    let checked = 0
    for (const q of meSample) {
      for (const option of q.options) {
        if (option.id === q.correctOptionId) continue
        if (q.meta.distractorTypes[option.id] !== 'misapplied-constant') continue
        checked++
        const note = q.distractorNotes[option.id]
        assert.ok(!/the first equation/.test(note), `${q.id}: note still refers to "the first equation"`)
        const r = reproduceMisapplication(note, q.solution)
        assert.ok(!r.error, `${q.id}/${option.id}: ${r.error}`)
        assert.ok(q.equations.includes(r.equation), `${q.id}: quotes "${r.equation}", not in the system`)
        assert.equal(r.value, option.value, `${q.id}/${option.id}: mechanism gives ${r.value}, option is ${option.value}`)
      }
    }
    assert.ok(checked > 0, 'expected at least one misapplied-constant distractor in the sample')
  })

  test('a misapplied-constant distractor only answers the letter its equation fixes', () => {
    for (const q of meSample) {
      for (const option of q.options) {
        if (q.meta.distractorTypes[option.id] !== 'misapplied-constant') continue
        const r = reproduceMisapplication(q.distractorNotes[option.id], q.solution)
        // The quoted equation must contain the asked letter: otherwise the
        // mistake produces a wrong value for a different letter entirely.
        assert.ok(
          (r.equation.match(/[A-Z]/g) ?? []).includes(q.asked),
          `${q.id}: the quoted equation ${r.equation} does not involve the asked letter ${q.asked}`,
        )
      }
    }
  })

  test('off-by-one, inverted-operation and wrong-variable values match their labels', () => {
    for (const q of meSample) {
      const answer = q.solution[q.asked]
      const ops = new Set(q.equations.join(' ').match(/[+−×÷]/g) ?? [])
      for (const option of q.options) {
        if (option.id === q.correctOptionId) continue
        const family = q.meta.distractorTypes[option.id]
        if (family === 'off-by-one') {
          assert.equal(Math.abs(option.value - answer), 1, `${q.id}/${option.id}`)
        }
        if (family === 'inverted-operation') {
          assert.ok(option.value === answer * 2 || option.value === answer / 2, `${q.id}/${option.id}`)
          const note = q.distractorNotes[option.id]
          if (/multiply where the equation divides/.test(note)) assert.ok(ops.has('÷'), `${q.id}/${option.id}`)
          if (/divide where the equation multiplies/.test(note)) assert.ok(ops.has('×'), `${q.id}/${option.id}`)
        }
        if (family === 'wrong-variable' || family === 'stopped-early') {
          assert.ok(
            Object.entries(q.solution).some(([n, v]) => n !== q.asked && v === option.value),
            `${q.id}/${option.id} claims another letter's value but none holds ${option.value}`,
          )
        }
      }
    }
  })

  test('no system repeats a left-hand side', () => {
    for (const q of meSample) {
      const lhs = q.equations.map((e) => e.split(' = ')[0])
      assert.equal(new Set(lhs).size, lhs.length, `${q.id}: ${q.equations.join(' | ')}`)
    }
  })

  test('the verifier rejects a fabricated misapplied-constant note', () => {
    const q = structuredClone(meSample.find((x) => Object.values(x.meta.distractorTypes).includes('misapplied-constant')))
    const id = Object.entries(q.meta.distractorTypes).find(([, f]) => f === 'misapplied-constant')[0]
    // Pick an equation with a numeric right-hand side so the mechanism is
    // computable and the mismatch is the thing under test.
    const eq = q.equations.find((e) => Number.isFinite(Number(e.split(' = ')[1])))
    assert.ok(eq, 'expected an equation with a numeric right-hand side')
    q.distractorNotes[id] = `${q.options.find((o) => o.id === id).value} is what you get from ${eq} by adding 99 instead of subtracting it. Undoing an operation means applying its inverse, not repeating it.`
    const { errors } = verifyQuestion(q)
    assert.ok(errors.some((e) => /gives .*, not/.test(e)), `expected a mechanism mismatch, got: ${errors.join(' | ')}`)
  })

  test('the verifier rejects a note naming "the first equation"', () => {
    const q = structuredClone(meSample.find((x) => Object.values(x.meta.distractorTypes).includes('misapplied-constant')))
    const id = Object.entries(q.meta.distractorTypes).find(([, f]) => f === 'misapplied-constant')[0]
    q.distractorNotes[id] = `${q.options.find((o) => o.id === id).value} is what you get by applying the constant 2 the wrong way round when rearranging the first equation.`
    const { errors } = verifyQuestion(q)
    assert.ok(errors.some((e) => /the first equation/.test(e)))
  })
})

describe('FS observed-direction descriptions', () => {
  const heading = (q, id) => {
    const a = q.given[0].symbols.find((x) => x.id === id).cell
    const b = q.given[1].symbols.find((x) => x.id === id).cell
    const dr = Math.sign(b.row - a.row)
    const dc = Math.sign(b.col - a.col)
    return dr && dc ? `${dr < 0 ? 'up' : 'down'}-${dc < 0 ? 'left' : 'right'}` : null
  }

  test('every diagonal explanation names the heading the candidate actually sees', () => {
    let checked = 0
    for (const q of fsSample) {
      for (const s of q.given[0].symbols) {
        if (q.rules[s.id].movement.type !== 'diagonal') continue
        const observed = heading(q, s.id)
        if (!observed) continue
        checked++
        assert.ok(
          q.explanation.includes(`moves diagonally ${observed.replace('-', 'wards to the ')}`),
          `${q.id}: explanation does not name the observed heading ${observed}`,
        )
      }
    }
    assert.ok(checked > 0, 'expected diagonal movers in the sample')
  })

  test('a symbol that reverses before matrix 1 is described by its visible heading', () => {
    // The retired item is the reference case: nominal up-left, visibly down-right.
    const retired = readRetired('figure-sequences').find((e) => e.id === 'fs-low-b2-002')
    assert.ok(retired, 'expected fs-low-b2-002 in the retired archive')
    const q = retired.question
    const id = q.given[0].symbols[0].id
    assert.equal(q.rules[id].movement.direction, 'up-left', 'precondition: nominal heading is up-left')
    assert.equal(heading(q, id), 'down-right', 'precondition: visible heading is down-right')
    assert.ok(
      q.explanation.includes('upwards to the left'),
      'precondition: the retired item described the unobserved heading',
    )
    // And the current verifier catches it.
    const { errors, warnings } = verifyQuestion(q)
    assert.ok(
      [...errors, ...warnings].some((m) => /observed heading/.test(m)),
      'the verifier should flag the unobserved heading',
    )
  })

  test('every image offers two distinct families, never two positional nudges', () => {
    for (const q of fsSample) {
      for (const image of q.images) {
        const families = image.options
          .filter((o) => o.id !== image.correctOptionId)
          .map((o) => q.meta.distractorTypes[`${image.label}:${o.id}`])
        assert.equal(families.length, 2, `${q.id}/${image.label}`)
        assert.notEqual(families[0], families[1], `${q.id}/${image.label}: both ${families[0]}`)
        assert.ok(
          !families.every((f) => f === 'position'),
          `${q.id}/${image.label}: both distractors are the positional nudge`,
        )
        assert.ok(families.some((f) => f !== 'position'), `${q.id}/${image.label}: no rule-based error offered`)
      }
    }
  })

  test('all four movement families remain reachable after the per-image rule', () => {
    const seen = new Set(fsSample.flatMap((q) => Object.values(q.rules).map((r) => r.movement.type)))
    for (const family of ['linear', 'diagonal', 'border', 'direction-cycle']) {
      assert.ok(seen.has(family), `${family} became unreachable`)
    }
  })
})

describe('retirement and replacement', () => {
  test('the retired pilot ids are reserved and absent from the active bank', () => {
    for (const [section, id] of [
      ['figure-sequences', 'fs-low-b2-002'],
      ['mathematical-equations', 'me-low-b2-005'],
    ]) {
      const retired = readRetired(section).map((e) => e.id)
      assert.ok(retired.includes(id), `${id} is not in the retired archive`)
      assert.ok(!readBank(section).some((q) => q.id === id), `${id} is still served`)
      const entry = readRetired(section).find((e) => e.id === id)
      assert.ok(entry.reason.length > 80, `${id} has no substantive retirement reason`)
      assert.equal(entry.question.id, id, `${id}: archived payload missing`)
    }
  })

  test('the replacements exist, are current-version, and pass verification', () => {
    for (const [section, id] of [
      ['figure-sequences', 'fs-low-b3-001'],
      ['mathematical-equations', 'me-low-b3-001'],
    ]) {
      const q = readBank(section).find((x) => x.id === id)
      assert.ok(q, `${id} missing`)
      assert.equal(q.generator.batchId, 'b3')
      assert.equal(q.generator.version, '3.1.0')
      assert.deepEqual(verifyQuestion(q).errors, [], `${id} failed verification`)
    }
  })
})
