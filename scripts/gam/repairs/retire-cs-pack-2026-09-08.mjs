/**
 * Retire the computational-sciences operation-counts pack, 8 September 2026.
 *
 * Not for a wrong answer. Two independent rounds agreed with all seven keys, the
 * pack has no ambiguity finding, no outside-knowledge finding and no §5.10
 * finding. It is retired because its questions give away their own source.
 *
 * The independent round of 8 September (Claude Opus 5, both halves, neither
 * shown the key) rated SIX of its seven questions DECISIVELY coupled, and showed
 * exactly how: the option lists reconstruct Table 1 outright, without the table
 * ever being seen.
 *
 *   q7's options factor exactly — 1,392,640 = 4096 x 340, 1,409,054 - 1,392,640
 *   = 16,414, 16,754 = 16,414 + 340 — which yields SPLIT(4096) = 340 and
 *   SCAN(4096) = 16,414. q2's options are spaced by exactly 25 and q3 asserts a
 *   constant rise per doubling, which gives SPLIT(n) = 40 + 25 log2 n. q5's
 *   option a is SCAN(256), which gives SCAN(n) = 4n + 30. q1's options 128 and
 *   32,768 stand in the ratio of one table step squared, which gives PAIR(n) =
 *   n^2 / 2. Every row of Table 1 then follows, and with it q1, q2, q3, q4, q5
 *   and q6.
 *
 * This is a pack-level design fault and not a question-level one. Each item is
 * individually sound; it is the arithmetic relationship BETWEEN their option
 * lists that leaks. Retiring the six decisively coupled questions would leave
 * one, so retiring them individually is pack retirement under another name.
 *
 * The repository's own standard, written before this round, is that a pack
 * carrying more than three decisive findings is past question-level repair
 * (scripts/test/gam-packs.test.mjs). This pack carries six.
 *
 * WHAT A REPLACEMENT SHOULD DO DIFFERENTLY. Not "write better distractors". The
 * fault is that every numeric option is a closed-form function of a tabulated
 * value, so each option list is a simultaneous equation in the source's own
 * constants, and seven of them over-determine the table. A replacement wants far
 * fewer numeric items on one table — two at most — or a source whose questions
 * do not all reduce to arithmetic on the same handful of constants.
 *
 * Reversible: the pack is kept in full, as break-even is, and nothing renumbers.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { contentHash } from '../lib/validate.mjs'

const url = new URL(
  '../../../content/gam/packs/gam-computational-sciences-operation-counts-001.json',
  import.meta.url,
)
const file = JSON.parse(readFileSync(url, 'utf8'))
const p = file.pack.provenance

p.reviewStatus = 'rejected'
p.retiredOn = '2026-09-08'
p.retiredBecause =
  'Fails spec §5.9 at pack level. The independent round of 8 September 2026 — Claude Opus 5 on both ' +
  'halves, neither shown the answer key — rated six of the pack’s seven questions DECISIVELY coupled, and ' +
  'demonstrated the mechanism: the option lists reconstruct Table 1 in full without the table being seen. ' +
  'q7’s options factor exactly into SPLIT(4096) = 340 and SCAN(4096) = 16,414; q2’s options are spaced by ' +
  'exactly 25 and q3 asserts a constant rise per doubling, giving SPLIT(n) = 40 + 25 log2 n; q5’s first ' +
  'option is SCAN(256), giving SCAN(n) = 4n + 30; q1’s 128 and 32,768 stand in the ratio of one table step ' +
  'squared, giving PAIR(n) = n^2 / 2. Every row of the table follows, and with it six of the seven answers. ' +
  'No key is wrong — both rounds agreed with all seven — and there is no ambiguity, outside-knowledge or ' +
  '§5.10 finding against it. The fault is the arithmetic relationship between the option lists, which is a ' +
  'pack-level design fault: each item is individually sound. Retiring the six coupled questions would ' +
  'leave one, so this is retirement under its proper name. A replacement should carry at most two numeric ' +
  'items on one table, or use a source whose questions do not all reduce to arithmetic on the same few ' +
  'constants. Kept in full as the evidence; counts for nothing.'
p.retirementCaveat =
  'ADJUDICATOR STRENGTH DECIDED THIS. The same seven questions were adjudicated one day earlier by Claude ' +
  'Sonnet 5, which rated three of them narrowing and NONE decisive. Nothing about the content changed ' +
  'between the two rounds. The pack was re-run under the stronger reader only because the step-rebate pack ' +
  'had been, and comparing packs judged by different readers would have been meaningless. Had that ' +
  're-run not happened, this pack would have been reported as the mildest of the four. That is the ' +
  'strongest evidence this pilot has produced that a clean adjudication round describes the reader as ' +
  'much as the content.'

file.pack.contentHash = contentHash(file)
writeFileSync(url, `${JSON.stringify(file, null, 2)}\n`)
console.log(`computational-sciences: retired · ${file.questions.length} questions withdrawn · hash ${file.pack.contentHash}`)
