/**
 * GAM pilot tests.
 *
 * These assert the properties the spec makes mechanical. They deliberately do
 * NOT assert that the answers are correct — no test can, for a prose module —
 * and the review-status test below exists to stop that gap being forgotten.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'

import { analyse } from '../gam/lib/ablation.mjs'
import { closeEnough, evaluate } from '../gam/lib/arith.mjs'
import { gramHashes, hashGram, normalise, overlaps } from '../gam/lib/ngrams.mjs'
import { analyseLeakage, intermediateValues } from '../gam/lib/leakage.mjs'
import {
  contentFailures,
  findIndependentRound,
  findSelfRound,
  independenceFailures,
  isCurrent,
  readiness,
  REQUIRED_RECORD_FIELDS,
  validateRound,
} from '../gam/lib/review.mjs'
import { blockText, contentHash, GAM_DOMAINS, validatePack } from '../gam/lib/validate.mjs'

const packsDir = new URL('../../content/gam/packs/', import.meta.url)
const files = readdirSync(packsDir).filter((f) => f.endsWith('.json')).sort()
const packs = files.map((f) => JSON.parse(readFileSync(new URL(f, packsDir), 'utf8')))
const allQuestions = packs.flatMap((p) => p.questions)

/**
 * A retired pack stays in the repository as the evidence for why it was retired
 * (spec §5.10), and counts for nothing. Everything about the pilot's content is
 * measured against the active set; only structural integrity is asserted of all.
 */
const isRetired = (file) => file.pack.provenance.reviewStatus === 'rejected'
const activePacks = packs.filter((f) => !isRetired(f))
const retiredPacks = packs.filter(isRetired)
const activeQuestions = activePacks.flatMap((p) => p.questions)

const corpusUrl = new URL('../../content/gam/official-ngram-hashes.json', import.meta.url)
const corpus = new Set(JSON.parse(readFileSync(corpusUrl, 'utf8')).hashes)

const adjudications = JSON.parse(
  readFileSync(new URL('../../content/gam/review/adjudications.json', import.meta.url), 'utf8'),
)
const reviewFlags = JSON.parse(
  readFileSync(new URL('../../content/gam/review/review-flags.json', import.meta.url), 'utf8'),
)
const authors = adjudications.packAuthors
const selfRound = findSelfRound(adjudications)
const packHashes = Object.fromEntries(activePacks.map((f) => [f.pack.id, contentHash(f)]))
/**
 * Coverage is per pack. A pack added to the pilot is adjudicated in its own
 * round rather than re-opening the ones already judged, so "the current round"
 * is only ever a question about one pack.
 */
const roundFor = (packId) => findIndependentRound(adjudications, authors, packHashes, packId)
const adjudicatedPacks = () => activePacks.filter((f) => roundFor(f.pack.id).round)
/** Any pack that has a round, for the synthetic gate fixtures. */
const currentIndependent = () => roundFor(adjudicatedPacks()[0]?.pack.id ?? '')
const adjudicatedQuestions = () => adjudicatedPacks().flatMap((f) => f.questions)

/**
 * What the current independent round leaves open on the active packs, written
 * down so it cannot quietly grow and so closing an item has to be a deliberate
 * edit rather than a test that silently starts passing.
 *
 * §5.10 is the gate that emptied `sourceIndependent`: the engineering pack was
 * rebuilt around a stipulated U-value limit its subject naturally carries, and
 * the business-administration pack — textbook end to end — was retired instead
 * of being propped up.
 */
const OUTSTANDING = {
  // Emptied by the §5.10 pass: no question is now answerable with the source
  // removed entirely.
  sourceIndependent: [],
  // All three are the same coupling seen from three sides — q3 asks which layer
  // carries the resistance, and q4 and q6 both turn on the answer. Two earlier
  // and stronger ablation rounds rated it narrowing; this one rated it decisive.
  decisiveLeaks: [
    'gam-eng-tr-001-q3',
    'gam-eng-tr-001-q4',
    'gam-eng-tr-001-q6',
    // The replacement pack's own coupling, and an unstable one: three ablation
    // rounds over the same scheme rated it decisive, then narrowing, then
    // decisive again. Recorded at its harshest reading rather than the kindest.
    'gam-ba-sr-001-q2',
    'gam-ba-sr-001-q3',
  ],
  // §5.10 is satisfied at pack level everywhere but here, where the adjudicator
  // credited the pack with one stipulated convention that one question applies,
  // and did not credit the invented operation-count formulas the whole pack rests
  // on. Left for a person to resolve rather than argued away.
  thinContribution: ['gam-computational-sciences-operation-counts-001'],
}
/** A question the round raised nothing against, for use as a synthetic fixture. */
const cleanQuestion = () => {
  const { round } = currentIndependent()
  return adjudicatedQuestions().find((q) => {
    const rec = round?.questions?.[q.id]
    return rec && rec.dependency !== 'source-independent' && !rec.evidence?.ablationLeaks
  })
}
const stateOf = (file, extra = {}) =>
  readiness({
    pack: file.pack,
    questions: file.questions,
    adjudications,
    authors,
    packHashes,
    validationErrors: [],
    ...extra,
  })

