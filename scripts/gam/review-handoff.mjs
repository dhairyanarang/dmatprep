#!/usr/bin/env node
/**
 * The human-review handoff for the GAM pilot.
 *
 *   npm run review:gam
 *
 * Writes content/gam/review/handoff.json and prints it. Everything in it is
 * derived from the packs and the current adjudication round, so it cannot drift
 * from the record the way a hand-written brief would.
 *
 * The point of this file is to keep three things apart that are easy to blur:
 *
 *   AUTOMATED VALIDATION  is exhaustive and mechanical. It proves a pack is
 *   internally coherent, traceable, original and free of arithmetic leakage. It
 *   proves nothing about whether an answer is right.
 *
 *   INDEPENDENT ADJUDICATION  is evidence from adjudicators who are not the
 *   author and never saw the key. It is strong evidence and it is not proof: it
 *   varies with who is doing the adjudicating, which the current round documents
 *   at first hand.
 *
 *   HUMAN REVIEW  is a person taking responsibility. Nothing here substitutes for
 *   it, and no pack ships without it.
 *
 * A reviewer's job is the decisions listed per pack. Each names what must be
 * settled, what the evidence is, and what follows from each answer.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'

import { analyseLeakage } from './lib/leakage.mjs'
import { findIndependentRound, readiness, validateRound } from './lib/review.mjs'
import { contentHash, validatePack } from './lib/validate.mjs'

// `--set <name>` prepares the handoff for a candidate set under
// content/gam/sets/<name>/ rather than for the deployed pilot.
const setArg = process.argv.indexOf('--set')
const set = setArg === -1 ? null : process.argv[setArg + 1]
const base = set
  ? new URL(`../../content/gam/sets/${set}/`, import.meta.url)
  : new URL('../../content/gam/', import.meta.url)
const packsDir = new URL('packs/', base)
const reviewUrl = new URL('review/adjudications.json', base)
const flagsUrl = new URL('review/review-flags.json', base)
const outUrl = new URL('review/handoff.json', base)
const corpusUrl = new URL('../../content/gam/official-ngram-hashes.json', import.meta.url)

// Fail closed, for the same reason verify-packs does: a handoff built without
// the originality gate having run looks exactly like one where it passed.
if (!existsSync(corpusUrl)) {
  console.error('✗ no originality corpus — a review handoff without the originality gate is misleading.')
  process.exit(1)
}
const corpus = new Set(JSON.parse(readFileSync(corpusUrl, 'utf8')).hashes)
const adjudications = JSON.parse(readFileSync(reviewUrl, 'utf8'))
const flags = JSON.parse(readFileSync(flagsUrl, 'utf8'))
const authors = adjudications.packAuthors ?? []

const files = readdirSync(packsDir)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(new URL(f, packsDir), 'utf8')))

const retired = files.filter((f) => f.pack.provenance.reviewStatus === 'rejected')
const active = files.filter((f) => f.pack.provenance.reviewStatus !== 'rejected')
const packHashes = Object.fromEntries(active.map((f) => [f.pack.id, contentHash(f)]))

// Coverage is per pack: packs added later are adjudicated in their own round
// rather than re-opening the ones already judged.
const roundFor = (packId) => findIndependentRound(adjudications, authors, packHashes, packId).round
const reasonsFor = (packId) => findIndependentRound(adjudications, authors, packHashes, packId).failures
if (!active.some((f) => roundFor(f.pack.id))) {
  console.error('no active pack has a current independent round; nothing to hand over')
  process.exit(1)
}

/** A decision only a person can take, with what it turns on. */
const decision = (id, question, evidence, ifAccepted, ifNot) => ({
  id,
  question,
  evidence,
  ifAccepted,
  ifNotAccepted: ifNot,
})

