#!/usr/bin/env node
/**
 * Independent re-verification of every committed question.
 *
 * Every check re-derives its answer from the data actually in questions.json
 * rather than trusting the generator that produced it: equations are re-parsed
 * from their rendered strings and re-solved exhaustively over 1..20, Latin
 * squares are re-propagated and their paths strictly replayed, and figure
 * sequences are re-simulated *and* inverted — the shown matrices must imply
 * exactly one continuation under the documented mechanics.
 *
 * The per-question logic lives in scripts/lib/verify.mjs so that generation runs
 * the identical checks. A candidate that would fail here can never reach the
 * bank in the first place.
 */
import { readFileSync } from 'node:fs'

import { parseEquation, solveAll } from './lib/equations.mjs'
import { isLegacy, verifyQuestion } from './lib/verify.mjs'
import { fingerprintFor, MAX_PER_FINGERPRINT } from './lib/fingerprint.mjs'
import { readBank, readRetired, SECTIONS } from './lib/bank.mjs'

/**
 * Before trusting the solver on our own items, prove it reproduces g.a.s.t.'s
 * published answers for the six official Mathematical Equations exercises
 * (GAM PDF pp. 19-23). If this ever fails, every result below is suspect.
 */
const OFFICIAL_FIXTURES = [
  { equations: ['7 + A = 14', 'B − 3 = A'], variables: ['A', 'B'], expect: { A: 7, B: 10 } },
  { equations: ['B ÷ 2 = A', 'B − A = 8'], variables: ['A', 'B'], expect: { A: 8, B: 16 } },
  {
    equations: ['3 × C = A', 'A + C = 8', '2 × A + 2 × C = B'],
    variables: ['A', 'B', 'C'],
    expect: { A: 6, B: 16, C: 2 },
  },
  {
    equations: ['18 − B = A', '3 × A = C', 'B ÷ 2 = A'],
    variables: ['A', 'B', 'C'],
    expect: { A: 6, B: 12, C: 18 },
  },
  {
    equations: ['A − B + C − D = 2', '10 × B = C', '5 × B = A', '11 + B = D'],
    variables: ['A', 'B', 'C', 'D'],
    expect: { A: 5, B: 1, C: 10, D: 12 },
  },
  {
    equations: ['C + D − A = 1', '5 × C = D', '13 − C = A', '3 × C − 1 = B'],
    variables: ['A', 'B', 'C', 'D'],
    expect: { A: 11, B: 5, C: 2, D: 10 },
  },
]

let fixtureFailures = 0
for (const [i, fixture] of OFFICIAL_FIXTURES.entries()) {
  const solutions = solveAll(fixture.equations.map(parseEquation), fixture.variables, 2)
  const ok =
    solutions.length === 1 && fixture.variables.every((v) => solutions[0][v] === fixture.expect[v])
  if (!ok) {
    fixtureFailures++
    console.error(
      `✗ official exercise ${i + 1}: expected ${JSON.stringify(fixture.expect)}, got ${JSON.stringify(solutions)}`,
    )
  }
}
console.log(
  `${fixtureFailures === 0 ? '✓' : '✗'} solver reproduces all ${OFFICIAL_FIXTURES.length} official worked exercises`,
)

let totalFailures = fixtureFailures
let totalChecked = 0
let totalWarnings = 0
let totalQuarantined = 0
const warningLines = []

