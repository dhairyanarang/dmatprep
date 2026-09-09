#!/usr/bin/env node
/**
 * Repair Figure Sequences explanations that name a heading the candidate never
 * sees.
 *
 *   node scripts/repair/fs-observed-heading.mjs [--dry-run]
 *
 * A diagonal mover that starts against a boundary in its nominal direction
 * reverses before matrix 1 is drawn, so its stored heading is never observed.
 * Four legacy items describe that stored heading: fs-medium-006 tells the
 * candidate its triangle "moves diagonally upwards to the right" while the
 * triangle visibly travels down-left from the top-right corner in every shown
 * transition.
 *
 * `describeRule` has taken an `observedDirection` override since the Phase 5
 * pilot; these items predate it. This rewrites only the heading words inside the
 * affected symbol's clause. Nothing else moves — not the rules, not the given
 * matrices, not the options, not the answer. The item is unchanged; the sentence
 * describing it becomes true.
 */
import { readBank, writeBank } from '../lib/bank.mjs'

const dryRun = process.argv.includes('--dry-run')
const bank = readBank('figure-sequences')
const phraseOf = (h) => h.replace('-', 'wards to the ')

let repaired = 0
const notes = []

for (const q of bank) {
  for (const symbol of q.given[0].symbols) {
    const rule = q.rules[symbol.id]
    if (rule.movement.type !== 'diagonal') continue

    const a = symbol.cell
    const b = q.given[1].symbols.find((x) => x.id === symbol.id).cell
    const dr = Math.sign(b.row - a.row)
    const dc = Math.sign(b.col - a.col)
    if (!dr || !dc) continue

    const observed = `${dr < 0 ? 'up' : 'down'}-${dc < 0 ? 'left' : 'right'}`
    if (q.explanation.includes(`moves diagonally ${phraseOf(observed)}`)) continue

    // The clause is addressed to one symbol by colour and shape. If two symbols
    // in the item share both, the sentence cannot be targeted safely and the
    // item is left for a human rather than guessed at.
    const subject = `The ${symbol.colour} ${symbol.shape}`
    const twins = q.given[0].symbols.filter(
      (s) => s.colour === symbol.colour && s.shape === symbol.shape,
    )
    if (twins.length > 1) {
      notes.push(`${q.id}: two ${symbol.colour} ${symbol.shape}s; clause not uniquely addressable — LEFT UNCHANGED`)
      continue
    }

    const stored = phraseOf(rule.movement.direction)
    const from = `${subject} moves diagonally ${stored}`
    if (!q.explanation.includes(from)) {
      notes.push(`${q.id}: could not find the clause for ${symbol.id} — LEFT UNCHANGED`)
      continue
    }

    q.explanation = q.explanation.replace(from, `${subject} moves diagonally ${phraseOf(observed)}`)
    repaired++
    notes.push(`${q.id} ${symbol.shape} (${symbol.id}): ${rule.movement.direction} → ${observed} (observed)`)
  }
}

for (const line of notes) console.log(line)
console.log(`\n${repaired} explanation(s) repaired${dryRun ? ' (dry run, nothing written)' : ''}`)
if (!dryRun && repaired) writeBank('figure-sequences', bank)
