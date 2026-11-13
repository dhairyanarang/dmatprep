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
  // Re-opened on 14 November 2026 by the round of that date.
  //
  // gam-econ-pt-001-q4 survived two repair passes and came back DECISIVE. Two
  // mechanisms compose: q2's stem stipulates that a consignment below the class
  // minimum is still charged, which falsifies option d — "whether its tonnage
  // reaches the lowest figure the tariff lists" — by sibling fiat with no
  // reference to the source; and q1's stem spends a clause establishing the
  // cargo "is landed" while assuming a fee is owed, which lexically underwrites
  // option a, the key. Options b and c have no footing anywhere in the pack, so
  // they fall to ordinary plausibility.
  //
  // The second repair pass made the first leg worse rather than better: it
  // reworded option a's gloss to "landed rather than passed straight between
  // vessels", importing q1's own verb into the key. Recorded as a finding
  // rather than edited again — a third pass against a deadline is how a
  // question gets worse while the record says it got better. The fix is either
  // retirement or a rebuild that changes q1's stem as well, and that is a
  // decision for a person.
  decisiveLeaks: ['gam-econ-pt-001-q4'],
  // §5.10 is satisfied at pack level everywhere but here, where the adjudicator
  // credited the pack with one stipulated convention that one question applies,
  // and did not credit the invented operation-count formulas the whole pack rests
  // on. Left for a person to resolve rather than argued away.
  // Emptied on promotion: the pack this named was retired on 8 September 2026,
  // and no pack in the live set carries the finding.
  thinContribution: [],
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
  test('every active pack sits within the pilot size band', () => {
    assert.equal(activePacks.length, 5)
    for (const f of activePacks) {
      // Upper bound only, plus a floor of 3 to catch a pack gutted by accident.
      // The floor used to be 5, which was our own invention — the official
      // exercises carry 8, 6, 7 and 5 questions and state no per-source count,
      // and a pack loses questions when adjudication finds they do no work.
      // gam-ba-sr-001-q5 was retired on 8 September 2026 for exactly that, which
      // is a reason to record, not a rule to breach.
      assert.ok(
        f.questions.length >= 3 && f.questions.length <= 8,
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
    // One pack per domain in the live set. Retired packs are excluded: they
    // accumulate as the bank is replaced and will repeat domains that the
    // active set covers once, which says nothing about what ships.
    assert.equal(
      new Set(activePacks.map((p) => p.pack.domain)).size,
      activePacks.length,
      'two active packs share a domain',
    )
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
    // A superseded round is the historical record and is held to the record
    // shape of its own time: the 5 September methodology correction replaced
    // `sourceMateriallySupportsAnswer` with the contribution fields, and no
    // earlier round can be expected to carry them.
    const OF_ITS_TIME = ['chosenOption', 'dependency', 'rationale', 'adjudicator', 'adjudicatedAt']
    for (const q of allQuestions.filter((x) => selfRound.questions[x.id])) {
      const rec = selfRound.questions[q.id]
      for (const field of OF_ITS_TIME) {
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
    delete other.supersededOn
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

  test('THE §5.10 GATE: a source that contributed nothing fails its question', () => {
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    const target = cleanQuestion()
    const tampered = structuredClone(round)
    tampered.questions[target.id].sourceMateriallyContributes = false
    assert.ok(
      validateRound(tampered, [target], { strict: true }).some((e) =>
        /contributes nothing this question uses/.test(e),
      ),
      'a question whose answer survives the source being removed must fail',
    )
  })

  test('a recall question is flagged, not failed — the official exercises contain them', () => {
    // Ex 3 Q1 identifies a stated assumption; Ex 3 Q7 reads a chart; Ex 4 Q1
    // discriminates between definitions. A gate that failed these would repeat
    // the error §5.10 was corrected for.
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    const target = cleanQuestion()
    const tampered = structuredClone(round)
    tampered.questions[target.id].requiresApplication = false
    assert.deepEqual(validateRound(tampered, [target], { strict: true }), [])
  })

  test('a standard relationship applied to source-supplied values now passes', () => {
    // The correction of 5 September 2026. Under the superseded rule this was a
    // failure; it is what official Exercise 3 Question 4 does.
    const { round } = currentIndependent()
    assert.ok(round, 'no qualifying independent round')
    const target = cleanQuestion()
    const ok = structuredClone(round)
    ok.questions[target.id].sourceMateriallyContributes = true
    ok.questions[target.id].contributionTypes = ['data']
    ok.questions[target.id].requiresApplication = true
    ok.questions[target.id].dependency = 'source-supported'
    assert.deepEqual(validateRound(ok, [target], { strict: true }), [])
  })

  test('the pack-level non-genericity test is gone from the gate', () => {
    const review = readFileSync(new URL('../gam/lib/review.mjs', import.meta.url), 'utf8')
    assert.ok(
      !review.includes('contributesNonGenericElement'),
      'the withdrawn pack-level test is still wired into readiness',
    )
    const spec = readFileSync(
      new URL('../../content/question-authoring/DMAT_GAM_AUTHORING_SPEC.md', import.meta.url),
      'utf8',
    )
    assert.match(spec, /5\.10 The source must materially contribute\. MANDATORY\./)
    assert.match(spec, /The governing academic relationship may be entirely standard/i)
  })

  test('every retired pack says why, and the grounds are distinct', () => {
    assert.equal(retiredPacks.length, 5)
    const byId = Object.fromEntries(retiredPacks.map((f) => [f.pack.id, f.pack.provenance]))
    // Retired under the ORIGINAL §5.10, re-evaluated under the corrected one,
    // which it passes; it stays retired on coverage grounds, not quality.
    const be = byId['gam-business-administration-break-even-001']
    assert.ok(be, 'the break-even pack is no longer retired')
    assert.match(be.retiredBecause, /§5\.10/)
    assert.ok(be.reEvaluated?.disposition, 'the break-even re-evaluation is not on record')
    // Retired under §5.9: six of seven questions decisively coupled once a
    // stronger adjudicator reconstructed its table from the option lists.
    const cs = byId['gam-computational-sciences-operation-counts-001']
    assert.ok(cs, 'the operation-counts pack is no longer retired')
    assert.match(cs.retiredBecause, /§5\.9/)
    assert.ok(cs.retirementCaveat?.length > 100, 'the adjudicator-strength caveat is not on record')
    // The three packs of the first pilot, retired on promotion. Sound content,
    // superseded architecture — the reason has to say so rather than implying
    // an error that was never found in them.
    for (const id of [
      'gam-engineering-thermal-resistance-001',
      'gam-humanities-source-checks-001',
      'gam-business-administration-step-rebate-001',
    ]) {
      const p = byId[id]
      assert.ok(p, `${id} is not retired`)
      assert.match(p.retiredBecause, /[Ss]uperseded/, `${id} does not say it was superseded`)
      assert.ok(
        /No key in this pack is wrong/.test(p.retiredBecause),
        `${id} implies a correctness fault it never had`,
      )
    }
    for (const [id, p] of Object.entries(byId)) {
      assert.ok(p.retiredBecause.length > 200, `${id}: a retirement needs its reasoning on record`)
      assert.ok(p.retiredOn, `${id}: no retirement date`)
    }
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

  test('a retired pack can be re-adjudicated without that restoring it', () => {
    // A round may cover a retired pack when its retirement is being
    // reconsidered — recording what the adjudicators said is how that decision
    // gets made. What must hold is that recording it changes nothing about
    // readiness: `readiness` short-circuits on a rejected pack.
    for (const file of retiredPacks) {
      const state = stateOf(file)
      assert.equal(state.retired, true, `${file.pack.id} no longer reads as retired`)
      assert.equal(state.productionReady, false)
      assert.equal(state.independentlyAdjudicated, false, 'a retired pack must not count as adjudicated')
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
    const round = structuredClone(currentIndependent().round)
    const target = cleanQuestion()
    round.questions[target.id].dependency = 'source-independent'
    const errors = validateRound(round, [target], { strict: true })
    assert.ok(errors.some((e) => /contributes nothing this question uses/.test(e)))
  })

  test('the independent round rejects outside knowledge and ambiguous keys', () => {
    // Must be a question the current round actually covers: `allQuestions`
    // includes the retired pack, which no active round adjudicates.
    const target = adjudicatedQuestions()[0]
    for (const [field, value, pattern] of [
      ['requiresOutsideKnowledge', true, /outside knowledge/],
      ['sourceMateriallyContributes', false, /contributes nothing this question uses/],
      ['exactlyOneDefensibleOption', false, /more than one defensible/],
      ['chosenOption', 'zz', /disagrees with the key/],
    ]) {
      const round = structuredClone(currentIndependent().round)
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

  test('the text-only rule still exists, and matches the live set', () => {
    // It used to be asserted against the humanities pack, which is retired. The
    // rule is what matters, not which pack happened to trip it: a pack built
    // only of prose is the hardest shape to make genuinely source-dependent.
    const builder = readFileSync(
      new URL('../gam/build-review-flags.mjs', import.meta.url),
      'utf8',
    )
    assert.match(builder, /text-only-pack/, 'the text-only rule has been dropped')
    const textOnly = (f) =>
      f.pack.blocks.every((b) => ['heading', 'paragraph', 'list'].includes(b.kind))
    for (const f of activePacks) {
      const flagged = (reviewFlags.packFlags[f.pack.id] ?? []).some(
        (x) => x.flag === 'text-only-pack',
      )
      assert.equal(flagged, textOnly(f), `${f.pack.id}: the text-only flag disagrees with its blocks`)
    }
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
    // "At n = 16 only" is a choice between the table's own column headings. A
    // sibling naming that catalogue size gives nothing away, and flagging it
    // would bury the findings that matter.
    //
    // Planted rather than read off a live question. It used to assert that
    // gam-cs-oc-001-q3 named the size, which made a content repair look like a
    // gate regression: the question was rewritten on 7 September 2026 to stop
    // enumerating the table's columns, and the check went red without the gate
    // having changed at all. What is being tested is the gate.
    const cs = packs.find((p) => p.pack.id === 'gam-computational-sciences-operation-counts-001')
    const table = cs.pack.blocks.find((b) => b.kind === 'table')
    const heading = table.columns.find((c) => /\d/.test(c))
    assert.ok(heading, 'fixture assumption changed: the table has no numeric column heading')
    const size = heading.match(/\d[\d,]*/)[0]
    assert.deepEqual(leakOf(cs).errors, [], 'the pack as committed already trips the gate')
    const planted = withPlant(cs, (copy) => {
      for (const [i, text] of [`At n = ${size} only`, 'At none of the listed sizes'].entries()) {
        copy.questions[0].options[i].text = text
      }
    })
    assert.deepEqual(
      leakOf(planted).errors,
      [],
      `the gate read the column heading ${size} as a value a sibling gave away`,
    )
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
    // What matters is per pack: the round that *governs* a pack must bind it at
    // the hash it currently has. An older round may still list that pack at a
    // superseded hash — that is precisely why it no longer governs it.
    for (const file of adjudicatedPacks()) {
      const governing = handoff.rounds.find((r) => r.id === roundFor(file.pack.id).round.id)
      assert.ok(governing, `${file.pack.id}'s governing round is missing from the handoff`)
      assert.equal(
        governing.boundTo[file.pack.id],
        packHashes[file.pack.id],
        `${file.pack.id} has moved since ${governing.id} judged it`,
      )
    }
    for (const file of adjudicatedPacks()) {
      const p = handoff.packs.find((x) => x.id === file.pack.id)
      assert.equal(p.independent.round, roundFor(file.pack.id).round.id)
    }
  })

  test('THE CAVEAT: any round whose halves used different models must carry one', () => {
    // The rule, not the instance. A round run by one model throughout needs no
    // caveat; the September 4 round mixed Sonnet and Haiku and had to disclose
    // that the weaker half scored 11 of 19 against the stronger's 17 of 19.
    const halvesDiffer = (r) => {
      const [a, b] = String(r.adjudicator?.model ?? '').split(' + ')
      return Boolean(b) && a.split(' (')[0].trim() !== b.split(' (')[0].trim()
    }
    // Rounds still in force only. A superseded round is held to the record shape
    // of its own time — the first one identified its adjudicators by agent name
    // rather than by model, so it cannot be read for model strength at all.
    for (const r of adjudications.rounds.filter((x) => x.status === 'complete').filter(halvesDiffer)) {
      assert.ok(r.caveat, `${r.id} used two different models and carries no caveat`)
      assert.match(r.caveat, /\d+ of \d+/, `${r.id}'s caveat does not quantify the difference`)
    }
    // Whatever caveats are in force reach the reviewer verbatim.
    for (const r of handoff.rounds) {
      if (r.caveat) assert.ok(handoff.caveat.includes(r.caveat), `${r.id}'s caveat is not in the handoff`)
    }
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
      // §5.10 is per question now: a decision is raised only when the round
      // found a question the source contributes nothing to, or one that asks
      // only for recall.
      const failing = file.questions.filter((q) => {
        const r = round?.questions?.[q.id]
        return r && (r.sourceMateriallyContributes === false || r.requiresApplication === false)
      })
      if (failing.length) {
        assert.ok(
          p.decisions.some((d) => d.id.endsWith('::section-5-10')),
          `${file.pack.id} has §5.10 failures and no decision says so`,
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
  test('it is excluded from the hashes and the counts, even while under re-evaluation', () => {
    for (const file of retiredPacks) {
      assert.ok(!(file.pack.id in packHashes), 'a retired pack must not gate the active set')
      assert.equal(stateOf(file).retired, true)
      assert.equal(stateOf(file).productionReady, false)
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
    assert.match(spec, /\*\*5\.10 The source must materially contribute\. MANDATORY\.\*\*/)
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
