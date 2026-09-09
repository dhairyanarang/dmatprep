/**
 * Promote the production candidate into the app, 9 September 2026.
 *
 * The five candidate packs become the GAM production set and the three packs of
 * the first pilot are retired. Nothing is deleted: a retired pack stays in the
 * repository as the record of why it was retired, which is now true of five of
 * them — break-even, operation-counts, and the three retired here.
 *
 * The old pilot is retired rather than removed because its questions are sound.
 * What is wrong with them is architectural: they were written before the
 * independent-source design, and every one of the sixteen carries a narrowing
 * coupling under the reader that judged the candidate set. Keeping them active
 * alongside content that does not would mean shipping two standards at once.
 *
 * Question ids are untouched on both sides, so GAM attempts already recorded
 * against the old packs stay valid and keep pointing at the questions they were
 * made against. `packStats` filters by pack id, so a retired pack simply reports
 * nothing rather than breaking; attempts are append-only and none is rewritten.
 */
import { readFileSync, writeFileSync, readdirSync, copyFileSync } from 'node:fs'

import { contentHash } from './lib/validate.mjs'

const packsDir = new URL('../../content/gam/packs/', import.meta.url)
const candidateDir = new URL('../../content/gam/sets/production-candidate-2026-09-08/packs/', import.meta.url)
const prodReview = new URL('../../content/gam/review/adjudications.json', import.meta.url)
const candReview = new URL('../../content/gam/sets/production-candidate-2026-09-08/review/adjudications.json', import.meta.url)

const RETIRING = {
  'gam-engineering-thermal-resistance-001': 'engineering',
  'gam-humanities-source-checks-001': 'humanities',
  'gam-business-administration-step-rebate-001': 'business administration',
}

const REASON =
  'Superseded by the production candidate set of 8-9 September 2026, and retired on promotion rather than ' +
  'deleted. No key in this pack is wrong: two independent rounds agreed with every one of them, and it ' +
  'carries no ambiguity, outside-knowledge or §5.10 finding. It is retired because of how it was built. It ' +
  'predates the independent-source architecture, and under the same adjudicator that cleared the candidate ' +
  'set every one of the pilot’s sixteen questions carried a narrowing sibling coupling, against seven of ' +
  'nineteen in the set replacing it. Keeping both active would ship two authoring standards at once. Its ' +
  'questions, provenance and adjudication history are kept in full as the record of how the architecture ' +
  'was arrived at; the ids are reserved and never reused.'

/* -- retire the three pilot packs -- */
for (const [id, domain] of Object.entries(RETIRING)) {
  const url = new URL(`${id}.json`, packsDir)
  const file = JSON.parse(readFileSync(url, 'utf8'))
  file.pack.provenance.reviewStatus = 'rejected'
  file.pack.provenance.retiredOn = '2026-09-09'
  file.pack.provenance.retiredBecause = REASON
  // The retirement is written into provenance, and provenance is inside the
  // content hash, so the stored hash has to be recomputed or the pack fails its
  // own integrity check.
  file.pack.contentHash = contentHash(file)
  writeFileSync(url, `${JSON.stringify(file, null, 2)}\n`)
  console.log(`retired  ${domain.padEnd(24)} ${id}`)
}

/* -- move the candidate packs into production -- */
const promoted = readdirSync(candidateDir).filter((f) => f.endsWith('.json')).sort()
for (const name of promoted) {
  copyFileSync(new URL(name, candidateDir), new URL(name, packsDir))
  console.log(`promoted ${name}`)
}

/* -- merge the candidate's adjudication history into the production log -- */
// The rounds are the evidence for the packs they certify, so they travel with
// them. The pilot's own rounds stay where they are: they explain the retired
// packs, and a round that certifies nothing active still has to be readable.
const prod = JSON.parse(readFileSync(prodReview, 'utf8'))
const cand = JSON.parse(readFileSync(candReview, 'utf8'))
// Re-runnable: a round already merged is left alone rather than duplicated, but
// one that shares an id with a DIFFERENT round is a genuine clash and stops the
// promotion, because silently keeping either would lose an adjudication.
const byId = new Map(prod.rounds.map((r) => [r.id, r]))
const clashes = cand.rounds.filter(
  (r) => byId.has(r.id) && JSON.stringify(byId.get(r.id)) !== JSON.stringify(r),
)
if (clashes.length) {
  throw new Error(`round id clash on promotion: ${clashes.map((r) => r.id).join(', ')}`)
}
const fresh = cand.rounds.filter((r) => !byId.has(r.id))
prod.rounds.push(...fresh)
prod.packAuthors = [...new Set([...prod.packAuthors, ...cand.packAuthors])]
writeFileSync(prodReview, `${JSON.stringify(prod, null, 2)}\n`)
console.log(`merged   ${fresh.length} new adjudication round(s); authors: ${prod.packAuthors.join(', ')}`)
