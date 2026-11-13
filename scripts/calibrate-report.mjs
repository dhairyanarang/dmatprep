#!/usr/bin/env node
/**
 * Measure every committed question against the rubric and report where the
 * stored label and the measurement disagree.
 *
 * This writes nothing. Disagreement is a question for a person: the rubric is
 * young, the bank was built against an older reading of difficulty, and a
 * disagreement is as likely to mean the rubric needs refining as it is to mean
 * the label is wrong. Re-tiering is a decision, and it is not this script's.
 *
 *   node scripts/calibrate-report.mjs            summary and disagreements
 *   node scripts/calibrate-report.mjs --all      every question, measured
 *   node scripts/calibrate-report.mjs --section latin-squares
 */
import { readFileSync, readdirSync } from 'node:fs'

import { calibrate, BANDS } from './lib/calibrate.mjs'
import { readBank, SECTIONS } from './lib/bank.mjs'
import { findIndependentRound } from './gam/lib/review.mjs'

const argv = process.argv.slice(2)
const only = argv.includes('--section') ? argv[argv.indexOf('--section') + 1] : null
const showAll = argv.includes('--all')

const rule = (label) => console.log(`\n${label}\n${'─'.repeat(label.length)}`)
const pad = (s, n) => String(s).padEnd(n)

let totalChecked = 0
const disagreements = []

/* ------------------------------------------------------------------ Core bank */

for (const section of SECTIONS) {
  if (only && only !== section) continue
  const bank = readBank(section)
  const matrix = Object.fromEntries(BANDS.map((b) => [b, { low: 0, medium: 0, high: 0 }]))

  for (const q of bank) {
    totalChecked++
    const result = calibrate(q)
    matrix[q.difficulty][result.suggested]++
    if (result.suggested !== q.difficulty) {
      disagreements.push({ id: q.id, section, stored: q.difficulty, ...result })
    }
    if (showAll) {
      console.log(
        `${pad(q.id, 24)} stored ${pad(q.difficulty, 7)} measured ${pad(result.suggested, 7)} ${JSON.stringify(result.measures)}`,
      )
    }
  }

  rule(`${section} — stored label (rows) against measured tier (columns)`)
  console.log(`  ${pad('', 9)}${BANDS.map((b) => pad(b, 9)).join('')}`)
  for (const stored of BANDS) {
    console.log(`  ${pad(stored, 9)}${BANDS.map((m) => pad(matrix[stored][m], 9)).join('')}`)
  }
  const agree = BANDS.reduce((n, b) => n + matrix[b][b], 0)
  console.log(`  agreement: ${agree}/${bank.length} (${Math.round((100 * agree) / bank.length)}%)`)
}

/* ------------------------------------------------------------------------ GAM */

if (!only || only === 'gam') {
  const dir = new URL('../content/gam/packs/', import.meta.url)
  const adjudications = JSON.parse(
    readFileSync(new URL('../content/gam/review/adjudications.json', import.meta.url), 'utf8'),
  )
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8')))
    .filter((f) => f.pack.provenance.reviewStatus !== 'rejected')

  const packHashes = Object.fromEntries(files.map((f) => [f.pack.id, f.pack.contentHash]))
  const matrix = Object.fromEntries(BANDS.map((b) => [b, { low: 0, medium: 0, high: 0 }]))
  let count = 0

  for (const file of files) {
    const round = findIndependentRound(adjudications, adjudications.packAuthors, packHashes, file.pack.id).round
    for (const q of file.questions) {
      totalChecked++
      count++
      const result = calibrate(q, { adjudication: round?.questions?.[q.id] })
      matrix[q.difficulty][result.suggested]++
      if (result.suggested !== q.difficulty) {
        disagreements.push({ id: q.id, section: `gam/${file.pack.domain}`, stored: q.difficulty, ...result })
      }
      if (showAll) {
        console.log(
          `${pad(q.id, 24)} stored ${pad(q.difficulty, 7)} measured ${pad(result.suggested, 7)} ${JSON.stringify(result.measures)}`,
        )
      }
    }
  }

  rule('gam — stored label (rows) against measured tier (columns)')
  console.log(`  ${pad('', 9)}${BANDS.map((b) => pad(b, 9)).join('')}`)
  for (const stored of BANDS) {
    console.log(`  ${pad(stored, 9)}${BANDS.map((m) => pad(matrix[stored][m], 9)).join('')}`)
  }
  const agree = BANDS.reduce((n, b) => n + matrix[b][b], 0)
  console.log(`  agreement: ${agree}/${count} (${Math.round((100 * agree) / count)}%)`)
}

/* ------------------------------------------------------------- disagreements */

rule(`Questions whose stored label and measured tier disagree — ${disagreements.length} of ${totalChecked}`)
console.log(
  '  For review, not for action. Nothing here is wrong by virtue of appearing in this list:\n' +
    '  the rubric may need refining as readily as a label may need moving, and no question\n' +
    '  is relabelled by this tool or by anything downstream of it.\n',
)

const bySection = {}
for (const d of disagreements) (bySection[d.section] ??= []).push(d)

for (const [section, items] of Object.entries(bySection)) {
  console.log(`  ${section} — ${items.length}`)
  const groups = {}
  for (const d of items) (groups[`${d.stored} → ${d.suggested}`] ??= []).push(d)
  for (const [move, group] of Object.entries(groups).sort()) {
    console.log(`    ${pad(move, 20)} ${group.length}`)
    console.log(`      ${group.slice(0, 6).map((d) => d.id).join(' ')}${group.length > 6 ? ` … +${group.length - 6}` : ''}`)
    console.log(`      e.g. ${group[0].id}: ${group[0].reasons[0]}`)
  }
  console.log()
}

console.log(`${totalChecked} questions measured. Nothing was changed.`)