describe('GAM pilot — shape', () => {
  test('four active packs, each within the pilot size band', () => {
    assert.equal(activePacks.length, 4)
    for (const f of activePacks) {
      assert.ok(
        f.questions.length >= 5 && f.questions.length <= 8,
        `${f.pack.id} has ${f.questions.length} questions`,
      )
    }
  })

  test('every pack passes validation with no errors', () => {
    for (const file of packs) {
      const { errors } = validatePack(file, { corpus })
      assert.deepEqual(errors, [], `${file.pack.id}: ${errors.join(' | ')}`)
    }
  })

  test('domains are drawn from the eight the official material names', () => {
    for (const { pack } of packs) assert.ok(GAM_DOMAINS.includes(pack.domain), pack.domain)
    assert.equal(new Set(packs.map((p) => p.pack.domain)).size, 4, 'domains should not repeat')
  })

  test('the four structural formats required of the pilot are present', () => {
    const kinds = (p) => new Set(p.pack.blocks.map((b) => b.kind))
    const has = (p, ...k) => k.every((x) => kinds(p).has(x))
    const figureCount = (p) => p.pack.blocks.filter((b) => b.kind === 'figure').length
    assert.ok(packs.some((p) => has(p, 'formula', 'table')), 'no pack with formula + table')
    assert.ok(packs.some((p) => has(p, 'formula') && figureCount(p) >= 2), 'no pack with formula + 2 figures')
    assert.ok(packs.some((p) => has(p, 'list', 'formula', 'figure')), 'no pack with list + formula + figure')
    assert.ok(
      packs.some((p) => [...kinds(p)].every((k) => k === 'heading' || k === 'paragraph')),
      'no text-only pack',
    )
  })

  test('unique ids across the pilot', () => {
    const packIds = packs.map((p) => p.pack.id)
    assert.equal(new Set(packIds).size, packIds.length)
    const qIds = allQuestions.map((q) => q.id)
    assert.equal(new Set(qIds).size, qIds.length)
  })
})

describe('GAM pilot — official answer format (GAM PDF p. 34)', () => {
  test('every question has exactly four options and exactly one correct', () => {
    for (const q of allQuestions) {
      assert.equal(q.options.length, 4, `${q.id}`)
      assert.equal(new Set(q.options.map((o) => o.id)).size, 4, `${q.id}`)
      const correct = q.options.filter((o) => o.id === q.correctOptionId)
      assert.equal(correct.length, 1, `${q.id}`)
    }
  })

  test('every wrong option has a refutation citing a real block, and the key has none', () => {
    for (const file of packs) {
      const ids = new Set(file.pack.blocks.map((b) => b.id))
      for (const q of file.questions) {
        const wrong = q.options.filter((o) => o.id !== q.correctOptionId).map((o) => o.id)
        assert.deepEqual(Object.keys(q.refutations).sort(), wrong.sort(), `${q.id}`)
        for (const [id, r] of Object.entries(q.refutations)) {
          assert.ok(ids.has(r.blockId), `${q.id}/${id} cites unknown block ${r.blockId}`)
        }
      }
    }
  })
})

describe('GAM pilot — source traceability', () => {
  test('every support quote appears verbatim in the block it cites', () => {
    for (const file of packs) {
      const byId = new Map(file.pack.blocks.map((b) => [b.id, b]))
      for (const q of file.questions) {
        assert.ok(q.supportSpans.length > 0, `${q.id} has no support spans`)
        for (const s of q.supportSpans) {
          const block = byId.get(s.blockId)
          assert.ok(block, `${q.id} cites unknown block ${s.blockId}`)
          assert.ok(blockText(block).includes(s.quote), `${q.id}: quote not in ${s.blockId}`)
        }
      }
    }
  })

  test('targeted ablation removes the evidence for every question', () => {
    for (const file of packs) {
      for (const q of file.questions) {
        const { errors } = analyse(file.pack, q)
        assert.deepEqual(errors, [], `${q.id}: ${errors.join(' | ')}`)
      }
    }
  })

  test('declared dependencies are all actually cited', () => {
    for (const q of allQuestions) {
      const cited = new Set([
        ...q.supportSpans.map((s) => s.blockId),
        ...Object.values(q.refutations).map((r) => r.blockId),
      ])
      for (const id of q.dependsOn) assert.ok(cited.has(id), `${q.id}: ${id} is a phantom dependency`)
    }
  })
})

describe('GAM pilot — computation re-check', () => {
  test('every stored computation evaluates to its expected value and matches the key', () => {
    let checked = 0
    for (const q of allQuestions) {
      if (!q.computation) continue
      checked++
      const value = evaluate(q.computation.expression)
      assert.ok(closeEnough(value, q.computation.expected), `${q.id}: ${value} != ${q.computation.expected}`)
      const correct = q.options.find((o) => o.id === q.correctOptionId)
      const numbers = [...correct.text.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replace(/,/g, '')))
      if (numbers.length) {
        assert.ok(
          numbers.some((n) => closeEnough(n, q.computation.expected)),
          `${q.id}: computed ${q.computation.expected} is not in "${correct.text}"`,
        )
      }
    }
    assert.ok(checked >= 8, `only ${checked} questions carry a machine-checkable computation`)
  })

  test('the evaluator computes correctly and refuses anything it does not understand', () => {
    assert.equal(evaluate('2+3*4'), 14)
    assert.equal(evaluate('(2+3)*4'), 20)
    assert.equal(evaluate('90000/(40-25)'), 6000)
    assert.equal(evaluate('2^3^2'), 512)
    assert.equal(evaluate('sqrt(144)'), 12)
    assert.equal(evaluate('-3+5'), 2)
    assert.throws(() => evaluate('process.exit(1)'), /unknown function|unexpected/)
    assert.throws(() => evaluate('1/0'), /division by zero/)
    assert.throws(() => evaluate('2+'), /unexpected end/)
    assert.throws(() => evaluate(''), /empty expression/)
  })
})

