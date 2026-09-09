#!/usr/bin/env node
/**
 * Ingest an independent adjudication round.
 *
 *   node scripts/gam/ingest-adjudication.mjs <ablation-results.json> <blind-results.json>
 *
 * Two separate adjudicators produce the inputs, neither of which has seen the
 * answer key:
 *
 *   - the ABLATION adjudicator sees stems and options with no source at all, and
 *     judges whether each question can be answered without its pack;
 *   - the BLIND adjudicator sees the packs and questions but no key, answers each
 *     question, and judges outside knowledge, material support and whether more
 *     than one option is defensible.
 *
 * This script only combines their outputs into the round schema. It makes no
 * judgements of its own, and the author of the packs makes none either — that is
 * the whole point of the separation (spec §5.8).
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

import { contentHash } from './lib/validate.mjs'

// `--set <name>` targets an authoring experiment's own packs and adjudication
// log under content/gam/sets/<name>/, so an experiment can never write
// into the deployed pilot's record.
const setArg = process.argv.indexOf('--set')
const set = setArg === -1 ? null : process.argv[setArg + 1]
const [ablationPath, blindPath] = process.argv.slice(2).filter((a) => a !== '--set' && a !== set)
if (!ablationPath || !blindPath) {
  console.error('usage: node scripts/gam/ingest-adjudication.mjs <ablation-results> <blind-results>')
  process.exit(1)
}

const ablation = JSON.parse(readFileSync(ablationPath, 'utf8'))
const blind = JSON.parse(readFileSync(blindPath, 'utf8'))

const base = set
  ? new URL(`../../content/gam/sets/${set}/`, import.meta.url)
  : new URL('../../content/gam/', import.meta.url)
const packsDir = new URL('packs/', base)
const files = readdirSync(packsDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(new URL(f, packsDir), 'utf8')))
// A round covers the packs its adjudicators were actually shown, which need not
// be all of them — a pack added to the pilot is adjudicated on its own rather
// than re-opening the ones already judged. Coverage is read from the results.
//
// A retired pack may appear here: when its retirement is being reconsidered it
// is put back in front of the adjudicators, and the round has to record what
// they said about it. Recording is not restoring — `readiness` short-circuits on
// a rejected pack, so nothing retired can reach a production count this way.
const judged = new Set(Object.keys(blind.results ?? {}))
const covered = files.filter((f) => f.questions.some((q) => judged.has(q.id)))
if (!covered.length) {
  console.error('the results cover no active pack')
  process.exit(1)
}
const questions = covered.flatMap((p) => p.questions)

// What the round is certifying. Recorded here rather than trusted later, so a
// repair to any pack retires the round instead of silently outliving it (§5.8).
const adjudicatedContent = Object.fromEntries(covered.map((f) => [f.pack.id, contentHash(f)]))

/**
 * The dependency class, derived from the two independent judgements.
 *
 * Fixed before any result was seen, so the rule cannot be fitted to the outcome:
 *
 *   - the pack contributing nothing material is decisive for source-independent,
 *     whatever the ablation said;
 *   - otherwise, a question the ablation adjudicator could not answer without the
 *     pack is source-determined;
 *   - anything else — answerable, or partly answerable, from domain knowledge,
 *     but with the pack genuinely carrying the answer — is source-supported.
 */
function deriveDependency(abl, bl) {
  // §5.10 as corrected on 5 September 2026: only a source that contributed
  // nothing this task used makes a question source-independent. A standard
  // relationship applied to source-supplied values is source-supported, which
  // passes — it is what the official Optimal Order Quantity exercise does.
  if (bl.sourceMateriallyContributes === false) return 'source-independent'
  if (abl.verdict === 'not-determinable') return 'source-determined'
  return 'source-supported'
}

const reviewUrl = new URL('review/adjudications.json', base)
const adjudications = JSON.parse(readFileSync(reviewUrl, 'utf8'))
const round = adjudications.rounds.find((r) => r.kind === 'independent' && r.status === 'pending')
if (!round) {
  console.error('no pending independent round to fill')
  process.exit(1)
}

const today = new Date().toISOString().slice(0, 10)
const adjudicator = {
  identity: 'independent-adjudication-round-1',
  model: `${ablation.adjudicator} (full ablation) + ${blind.adjudicator} (blind re-answer)`,
  kind: 'model',
  independentOfAuthor: true,
}

