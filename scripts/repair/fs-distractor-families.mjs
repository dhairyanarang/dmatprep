#!/usr/bin/env node
/**
 * Repair Figure Sequences images that offer two distractors of the same family.
 *
 *   node scripts/repair/fs-distractor-families.mjs [--dry-run]
 *
 * When both wrong panels differ from the key in the same dimension — both
 * rotations, both positional nudges — the image collapses from "which
 * continuation is legal" to "which of two variants of one idea", and the third
 * option carries no work. The generator has refused to build these since 3.1.0
 * (`if (!second || second.family === first.family) return null`); the items that
 * remain predate that guard.
 *
 * This replaces **only the second offending panel**, in place. The stem, the
 * rules, the four given matrices, the option ids and the correct answer are all
 * untouched — the repair is the smallest edit that removes the defect, and it
 * builds the new panel with `makeDistractor`, the same function generation uses,
 * so a repaired image is indistinguishable from a freshly generated one.
 */
import { makeDistractor, nudgeDistractor } from '../generate/figure-sequences.mjs'
import { readBank, writeBank } from '../lib/bank.mjs'
import { simulateStates } from '../lib/figures.mjs'
import { itemSeed } from '../lib/seed.mjs'

const dryRun = process.argv.includes('--dry-run')
const SECTION = 'figure-sequences'

/** Deterministic per-item stream, so a rerun produces the same repair. */
function makeRng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const bank = readBank(SECTION)
let repaired = 0
const report = []

for (const q of bank) {
  const families = q.meta?.distractorTypes ?? {}
  // The heading a symbol travels on is not recoverable from a rendered panel,
  // so it is seeded from the rule — the same reconstruction `verify-bank` does.
  const seedSymbols = q.given[0].symbols.map((s) => ({
    ...s,
    direction: q.rules[s.id]?.movement?.direction ?? null,
  }))
  const run = simulateStates(seedSymbols, q.rules, 6)
  if (!run) {
    report.push(`${q.id}: could not re-simulate; skipped`)
    continue
  }

  for (const [imageIndex, image] of q.images.entries()) {
    const wrong = image.options.filter((o) => o.id !== image.correctOptionId)
    if (wrong.length !== 2) continue
    const [a, b] = wrong
    const fa = families[`${image.label}:${a.id}`]
    const fb = families[`${image.label}:${b.id}`]
    if (!fa || !fb || fa !== fb) continue

    // image1 predicts panel index 4, image2 predicts panel index 5.
    const panelIndex = 4 + imageIndex
    const correctPanel = image.options.find((o) => o.id === image.correctOptionId).panel
    const taken = [correctPanel, a.panel]
    const rng = makeRng(
      itemSeed({
        generator: 'figure-sequences-repair',
        section: SECTION,
        tier: q.difficulty,
        batchId: 'repair-2026-09-05',
        index: imageIndex,
        attempt: 0,
      }),
    )

    // Try the second slot first, since that is the one the generator fills last.
    let target = b
    let replacement =
      makeDistractor(rng, run.states, q.rules, panelIndex, correctPanel, taken, new Set([fa])) ??
      nudgeDistractor(rng, correctPanel, run.panels[panelIndex - 1], taken)

    // Where both panels are the arbitrary positional nudge — a single-symbol
    // mover can genuinely afford only one rule-based family — the second slot
    // has nothing else to become. The rule-based error belongs in the *first*
    // slot in that case, with the nudge left as the second, which is the shape
    // the generator produces today.
    if (!replacement || replacement.family === fa) {
      const alt = makeDistractor(
        rng,
        run.states,
        q.rules,
        panelIndex,
        correctPanel,
        [correctPanel, b.panel],
        new Set([fa]),
      )
      if (alt) {
        target = a
        replacement = alt
      }
    }

    if (!replacement || replacement.family === fa) {
      report.push(`${q.id} ${image.label}: no different-family panel available; LEFT UNCHANGED`)
      continue
    }

    target.panel = replacement.panel
    q.meta.distractorTypes[`${image.label}:${target.id}`] = replacement.family
    q.distractorNotes[`${image.label}:${target.id}`] = replacement.note
    repaired++
    report.push(`${q.id} ${image.label}: ${target.id} ${fa} → ${replacement.family}`)
  }
}

for (const line of report) console.log(line)
console.log(`\n${repaired} image(s) repaired${dryRun ? ' (dry run, nothing written)' : ''}`)
if (!dryRun && repaired) writeBank(SECTION, bank)