describe('GAM pilot — originality', () => {
  test('no pack overlaps the official material by eight consecutive words', () => {
    for (const file of packs) {
      const text = [
        ...file.pack.blocks.map(blockText),
        ...file.questions.map((q) => [q.stem, ...q.options.map((o) => o.text)].join(' ')),
      ].join(' ')
      const hits = overlaps(text, corpus)
      assert.deepEqual(hits.map((h) => h.gram), [], `${file.pack.id} reproduces official wording`)
    }
  })

  test('the corpus holds hashes only, never recoverable source text', () => {
    const raw = readFileSync(corpusUrl, 'utf8')
    const { hashes } = JSON.parse(raw)
    assert.ok(hashes.length > 1000)
    for (const h of hashes) assert.match(h, /^[0-9a-f]{16}$/)
  })

  test('the originality check actually detects a known official phrase', () => {
    const official = normalise('There are 4 answer options for each question For each')
    const gram = official.split(' ').slice(0, 8).join(' ')
    assert.ok(corpus.has(hashGram(gram)), 'the corpus should recognise official wording')
    assert.equal(gramHashes('too short').length, 0)
  })
})

describe('GAM pilot — self-adjudication is evidence, not review', () => {
  test('the self round covers every question and carries every required field', () => {
    assert.ok(selfRound, 'no self round recorded')
    // The self round predates the replacement pack and never saw it.
    for (const q of allQuestions.filter((x) => selfRound.questions[x.id])) {
      const rec = selfRound.questions[q.id]
      assert.ok(rec, `${q.id} has no self-adjudication`)
      for (const field of REQUIRED_RECORD_FIELDS) {
        assert.notEqual(rec[field], undefined, `${q.id} record is missing "${field}"`)
      }
    }
  })

  test('the self round is superseded, because the content it judged was repaired', () => {
    // Its per-question verdicts are kept as the historical record. They are not
    // claims about the questions as they now stand, and must never read as such.
    assert.equal(selfRound.status, 'superseded')
    assert.ok(!isCurrent(selfRound, packHashes), 'a superseded round must not read as current')
  })

  test('the self round declares itself non-independent and says why', () => {
    assert.equal(selfRound.kind, 'self')
    assert.equal(selfRound.countsAsIndependentReview, false)
    assert.equal(selfRound.adjudicator.independentOfAuthor, false)
    assert.match(selfRound.caveat, /already knows the answer|cannot judge blind|same model that authored/i)
  })

  test('THE GATE: the self round cannot satisfy independent adjudication', () => {
    const failures = independenceFailures(selfRound, authors)
    assert.ok(failures.length > 0, 'a self round must never qualify as independent')
    assert.ok(
      failures.some((f) => /kind is "self"/.test(f)),
      `expected the round kind to disqualify it, got: ${failures.join('; ')}`,
    )
  })

  test('relabelling the self round as independent still fails, because the adjudicator authored the packs', () => {
    const forged = structuredClone(selfRound)
    forged.kind = 'independent'
    forged.countsAsIndependentReview = true
    forged.adjudicator.independentOfAuthor = true
    forged.adjudicatedAt = '2026-09-04'
    const failures = independenceFailures(forged, authors)
    assert.ok(
      failures.some((f) => /is an author of these packs/.test(f)),
      `an author must not be able to certify their own work by relabelling: ${failures.join('; ')}`,
    )
  })

  test('a genuinely independent adjudicator would pass the identity check', () => {
    const other = structuredClone(selfRound)
    other.kind = 'independent'
    other.countsAsIndependentReview = true
    other.adjudicator = {
      identity: 'independent-reviewer-1',
      model: 'a different model',
      kind: 'model',
      independentOfAuthor: true,
    }
    other.adjudicatedAt = '2026-09-04'
    delete other.status
    assert.deepEqual(independenceFailures(other, authors), [])
  })

  test('every adjudicated pack has a complete round covering all of its questions', () => {
   for (const file of adjudicatedPacks()) {
    const { round, failures } = roundFor(file.pack.id)
    assert.ok(round, `${file.pack.id}: no qualifying round: ${failures.join('; ')}`)
    assert.equal(round.status, 'complete')
    for (const q of file.questions) {
      const rec = round.questions[q.id]
      assert.ok(rec, `${q.id} is not covered by the round that governs its pack`)
      for (const field of REQUIRED_RECORD_FIELDS) {
        assert.notEqual(rec[field], undefined, `${q.id} independent record is missing "${field}"`)
      }
      assert.equal(rec.adjudicator.independentOfAuthor, true)
      assert.ok(!authors.includes(rec.adjudicator.identity), `${q.id} adjudicated by an author`)
    }
   }
  })

  test('the independent round was produced by adjudicators who never saw the key', () => {
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    assert.match(round.method, /neither shown the answer key/i)
    assert.match(round.adjudicator.model, /ablation/i)
    assert.match(round.adjudicator.model, /blind/i)
  })

  test('every independent round agrees with every answer key it judged', () => {
    for (const file of adjudicatedPacks()) {
      const round = roundFor(file.pack.id).round
      for (const q of file.questions) {
        assert.equal(
          round.questions[q.id].chosenOption,
          q.correctOptionId,
          `${q.id}: independent adjudicator disagreed with the key`,
        )
      }
    }
  })

  test('the source-independent findings are exactly the ones on record', () => {
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    const bad = adjudicatedQuestions()
      .filter((q) => round.questions[q.id]?.dependency === 'source-independent')
      .map((q) => q.id)
    assert.deepEqual(
      bad.sort(),
      [...OUTSTANDING.sourceIndependent].sort(),
      'the set of questions the pack contributes nothing to has changed',
    )
  })

  test('THE §5.10 GATE: a source-independent question fails its pack outright', () => {
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    const target = cleanQuestion()
    const tampered = structuredClone(round)
    tampered.questions[target.id].dependency = 'source-independent'
    tampered.questions[target.id].sourceMateriallySupportsAnswer = false
    const errors = validateRound(tampered, [target], { strict: true })
    assert.ok(
      errors.some((e) => /source-independent/.test(e)),
      'a pack the candidate does not need must not be adjudicable',
    )
  })

  test('THE §5.10 PACK GATE: a pack contributing nothing non-generic cannot ship', () => {
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    const file = adjudicatedPacks()[0]
    const stripped = structuredClone(adjudications)
    const target = stripped.rounds.find((r) => r.id === roundFor(file.pack.id).round.id)
    target.packContributions[file.pack.id].contributesNonGenericElement = false
    const state = readiness({
      pack: file.pack,
      questions: file.questions,
      adjudications: stripped,
      authors,
      packHashes,
      validationErrors: [],
    })
    assert.ok(
      state.blockers.some((b) => /contributes nothing non-generic/.test(b)),
      `pack-specific values alone must not be enough: ${state.blockers.join('; ')}`,
    )
  })

  test('a non-generic contribution only one question touches is decoration', () => {
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    const file = adjudicatedPacks()[0]
    const stripped = structuredClone(adjudications)
    const target = stripped.rounds.find((r) => r.id === roundFor(file.pack.id).round.id)
    target.packContributions[file.pack.id].questionsRequiringIt = [file.questions[0].id]
    const state = readiness({
      pack: file.pack,
      questions: file.questions,
      adjudications: stripped,
      authors,
      packHashes,
      validationErrors: [],
    })
    assert.ok(state.blockers.some((b) => /question\(s\) require what the pack contributes/.test(b)))
  })

  test('every active pack contributes something non-generic, and the record says what', () => {
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    for (const file of adjudicatedPacks()) {
      const c = roundFor(file.pack.id).round.packContributions?.[file.pack.id]
      assert.ok(c, `${file.pack.id} has no §5.10 judgement`)
      assert.equal(c.contributesNonGenericElement, true, `${file.pack.id}: ${c.whatItContributes}`)
      assert.ok(c.whatItContributes.length > 60, `${file.pack.id} does not say what it contributes`)
    }
  })

  test('the packs whose contribution is too thin to ship are exactly the ones on record', () => {
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    const thin = adjudicatedPacks()
      .filter(
        (f) =>
          (roundFor(f.pack.id).round.packContributions[f.pack.id].questionsRequiringIt ?? [])
            .length < 2,
      )
      .map((f) => f.pack.id)
    assert.deepEqual(thin.sort(), [...OUTSTANDING.thinContribution].sort())
    for (const id of thin) {
      const file = activePacks.find((f) => f.pack.id === id)
      assert.ok(
        stateOf(file).blockers.some((b) => /require what the pack contributes/.test(b)),
        `${id} is thin and does not say so`,
      )
    }
  })

  test('the retired pack is the one §5.10 could not repair, and says why', () => {
    assert.equal(retiredPacks.length, 1)
    const [gone] = retiredPacks
    assert.equal(gone.pack.id, 'gam-business-administration-break-even-001')
    assert.match(gone.pack.provenance.retiredBecause, /§5\.10/)
    assert.ok(gone.pack.provenance.retiredBecause.length > 200, 'a retirement needs its reasoning on record')
    assert.ok(gone.pack.provenance.retiredOn, 'no retirement date')
  })

  test('a retired pack is not measured for readiness at all', () => {
    for (const file of retiredPacks) {
      const state = stateOf(file)
      assert.equal(state.retired, true)
      assert.equal(state.productionReady, false)
      assert.deepEqual(
        state.blockers.filter((b) => /signed off by a person/.test(b)),
        [],
        'a retired pack must not read as merely awaiting a reviewer',
      )
    }
  })

  test('no round still in force reaches into the retired pack', () => {
    // Superseded rounds are the historical record and may name a pack that has
    // since been retired; a round that still counts may not.
    for (const round of adjudications.rounds.filter((r) => r.status === 'complete')) {
      for (const file of retiredPacks) {
        assert.ok(
          !(file.pack.id in (round.adjudicatedContent ?? {})),
          `${round.id} binds ${file.pack.id}, which is retired`,
        )
      }
    }
  })

  test('a pack with an outstanding finding does not clear adjudication, and one without does', () => {
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    const open = new Set([...OUTSTANDING.sourceIndependent, ...OUTSTANDING.decisiveLeaks])
    for (const file of adjudicatedPacks()) {
      const hasOpen = file.questions.some((q) => open.has(q.id))
      assert.equal(
        stateOf(file).independentlyAdjudicated,
        !hasOpen,
        `${file.pack.id}: readiness disagrees with its own findings`,
      )
    }
    // Each pack's decisive findings are one coupling seen from several sides.
    for (const file of adjudicatedPacks()) {
      const mine = OUTSTANDING.decisiveLeaks.filter((id) =>
        file.questions.some((q) => q.id === id),
      )
      if (mine.length) assert.ok(mine.length <= 3, `${file.pack.id} has ${mine.length} decisive findings`)
    }
  })

  test('the independent round rejects a source-independent verdict', () => {
    const round = structuredClone(selfRound)
    const target = allQuestions[0]
    round.questions[target.id].dependency = 'source-independent'
    const errors = validateRound(round, [target], { strict: true })
    assert.ok(errors.some((e) => /source-independent/.test(e)))
  })

  test('the independent round rejects outside knowledge and ambiguous keys', () => {
    const target = allQuestions[0]
    for (const [field, value, pattern] of [
      ['requiresOutsideKnowledge', true, /outside knowledge/],
      ['sourceMateriallySupportsAnswer', false, /not materially supported/],
      ['exactlyOneDefensibleOption', false, /more than one defensible/],
      ['chosenOption', 'zz', /disagrees with the key/],
    ]) {
      const round = structuredClone(selfRound)
      round.questions[target.id][field] = value
      const errors = validateRound(round, [target], { strict: true })
      assert.ok(errors.some((e) => pattern.test(e)), `${field} should have been caught`)
    }
  })
})

