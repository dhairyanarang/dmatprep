#!/usr/bin/env node
/**
 * Verify every GAM source pack.
 *
 *   npm run verify:gam            check all packs
 *   npm run verify:gam -- --artifacts   also write blind-adjudication artefacts
 *
 * A pack that passes here is **not** production-ready. It is internally
 * coherent, traceable and original. Whether its answers are right, and whether
 * its questions need their source at all, is settled by the adjudication log and
 * by a human — see spec §5.3 and §7.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'

import { analyse, buildArtifacts } from './lib/ablation.mjs'
import { analyseLeakage } from './lib/leakage.mjs'
import { findIndependentRound, findSelfRound, isCurrent, readiness, validateRound } from './lib/review.mjs'
import { contentHash, validatePack } from './lib/validate.mjs'

const packsDir = new URL('../../content/gam/packs/', import.meta.url)
const corpusUrl = new URL('../../content/gam/official-ngram-hashes.json', import.meta.url)
const reviewUrl = new URL('../../content/gam/review/adjudications.json', import.meta.url)
const flagsUrl = new URL('../../content/gam/review/review-flags.json', import.meta.url)

const corpus = existsSync(corpusUrl)
  ? new Set(JSON.parse(readFileSync(corpusUrl, 'utf8')).hashes)
  : null
if (!corpus) console.log('⚠ no originality corpus found — the originality gate is not running')

const adjudications = existsSync(reviewUrl) ? JSON.parse(readFileSync(reviewUrl, 'utf8')) : { rounds: [] }
const reviewFlags = existsSync(flagsUrl) ? JSON.parse(readFileSync(flagsUrl, 'utf8')) : { questionFlags: {}, packFlags: {} }
const packAuthors = adjudications.packAuthors ?? []
const selfRound = findSelfRound(adjudications)

const files = readdirSync(packsDir).filter((f) => f.endsWith('.json')).sort()
const wantArtifacts = process.argv.includes('--artifacts')

// A first pass over every pack, because whether an adjudication round still
// counts depends on the whole set: a round certifies the content it saw, and one
// repaired pack retires the round for all of them (spec §5.8).
const loaded = files.map((name) => JSON.parse(readFileSync(new URL(name, packsDir), 'utf8')))
// Retired packs are outside the round: a round covers the content in play, and
// retiring something should not force everything still live to be re-adjudicated.
const packHashes = Object.fromEntries(
  loaded.filter((f) => f.pack.provenance.reviewStatus !== 'rejected').map((f) => [f.pack.id, contentHash(f)]),
)
const selfCurrent = selfRound ? isCurrent(selfRound, packHashes) : false

let totalQuestions = 0
let retired = 0
let failures = 0
let warningCount = 0
let notReady = 0
const perDomain = new Map()

for (const file of loaded) {
  const { pack, questions } = file
  const { errors, warnings, contentHash: hash } = validatePack(file, { corpus })

  // Dependency analysis, per question.
  const signals = []
  for (const q of questions) {
    const a = analyse(pack, q)
    errors.push(...a.errors.map((e) => `${q.id}: ${e}`))
    signals.push(...a.signals.map((s) => `${q.id}: ${s}`))
  }

  // Cross-question leakage (spec §5.9). Checked at pack level, because that is
  // the unit the candidate is shown; no per-question gate above can see it.
  const leak = analyseLeakage(pack, questions)
  errors.push(...leak.errors)
  warnings.push(...leak.warnings)

  // Adjudication (spec §5.3, §5.6, §5.8). The self round is evidence, never review.
  if (selfCurrent) errors.push(...validateRound(selfRound, questions, { strict: true }))

  // Report the independent classification once one exists; the self round is
  // evidence and must not be what the summary line shows.
  const independentRound = findIndependentRound(adjudications, packAuthors, packHashes, pack.id).round
  const classifyingRound = independentRound ?? (selfCurrent ? selfRound : null)
  const classSource = classifyingRound === null ? 'none' : classifyingRound === selfRound ? 'self' : 'independent'
  const missing = questions.filter((q) => !classifyingRound?.questions?.[q.id])
  const countClass = (name) =>
    questions.filter((q) => classifyingRound?.questions?.[q.id]?.dependency === name).length
  const supported = countClass('source-supported')
  const determined = countClass('source-determined')
  const independentClass = countClass('source-independent')

  const state = readiness({
    pack,
    questions,
    adjudications,
    authors: packAuthors,
    packHashes,
    validationErrors: errors,
  })
  if (state.retired) retired++
  else if (!state.productionReady) notReady++

  if (!state.retired) {
    totalQuestions += questions.length
    perDomain.set(pack.domain, (perDomain.get(pack.domain) ?? 0) + questions.length)
  }
  warningCount += warnings.length + signals.length

  const mark = errors.length ? '✗' : state.retired ? '—' : '✓'
  console.log(
    `${mark} ${pack.id}${state.retired ? '  [RETIRED]' : ''}\n    ${pack.domain} · ${questions.length} questions · ` +
      `${pack.blocks.length} blocks · hash ${hash} · review: ${pack.provenance.reviewStatus} · ` +
      `${determined} determined · ${supported} supported` +
      `${independentClass ? ` · ${independentClass} INDEPENDENT` : ''} (${classSource})` +
      `${missing.length ? ` · ${missing.length} unadjudicated` : ''}`,
  )
  for (const e of errors) {
    failures++
    console.error(`      ERROR  ${e}`)
  }
  for (const w of [...warnings, ...signals]) console.log(`      warn   ${w}`)
  for (const q of missing) console.log(`      warn   ${q.id}: no adjudication recorded`)
  for (const b of state.blockers) console.log(`      block  ${b}`)
  for (const f of reviewFlags.packFlags?.[pack.id] ?? []) console.log(`      flag   [${f.flag}] ${f.reason}`)
  const flagged = questions.filter((q) => (reviewFlags.questionFlags?.[q.id] ?? []).length)
  if (flagged.length) {
    const specific = flagged.filter((q) =>
      reviewFlags.questionFlags[q.id].some((f) => f.flag === 'specific-concern'),
    )
    console.log(
      `      flag   ${flagged.length} question(s) flagged for review` +
        `${specific.length ? ` (${specific.map((q) => q.id).join(', ')} carry specific concerns)` : ''}`,
    )
  }

  if (wantArtifacts) {
    const dir = new URL('../../content/gam/review/', import.meta.url)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(
      new URL(`artifacts-${pack.id}.json`, dir),
      `${JSON.stringify(buildArtifacts(file), null, 2)}\n`,
    )
  }
}

const active = files.length - retired

// Three gates, deliberately printed apart. Blurring them is how "it passed
// validation" comes to sound like "it is right", which is the one thing this
// module's automated checks cannot tell anyone (spec §5.3).
const rule = (label) => console.log(`\n${label}\n${'─'.repeat(label.length)}`)

rule('GATE 1 — automated validation  ·  mechanical, exhaustive, and proves nothing about correctness')
console.log(
  `  ${active} active pack(s), ${totalQuestions} question(s) · ${failures} error(s) · ${warningCount} warning(s)` +
    `${retired ? ` · ${retired} pack(s) retired and excluded from every count` : ''}`,
)
console.log(`  domains: ${[...perDomain].map(([d, n]) => `${d} (${n})`).join(', ')}`)

const covered = loaded
  .filter((f) => f.pack.provenance.reviewStatus !== 'rejected')
  .filter((f) => findIndependentRound(adjudications, packAuthors, packHashes, f.pack.id).round)
const indep = findIndependentRound(adjudications, packAuthors, packHashes)
rule('GATE 2 — independent adjudication  ·  evidence from adjudicators who never saw the key, not proof')
console.log(
  `  ${covered.length}/${active} active pack(s) covered by a qualifying round` +
    `${indep.round ? ` — "${indep.round.id}" covers the whole set` : ''}`,
)
for (const f of loaded.filter((x) => x.pack.provenance.reviewStatus !== 'rejected')) {
  const one = findIndependentRound(adjudications, packAuthors, packHashes, f.pack.id)
  if (!one.round) console.log(`    ✗ ${f.pack.id}: ${one.failures.join('; ')}`)
}
console.log(
  `  self-adjudication: ${
    selfRound
      ? `round "${selfRound.id}" — evidence only, does NOT count as review` +
        `${selfCurrent ? '' : '; superseded by a content change'}`
      : 'none'
  }`,
)
const caveats = [...new Set(covered.map((f) => findIndependentRound(adjudications, packAuthors, packHashes, f.pack.id).round?.caveat).filter(Boolean))]
for (const caveat of caveats) {
  // Printed here rather than in a footnote: every figure above and below comes
  // from this round, and the round says its own halves were not equally strong.
  console.log('\n  ⚠ CAVEAT ON EVERY FIGURE FROM THIS ROUND — do not quote one without it:')
  for (const line of caveat.match(/.{1,92}(\s|$)/g) ?? []) {
    console.log(`    ${line.trim()}`)
  }
}

rule('GATE 3 — human review  ·  a person taking responsibility; nothing here substitutes for it')
console.log(
  `  ${notReady === 0 ? '✓' : '⚠'} ${active - notReady}/${active} active pack(s) production-ready` +
    `${notReady ? ' — see the blockers above, and npm run review:gam' : ''}`,
)

if (failures > 0) process.exit(1)