const filled = {}
const missing = []
for (const q of questions) {
  const abl = ablation.results?.[q.id]
  const bl = blind.results?.[q.id]
  if (!abl || !bl) {
    missing.push(q.id)
    continue
  }
  filled[q.id] = {
    chosenOption: bl.chosenOption,
    dependency: deriveDependency(abl, bl),
    requiresOutsideKnowledge: bl.requiresOutsideKnowledge,
    sourceMateriallyContributes: bl.sourceMateriallyContributes,
    contributionTypes: bl.contributionTypes ?? [],
    requiresApplication: bl.requiresApplication,
    exactlyOneDefensibleOption: bl.exactlyOneDefensibleOption,
    recognitionNotTransfer: bl.recognitionNotTransfer ?? null,
    requiresPackData: bl.requiresPackData ?? null,
    requiresPackReasoning: bl.requiresPackReasoning ?? null,
    rationale:
      `Blind re-answer (${blind.adjudicator}, confidence ${bl.confidence}): ${bl.rationale} ` +
      `Full ablation (${ablation.adjudicator}): ${abl.verdict} without the pack ` +
      `(would have chosen "${abl.wouldChoose}", confidence ${abl.confidence}) — ${abl.reason}`,
    adjudicator,
    adjudicatedAt: today,
    evidence: {
      ablationVerdict: abl.verdict,
      ablationWouldChoose: abl.wouldChoose,
      ablationConfidence: abl.confidence,
      blindConfidence: bl.confidence,
      ablationLeaks: abl.leaks ?? null,
      ablationLeakedBy: abl.leakedBy ?? [],
      ablationLeakDetail: abl.leakDetail ?? '',
      ablationLeakSeverity: abl.leakSeverity ?? (abl.leaks ? 'unrated' : 'none'),
    },
  }
}

if (missing.length) {
  console.error(`missing adjudications for: ${missing.join(', ')}`)
  process.exit(1)
}

// Several rounds can land on one day; keep ids unique so a superseded round is
// never confused with the one that replaced it.
const taken = new Set(adjudications.rounds.map((r) => r.id))
let id = `independent-${today}`
for (let n = 2; taken.has(id); n++) id = `independent-${today}-r${n}`
round.id = id
round.status = 'complete'
round.adjudicatedContent = adjudicatedContent
round.adjudicator = adjudicator
round.adjudicatedAt = today
round.method =
  'Two separate adjudicators, neither shown the answer key, the explanations, the refutations or the ' +
  'prior self-adjudication. The ablation adjudicator saw stems and options only; the blind adjudicator ' +
  'saw the packs and questions only. The pack author combined their outputs mechanically and made no ' +
  'judgement of its own. The content hash of every pack as adjudicated is recorded on the round; if any ' +
  'of them is edited afterwards the round stops counting.'
delete round.instructions
round.questions = filled
// §5.10 is judged at pack level as well as per question; the adjudicator's
// pack-level verdicts are recorded verbatim and gate readiness.
// Kept for the record; §5.10 is judged per question now, so this no longer gates.
round.packContributions = blind.packs ?? {}

writeFileSync(reviewUrl, `${JSON.stringify(adjudications, null, 2)}\n`)

const tally = {}
for (const r of Object.values(filled)) tally[r.dependency] = (tally[r.dependency] ?? 0) + 1
console.log(`ingested ${Object.keys(filled).length} independent adjudications`)
console.log(`  dependency: ${JSON.stringify(tally)}`)

console.log(
  `  content    : ${Object.keys(adjudicatedContent).length} pack(s) bound to this round by hash — ` +
    `${covered.map((f) => f.pack.id).join(', ')}`,
)
for (const [id, c] of Object.entries(blind.packs ?? {})) {
  console.log(
    `  source  ${c.sourceIsSufficient === false ? '✗' : '✓'} ${id}: ${c.whatItContributes}`,
  )
}

const keyed = new Map(questions.map((q) => [q.id, q.correctOptionId]))
const disagreements = Object.entries(filled).filter(([id, r]) => r.chosenOption !== keyed.get(id))
console.log(`  disagreements with the key: ${disagreements.length}`)
for (const [id, r] of disagreements) {
  console.log(`    ${id}: adjudicator chose "${r.chosenOption}", key says "${keyed.get(id)}"`)
}
for (const [id, r] of Object.entries(filled)) {
  if (r.requiresOutsideKnowledge) console.log(`  outside knowledge: ${id}`)
  if (r.exactlyOneDefensibleOption === false) console.log(`  multi-defensible: ${id}`)
  if (r.sourceMateriallyContributes === false) console.log(`  §5.10 FAIL (no contribution): ${id}`)
  // Recall is a reviewer flag, not a failure: the official exercises contain
  // assumption identification, exhibit reading and definition discrimination.
  // This line used to read "§5.10 FAIL", which contradicted the corrected rule
  // and the gate in review.mjs.
  if (r.requiresApplication === false) console.log(`  recall-flagged for review (not a failure): ${id}`)
  if (r.evidence?.ablationLeaks === true) {
    console.log(
      `  LEAKS (${r.evidence.ablationLeakSeverity}): ${id} — by ${r.evidence.ablationLeakedBy.join(', ')}`,
    )
  }
}