describe('GAM pilot — production readiness', () => {
  test('no active pack is production-ready, and every one is still blocked on human review', () => {
    for (const file of activePacks) {
      const state = stateOf(file)
      assert.equal(state.productionReady, false, `${file.pack.id} claims production readiness`)
      assert.equal(state.humanReviewed, false)
      assert.ok(state.blockers.some((b) => /not signed off by a person/.test(b)))
    }
  })

  test('no active pack is production-ready, and every one is still blocked on a person', () => {
    for (const file of activePacks) {
      const state = stateOf(file)
      assert.equal(state.productionReady, false, `${file.pack.id} claims production readiness`)
      assert.ok(state.blockers.some((b) => /not signed off by a person/.test(b)))
    }
  })

  test('a narrowing leak blocks its pack from shipping without failing validation', () => {
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    for (const file of adjudicatedPacks()) {
      const narrowed = file.questions.filter(
        (q) =>
          roundFor(file.pack.id).round.questions[q.id]?.evidence?.ablationLeakSeverity ===
          'narrowing',
      )
      const state = stateOf(file)
      if (narrowed.length) {
        assert.ok(
          state.blockers.some((b) => /could narrow using a sibling/.test(b)),
          `${file.pack.id} has ${narrowed.length} narrowing finding(s) and does not say so`,
        )
      }
      assert.equal(state.productionReady, false)
    }
  })

  test('every active pack sits at automated-pass, and the retired one at rejected', () => {
    for (const { pack } of activePacks) {
      assert.ok(
        ['draft', 'automated-pass'].includes(pack.provenance.reviewStatus),
        `${pack.id} is at "${pack.provenance.reviewStatus}"`,
      )
    }
    for (const { pack } of retiredPacks) assert.equal(pack.provenance.reviewStatus, 'rejected')
  })

  test('a pack claiming human review without a named reviewer is blocked', () => {
    const file = structuredClone(packs[0])
    file.pack.provenance.reviewStatus = 'human-reviewed'
    const state = stateOf(file)
    assert.ok(state.blockers.some((b) => /named reviewer and date/.test(b)))
  })
})

