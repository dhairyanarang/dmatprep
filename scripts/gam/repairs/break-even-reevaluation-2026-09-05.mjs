/**
 * Break-even pack: the re-evaluation verdict of 5 September 2026.
 *
 * The pack was retired on 4 September 2026 for failing the original §5.10, which
 * required a pack to contribute a materially non-generic relationship. That rule
 * was withdrawn on 5 September 2026 because the official material fails it, so
 * the retirement was re-opened and the pack put back in front of the independent
 * adjudicators under the corrected rule. It passed.
 *
 * Passing is not restoration. The step-rebate pack already fills the business
 * administration slot this one vacated, so restoring it would take the active
 * pilot from 24 questions to 31 — scaling, which is out of scope. It stays
 * retired, and the decision that remains is about coverage rather than quality.
 *
 * This script exists so that verdict is reproducible rather than hand-written
 * into the pack: the retirement reason is rewritten to say it is superseded, and
 * the finding is recorded beside it.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { contentHash } from '../lib/validate.mjs'

const url = new URL(
  '../../../content/gam/packs/gam-business-administration-break-even-001.json',
  import.meta.url,
)
const file = JSON.parse(readFileSync(url, 'utf8'))
const p = file.pack.provenance

p.retiredBecause =
  'SUPERSEDED REASON, kept for the record: it was retired on 4 September 2026 for failing the original §5.10, ' +
  'which required a pack to contribute a materially non-generic relationship. That rule was withdrawn on ' +
  '5 September 2026 because the official material fails it — Exercise 3 is the optimal order quantity model, ' +
  'a textbook formula, with a stated-assumption question, comparative statics, a pure plug-in on ' +
  'source-supplied values and a chart-reading question. This pack matched that exercise question for ' +
  'question, which is why it was retired.'

p.reEvaluated = {
  on: '2026-09-05',
  under: 'the corrected §5.10 (the source must materially contribute; the governing relationship may be standard)',
  result:
    'PASSES. The independent round of 5 September 2026 judged all 7 questions to draw materially on the ' +
    'source, agreed with all 7 keys, and found no ambiguity, no outside-knowledge dependence and no ' +
    'correctness defect. Two questions (q2, q6) can be narrowed using a sibling; three (q1, q4, q7) are ' +
    'recall-flagged, and all three match forms the official material demonstrates — Ex 3 Q1 identifies a ' +
    'stated assumption and Ex 3 Q7 reads a chart.',
  disposition: 'ELIGIBLE FOR RESTORATION, NOT RESTORED.',
  why:
    'Eligibility is a content judgement and it is met. Restoration is a bank-composition decision and it is ' +
    'not required: the step-rebate pack already fills the business-administration slot it vacated, so ' +
    'restoring would take the active pilot from 24 questions to 31 — scaling, which this pass was told not ' +
    'to do. It stays retired pending that decision, and the decision is now about coverage rather than ' +
    'about quality.',
}

file.pack.contentHash = contentHash(file)
writeFileSync(url, `${JSON.stringify(file, null, 2)}\n`)
console.log(`break-even: re-evaluation recorded · hash ${file.pack.contentHash}`)
