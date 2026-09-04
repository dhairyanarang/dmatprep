/**
 * Adjudication rounds and the production-readiness gate (spec §5.8).
 *
 * Two rules this file exists to enforce.
 *
 * **An author cannot certify their own work.** The pilot's adjudication round was performed by the model that wrote
 * the packs, which makes it evidence and not review. Relabelling that round as
 * `independent` must not get it past the gate, so independence is checked
 * against the pack authors' identities rather than against a self-declared flag
 * alone.
 *
 * **A round certifies the content it actually saw, and nothing else.** Repairing
 * a pack after it was adjudicated silently turns its review into a review of
 * something that no longer exists — which is how the repaired pilot briefly
 * appeared to have three keys its independent adjudicator disagreed with, on
 * questions that adjudicator had never been shown. A round therefore records
 * the content hash of every pack it judged, and stops counting the moment one of
 * them moves.
 */

export const DEPENDENCY_CLASSES = ['source-determined', 'source-supported', 'source-independent']

/** Every field a per-question adjudication record must carry (spec §5.8). */
export const REQUIRED_RECORD_FIELDS = [
  'chosenOption',
  'dependency',
  'requiresOutsideKnowledge',
  'sourceMateriallySupportsAnswer',
  'exactlyOneDefensibleOption',
  'rationale',
  'adjudicator',
  'adjudicatedAt',
]

/**
 * Why a round no longer covers the packs as they stand. Empty means it is current.
 *
 * A round that records nothing about what it judged can never be shown to be
 * current, so it fails here rather than being given the benefit of the doubt.
 */
/**
 * Does this round cover one particular pack, as that pack now stands?
 *
 * Coverage is per pack because rounds are: adding a new pack to the pilot must
 * not un-adjudicate the ones already judged, and repairing one pack must not
 * leave a stale verdict standing over it.
 */
export function coversPack(round, packId, hash) {
  // A pack with no current hash is not part of the active set — a retired one,
  // typically — and no round covers it.
  if (!hash) return [`pack "${packId}" is not in the active set`]
  const recorded = round?.adjudicatedContent?.[packId]
  if (!recorded) return [`pack "${packId}" was not covered by round "${round?.id ?? '(none)'}"`]
  if (recorded !== hash) {
    return [
      `pack "${packId}" has changed since round "${round.id}" adjudicated it ` +
        `(judged ${recorded.slice(0, 8)}…, now ${hash.slice(0, 8)}…)`,
    ]
  }
  return []
}

export function contentFailures(round, packHashes) {
  if (!round) return ['no round supplied']
  const recorded = round.adjudicatedContent
  if (!recorded || typeof recorded !== 'object') {
    return ['the round records no adjudicatedContent, so what it judged cannot be established']
  }
  const failures = []
  for (const [packId, hash] of Object.entries(packHashes ?? {})) {
    if (!recorded[packId]) failures.push(`pack "${packId}" was not covered by the round`)
    else if (recorded[packId] !== hash) {
      failures.push(
        `pack "${packId}" has changed since it was adjudicated ` +
          `(judged ${recorded[packId].slice(0, 8)}…, now ${hash.slice(0, 8)}…)`,
      )
    }
  }
  for (const packId of Object.keys(recorded)) {
    if (packHashes && !(packId in packHashes)) failures.push(`records pack "${packId}", which no longer exists`)
  }
  return failures
}

/**
 * Why a round does or does not count as independent. Returns the list of
 * failures, so an empty list means it qualifies.
 */
export function independenceFailures(round, authors) {
  const failures = []
  if (!round) return ['no round supplied']
  if (round.kind !== 'independent') failures.push(`kind is "${round.kind}", not "independent"`)
  if (round.countsAsIndependentReview !== true) failures.push('countsAsIndependentReview is not true')
  if (round.status === 'pending') failures.push('round is still pending')
  if (round.status === 'superseded') failures.push('round is marked superseded')

  const a = round.adjudicator ?? {}
  if (a.independentOfAuthor !== true) failures.push('adjudicator.independentOfAuthor is not true')
  if (!a.identity) failures.push('adjudicator.identity is missing')
  else if (authors.includes(a.identity)) {
    // The load-bearing check: an author relabelling their own round cannot pass.
    failures.push(`adjudicator "${a.identity}" is an author of these packs`)
  }
  if (!round.adjudicatedAt) failures.push('adjudicatedAt is missing')
  return failures
}

/**
 * The qualifying independent round, or null with the reasons it did not qualify.
 *
 * `packHashes` maps pack id to current content hash. It is required for a round
 * to qualify: without it there is no way to tell a current round from one whose
 * content has moved underneath it.
 */
export function findIndependentRound(adjudications, authors, packHashes, packId) {
  const rounds = adjudications?.rounds ?? []
  const candidates = rounds.filter((r) => r.kind === 'independent')
  // With a pack named, only that pack's coverage matters; without one, the round
  // must cover the whole active set.
  const reasons = (round) => [
    ...independenceFailures(round, authors),
    ...(packId
      ? coversPack(round, packId, packHashes?.[packId])
      : contentFailures(round, packHashes)),
  ]
  for (const round of candidates) {
    if (reasons(round).length === 0) return { round, failures: [] }
  }
  return {
    round: null,
    failures: candidates.length
      ? reasons(candidates[candidates.length - 1])
      : ['no round with kind "independent" exists'],
  }
}

/** Is this round's judgement still about the packs as they now stand? */
export const isCurrent = (round, packHashes) => contentFailures(round, packHashes).length === 0

export const findSelfRound = (adjudications) =>
  (adjudications?.rounds ?? []).find((r) => r.kind === 'self') ?? null

/**
 * Validate one round's per-question records against the questions it covers.
 * `strict` applies the full field requirements; a pending round is only checked
 * for coverage.
 */
