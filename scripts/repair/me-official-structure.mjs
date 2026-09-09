#!/usr/bin/env node
/**
 * Record the official structural figures on every Mathematical Equations item.
 *
 *   node scripts/repair/me-official-structure.mjs [--dry-run]
 *
 * GAM PDF pp. 17–19 tiers this task type by size: 2 letters and 2 equations in
 * both low exercises, 3 and 3 in both medium, 4 and 4 in both high. This bank
 * tiers by reasoning depth instead. Both readings are defensible and they
 * disagree, so the structural figures are stamped alongside ours rather than one
 * standing in silently for the other.
 *
 * This writes **derived metadata only** — letters and equations counted from the
 * item itself. No equation, answer, option, note or difficulty label moves. The
 * generator stamps the same field on everything it builds from now on; this
 * backfills what already existed.
 */
import { readBank, writeBank } from '../lib/bank.mjs'

const dryRun = process.argv.includes('--dry-run')
const bank = readBank('mathematical-equations')

let stamped = 0
let mismatched = 0
for (const q of bank) {
  const letters = Object.keys(q.solution).length
  const equations = q.equations.length
  const existing = q.meta.officialStructure
  if (existing && (existing.letters !== letters || existing.equations !== equations)) {
    console.log(`${q.id}: recorded ${JSON.stringify(existing)} but counts ${letters}/${equations}`)
    mismatched++
  }
  q.meta.officialStructure = { letters, equations }
  stamped++
}

console.log(
  `${stamped} item(s) stamped · ${mismatched} correction(s)${dryRun ? ' (dry run, nothing written)' : ''}`,
)
if (!dryRun) writeBank('mathematical-equations', bank)
