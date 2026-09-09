#!/usr/bin/env node
/**
 * Repair Mathematical Equations teaching content.
 *
 *   node scripts/repair/me-teaching-content.mjs [--dry-run]
 *
 * The 5 September 2026 audit found 54 items whose distractor notes describe a
 * mistake that cannot produce the value they sit on:
 *
 *   - 48 name "the first equation", but the equations are shuffled at render, so
 *     there is no first equation for the candidate to look at;
 *   - 8 blame multiplication or division in a system that contains neither.
 *
 * Rewording is not available. Of 75 defective notes, 69 sit on values that admit
 * **no true mechanism at all** — they are the superseded `correct ± constant`
 * family the Phase 3 audit identified, where `A ÷ 3 = 3` (answer 9) was given
 * distractors 6 and 12 while claiming a misapplication that yields 1. A note
 * cannot be made honest about a value that no misstep reaches.
 *
 * So each defective item's *wrong* options are rebuilt from mechanisms that are
 * actually available in that item, using the families the current generator
 * uses. What is preserved exactly:
 *
 *   - the equations, the asked letter and the full solution;
 *   - the correct option: its id, its value, and `correctOptionId`.
 *
 * What changes: the wrong options' values, ids and notes, and — where it gave the
 * answer away — the level-2 hint. A stored attempt keeps its verdict, because
 * correctness is decided against `correctOptionId`, which does not move.
 */
import { readBank, writeBank } from '../lib/bank.mjs'
import { operatorsIn } from '../lib/verify.mjs'

const dryRun = process.argv.includes('--dry-run')
const SECTION = 'mathematical-equations'
const TEACHING_VERSION = '3.3.0'
const REPAIRED_AT = '2026-09-05'

const lettersIn = (s) => [...new Set(s.match(/[A-Z]/g) ?? [])]
const inRange = (v) => Number.isInteger(v) && v >= 1 && v <= 20

/** The equation that fixes the root letter — the only one with a single unknown. */
const determiningEquation = (q) => q.equations.find((e) => lettersIn(e).length === 1) ?? null

/**
 * The value a candidate reaches by undoing the determining equation the wrong
 * way round. Computed from the equation, never assumed.
 */
function wrongInverse(q) {
  const eq = determiningEquation(q)
  if (!eq) return null
  const [lhs, rhsText] = eq.split(' = ')
  const rhs = Number(rhsText)
  if (!Number.isFinite(rhs)) return null
  let m
  if ((m = /^(\d+) × [A-Z]$/.exec(lhs))) {
    return { eq, value: rhs * Number(m[1]), how: `multiplying by ${m[1]} instead of dividing by it` }
  }
  if ((m = /^[A-Z] ÷ (\d+)$/.exec(lhs))) {
    const k = Number(m[1])
    return rhs % k === 0
      ? { eq, value: rhs / k, how: `dividing by ${k} again instead of multiplying by it` }
      : null
  }
  if ((m = /^(\d+) \+ [A-Z]$/.exec(lhs))) {
    return { eq, value: rhs + Number(m[1]), how: `adding ${m[1]} instead of subtracting it` }
  }
  if ((m = /^[A-Z] − (\d+)$/.exec(lhs))) {
    return { eq, value: rhs - Number(m[1]), how: `subtracting ${m[1]} again instead of adding it` }
  }
  return null
}

/**
 * Is this note one of the two defective shapes?
 *
 * The operator test mirrors `verify-bank`'s wording exactly. An earlier draft
 * paraphrased it, missed the "divide where the equation multiplies" phrasing,
 * and stamped an item as repaired while leaving the defect in place — which
 * promoted a standing warning straight to a failure.
 */
function noteIsDefective(note, operators) {
  if (/the first equation/.test(note)) return true
  if (/multiply where the equation divides/.test(note) && !operators.has('÷')) return true
  if (/divide where the equation multiplies/.test(note) && !operators.has('×')) return true
  return false
}

/** Every distractor this item can honestly offer, in the generator's preference order. */
function trueCandidates(q) {
  const answer = q.solution[q.asked]
  const operators = operatorsIn(q.equations)
  const names = Object.keys(q.solution)
  const order = names // solution order is generation order: the root letter first
  const askedIndex = order.indexOf(q.asked)
  const previous = askedIndex > 0 ? order[askedIndex - 1] : null

  const out = []
  for (const name of names) {
    if (name === q.asked) continue
    out.push({
      value: q.solution[name],
      family: name === previous ? 'stopped-early' : 'wrong-variable',
      note:
        name === previous
          ? `${q.solution[name]} is the value of ${name}, the letter you have to work out on the way. Stopping there answers the wrong question — the item asks for ${q.asked}.`
          : `${q.solution[name]} is the value of ${name}, not ${q.asked} — this is the right system solved for the wrong letter.`,
    })
  }
  if (operators.has('÷')) {
    out.push({
      value: answer * 2,
      family: 'inverted-operation',
      note: `${answer * 2} is double the correct value, which is what you get if you multiply where the equation divides.`,
    })
  }
  if (operators.has('×') && answer % 2 === 0) {
    out.push({
      value: answer / 2,
      family: 'inverted-operation',
      note: `${answer / 2} is half the correct value, which is what you get if you divide where the equation multiplies.`,
    })
  }
  // Only offered when the asked letter is the one the determining equation fixes:
  // otherwise the misapplication produces a wrong value for *that* letter, which
  // the candidate would propagate onward to some third number.
  const inverse = q.asked === order[0] ? wrongInverse(q) : null
  if (inverse && Number.isInteger(inverse.value)) {
    out.push({
      value: inverse.value,
      family: 'misapplied-constant',
      note: `${inverse.value} is what you get from ${inverse.eq} by ${inverse.how}. Undoing an operation means applying its inverse, not repeating it.`,
    })
  }
  for (const v of [answer + 1, answer - 1]) {
    out.push({
      value: v,
      family: 'off-by-one',
      note: `${v} is one ${v > answer ? 'more' : 'less'} than the correct value — an off-by-one slip when adding or subtracting a constant.`,
    })
  }

  // A value that fits two families cannot be explained honestly; drop it. One
  // off-by-one only — the policy the verifier enforces.
  const seen = new Map()
  const usable = []
  let offByOne = 0
  for (const c of out) {
    if (!inRange(c.value) || c.value === answer) continue
    if (seen.has(c.value)) {
      seen.set(c.value, null) // ambiguous
      continue
    }
    seen.set(c.value, c)
  }
  for (const c of out) {
    const kept = seen.get(c.value)
    if (!kept || kept !== c) continue
    if (c.family === 'off-by-one') {
      if (offByOne >= 1) continue
      offByOne++
    }
    usable.push(c)
  }
  return usable
}

