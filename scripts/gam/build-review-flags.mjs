#!/usr/bin/env node
/**
 * Derive the targeted review flags from whichever adjudication round is current.
 *
 *   node scripts/gam/build-review-flags.mjs
 *
 * Flags were hand-maintained for the first pilot, which meant they went stale
 * the moment a question was repaired and kept pointing a human reviewer at
 * concerns that no longer existed. They are now derived, so they can only ever
 * describe the content as it stands.
 *
 * A flag is not a defect. It is a question for the person who signs the pack off,
 * and the point of writing them down is that the automated gates cannot settle
 * them.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

import { findIndependentRound } from './lib/review.mjs'
import { contentHash } from './lib/validate.mjs'

const packsDir = new URL('../../content/gam/packs/', import.meta.url)
const reviewUrl = new URL('../../content/gam/review/adjudications.json', import.meta.url)
const flagsUrl = new URL('../../content/gam/review/review-flags.json', import.meta.url)

const files = readdirSync(packsDir)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(new URL(f, packsDir), 'utf8')))
  .filter((f) => f.pack.provenance.reviewStatus !== 'rejected')
const packHashes = Object.fromEntries(files.map((f) => [f.pack.id, contentHash(f)]))

const adjudications = JSON.parse(readFileSync(reviewUrl, 'utf8'))
// Each pack is described by whichever round covers it; packs may have been
// adjudicated in different rounds, and a pack with no round is simply skipped.
const roundFor = (packId) =>
  findIndependentRound(adjudications, adjudications.packAuthors, packHashes, packId).round
const covered = files.filter((f) => roundFor(f.pack.id))
if (!covered.length) {
  console.error('no pack has a current independent round to derive flags from')
  process.exit(1)
}

const questionFlags = {}
const add = (id, flag, severity, reason) => {
  ;(questionFlags[id] ??= []).push({ flag, severity, reason })
}

for (const file of covered) {
  const round = roundFor(file.pack.id)
  for (const q of file.questions) {
    const rec = round.questions[q.id]
    if (!rec) continue

    if (rec.dependency === 'source-supported') {
      add(
        q.id,
        'source-supported',
        'review',
        'Classified source-supported: a domain-literate candidate could reason to the answer without ' +
          'reading the pack. Legitimate under spec §5.6 provided the pack supplies the framework and no ' +
          'memorised outside fact is required — the human reviewer should confirm both.',
      )
    }
    if (rec.requiresPackReasoning === false && rec.requiresPackData === true) {
      add(
        q.id,
        'data-dependence-only',
        'review',
        'The independent adjudicator judged this answerable once the pack’s values are in hand, without ' +
          'applying any rule the pack contributes. Legitimate under spec §5.10 — reading a source and ' +
          'applying knowledge to it is what a subject module tests — but a pack made only of these has ' +
          'contributed numerals and nothing else, so the reviewer should weigh the balance across the pack.',
      )
    }
    if (rec.recognitionNotTransfer === true) {
      add(
        q.id,
        'recognition-not-transfer',
        'review',
        'The independent adjudicator judged this a lookup or a restatement of something the source states, ' +
          'rather than an application to a case the source does not work through. A pack needs some of these ' +
          'and should not be built of them; the reviewer should judge the balance across the pack.',
      )
    }
    if (rec.evidence?.ablationVerdict === 'determinable') {
      add(
        q.id,
        'specific-concern',
        'review',
        'An independent adjudicator, shown only the stem and options with no source at all, answered this ' +
          `confidently (${rec.evidence.ablationConfidence} confidence): ${rec.evidence.ablationWouldChoose}. ` +
          'That does not make the item wrong, but it does mean the pack is not what settles it.',
      )
    }
    if (rec.evidence?.ablationLeaks === true) {
      const severity = rec.evidence.ablationLeakSeverity ?? 'unrated'
      add(
        q.id,
        'cross-question-leakage',
        'blocking',
        `An independent adjudicator, shown the pack's questions without its source, could ` +
          `${severity === 'narrowing' ? 'narrow this question' : 'settle this question'} using ` +
          `${rec.evidence.ablationLeakedBy.join(', ')}. ${rec.evidence.ablationLeakDetail}`,
      )
    }
  }
}

const packFlags = {}
for (const file of covered) {
  const round = roundFor(file.pack.id)
  const recs = file.questions.map((q) => round.questions[q.id]).filter(Boolean)
  const supported = recs.filter((r) => r.dependency === 'source-supported').length
  const recognition = recs.filter((r) => r.recognitionNotTransfer === true).length
  const contribution = round.packContributions?.[file.pack.id]
  if (contribution) {
    const requiring = contribution.questionsRequiringIt ?? []
    if (contribution.contributesNonGenericElement !== true || requiring.length < 2) {
      ;(packFlags[file.pack.id] ??= []).push({
        flag: 'section-5-10',
        severity: 'blocking',
        reason:
          `§5.10: the adjudicator recorded the pack’s non-generic contribution as “${contribution.whatItContributes}” ` +
          `and found ${requiring.length} question(s) requiring it. A contribution one question touches is ` +
          'decoration. The reviewer should decide whether the adjudicator has identified everything the pack ' +
          'contributes, or whether the pack genuinely rests on knowledge the candidate already holds.',
      })
    } else {
      ;(packFlags[file.pack.id] ??= []).push({
        flag: 'section-5-10',
        severity: 'review',
        reason:
          `§5.10 satisfied: the pack contributes “${contribution.whatItContributes}”, required by ` +
          `${requiring.length} of its ${recs.length} questions (${requiring.join(', ')}). The reviewer should ` +
          'confirm that this is a real contribution rather than one the adjudicator was generous about.',
      })
    }
  }

  if (supported === recs.length) {
    ;(packFlags[file.pack.id] ??= []).push({
      flag: 'all-source-supported',
      severity: 'review',
      reason:
        `All ${recs.length} questions are classified source-supported, none source-determined. Spec §5.6 ` +
        'does not forbid this — the module is a knowledge-and-application test — but it does require the ' +
        'pack to be shown to be doing real work rather than decorating questions that would stand without ' +
        'it. That judgement is the reviewer\'s, and calibration across packs follows the repaired pilot.',
    })
  }
  if (recognition > recs.length / 2) {
    ;(packFlags[file.pack.id] ??= []).push({
      flag: 'recognition-heavy',
      severity: 'review',
      reason:
        `${recognition} of ${recs.length} questions were judged recognition rather than transfer. Confirm ` +
        'the pack still asks the candidate to do something with the source.',
    })
  }
  if (file.pack.blocks.every((b) => ['heading', 'paragraph', 'list'].includes(b.kind))) {
    ;(packFlags[file.pack.id] ??= []).push({
      flag: 'text-only-pack',
      severity: 'review',
      reason:
        'A text-only pack in a familiar domain is the structurally hardest shape to make genuinely ' +
        'source-dependent, and the case where the line between source-supported and source-independent is ' +
        'thinnest. It warrants the closest reading of the four.',
    })
  }
}

const out = {
  note:
    'Targeted review flags for the GAM pilot. These are open questions for the human reviewer, not ' +
    'defects. Derived from the current independent adjudication round by ' +
    'scripts/gam/build-review-flags.mjs, never hand-edited, so they cannot outlive the content they ' +
    'describe. Held outside the pack files so the pilot questions stay untouched by review bookkeeping.',
  raisedBy: [...new Set(covered.map((f) => roundFor(f.pack.id).id))].sort().join(', '),
  raisedAt: [...new Set(covered.map((f) => roundFor(f.pack.id).adjudicatedAt))].sort().pop(),
  questionFlags,
  packFlags,
}
writeFileSync(flagsUrl, `${JSON.stringify(out, null, 2)}\n`)

const total = Object.values(questionFlags).flat().length
console.log(`derived ${total} question flag(s) across ${Object.keys(questionFlags).length} questions`)
console.log(`         ${Object.values(packFlags).flat().length} pack flag(s) across ${Object.keys(packFlags).length} packs`)