const packs = active.map((file) => {
  const { pack, questions } = file
  const round = roundFor(pack.id)
  const { errors, warnings } = validatePack(file, { corpus })
  const leak = analyseLeakage(pack, questions)
  const roundErrors = round ? validateRound(round, questions, { strict: true }) : []
  const state = readiness({
    pack,
    questions,
    adjudications,
    authors,
    packHashes,
    validationErrors: errors,
  })

  const rec = (q) => round?.questions?.[q.id] ?? {}
  const sev = (q) => rec(q).evidence?.ablationLeakSeverity
  const decisive = questions.filter((q) => sev(q) === 'decisive')
  const narrowing = questions.filter((q) => sev(q) === 'narrowing')
  const contribution = round?.packContributions?.[pack.id] ?? {}

  const decisions = []

  if (!round) {
    decisions.push(
      decision(
        `${pack.id}::awaiting-adjudication`,
        'This pack has not been through an independent adjudication round as it now stands, so there is ' +
          `nothing yet for a reviewer to weigh: ${reasonsFor(pack.id).join('; ')}.`,
        [{ note: 'Run the round before reviewing this pack.' }],
        'n/a — the round must run first.',
        'n/a — the round must run first.',
      ),
    )
  }

  if (decisive.length) {
    decisions.push(
      decision(
        `${pack.id}::decisive-coupling`,
        `An adjudicator shown these questions with no source at all judged ${decisive.length} of them ` +
          `settled by a sibling: ${decisive.map((q) => q.id).join(', ')}. Is that judgement right, and if ` +
          'it is, does the pack need rebuilding?',
        decisive.map((q) => ({
          questionId: q.id,
          leakedBy: rec(q).evidence?.ablationLeakedBy ?? [],
          detail: rec(q).evidence?.ablationLeakDetail ?? '',
        })),
        'The pack clears its last automated blocker and needs only sign-off.',
        'The coupled questions must be rebuilt, which retires this round and requires a fresh one.',
      ),
    )
  }

  const recallOnly = questions.filter((q) => rec(q).requiresApplication === false)
  const noContribution = questions.filter((q) => rec(q).sourceMateriallyContributes === false)
  if (recallOnly.length || noContribution.length) {
    decisions.push(
      decision(
        `${pack.id}::section-5-10`,
        'Spec §5.10 requires the source to contribute something the question uses, and the question to ' +
          `apply it rather than repeat it. The adjudicator found ${noContribution.length} question(s) the ` +
          `source contributes nothing to and ${recallOnly.length} that ask only for recall. Are those ` +
          'judgements right?',
        [
          { noContribution: noContribution.map((q) => q.id) },
          { recallOnly: recallOnly.map((q) => q.id) },
          {
            note:
              'The rule was corrected on 5 September 2026: a standard relationship applied to ' +
              'source-supplied values passes, because that is what official Exercise 3 does. Only a ' +
              'question whose answer is unchanged with the source removed entirely fails.',
          },
        ],
        'The pack clears §5.10 and needs only sign-off.',
        'The named questions are rebuilt or retired.',
      ),
    )
  }

  if (narrowing.length) {
    decisions.push(
      decision(
        `${pack.id}::narrowing-couplings`,
        `${narrowing.length} question(s) can be narrowed — not settled — using a sibling: ` +
          `${narrowing.map((q) => q.id).join(', ')}. Is the cost to each item acceptable, or must they be ` +
          'rebuilt? Spec §5.9 leaves this to a person because severity is a judgement.',
        narrowing.map((q) => ({
          questionId: q.id,
          leakedBy: rec(q).evidence?.ablationLeakedBy ?? [],
          detail: rec(q).evidence?.ablationLeakDetail ?? '',
        })),
        'The findings are recorded as accepted and stop blocking.',
        'The affected questions are rebuilt, which retires this round.',
      ),
    )
  }

  decisions.push(
    decision(
      `${pack.id}::sign-off`,
      'Having read the source and every question, key, explanation and refutation: is this pack correct, ' +
        'fair and fit to put in front of a candidate?',
      [
        { contentHash: contentHash(file), questions: questions.length },
        { note: 'Sign-off requires a named reviewer and a date; the gate rejects a claim without both.' },
      ],
      'reviewStatus becomes human-reviewed and the pack can ship.',
      'reviewStatus becomes rejected and the pack is retired.',
    ),
  )

  return {
    id: pack.id,
    domain: pack.domain,
    title: pack.title,
    questions: questions.length,
    contentHash: contentHash(file),
    reviewStatus: pack.provenance.reviewStatus,
    automated: {
      errors: errors.length,
      warnings: warnings.length,
      leakageErrors: leak.errors.length,
      leakageWarnings: leak.warnings.length,
    },
    independent: {
      round: round?.id ?? null,
      raisedIssues: roundErrors,
      dependency: {
        determined: questions.filter((q) => rec(q).dependency === 'source-determined').length,
        supported: questions.filter((q) => rec(q).dependency === 'source-supported').length,
        independent: questions.filter((q) => rec(q).dependency === 'source-independent').length,
      },
      contributesUnderSection510: contribution,
    },
    blockers: state.blockers,
    decisions,
    flaggedQuestions: Object.fromEntries(
      questions
        .map((q) => [q.id, flags.questionFlags?.[q.id] ?? []])
        .filter(([, f]) => f.length),
    ),
  }
})

