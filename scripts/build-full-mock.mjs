#!/usr/bin/env node
/**
 * Build the Core + GAM sample sitting.
 *
 * **It is a sample, not a full-length examination, and the name says so.**
 * The Core half is complete — 60 questions in three 25-minute subtests, exactly
 * the official shape. The General Academic half holds 10 questions against the
 * roughly 60 the real module carries, so it is a sixth of a module.
 *
 * That is why its clock is 15 minutes and not the official 90. Running 10
 * questions against a 90-minute module clock reproduced the module's DURATION
 * while destroying its PACE: 540 seconds a question against the official ~90,
 * so a candidate would have finished in a quarter of an hour and sat for
 * another seventy-five minutes learning nothing about the time pressure every
 * account of the real sitting describes as the actual difficulty. 15 minutes is
 * 10 questions at the official rate. The official 90 is still recorded, as
 * `officialGamMinutes`, because the fact has not changed — only what we can
 * honestly fill it with.
 *
 * WHY THIS IS A SEPARATE FILE AND A SEPARATE SCRIPT.
 *
 * The four Core mocks in `content/access/core-mocks.json` are frozen, and a
 * committed test pins their exact question lists. `build-core-mocks.mjs` deals
 * all four from one shuffle, so raising its MOCKS count from 4 to 5 would
 * re-deal the existing four under unchanged ids — which is precisely the
 * corruption the append-only rule exists to prevent. So this writes its own
 * artefact and never touches theirs.
 *
 * WHAT MAKES IT A *FULL* MOCK. The four Core mocks cover Module A only: three
 * subtests, 25 minutes each. The real sitting is that, then a break, then the
 * General Academic Module for 90 minutes. Nothing in the product ran both
 * halves end to end, so no mock resembled the actual examination in shape.
 *
 * Both of those facts are official and are the only parts taken from the source:
 *   · each Core subtest is 25 minutes / 20 items   (GAM PDF pp. 8, 18, 25)
 *   · the Subject Module runs 90 minutes in total  (GAM PDF p. 34)
 *   · about three hours with a break of 30 minutes (GAM PDF p. 6)
 * Which questions a sitting contains is product behaviour, not official.
 *
 * DISJOINTNESS. Every Core question here is one the four existing mocks do not
 * use, so a candidate who has worked through the mocks does not meet the same
 * item again in the full sitting. That is checked here and asserted by a test.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const SECTIONS = ['figure-sequences', 'mathematical-equations', 'latin-squares']
const PER_SECTION = 20 // OFFICIAL: each Core subtest is 25 minutes / 20 items.

/**
 * The General Academic half: the exam-alignment packs of 22 November 2026.
 *
 * Listed by id rather than taken as "every active pack", so the sitting is a
 * fixed test. A mock whose content changes when a pack is added is not a mock.
 */
const GAM_PACK_IDS = [
  'gam-business-administration-fixed-price-rights-001',
  'gam-natural-sciences-charge-inventory-001',
  'gam-computational-sciences-finite-automata-001',
  'gam-social-sciences-two-stage-sampling-001',
]

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'))

/** Deterministic PRNG, so the same bank always deals the same sitting. */
function rng(seedText) {
  let h = 0
  for (const ch of seedText) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0
  let s = h >>> 0 || 1
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >> 17
    s ^= s << 5
    s >>>= 0
    return s / 0xffffffff
  }
}

function shuffle(list, rand) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const coreMocks = read('content/access/core-mocks.json')
const alreadyUsed = new Set()
for (const set of coreMocks.sets) {
  for (const ids of Object.values(set.sections)) for (const id of ids) alreadyUsed.add(id)
}

const sections = {}
const report = []

for (const section of SECTIONS) {
  const bank = read(`content/sections/${section}/questions.json`).filter((q) => !q.meta?.quarantined)
  const spare = bank.filter((q) => !alreadyUsed.has(q.id))

  if (spare.length < PER_SECTION) {
    throw new Error(
      `${section}: ${spare.length} questions are free of the four Core mocks, ${PER_SECTION} needed. ` +
        'This is a capacity signal — generate a batch, do not reuse a question the mocks already hold.',
    )
  }

  // Sorted first so the shuffle is the ONLY source of order.
  const byDifficulty = { low: [], medium: [], high: [] }
  for (const q of [...spare].sort((a, b) => a.id.localeCompare(b.id))) {
    byDifficulty[q.difficulty]?.push(q.id)
  }
  const rand = rng(`full-mock:${section}`)
  for (const d of Object.keys(byDifficulty)) byDifficulty[d] = shuffle(byDifficulty[d], rand)

  // Aim for an even 7/7/6 and fall back to whatever the spare supply allows.
  // Figure Sequences is the binding one: its low tier is closed to growth by
  // the direction-cycle quarantine, so almost every spare low item is already
  // committed to the four mocks.
  const cap = {
    low: byDifficulty.low.length,
    medium: byDifficulty.medium.length,
    high: byDifficulty.high.length,
  }
  const profile = { low: 7, medium: 7, high: 6 }
  for (const d of ['low', 'medium', 'high']) profile[d] = Math.min(profile[d], cap[d])
  let short = PER_SECTION - (profile.low + profile.medium + profile.high)
  while (short > 0) {
    const d = ['high', 'medium', 'low']
      .filter((x) => profile[x] < cap[x])
      .sort((a, b) => cap[b] - profile[b] - (cap[a] - profile[a]))[0]
    if (!d) break
    profile[d]++
    short--
  }
  if (short > 0) {
    throw new Error(`${section}: profile ${JSON.stringify(profile)} short by ${short} of ${PER_SECTION}`)
  }

  const picked = []
  const difficultyOf = new Map()
  for (const d of ['low', 'medium', 'high']) {
    for (let k = 0; k < profile[d]; k++) {
      const id = byDifficulty[d][k]
      difficultyOf.set(id, d)
      picked.push(id)
    }
  }
  sections[section] = shuffle(picked, rand)

  report.push({ section, active: bank.length, spare: spare.length, profile })
}