describe('GAM pilot — targeted review flags', () => {
  test('the flags describe the content as it stands, not an earlier version', () => {
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    assert.ok(
      String(reviewFlags.raisedBy).includes(round.id),
      'the flags were raised against a round that no longer governs — rebuild them',
    )
    for (const id of Object.keys(reviewFlags.questionFlags)) {
      assert.ok(
        activeQuestions.some((q) => q.id === id),
        `flags survive for "${id}", which is no longer a question`,
      )
    }
  })

  test('every flag says something a person can act on', () => {
    for (const [id, flags] of Object.entries(reviewFlags.questionFlags)) {
      for (const f of flags) {
        assert.ok(f.reason.length > 60, `${id}/${f.flag} gives the reviewer nothing to go on`)
        assert.ok(['review', 'blocking'].includes(f.severity), `${id}/${f.flag} has severity "${f.severity}"`)
      }
    }
  })

  test('every source-supported question is flagged for review', () => {
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    const supported = adjudicatedQuestions().filter(
      (q) => round.questions[q.id]?.dependency === 'source-supported',
    )
    assert.ok(supported.length > 0)
    for (const q of supported) {
      const flags = reviewFlags.questionFlags[q.id] ?? []
      assert.ok(flags.some((f) => f.flag === 'source-supported'), `${q.id} is not flagged`)
    }
  })

  test('the text-only humanities pack is flagged at pack level', () => {
    const flags = reviewFlags.packFlags['gam-humanities-source-checks-001'] ?? []
    assert.ok(flags.some((f) => f.flag === 'text-only-pack'), 'the text-only pack is not flagged')
  })

  test('a decisive leakage finding fails the round outright', () => {
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    const target = cleanQuestion()
    const tampered = structuredClone(round)
    tampered.questions[target.id].evidence.ablationLeaks = true
    tampered.questions[target.id].evidence.ablationLeakedBy = [activeQuestions[1].id]
    tampered.questions[target.id].evidence.ablationLeakSeverity = 'decisive'
    const errors = validateRound(tampered, [target], { strict: true })
    assert.ok(
      errors.some((e) => /settled by/.test(e)),
      `a decisive leakage finding must be fatal: ${errors.join(' | ')}`,
    )
  })

  test('the questions settled outright by a sibling are exactly the ones on record', () => {
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    const decisive = adjudicatedPacks()
      .flatMap((file) =>
        file.questions.filter((q) => {
          const e = roundFor(file.pack.id).round.questions[q.id]?.evidence
          return e?.ablationLeaks === true && e.ablationLeakSeverity !== 'narrowing'
        }),
      )
      .map((q) => q.id)
    assert.deepEqual(decisive.sort(), [...OUTSTANDING.decisiveLeaks].sort())
  })

  test('a narrowing finding is recorded but does not fail the round', () => {
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    const target = cleanQuestion()
    const tampered = structuredClone(round)
    tampered.questions[target.id].evidence.ablationLeaks = true
    tampered.questions[target.id].evidence.ablationLeakedBy = [activeQuestions[1].id]
    tampered.questions[target.id].evidence.ablationLeakSeverity = 'narrowing'
    assert.deepEqual(
      validateRound(tampered, [target], { strict: true }),
      [],
      'severity is the adjudicator\'s judgement; narrowing must not fail validation outright',
    )
  })

  test('an unrated leak finding is treated as decisive rather than waved through', () => {
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    const target = cleanQuestion()
    const tampered = structuredClone(round)
    tampered.questions[target.id].evidence.ablationLeaks = true
    tampered.questions[target.id].evidence.ablationLeakedBy = [activeQuestions[1].id]
    delete tampered.questions[target.id].evidence.ablationLeakSeverity
    assert.ok(
      validateRound(tampered, [target], { strict: true }).some((e) => /settled by/.test(e)),
      'a finding with no severity must not pass',
    )
  })

  test('flags live outside the pack files, so the 26 questions stay untouched', () => {
    for (const q of allQuestions) {
      assert.equal(q.reviewFlags, undefined, `${q.id} carries flags inline`)
    }
  })
})

