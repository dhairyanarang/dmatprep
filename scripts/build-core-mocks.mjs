#!/usr/bin/env node
/**
 * Build the four fixed Core mock exams.
 *
 * A mock has to be the SAME test every time someone opens it — same questions,
 * same order — or a second attempt is not comparable with the first and the
 * score means nothing. The ordinary runner plans a session from a pool at run
 * time, ranking by what you have already seen, so it deliberately gives a
 * different test on every visit. That is right for practice and wrong for a
 * mock, so the mocks are a committed artefact rather than a computation.
 *
 * Three properties this guarantees, each checked by a test:
 *
 *   · 4 mocks × 3 subtests × 20 questions = 240 questions.
 *   · No question appears in two mocks, and none appears twice in one.
 *   · The file is reproducible: re-running this script on an unchanged bank
 *     produces an identical file, so a diff means the bank moved.
 *
 * Difficulty is dealt as evenly as the SUPPLY allows rather than to a fixed
 * quota. Figure Sequences has only 21 active low-difficulty items against the
 * 80 the four mocks need, so a flat 7/7/6 split is arithmetically impossible
 * there. Demanding one would have meant either reusing questions or inventing
 * them; the deal below instead spreads whatever exists evenly across the four,
 * so no single mock carries the shortfall.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const SECTIONS = ['figure-sequences', 'mathematical-equations', 'latin-squares']
const MOCKS = 4
const PER_SECTION = 20 // official: each Core subtest is 25 minutes / 20 items

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'))

/** Deterministic PRNG, so the same bank always deals the same mocks. */
function rng(seedText) {
  let h = 0
  for (const ch of seedText) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0
  let s = h >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >> 17
    s ^= s << 5; s >>>= 0
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

const mocks = Array.from({ length: MOCKS }, (_, i) => ({
  id: `core-mock-${i + 1}`,
  label: `Core mock ${i + 1}`,
  sections: {},
}))

const report = []

for (const section of SECTIONS) {
  const bank = read(`content/sections/${section}/questions.json`).filter((q) => !q.meta?.quarantined)
  const need = MOCKS * PER_SECTION

  if (bank.length < need) {
    throw new Error(`${section}: ${bank.length} active questions, ${need} needed for ${MOCKS} mocks`)
  }

  // Sorted first so the shuffle is the ONLY source of order, and the same bank
  // always yields the same deal regardless of file ordering.
  const byDifficulty = { low: [], medium: [], high: [] }
  for (const q of [...bank].sort((a, b) => a.id.localeCompare(b.id))) {
    byDifficulty[q.difficulty]?.push(q.id)
  }
  const rand = rng(`core-mocks:${section}`)
  for (const d of Object.keys(byDifficulty)) byDifficulty[d] = shuffle(byDifficulty[d], rand)

  // Work out ONE difficulty profile that every mock will share, rather than
  // dealing from a pile and hoping it comes out even. Two mocks are only
  // comparable if they are the same shape, so the shape is decided first and
  // the questions are poured into it.
  //
  // A tier can give each mock at most floor(available / 4). Figure Sequences
  // has 21 active low items, so five per mock is the ceiling there — the even
  // 7 is simply not available, and the two it cannot supply move to a tier
  // that can.
  const cap = {
    low: Math.floor(byDifficulty.low.length / MOCKS),
    medium: Math.floor(byDifficulty.medium.length / MOCKS),
    high: Math.floor(byDifficulty.high.length / MOCKS),
  }
  if (cap.low + cap.medium + cap.high < PER_SECTION) {
    throw new Error(`${section}: cannot fill ${PER_SECTION} per mock from caps ${JSON.stringify(cap)}`)
  }

  const profile = { low: 7, medium: 7, high: 6 } // the even starting point for 20
  for (const d of ['low', 'medium', 'high']) profile[d] = Math.min(profile[d], cap[d])
  let short = PER_SECTION - (profile.low + profile.medium + profile.high)
  while (short > 0) {
    // Give the shortfall to whichever tier has the most headroom left, so it
    // lands where the bank is deepest rather than all on one tier.
    const d = ['medium', 'high', 'low']
      .filter((x) => profile[x] < cap[x])
      .sort((a, b) => cap[b] - profile[b] - (cap[a] - profile[a]))[0]
    if (!d) break
    profile[d]++
    short--
  }
  if (short > 0) throw new Error(`${section}: profile ${JSON.stringify(profile)} short by ${short}`)

  // Deal each tier round-robin, so mock N gets the Nth slice of every tier.
  const difficultyOf = new Map()
  const cursors = { low: 0, medium: 0, high: 0 }
  for (let m = 0; m < MOCKS; m++) {
    mocks[m].sections[section] ??= []
    for (const d of ['low', 'medium', 'high']) {
      for (let k = 0; k < profile[d]; k++) {
        const id = byDifficulty[d][cursors[d]++]
        difficultyOf.set(id, d)
        mocks[m].sections[section].push(id)
      }
    }
    // Shuffle within the mock so it does not open with every easy question.
    mocks[m].sections[section] = shuffle(mocks[m].sections[section], rand)
  }

  report.push({
    section,
    active: bank.length,
    used: need,
    spare: bank.length - need,
    mix: mocks.map((m) => {
      const counts = { low: 0, medium: 0, high: 0 }
      for (const id of m.sections[section]) {
        counts[difficultyOf.get(id)]++
      }
      return `${counts.low}/${counts.medium}/${counts.high}`
    }),
  })
}

const payload = {
  note: 'The four fixed Core mock exams. Generated by scripts/build-core-mocks.mjs — a committed artefact, never recomputed at run time, because a mock must be the same test every time it is opened.',
  generatedFrom: 'content/sections/*/questions.json (active questions only)',
  mocks: MOCKS,
  questionsPerSection: PER_SECTION,
  sections: SECTIONS,
  sets: mocks,
}

const json = `${JSON.stringify(payload, null, 2)}\n`
writeFileSync(new URL('../content/access/core-mocks.json', import.meta.url), json)

const allIds = mocks.flatMap((m) => SECTIONS.flatMap((s) => m.sections[s]))
console.log(`\n${MOCKS} mocks × ${SECTIONS.length} subtests × ${PER_SECTION} = ${allIds.length} questions`)
console.log(`unique ids: ${new Set(allIds).size} (must equal ${allIds.length})\n`)
for (const r of report) {
  console.log(`${r.section.padEnd(24)} ${r.active} active · ${r.used} used · ${r.spare} spare`)
  console.log(`${''.padEnd(24)} low/med/high per mock: ${r.mix.join('  ')}`)
}
console.log(`\nlock: ${createHash('sha256').update(allIds.join('\n')).digest('hex')}`)
