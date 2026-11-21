/**
 * Provenance is derived, not asserted.
 *
 * Before this, all three generators hardcoded `dmatAlignment:
 * 'officially_documented'`, so 473 of 473 committed questions claimed the exam
 * documents them. It did not, and the repository's own contract said so in at
 * least one place: ME_CONTRACT files the four-option answer format under
 * `review`, noting the option count is not documented.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { readBank, SECTIONS } from '../lib/bank.mjs'
import { classify, SECTION_PROVENANCE, rollUp } from '../lib/provenance.mjs'
import { verifyQuestion } from '../lib/verify.mjs'

test('every stored grade is the one the question derives', () => {
  let checked = 0
  for (const section of SECTIONS) {
    for (const q of readBank(section)) {
      checked++
      const derived = classify(q)
      assert.equal(q.meta.dmatAlignment, derived.dmatAlignment, `${q.id}: stored grade is not the derived one`)
      assert.ok(q.meta.provenance, `${q.id}: no provenance record`)
      for (const axis of ['format', 'answerFormat', 'answerOptionCount', 'mechanics', 'originality']) {
        assert.equal(q.meta.provenance[axis], derived.provenance[axis], `${q.id}: provenance.${axis} drifted`)
      }
    }
  }
  assert.ok(checked > 400, `only ${checked} questions checked — the bank did not load`)
})

test('NEGATIVE CONTROL: a hand-raised grade is rejected', () => {
  // The whole point. Without this gate `dmatAlignment` is free text that
  // anything can set to `officially_documented`.
  const [q] = readBank('mathematical-equations')
  assert.equal(q.meta.dmatAlignment, 'reasonable_extrapolation', 'fixture is not the expected grade')

  const tampered = structuredClone(q)
  tampered.meta.dmatAlignment = 'officially_documented'
  const errors = verifyQuestion(tampered).errors ?? verifyQuestion(tampered)
  const text = JSON.stringify(errors)
  assert.match(text, /dmatAlignment/, 'the verifier accepted a grade the question does not earn')
})

test('Mathematical Equations never claims a documented option count', () => {
  // The FAQ now states every question is single-choice, so the KIND of answer
  // format is settled for this subtest. How many options it offers is not, and
  // our four-option form remains an inference from d-mat.de.
  assert.equal(SECTION_PROVENANCE['mathematical-equations'].answerFormat.grade, 'stated')
  assert.equal(SECTION_PROVENANCE['mathematical-equations'].answerOptionCount.grade, 'unknown')

  const bank = readBank('mathematical-equations')
  // 175 → 210: batch b10. Re-checked — every item below, including the 16 new
  // quadratic-type ones, still grades its option count `unknown`.
  assert.equal(bank.length, 210, 'the ME bank size moved — re-check this expectation')
  for (const q of bank) {
    assert.equal(q.meta.provenance.answerOptionCount, 'unknown', `${q.id}: claims an option count`)
    assert.notEqual(
      q.meta.dmatAlignment,
      'officially_documented',
      `${q.id}: claims the exam documents it while its option count is unknown`,
    )
  }
})

test('an unsettled answer claim can never roll up to officially_documented', () => {
  const ok = { answerFormat: 'stated', answerOptionCount: 'demonstrated', mechanics: 'documented' }
  assert.equal(rollUp(ok), 'officially_documented')
  // Either half of the answer claim being unsettled is enough on its own. This
  // is the case that matters: Mathematical Equations is stated single-choice
  // and still does not have a documented number of options.
  assert.equal(rollUp({ ...ok, answerOptionCount: 'unknown' }), 'reasonable_extrapolation')
  assert.equal(rollUp({ ...ok, answerOptionCount: 'inferred' }), 'reasonable_extrapolation')
  assert.equal(rollUp({ ...ok, answerFormat: 'unknown' }), 'reasonable_extrapolation')
  assert.equal(rollUp({ ...ok, mechanics: 'extrapolated' }), 'reasonable_extrapolation')
  assert.equal(rollUp({ ...ok, mechanics: 'unsupported' }), 'uncertain')
})

test('every provenance grade cites why', () => {
  for (const section of SECTIONS) {
    const p = SECTION_PROVENANCE[section]
    assert.ok(p, `${section} has no provenance definition`)
    for (const axis of ['format', 'answerFormat', 'answerOptionCount']) {
      assert.ok(p[axis].why.length > 60, `${section}.${axis} has no substantive justification`)
    }
  }
})

test('the originality corpus records every build it covers', () => {
  const root = fileURLToPath(new URL('../../', import.meta.url))
  const corpus = JSON.parse(readFileSync(root + 'content/gam/official-ngram-hashes.json', 'utf8'))

  assert.ok(Array.isArray(corpus.hashes) && corpus.hashes.length > 0, 'the corpus is empty')
  assert.ok(Array.isArray(corpus.sources) && corpus.sources.length > 0, 'the corpus does not say what it came from')

  // The 02.09.2026 build is the current one. A corpus that predates it is blind
  // to the reflowed text: when it was built from 04.08 alone it covered only
  // 43.5% of the September build's 8-grams.
  assert.ok(
    corpus.sources.some((s) => s.includes('260902_dMAT')),
    'the corpus does not cover the current 02.09.2026 build',
  )
  assert.equal(corpus.count, corpus.hashes.length, 'the recorded count disagrees with the hashes')
})

test('the corpus holds no recoverable source text', () => {
  const root = fileURLToPath(new URL('../../', import.meta.url))
  const corpus = JSON.parse(readFileSync(root + 'content/gam/official-ngram-hashes.json', 'utf8'))
  // Hashes only. The source material is copyrighted and this repository is public.
  for (const h of corpus.hashes.slice(0, 200)) {
    assert.match(h, /^[0-9a-f]+$/, 'a corpus entry is not a hex hash')
  }
})