describe('GAM pilot — content integrity', () => {
  test('every pack carries a content hash matching its content', () => {
    for (const file of packs) {
      assert.ok(file.pack.contentHash, `${file.pack.id} has no contentHash`)
      assert.equal(file.pack.contentHash, contentHash(file), `${file.pack.id} has been edited since stamping`)
    }
  })

  test('a silent edit is detected', () => {
    const tampered = structuredClone(packs[0])
    tampered.questions[0].correctOptionId = tampered.questions[0].options[3].id
    assert.notEqual(contentHash(tampered), packs[0].pack.contentHash)
  })
})

describe('GAM pilot — cross-question leakage (spec §5.9)', () => {
  const leakOf = (file) => analyseLeakage(file.pack, file.questions)

  /** A pack, and one of its questions whose key is a number that could leak. */
  const numericTarget = () => {
    for (const file of packs) {
      for (const q of file.questions) {
        const correct = q.options.find((o) => o.id === q.correctOptionId)
        if (/\d/.test(correct.text)) return { file, target: q, answer: correct.text }
      }
    }
    throw new Error('no question with a numeric key to plant against')
  }

  // A working copy that keeps the pack, so a planted leak is checked against the
  // real source rather than a fixture that could not occur.
  const withPlant = (file, mutate) => {
    const copy = structuredClone(file)
    mutate(copy)
    return copy
  }

  test('no committed pack leaks a question to its siblings', () => {
    for (const file of packs) {
      const { errors } = leakOf(file)
      assert.deepEqual(errors, [], `${file.pack.id}:\n  ${errors.join('\n  ')}`)
    }
  })

  test('a sibling option stating another question’s answer is caught', () => {
    const { file, target, answer } = numericTarget()
    const planted = withPlant(file, (copy) => {
      const sibling = copy.questions.find((q) => q.id !== target.id)
      sibling.options[0].text = `Definitely not ${answer}`
    })
    const { errors } = leakOf(planted)
    assert.ok(
      errors.some((e) => /literal-answer-leakage/.test(e) && e.includes(target.id)),
      `a planted answer leak went unnoticed: ${errors.join(' | ')}`,
    )
  })

  test('a sibling stem handing over a value the question must read is caught', () => {
    const file = packs.find((p) => p.questions.some((q) => q.computation))
    const target = file.questions.find((q) => q.computation)
    // A number the question takes from the source and does not state itself.
    const needed = [...target.computation.expression.matchAll(/\d[\d.]*/g)]
      .map((m) => Number(m[0]))
      .find((v) => v > 3 && !target.stem.includes(String(v)))
    assert.ok(needed !== undefined, 'no suitable value to plant')
    const planted = withPlant(file, (copy) => {
      const sibling = copy.questions.find((q) => q.id !== target.id)
      sibling.stem = `Given a value of ${needed}, ${sibling.stem}`
    })
    const { errors } = leakOf(planted)
    assert.ok(
      errors.some((e) => /sibling-stem-leakage/.test(e) && e.includes(target.id)),
      `a planted stem leak of ${needed} went unnoticed: ${errors.join(' | ')}`,
    )
  })

  test('an answer reconstructable from two sibling numbers is caught', () => {
    // The distractor family that caused the real failure: a wrong operation
    // applied to the right inputs, which encodes those inputs exactly. Planted
    // from the question's own working, which is what makes it a reconstruction
    // rather than a coincidence.
    const ops = [
      (x, y) => x + y,
      (x, y) => x - y,
      (x, y) => x * y,
      (x, y) => (y === 0 ? NaN : x / y),
    ]
    let found = null
    for (const file of packs) {
      for (const q of file.questions) {
        if (!q.computation || found) continue
        const steps = [...intermediateValues(q.computation.expression)].filter((v) => Math.abs(v) > 3)
        for (const a of steps) {
          for (const b of steps) {
            if (a === b || found) continue
            if (ops.some((fn) => Math.abs(fn(a, b) - q.computation.expected) < 1e-9)) {
              found = { file, target: q, a, b }
            }
          }
        }
      }
    }
    assert.ok(found, 'no question whose answer is one step from its own working')
    const planted = withPlant(found.file, (copy) => {
      const sibling = copy.questions.find((q) => q.id !== found.target.id)
      sibling.options[0].text = String(found.a)
      sibling.options[1].text = String(found.b)
    })
    const { errors } = leakOf(planted)
    assert.ok(
      errors.some((e) => /reconstructable-answer-leakage/.test(e) && e.includes(found.target.id)),
      `a planted reconstruction of ${found.target.id} went unnoticed: ${errors.join(' | ')}`,
    )
  })

  test('THE POINT OF THE GATE: question-level validation cannot see any of this', () => {
    // The claim §5.9 rests on. If validatePack ever caught a planted leak, this
    // gate would be redundant; it does not, because it inspects one question at
    // a time while the candidate sees the whole pack.
    const { file, target, answer } = numericTarget()
    const planted = withPlant(file, (copy) => {
      const sibling = copy.questions.find((q) => q.id !== target.id)
      sibling.options[0].text = `Definitely not ${answer}`
      delete copy.pack.contentHash
    })
    const { errors: perQuestion } = validatePack(planted, {})
    assert.deepEqual(perQuestion, [], 'question-level validation unexpectedly caught a pack-level fault')
    assert.ok(leakOf(planted).errors.length > 0, 'the pack-level gate missed what only it can see')
  })

  test('an exhibit’s own axis labels are not treated as leaked values', () => {
    // "At n = 16 only" is a choice between the table's columns. A sibling
    // mentioning that catalogue size gives nothing away, and flagging it would
    // bury the findings that matter.
    const cs = packs.find((p) => p.pack.id === 'gam-computational-sciences-operation-counts-001')
    const table = cs.pack.blocks.find((b) => b.kind === 'table')
    assert.ok(table.columns.some((c) => c.includes('16')), 'fixture assumption changed')
    const q3 = cs.questions.find((q) => q.id === 'gam-cs-oc-001-q3')
    assert.match(q3.options.find((o) => o.id === q3.correctOptionId).text, /16/)
    assert.deepEqual(leakOf(cs).errors, [])
  })
})