export function validateRound(round, questions, { strict = true } = {}) {
  const errors = []
  const records = round?.questions ?? {}

  for (const q of questions) {
    const rec = records[q.id]
    if (!rec) {
      errors.push(`${q.id}: no record in round "${round.id}"`)
      continue
    }
    if (!strict || rec.status === 'pending') continue

    for (const field of REQUIRED_RECORD_FIELDS) {
      if (rec[field] === undefined || rec[field] === null) {
        errors.push(`${q.id}: round "${round.id}" record is missing "${field}"`)
      }
    }
    if (rec.dependency && !DEPENDENCY_CLASSES.includes(rec.dependency)) {
      errors.push(`${q.id}: unknown dependency "${rec.dependency}"`)
    }
    if (rec.dependency === 'source-independent') {
      errors.push(`${q.id}: adjudged source-independent — the pack contributes nothing material`)
    }
    if (rec.chosenOption && rec.chosenOption !== q.correctOptionId) {
      errors.push(`${q.id}: blind answer "${rec.chosenOption}" disagrees with the key "${q.correctOptionId}"`)
    }
    if (rec.requiresOutsideKnowledge === true) {
      errors.push(`${q.id}: adjudged to require outside knowledge, which GAM PDF p. 6 rules out`)
    }
    if (rec.sourceMateriallySupportsAnswer === false) {
      errors.push(`${q.id}: adjudged not materially supported by its source`)
    }
    if (rec.exactlyOneDefensibleOption === false) {
      errors.push(`${q.id}: adjudged to leave more than one defensible option`)
    }
    // The human half of the §5.9 gate. `leakage.mjs` catches what is mechanical;
    // an adjudicator reading a pack's questions side by side catches what is not
    // — concepts, and the shape of option sets.
    //
    // Severity is the adjudicator's to judge, not this file's. A sibling that
    // *settles* a question is as fatal as a wrong key. A sibling that eliminates
    // one option is a real fault and a real cost to the item, but whether it
    // sinks the item is a judgement, so it blocks in `readiness` rather than
    // failing here. An unrated finding is treated as decisive.
    if (rec.evidence?.ablationLeaks === true && rec.evidence.ablationLeakSeverity !== 'narrowing') {
      const by = rec.evidence.ablationLeakedBy?.join(', ') || 'a sibling'
      errors.push(`${q.id}: an independent adjudicator found it settled by ${by} (spec §5.9)`)
    }
  }
  return errors
}

/**
 * Readiness for one pack. `automated-pass` is not production-ready and the
 * blockers say exactly what is still missing.
 */
export function readiness({ pack, questions, adjudications, authors, packHashes, validationErrors = [] }) {
  const blockers = []

  // A retired pack is kept as evidence for why it was retired. It is not content,
  // so it is not measured against readiness — saying it needs a human reviewer
  // would imply someone should still be looking at it.
  if (pack.provenance.reviewStatus === 'rejected') {
    return {
      retired: true,
      automatedPass: validationErrors.length === 0,
      independentlyAdjudicated: false,
      humanReviewed: false,
      productionReady: false,
      blockers: [`retired: ${pack.provenance.retiredBecause ?? 'no reason recorded'}`],
    }
  }

  const automatedPass = validationErrors.length === 0
  if (!automatedPass) blockers.push(`${validationErrors.length} automated validation error(s)`)

  const { round: independent, failures } = findIndependentRound(
    adjudications,
    authors,
    packHashes,
    pack.id,
  )
  let independentlyAdjudicated = false
  if (!independent) {
    blockers.push(`no independent adjudication (${failures.join('; ')})`)
  } else {
    const roundErrors = validateRound(independent, questions, { strict: true })
    if (roundErrors.length) blockers.push(`independent adjudication raised ${roundErrors.length} issue(s)`)
    else independentlyAdjudicated = true
  }

  // §5.10 at pack level. A question may depend on the source for its data alone;
  // a pack may not. What the pack contributes, and which of its questions
  // actually require it, is the independent adjudicator's judgement, recorded on
  // the round.
  if (independent) {
    const contribution = independent.packContributions?.[pack.id]
    if (!contribution) {
      blockers.push('the round records no §5.10 judgement for this pack')
    } else if (contribution.contributesNonGenericElement !== true) {
      blockers.push(
        `§5.10: the pack contributes nothing non-generic — ${contribution.whatItContributes ?? 'no reason recorded'}`,
      )
    } else if ((contribution.questionsRequiringIt ?? []).length < 2) {
      // One question touching it is decoration, not a contribution.
      blockers.push(
        `§5.10: only ${(contribution.questionsRequiringIt ?? []).length} question(s) require what the pack contributes`,
      )
    }
  }

  // Narrowing leaks do not fail validation, but nothing ships with one open.
  if (independent) {
    const narrowed = questions.filter(
      (q) => independent.questions?.[q.id]?.evidence?.ablationLeakSeverity === 'narrowing',
    )
    if (narrowed.length) {
      blockers.push(
        `${narrowed.length} question(s) an adjudicator could narrow using a sibling: ` +
          `${narrowed.map((q) => q.id).join(', ')}`,
      )
    }
  }

  const humanReviewed = pack.provenance.reviewStatus === 'human-reviewed'
  if (!humanReviewed) blockers.push('not signed off by a person')
  else if (!pack.provenance.reviewedBy || !pack.provenance.reviewedAt) {
    blockers.push('claims human review without a named reviewer and date')
  }

  return {
    retired: false,
    automatedPass,
    independentlyAdjudicated,
    humanReviewed,
    productionReady: automatedPass && independentlyAdjudicated && humanReviewed && blockers.length === 0,
    blockers,
  }
}