for (const section of SECTIONS) {
  const path = new URL(`../content/sections/${section}/questions.json`, import.meta.url)
  const questions = JSON.parse(readFileSync(path, 'utf8'))
  const ids = new Set()
  const counts = { low: 0, medium: 0, high: 0 }
  let failures = 0
  let quarantined = 0
  const quarantineLines = []
  let warned = 0

  // An id must never be reused, including by a retired item.
  const retiredIds = new Set(readRetired(section).map((e) => e.question?.id ?? e.id))

  const fingerprints = new Map()

  for (const q of questions) {
    totalChecked++
    const { errors, warnings } = verifyQuestion(q)

    if (ids.has(q.id)) errors.push('duplicate id')
    ids.add(q.id)
    if (retiredIds.has(q.id)) errors.push(`id ${q.id} is retired and must not be reused`)
    if (q.section !== section) errors.push(`section mismatch: ${q.section}`)
    if (counts[q.difficulty] !== undefined) counts[q.difficulty]++

    // Structural over-concentration is a warning for the legacy bank and an
    // error for anything the append-only pipeline produced.
    try {
      const fp = fingerprintFor(q)
      const seen = (fingerprints.get(fp.key) ?? []).concat(q.id)
      fingerprints.set(fp.key, seen)
      if (seen.length > MAX_PER_FINGERPRINT) {
        const message = `structural fingerprint shared with ${seen.slice(0, -1).join(', ')} (${fp.readable})`
        if (isLegacy(q)) warnings.push(message)
        else errors.push(message)
      }
    } catch {
      /* unfingerprintable kinds simply do not constrain */
    }

    if (errors.length) {
      if (q.meta?.quarantined) {
        // Quarantined questions are knowingly non-conforming — that is what
        // quarantine means — and `getQuestions` never serves them. Their errors
        // are still printed, because silence is how a quarantine turns into a
        // place to hide things, but they do not fail the run: the contract they
        // breach is the one we deliberately tightened under them.
        //
        // The trade-off is real. A genuinely new defect in a quarantined item
        // lands in this bucket rather than failing the build. That is tolerable
        // only because nothing reaches a candidate, which the free-set and
        // registry tests assert separately.
        quarantined++
        totalQuarantined++
        quarantineLines.push(`  ${q.id}: ${errors.join('; ')}`)
      } else {
        failures++
        totalFailures++
        console.error(`✗ ${q.id}`)
        for (const e of errors) console.error(`    ${e}`)
      }
    }
    if (warnings.length) {
      warned++
      totalWarnings += warnings.length
      warningLines.push(`  ${q.id} [${q.generator?.batchId ?? 'b1'} · generator ${q.generator?.version ?? 'pre-3.0.0'}]`)
      for (const w of warnings) warningLines.push(`      ${w}`)
    }
  }

  const retired = readRetired(section)
  const summary = `${questions.length} items (low ${counts.low}, medium ${counts.medium}, high ${counts.high})${retired.length ? `, ${retired.length} retired` : ''}`
  console.log(
    `${failures === 0 ? '✓' : '✗'} ${section}: ${summary}${failures ? ` — ${failures} FAILED` : ''}${warned ? ` — ${warned} with warnings` : ''}${quarantined ? ` — ${quarantined} quarantined, not served` : ''}`,
  )
  if (quarantineLines.length) {
    console.log(`  Quarantined (excluded from pools by lib/content/registry.ts):`)
    for (const line of quarantineLines) console.log(line)
  }
}

if (warningLines.length) {
  console.log(`\n⚠ ${totalWarnings} warning(s) on items made by superseded generator versions.`)
  console.log(
    '  Each is a check added after the item was generated. None of these items is wrong —\n' +
      '  every answer is correct and uniquely determined — but they carry defects the current\n' +
      '  gates reject outright, so no newly generated item can repeat them. Listed with the\n' +
      '  batch and generator version that produced them, so they are not forgotten:\n',
  )
  console.log(warningLines.join('\n'))
}

/**
 * Mathematical Equations difficulty, both ways round.
 *
 * The official material tiers this task type strictly by size — GAM PDF pp. 17–19
 * put 2 letters and 2 equations in both low exercises, 3 and 3 in both medium, 4
 * and 4 in both high. This bank tiers by reasoning depth instead, because letter
 * count was a perfect proxy for tier in the original bank and made the whole low
 * tier one template.
 *
 * Both readings are defensible and they disagree, so neither is allowed to stand
 * in silently for the other. This prints them side by side. It is a report, not a
 * gate: re-tiering is a decision, not a repair.
 */
function meCalibration(bank) {
  const OFFICIAL_LETTERS = { low: 2, medium: 3, high: 4 }
  const rows = []
  for (const tier of ['low', 'medium', 'high']) {
    const items = bank.filter((q) => q.difficulty === tier)
    if (!items.length) continue
    const letters = {}
    for (const q of items) {
      const n = q.meta?.officialStructure?.letters ?? Object.keys(q.solution ?? {}).length
      letters[n] = (letters[n] ?? 0) + 1
    }
    const matching = letters[OFFICIAL_LETTERS[tier]] ?? 0
    rows.push({
      tier,
      total: items.length,
      matching,
      spread: Object.keys(letters)
        .sort()
        .map((n) => `${n}L×${letters[n]}`)
        .join(' '),
    })
  }
  return rows
}

const meBank = readBank('mathematical-equations')
if (meBank) {
  console.log('\nMathematical Equations — difficulty, our metric against the official one')
  console.log('  official ladder (GAM PDF pp. 17–19): low 2 letters · medium 3 · high 4')
  for (const r of meCalibration(meBank)) {
    const pct = Math.round((r.matching / r.total) * 100)
    console.log(
      `  ${r.tier.padEnd(6)} ${String(r.total).padStart(3)} items · ${String(r.matching).padStart(3)} at the official letter count (${String(pct).padStart(3)}%) · ${r.spread}`,
    )
  }
  console.log('  Reported, not enforced: our tiers measure reasoning depth. Re-tiering is a decision.')
}

console.log(
  `\n${totalChecked} questions checked, ${totalFailures} failed, ${totalWarnings} warnings` +
    `${totalQuarantined ? `, ${totalQuarantined} quarantined and not served` : ''}.`,
)
if (totalFailures > 0) process.exit(1)