describe('GAM pilot — a round certifies the content it saw (spec §5.8)', () => {
  const qualifying = () => {
    const { round } = currentIndependent()
    return round
  }

  test('every earlier round is superseded and counts for nothing', () => {
    const superseded = adjudications.rounds.filter((r) => r.status === 'superseded')
    assert.ok(superseded.length >= 2, 'the self round and the earlier independent rounds are superseded')
    assert.equal(new Set(superseded.map((r) => r.id)).size, superseded.length, 'two rounds share an id')
    for (const round of superseded) {
      assert.ok(!isCurrent(round, packHashes), `${round.id} still reads as current`)
      assert.ok(round.supersededBecause?.length > 40, `${round.id} does not say why`)
    }
  })

  test('a round that records no adjudicatedContent can never be current', () => {
    const round = structuredClone(adjudications.rounds.find((r) => r.status === 'superseded'))
    delete round.adjudicatedContent
    assert.deepEqual(contentFailures(round, packHashes), [
      'the round records no adjudicatedContent, so what it judged cannot be established',
    ])
  })

  test('editing any pack retires a round that had qualified', () => {
    const round = qualifying()
    assert.ok(round, 'no qualifying independent round to retire')
    for (const file of adjudicatedPacks()) {
      const moved = { ...packHashes, [file.pack.id]: 'f'.repeat(32) }
      const failures = contentFailures(roundFor(file.pack.id).round, moved)
      assert.ok(
        failures.some((f) => f.includes(file.pack.id) && /has changed since it was adjudicated/.test(f)),
        `a change to ${file.pack.id} left the round standing: ${failures.join('; ')}`,
      )
      assert.equal(findIndependentRound(adjudications, authors, moved, file.pack.id).round, null)
    }
  })

  test('a round that skips a pack does not cover it', () => {
    const round = qualifying()
    assert.ok(round, 'no qualifying independent round')
    const trimmed = structuredClone(round)
    delete trimmed.adjudicatedContent[adjudicatedPacks()[0].pack.id]
    assert.ok(
      contentFailures(trimmed, packHashes).some((f) => /was not covered by the round/.test(f)),
    )
  })

  test('each round is bound to the packs it judged, as they stand', () => {
    for (const file of adjudicatedPacks()) {
      const round = roundFor(file.pack.id).round
      assert.equal(
        round.adjudicatedContent[file.pack.id],
        packHashes[file.pack.id],
        `${file.pack.id} is bound to different content`,
      )
    }
  })

  test('an author still cannot certify their own work, however current the round', () => {
    const round = structuredClone(qualifying() ?? adjudications.rounds[0])
    round.kind = 'independent'
    round.status = 'complete'
    round.countsAsIndependentReview = true
    round.adjudicatedContent = { ...packHashes }
    round.adjudicator = { identity: authors[0], model: 'x', kind: 'model', independentOfAuthor: true }
    round.adjudicatedAt = '2026-09-04'
    assert.deepEqual(contentFailures(round, packHashes), [], 'the content check should be satisfied here')
    assert.ok(
      independenceFailures(round, authors).some((f) => /is an author of these packs/.test(f)),
      'currency must not buy independence',
    )
  })
})

