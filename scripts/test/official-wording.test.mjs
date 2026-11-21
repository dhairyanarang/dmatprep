/**
 * Official wording must not reappear without a decision.
 *
 * The Terms and Conditions §9.1 forbid reproducing official material "in any
 * form, including for the purposes of teaching", without written permission
 * from g.a.s.t., and bind "any participant or third party" — so being
 * independent does not place us outside it. On 18 November 2026 the four
 * quotations in the section guides were paraphrased for that reason.
 *
 * Paraphrasing is risk reduction, not legal clearance. This gate exists so the
 * reduction cannot silently erode: a `quote` block reappearing in a guide, or a
 * new run of official wording, has to be a deliberate act rather than a drift.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { normalise, hashGram, N } from '../gam/lib/ngrams.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => readFileSync(root + p, 'utf8')
const SECTIONS = ['figure-sequences', 'mathematical-equations', 'latin-squares']

const corpus = new Set(JSON.parse(read('content/gam/official-ngram-hashes.json')).hashes)

/** Every n-gram of `text` that also appears in the official materials. */
function overlaps(text) {
  const w = normalise(text).split(' ').filter(Boolean)
  const hits = new Set()
  for (let i = 0; i + N <= w.length; i++) {
    const gram = w.slice(i, i + N).join(' ')
    if (corpus.has(hashGram(gram))) hits.add(gram)
  }
  return [...hits]
}

test('the originality corpus is loaded — this gate fails closed without it', () => {
  assert.ok(corpus.size > 1000, `corpus holds only ${corpus.size} grams`)
})

test('no section guide reproduces official wording', () => {
  for (const section of SECTIONS) {
    const found = overlaps(read(`content/sections/${section}/guide.ts`))
    assert.deepEqual(found, [], `${section}: guide reproduces official wording`)
  }
})

test('no guide presents anything as a direct quotation', () => {
  // The `quote` block renders a blockquote labelled "Official wording". A
  // paraphrase in one would be a misrepresentation, which is worse than either
  // quoting or paraphrasing honestly.
  for (const section of SECTIONS) {
    const src = read(`content/sections/${section}/guide.ts`)
    assert.ok(
      !src.includes("type: 'quote'"),
      `${section}: a quote block is back. If official wording is now permitted, say so here and in docs/COPYRIGHT_REVIEW.md.`,
    )
  }
})

test('the two fragments that remain are the duration discrepancy, and only those', () => {
  // Reporting that two official sources conflict requires both wordings; a
  // paraphrase would destroy the evidence for the claim. Nine words each.
  const found = overlaps(read('content/exam/claims.ts'))
  for (const gram of found) {
    assert.match(
      gram,
      /three hours with a break of/,
      `content/exam/claims.ts reproduces official wording beyond the duration discrepancy: "${gram}"`,
    )
  }
})

test('NEGATIVE CONTROL: the detector catches official wording when it is there', () => {
  // The exact sentence that was removed from the Latin Squares guide.
  const removed =
    'Each letter can only appear once in each row and each column. Only the letters that are shown as response options can appear in the grid.'
  assert.ok(
    overlaps(removed).length > 10,
    'the detector would not notice an official passage pasted back into a guide',
  )
})