const handoff = {
  generatedBy: 'scripts/gam/review-handoff.mjs — derived, never hand-edited',
  generatedFor: 'human review of the GAM pilot (spec §5.8, §5.9, §5.10)',
  theThreeGates: {
    automatedValidation:
      'Exhaustive and mechanical. Proves a pack is internally coherent, traceable, original and free of ' +
      'arithmetic cross-question leakage. Proves nothing about whether an answer is right.',
    independentAdjudication:
      'Evidence from adjudicators who are not the author and never saw the key. Strong evidence, not proof.',
    humanReview:
      'A person taking responsibility. Nothing substitutes for it and no pack ships without it.',
  },
  caveat: [...new Set(active.map((f) => roundFor(f.pack.id)?.caveat).filter(Boolean))].join('\n\n') || null,
  caveatAppliesTo:
    'Every figure drawn from the round that carries it, including the blind re-answer agreement rate. ' +
    'Do not quote that rate without this qualification.',
  rounds: [...new Set(active.map((f) => roundFor(f.pack.id)).filter(Boolean))].map((r) => ({
    id: r.id,
    adjudicator: r.adjudicator,
    method: r.method,
    boundTo: r.adjudicatedContent,
    caveat: r.caveat ?? null,
  })),
  activePacks: packs.length,
  activeQuestions: packs.reduce((n, p) => n + p.questions, 0),
  retiredPacks: retired.map((f) => ({
    id: f.pack.id,
    questions: f.questions.length,
    retiredOn: f.pack.provenance.retiredOn,
    retiredBecause: f.pack.provenance.retiredBecause,
    excludedFrom: ['pilot counts', 'readiness calculations', 'the adjudication round', 'production'],
  })),
  packs,
}

writeFileSync(outUrl, `${JSON.stringify(handoff, null, 2)}\n`)

/* ------------------------------------------------------------------ report */

const rule = (s) => console.log(`\n${s}\n${'─'.repeat(s.length)}`)

rule('GAM pilot — handoff for human review')
console.log(`${handoff.activePacks} active packs · ${handoff.activeQuestions} questions`)
for (const r of handoff.retiredPacks) {
  console.log(`${r.questions} questions in ${r.id} are RETIRED and excluded from every count above`)
}

rule('⚠ READ THIS BEFORE QUOTING ANY FIGURE FROM AN ADJUDICATION ROUND')
console.log(handoff.caveat ?? 'No round carries a caveat.')
console.log(`\nApplies to: ${handoff.caveatAppliesTo}`)

rule('The three gates, which are not the same thing')
for (const [k, v] of Object.entries(handoff.theThreeGates)) console.log(`  ${k}\n    ${v}`)

for (const p of packs) {
  rule(`${p.id}  ·  ${p.questions} questions  ·  hash ${p.contentHash}`)
  console.log(
    `  automated : ${p.automated.errors} errors, ${p.automated.warnings} warnings, ` +
      `${p.automated.leakageErrors} leakage errors`,
  )
  console.log(
    `  round     : ${p.independent.round ?? 'NONE — not yet adjudicated as it now stands'}`,
  )
  console.log(
    `  adjudged  : ${p.independent.dependency.determined} determined · ` +
      `${p.independent.dependency.supported} supported · ${p.independent.dependency.independent} independent` +
      `${p.independent.raisedIssues.length ? ` · ${p.independent.raisedIssues.length} issue(s) raised` : ''}`,
  )
  console.log(`  OPEN FOR THE REVIEWER (${p.decisions.length}):`)
  for (const d of p.decisions) {
    console.log(`    • ${d.question}`)
    console.log(`        if accepted → ${d.ifAccepted}`)
    console.log(`        if not      → ${d.ifNotAccepted}`)
  }
}

rule('Nothing here has been signed off')
console.log(`0 of ${packs.length} packs are production-ready. Written to content/gam/review/handoff.json`)