describe('GAM pilot — the handoff for human review', () => {
  const handoffUrl = new URL('../../content/gam/review/handoff.json', import.meta.url)
  const handoff = existsSync(handoffUrl) ? JSON.parse(readFileSync(handoffUrl, 'utf8')) : null

  test('a handoff exists, and every round it describes still governs its packs', () => {
    assert.ok(handoff, 'no handoff — run npm run review:gam')
    assert.ok(handoff.rounds.length > 0, 'the handoff names no round')
    for (const r of handoff.rounds) {
      for (const [packId, hash] of Object.entries(r.boundTo)) {
        assert.equal(hash, packHashes[packId], `${packId} has moved since ${r.id} judged it`)
      }
    }
    for (const file of adjudicatedPacks()) {
      const p = handoff.packs.find((x) => x.id === file.pack.id)
      assert.equal(p.independent.round, roundFor(file.pack.id).round.id)
    }
  })

  test('THE CAVEAT: a round whose halves differed says so, and the handoff leads with it', () => {
    const mixed = adjudications.rounds.filter(
      (r) => r.status === 'complete' && /\+/.test(r.adjudicator?.model ?? '') && r.caveat,
    )
    const different = adjudications.rounds.filter((r) => {
      if (r.status !== 'complete') return false
      const [a, b] = String(r.adjudicator?.model ?? '').split(' + ')
      return b && a.split(' (')[0] !== b.split(' (')[0]
    })
    assert.ok(different.length > 0, 'no round used two different adjudicators')
    for (const r of different) {
      assert.ok(r.caveat, `${r.id} used two different models and carries no caveat`)
      assert.match(r.caveat, /11 of 19/, 'the caveat must state the weaker half’s score')
      assert.match(r.caveat, /17 of 19/, 'the caveat must state the stronger half’s score')
      assert.ok(
        handoff.caveat.includes(r.caveat),
        'the handoff must carry every caveat verbatim',
      )
    }
    assert.ok(mixed.length > 0)
    assert.match(handoff.caveatAppliesTo, /blind re-answer agreement rate/i)
  })

  test('the three gates are stated separately and none is described as proving correctness', () => {
    assert.deepEqual(Object.keys(handoff.theThreeGates).sort(), [
      'automatedValidation',
      'humanReview',
      'independentAdjudication',
    ])
    assert.match(handoff.theThreeGates.automatedValidation, /proves nothing about whether an answer is right/i)
    assert.match(handoff.theThreeGates.independentAdjudication, /not proof/i)
    assert.match(handoff.theThreeGates.humanReview, /nothing substitutes for it/i)
  })

  test('every active pack carries its own open decisions, and sign-off is always one of them', () => {
    assert.equal(handoff.packs.length, activePacks.length)
    for (const p of handoff.packs) {
      assert.ok(p.decisions.length >= 1, `${p.id} hands over nothing to decide`)
      const signOff = p.decisions.find((d) => d.id.endsWith('::sign-off'))
      assert.ok(signOff, `${p.id} does not ask for sign-off`)
      for (const d of p.decisions) {
        assert.ok(d.question.length > 60, `${p.id}/${d.id} does not say what must be decided`)
        assert.ok(d.ifAccepted && d.ifNotAccepted, `${p.id}/${d.id} does not say what follows`)
      }
    }
  })

  test('each pack’s open blocker appears as a decision, not only as a number', () => {
    for (const file of activePacks) {
      const round = roundFor(file.pack.id).round
      const p = handoff.packs.find((x) => x.id === file.pack.id)
      if (!round) {
        assert.ok(
          p.decisions.some((d) => d.id.endsWith('::awaiting-adjudication')),
          `${file.pack.id} has no round and the handoff does not say so`,
        )
        continue
      }
      const decisive = file.questions.filter(
        (q) => round.questions[q.id]?.evidence?.ablationLeakSeverity === 'decisive',
      )
      if (decisive.length) {
        assert.ok(
          p.decisions.some((d) => d.id.endsWith('::decisive-coupling')),
          `${file.pack.id} has decisive findings and no decision about them`,
        )
      }
      const c = round?.packContributions?.[file.pack.id]
      if (c && (c.questionsRequiringIt ?? []).length < 2) {
        assert.ok(
          p.decisions.some((d) => d.id.endsWith('::section-5-10')),
          `${file.pack.id} is thin under §5.10 and no decision says so`,
        )
      }
    }
  })

  test('the retired pack is listed as retired and counted nowhere', () => {
    assert.equal(handoff.activePacks, activePacks.length)
    assert.equal(handoff.activeQuestions, activeQuestions.length)
    assert.equal(handoff.retiredPacks.length, retiredPacks.length)
    for (const r of handoff.retiredPacks) {
      assert.ok(!handoff.packs.some((p) => p.id === r.id), `${r.id} is retired and still listed as active`)
      assert.ok(r.excludedFrom.includes('readiness calculations'))
      assert.ok(r.retiredBecause.length > 200)
    }
  })

  test('no pack is handed over as production-ready', () => {
    for (const p of handoff.packs) {
      assert.notEqual(p.reviewStatus, 'human-reviewed', `${p.id} claims sign-off before a person gave it`)
      assert.ok(p.blockers.some((b) => /not signed off by a person/.test(b)))
    }
  })
})

describe('GAM pilot — the retired pack cannot re-enter', () => {
  test('it is excluded from the round, the hashes and the domain counts', () => {
    const { round } = currentIndependent()
    for (const file of retiredPacks) {
      assert.ok(!(file.pack.id in packHashes), 'a retired pack must not be bound to the round')
      assert.ok(!(file.pack.id in round.adjudicatedContent))
      assert.ok(!(file.pack.id in (round.packContributions ?? {})))
      for (const q of file.questions) {
        assert.ok(!(q.id in round.questions), `${q.id} is retired and still adjudicated`)
      }
    }
  })

  test('un-retiring it would not silently make it ready', () => {
    const file = structuredClone(retiredPacks[0])
    file.pack.provenance.reviewStatus = 'automated-pass'
    const state = stateOf(file)
    assert.equal(state.retired, false)
    assert.equal(state.productionReady, false)
    assert.ok(
      state.blockers.some((b) => /no independent adjudication|not signed off/.test(b)),
      `an un-retired pack must fall straight back onto the gates: ${state.blockers.join('; ')}`,
    )
  })

  test('§5.10 and the leakage gate are still mandatory, and no percentage was imposed', () => {
    const spec = readFileSync(
      new URL('../../content/question-authoring/DMAT_GAM_AUTHORING_SPEC.md', import.meta.url),
      'utf8',
    )
    assert.match(spec, /\*\*5\.10 The pack must contribute something\. MANDATORY\.\*\*/)
    assert.match(spec, /5\.9 Cross-question leakage — a SOURCE-PACK-LEVEL gate\. PROPOSED, mandatory\./)
    assert.match(spec, /No fixed percentage is imposed here/)
  })
})

describe('GAM pilot — Core module is untouched', () => {
  test('the Core bank still holds 473 active questions', () => {
    const counts = ['figure-sequences', 'mathematical-equations', 'latin-squares'].map((s) => {
      const url = new URL(`../../content/sections/${s}/questions.json`, import.meta.url)
      return JSON.parse(readFileSync(url, 'utf8')).length
    })
    assert.deepEqual(counts, [173, 175, 125])
    assert.equal(counts.reduce((a, b) => a + b, 0), 473)
  })

  test('GAM content lives outside the Core section directories', () => {
    for (const s of ['figure-sequences', 'mathematical-equations', 'latin-squares']) {
      const dir = new URL(`../../content/sections/${s}/`, import.meta.url)
      const entries = readdirSync(dir)
      assert.ok(!entries.some((e) => e.startsWith('gam-')), `${s} contains GAM files`)
    }
    assert.ok(existsSync(new URL('../../content/gam/packs/', import.meta.url)))
  })
})