/**
 * Level 2 quotes the starting equation — but when that equation holds only the
 * asked letter, quoting it *is* the answer. Name the operation to undo instead.
 */
const OPERATION_WORD = { '×': 'multiplies', '÷': 'divides', '+': 'adds to', '−': 'subtracts from' }
function repairHint(q) {
  const hint = q.hints?.find((h) => h.level === 2)
  if (!hint) return false
  const quoted = /Look at ([^.]+)\./.exec(hint.text)
  if (!quoted) return false
  const letters = lettersIn(quoted[1])
  if (letters.length !== 1 || letters[0] !== q.asked) return false

  const eq = quoted[1]
  const opChar = (eq.match(/[+−×÷]/) ?? [])[0]
  hint.text = opChar
    ? `The equation you want is the one that ${OPERATION_WORD[opChar]} ${q.asked} and nothing else. Find it, then undo that operation on both sides.`
    : 'One of the equations gives a letter its value outright, with nothing done to it. Start from that line and work outwards.'
  return true
}

/* ------------------------------------------------------------------- run */

const bank = readBank(SECTION)
let itemsRepaired = 0
let optionsRebuilt = 0
let hintsRepaired = 0
let notesRewritten = 0
const stuck = []
const hintOnly = []

for (const q of bank) {
  const operators = operatorsIn(q.equations)
  const defective = Object.entries(q.distractorNotes ?? {}).filter(([, n]) =>
    noteIsDefective(n, operators),
  )
  const hintFixed = repairHint(q)
  if (hintFixed) hintsRepaired++
  if (!defective.length) {
    // A hint repair alone does not make the item's teaching content current: the
    // stamp promotes every note check from warning to error, so it may only be
    // applied to an item whose notes have all been proved sound.
    if (hintFixed) {
      itemsRepaired++
      hintOnly.push(q.id)
    }
    continue
  }

  const answer = q.solution[q.asked]
  const candidates = trueCandidates(q)
  const wrongSlots = q.options.filter((o) => o.id !== q.correctOptionId)
  if (candidates.length < wrongSlots.length) {
    stuck.push(`${q.id}: only ${candidates.length} true mechanisms for ${wrongSlots.length} slots`)
    continue
  }

  // Keep any existing wrong option whose value a true mechanism already explains,
  // so the item changes as little as it can; fill the rest from what is left.
  const chosen = []
  const usedValues = new Set([answer])
  for (const slot of wrongSlots) {
    const match = candidates.find((c) => c.value === slot.value && !usedValues.has(c.value))
    if (match) {
      chosen.push(match)
      usedValues.add(match.value)
    } else {
      chosen.push(null)
    }
  }
  for (let i = 0; i < chosen.length; i++) {
    if (chosen[i]) continue
    const next = candidates.find((c) => !usedValues.has(c.value))
    if (!next) {
      stuck.push(`${q.id}: ran out of true mechanisms filling slot ${i + 1}`)
      break
    }
    chosen[i] = next
    usedValues.add(next.value)
    optionsRebuilt++
  }
  if (chosen.some((c) => !c)) continue

  const correct = q.options.find((o) => o.id === q.correctOptionId)
  const rebuilt = []
  const notes = {}
  const families = {}
  let wi = 0
  for (const option of q.options) {
    if (option.id === q.correctOptionId) {
      rebuilt.push(correct)
      continue
    }
    const c = chosen[wi++]
    const id = `opt-${c.value}`
    rebuilt.push({ id, value: c.value })
    notes[id] = c.note
    families[id] = c.family
    notesRewritten++
  }

  q.options = rebuilt
  q.distractorNotes = notes
  q.meta.distractorTypes = families
  q.generator.teachingContent = { version: TEACHING_VERSION, repairedAt: REPAIRED_AT }
  itemsRepaired++
}

for (const line of stuck) console.log('UNREPAIRED', line)
if (hintOnly.length) console.log(`hint-only repairs (notes already sound, stamp withheld): ${hintOnly.length}`)
console.log(
  `${itemsRepaired} item(s) repaired · ${notesRewritten} note(s) rewritten · ` +
    `${optionsRebuilt} distractor value(s) replaced · ${hintsRepaired} hint(s) repaired` +
    `${dryRun ? ' (dry run, nothing written)' : ''}`,
)
if (!dryRun && itemsRepaired) writeBank(SECTION, bank)
