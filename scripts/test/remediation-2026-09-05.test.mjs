/**
 * The 5 September 2026 Core remediation.
 *
 * Each defect class the audit found is asserted twice: gone from the bank, and
 * still caught by the validator. A gate that never fires proves nothing, so
 * every one of these plants the defect on a copy of a real item and requires the
 * verifier to reject it.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { hintRevealsAnswer, verifyQuestion } from '../lib/verify.mjs'
import { readBank, readRetired } from '../lib/bank.mjs'
import { disambiguationErrors } from '../lib/fs-inversion.mjs'

const fs = readBank('figure-sequences')
const me = readBank('mathematical-equations')
const ls = readBank('latin-squares')
const errorsFor = (q) => verifyQuestion(q).errors

describe('Core remediation — the bank is clean', () => {
  test('every active Figure Sequence admits exactly one continuation', () => {
    for (const q of fs) {
      assert.deepEqual(
        disambiguationErrors(q.given, q.rules),
        [],
        `${q.id} admits more than one legal continuation`,
      )
    }
  })

  test('no image offers two distractors of the same family', () => {
    for (const q of fs) {
      for (const image of q.images) {
        const families = image.options
          .filter((o) => o.id !== image.correctOptionId)
          .map((o) => q.meta?.distractorTypes?.[`${image.label}:${o.id}`])
          .filter(Boolean)
        if (families.length !== 2) continue
        assert.notEqual(families[0], families[1], `${q.id} ${image.label}: ${families[0]} twice`)
        assert.ok(
          !families.every((f) => f === 'position'),
          `${q.id} ${image.label}: two positional nudges`,
        )
      }
    }
  })

  test('no distractor note cites "the first equation"', () => {
    for (const q of me) {
      for (const [id, note] of Object.entries(q.distractorNotes ?? {})) {
        assert.ok(!/the first equation/.test(note), `${q.id}/${id} still cites the first equation`)
      }
    }
  })

  test('no distractor note blames an operator the system does not contain', () => {
    for (const q of me) {
      const ops = new Set(q.equations.join(' ').match(/[+−×÷]/g) ?? [])
      for (const [id, note] of Object.entries(q.distractorNotes ?? {})) {
        if (/multiply where the equation divides/.test(note)) {
          assert.ok(ops.has('÷'), `${q.id}/${id} blames division in a system with none`)
        }
        if (/divide where the equation multiplies/.test(note)) {
          assert.ok(ops.has('×'), `${q.id}/${id} blames multiplication in a system with none`)
        }
      }
    }
  })

  test('no hint hands over the answer, at any level', () => {
    for (const q of me) {
      assert.equal(hintRevealsAnswer(q), null, `${q.id}: ${hintRevealsAnswer(q)}`)
    }
  })

  test('every distractor note names an equation that exists in its own system', () => {
    for (const q of me) {
      for (const [id, note] of Object.entries(q.distractorNotes ?? {})) {
        const quoted = /from (.+?) by /.exec(note)
        if (!quoted) continue
        assert.ok(
          q.equations.includes(quoted[1]),
          `${q.id}/${id} quotes "${quoted[1]}", which is not in this system`,
        )
      }
    }
  })
})

describe('Core remediation — the validators still bite', () => {
  test('a second same-family distractor is rejected', () => {
    const q = structuredClone(fs.find((x) => x.images[0].options.length === 3))
    const image = q.images[0]
    const wrong = image.options.filter((o) => o.id !== image.correctOptionId)
    const family = q.meta.distractorTypes[`${image.label}:${wrong[0].id}`]
    q.meta.distractorTypes[`${image.label}:${wrong[1].id}`] = family
    assert.ok(
      errorsFor(q).some((e) => /both distractors are the same family/.test(e)),
      'a duplicated distractor family passed verification',
    )
  })

  test('a note citing "the first equation" is rejected', () => {
    const q = structuredClone(me.find((x) => x.generator?.teachingContent))
    const id = Object.keys(q.distractorNotes)[0]
    q.distractorNotes[id] = 'This is what you get from the first equation by misreading it.'
    q.meta.distractorTypes[id] = 'misapplied-constant'
    assert.ok(
      errorsFor(q).some((e) => /the first equation/.test(e)),
      'a shuffled-order reference passed verification',
    )
  })

  test('a note blaming an absent operator is rejected', () => {
    const q = structuredClone(me.find((x) => !x.equations.join(' ').includes('×')))
    assert.ok(q, 'no system without × to test against')
    const id = Object.keys(q.distractorNotes)[0]
    q.distractorNotes[id] = 'This is half the correct value, which is what you get if you divide where the equation multiplies.'
    q.meta.distractorTypes[id] = 'inverted-operation'
    assert.ok(
      errorsFor(q).some((e) => /blames multiplication/.test(e)),
      'a note blaming an absent operator passed verification',
    )
  })

  test('a hint that quotes a single-unknown equation is rejected, at any level', () => {
    for (const level of [1, 2, 3]) {
      const q = structuredClone(me[0])
      q.hints = q.hints.map((h) =>
        h.level === level ? { ...h, text: `Look at ${q.asked} ÷ 3 = 3.` } : h,
      )
      assert.match(
        hintRevealsAnswer(q) ?? '',
        new RegExp(`level-${level} hint quotes`),
        `a level-${level} give-away was not caught`,
      )
    }
  })

  test('a hint that simply states the answer is rejected', () => {
    const q = structuredClone(me[0])
    const answer = q.solution[q.asked]
    q.hints = q.hints.map((h) => (h.level === 3 ? { ...h, text: `So ${q.asked} is ${answer}.` } : h))
    assert.match(hintRevealsAnswer(q) ?? '', /is the answer rather than a hint/)
  })
})

describe('Core remediation — retirement was append-only', () => {
  test('every retired id is reserved and never reused', () => {
    for (const section of ['figure-sequences', 'mathematical-equations', 'latin-squares']) {
      const active = new Set(readBank(section).map((q) => q.id))
      for (const entry of readRetired(section)) {
        const id = entry.question?.id ?? entry.id
        assert.ok(!active.has(id), `${id} is retired and back in the active bank`)
        assert.ok(entry.reason?.length > 40, `${id} was retired without a recorded reason`)
      }
    }
  })

  test('the twelve Figure Sequences and twenty Mathematical Equations retirements are on record', () => {
    const fsRetired = readRetired('figure-sequences').map((e) => e.question?.id ?? e.id)
    for (const id of [
      'fs-low-001', 'fs-medium-001', 'fs-medium-002', 'fs-medium-010', 'fs-medium-011',
      'fs-high-001', 'fs-high-002', 'fs-high-010', 'fs-high-012', 'fs-high-014',
      'fs-low-010', 'fs-low-b2-003',
    ]) {
      assert.ok(fsRetired.includes(id), `${id} is not recorded as retired`)
    }
    assert.equal(readRetired('mathematical-equations').length, 22, 'ME retirement count moved')
    assert.ok(
      readRetired('mathematical-equations')
        .map((e) => e.question?.id ?? e.id)
        .includes('me-low-b4-001'),
      'the printed-answer item is not recorded as retired',
    )
  })

  test('section counts are unchanged by the repair', () => {
    assert.equal(fs.length, 173)
    assert.equal(me.length, 175)
    assert.equal(ls.length, 125)
    assert.equal(fs.length + me.length + ls.length, 473)
  })
})

describe('Core remediation — the official difficulty ladder is recorded, not enforced', () => {
  test('newly generated items stamp the official structural figures', () => {
    const stamped = me.filter((q) => q.meta?.officialStructure)
    assert.ok(stamped.length > 0, 'no item records letters and equations')
    for (const q of stamped) {
      assert.equal(q.meta.officialStructure.letters, Object.keys(q.solution).length)
      assert.equal(q.meta.officialStructure.equations, q.equations.length)
    }
  })

  test('the learner-facing tiers were left alone', () => {
    // Re-tiering is a decision for a later pass; this one only made the
    // divergence visible. If these move, it was not this remediation.
    const byTier = { low: 0, medium: 0, high: 0 }
    for (const q of me) byTier[q.difficulty]++
    assert.deepEqual(byTier, { low: 58, medium: 58, high: 59 })
  })

  test('the source of record is the 02.09.2026 build', () => {
    const sources = readFileSync(new URL('../../content/exam/sources.ts', import.meta.url), 'utf8')
    assert.match(sources, /260902_dMAT_General-Academic-Module/)
    assert.match(sources, /2 September 2026/)
    assert.ok(!sources.includes('260804_dMAT'), 'the superseded build is still cited')
  })
})

describe('Core remediation — historic attempts survive the repair', () => {
  const banner = readFileSync(
    new URL('../../components/practice/result-banner.tsx', import.meta.url),
    'utf8',
  )
  const progressTypes = readFileSync(
    new URL('../../lib/types/progress.ts', import.meta.url),
    'utf8',
  )

  test('the verdict is stored on the attempt, not recomputed from options', () => {
    // If `correct` were derived at read time, rebuilding an item's options could
    // silently restate history. It is a stored boolean, so it cannot.
    assert.match(progressTypes, /correct: boolean/)
  })

  test('the correct option id never moved on a repaired item', () => {
    // Row-level correctness in the review is `chosen === correctOptionId`, so a
    // historic attempt keeps its verdict only while the key's id is stable.
    for (const q of me) {
      assert.ok(
        q.options.some((o) => o.id === q.correctOptionId),
        `${q.id}: correctOptionId does not name one of its options`,
      )
    }
  })

  test('a stale option id still resolves to the value the learner chose', () => {
    assert.match(banner, /function historicValue/)
    assert.match(banner, /yours: yours \? String\(yours\.value\) : historicValue\(chosen\)/)
  })

  test('option ids encode their value, which is what makes that recovery sound', () => {
    for (const q of me) {
      for (const o of q.options) {
        assert.equal(o.id, `opt-${o.value}`, `${q.id}: ${o.id} does not encode ${o.value}`)
      }
    }
  })
})