/* ------------------------------------------------------------ GAM half */

const gamQuestionCount = GAM_PACK_IDS.reduce((n, id) => {
  const file = read(`content/gam/packs/${id}.json`)
  if (file.pack.provenance.reviewStatus === 'rejected') {
    throw new Error(`${id} is retired and cannot sit in a mock`)
  }
  return n + file.questions.length
}, 0)

/* -------------------------------------------------------------- checks */

const all = Object.values(sections).flat()
if (all.length !== SECTIONS.length * PER_SECTION) {
  throw new Error(`expected ${SECTIONS.length * PER_SECTION} Core questions, got ${all.length}`)
}
if (new Set(all).size !== all.length) throw new Error('a question appears twice in the full mock')
for (const id of all) {
  if (alreadyUsed.has(id)) throw new Error(`${id} is already used by one of the four Core mocks`)
}

const GAM_SECONDS_PER_QUESTION = 90 // 90 official minutes over ~60 official questions.
const gamMinutes = Math.round((gamQuestionCount * GAM_SECONDS_PER_QUESTION) / 60)

const out = {
  note:
    'The Core + GAM sample sitting: the Core Module, a break, then a SAMPLE of the General Academic ' +
    'Module. Not a full-length examination — the Core half is complete at 60 questions, but the General ' +
    'Academic half holds 10 of the roughly 60 the real module carries, so its clock is set to the ' +
    'official per-question rate rather than the official module length. Generated by ' +
    'scripts/build-full-mock.mjs and then frozen — a sitting has to be the same test every time it is ' +
    'opened. Its Core questions are disjoint from all four Core mocks, so working through those does ' +
    'not spoil this one.',
  generatedFrom: 'content/sections/*/questions.json and content/gam/packs/*.json',
  id: 'full-mock-1',
  label: 'Core + GAM sample simulation',
  questionsPerSection: PER_SECTION,
  sections,
  gamPackIds: GAM_PACK_IDS,
  gamQuestionCount,
  /** OFFICIAL. GAM PDF pp. 8, 18, 25 — 25 minutes for 20 items, and the Core half is complete. */
  minutesPerCoreStage: 25,
  /**
   * OURS, derived from two official figures — 90 minutes (GAM PDF p. 34) over
   * approximately 60 questions (d-mat.de FAQ) is about 90 seconds a question,
   * applied to the 10 questions we actually have. NOT an official stage length.
   */
  gamMinutes,
  gamSecondsPerQuestion: GAM_SECONDS_PER_QUESTION,
  /** OFFICIAL, and kept even though the sample cannot fill it. GAM PDF p. 34. */
  officialGamMinutes: 90,
  /** OFFICIAL, approximate. d-mat.de FAQ: "an average; the actual number may be higher or lower". */
  officialGamQuestionsApprox: 60,
  /** OFFICIAL. GAM PDF p. 6: "about three hours with a break of 30 minutes". */
  breakMinutes: 30,
  /** What this sitting actually runs, as distinct from the real examination's 195. */
  totalMinutes: 25 * 3 + 30 + gamMinutes,
}

writeFileSync(
  new URL('../content/access/full-mock.json', import.meta.url),
  `${JSON.stringify(out, null, 2)}\n`,
)

console.log('Core + GAM sample sitting')
for (const r of report) {
  console.log(
    `  ${r.section.padEnd(24)} ${r.spare} spare of ${r.active} active · profile ${JSON.stringify(r.profile)}`,
  )
}
console.log(`  Core: ${all.length} questions over ${SECTIONS.length} stages of ${out.minutesPerCoreStage} min`)
console.log(`  GAM:  ${gamQuestionCount} questions over ${GAM_PACK_IDS.length} packs in ${out.gamMinutes} min (sample — the real module is ~${out.officialGamQuestionsApprox} questions in ${out.officialGamMinutes} min)`)
console.log(`  Break: ${out.breakMinutes} min`)
console.log('\nWritten to content/access/full-mock.json')
