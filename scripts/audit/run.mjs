/**
 * The independent correctness audit of the active question bank.
 *
 * Every verdict here is derived from the question alone. The stored answer
 * key, the explanation and the stored solution are read at the END of each
 * check, only to compare — never to reach the conclusion. That distinction is
 * the entire value of the exercise: `npm run verify:bank` already proves the
 * bank is internally consistent, and an internally consistent bank can be
 * uniformly wrong.
 *
 * Output is JSON on stdout, which `scripts/audit/report.mjs` turns into the
 * committed Markdown.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

import { solve } from './me-solver.mjs'
import { solveTarget } from './ls-solver.mjs'
import { deriveContinuation, checkImages } from './fs-checker.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const bank = (section) => {
  const raw = JSON.parse(
    readFileSync(join(root, 'content/sections', section, 'questions.json'), 'utf8'),
  )
  return Array.isArray(raw) ? raw : raw.questions
}

const findings = []
const add = (id, section, severity, kind, detail) =>
  findings.push({ id, section, severity, kind, detail })

/** Checks every question carries the explanation apparatus the types promise. */
function checkProse(q, section, optionIds) {
  if (typeof q.explanation !== 'string' || q.explanation.trim().length < 20) {
    add(q.id, section, 'issue', 'explanation-missing', 'explanation absent or under 20 characters')
  }
  const notes = q.distractorNotes ?? {}
  for (const optionId of optionIds) {
    if (!notes[optionId] || String(notes[optionId]).trim().length < 10) {
      add(q.id, section, 'issue', 'distractor-note-missing', `no usable note for "${optionId}"`)
    }
  }
  for (const key of Object.keys(notes)) {
    if (!optionIds.includes(key)) {
      add(q.id, section, 'issue', 'distractor-note-orphan', `note for unknown option "${key}"`)
    }
  }
}

/* ------------------------------------------------- mathematical equations */

function auditME() {
  const all = bank('mathematical-equations')
  const active = all.filter((q) => !q.meta?.quarantined)
  let pass = 0

  for (const q of active) {
    const result = solve(q, 3)
    if (result.error) {
      add(q.id, 'mathematical-equations', 'review', 'unparsed', result.error)
      continue
    }
    const { solutions, askedValues } = result

    if (solutions.length === 0) {
      add(q.id, 'mathematical-equations', 'issue', 'no-solution', `no assignment in 1..20 satisfies ${q.equations.join(' ; ')}`)
      continue
    }
    if (askedValues.length > 1) {
      add(q.id, 'mathematical-equations', 'issue', 'ambiguous', `${q.asked} can be ${askedValues.join(' or ')}`)
      continue
    }

    const derived = solutions[0][q.asked]
    const stored = q.options.find((o) => o.id === q.correctOptionId)
    if (!stored) {
      add(q.id, 'mathematical-equations', 'issue', 'key-missing', `correctOptionId "${q.correctOptionId}" is not an option`)
      continue
    }
    if (stored.value !== derived) {
      add(q.id, 'mathematical-equations', 'issue', 'wrong-key', `${q.asked} = ${derived}; key says ${stored.value}`)
      continue
    }

    // A distractor equal to the answer makes two options correct.
    const sameValue = q.options.filter((o) => o.value === derived)
    if (sameValue.length > 1) {
      add(q.id, 'mathematical-equations', 'issue', 'duplicate-option', `${sameValue.length} options share the value ${derived}`)
      continue
    }
    // The stored full solution is checked too, where present.
    if (q.solution) {
      for (const [name, value] of Object.entries(q.solution)) {
        if (solutions[0][name] !== value) {
          add(q.id, 'mathematical-equations', 'issue', 'stored-solution-wrong', `${name}: derived ${solutions[0][name]}, stored ${value}`)
        }
      }
    }
    // The explanation must at least state the number it is explaining.
    if (typeof q.explanation === 'string' && !new RegExp(`\\b${derived}\\b`).test(q.explanation)) {
      add(q.id, 'mathematical-equations', 'review', 'explanation-silent', `explanation never states ${q.asked} = ${derived}`)
    }
    checkProse(q, 'mathematical-equations', q.options.map((o) => o.id).filter((id) => id !== q.correctOptionId))
    pass++
  }
  return { total: all.length, active: active.length, pass }
}

/* -------------------------------------------------------- latin squares */

function auditLS() {
  const all = bank('latin-squares')
  const active = all.filter((q) => !q.meta?.quarantined)
  let pass = 0

  for (const q of active) {
    const result = solveTarget(q)
    if (result.error) {
      add(q.id, 'latin-squares', 'issue', 'invalid-givens', result.error)
      continue
    }
    if (result.possible.length === 0) {
      add(q.id, 'latin-squares', 'issue', 'no-solution', 'the givens admit no valid completion')
      continue
    }
    if (result.possible.length > 1) {
      add(q.id, 'latin-squares', 'issue', 'ambiguous', `the marked cell can be ${result.possible.join(' or ')}`)
      continue
    }

    const derived = result.possible[0]
    const stored = q.options.find((o) => o.id === q.correctOptionId)
    if (!stored) {
      add(q.id, 'latin-squares', 'issue', 'key-missing', `correctOptionId "${q.correctOptionId}" is not an option`)
      continue
    }
    if (stored.letter !== derived) {
      add(q.id, 'latin-squares', 'issue', 'wrong-key', `marked cell is ${derived}; key says ${stored.letter}`)
      continue
    }
    // Only letters that appear in the response row may be offered.
    for (const option of q.options) {
      if (!q.letters.includes(option.letter)) {
        add(q.id, 'latin-squares', 'issue', 'foreign-option', `option "${option.letter}" is not one of the grid's letters`)
      }
    }
    if (typeof q.explanation === 'string' && !new RegExp(`\\b${derived}\\b`).test(q.explanation)) {
      add(q.id, 'latin-squares', 'review', 'explanation-silent', `explanation never names the answer ${derived}`)
    }
    checkProse(q, 'latin-squares', q.options.map((o) => o.id).filter((id) => id !== q.correctOptionId))
    pass++
  }
  return { total: all.length, active: active.length, pass }
}

/* ----------------------------------------------------- figure sequences */

function auditFS() {
  const all = bank('figure-sequences')
  const active = all.filter((q) => !q.meta?.quarantined)
  let pass = 0

  for (const q of active) {
    const derived = deriveContinuation(q)
    if (derived.error) {
      add(q.id, 'figure-sequences', 'issue', 'underivable', derived.error)
      continue
    }
    if (derived.ambiguous) {
      add(q.id, 'figure-sequences', 'issue', 'ambiguous', `more than one continuation fits: ${derived.ambiguous.join('; ')}`)
      continue
    }

    const images = checkImages(q, derived)
    let ok = true
    for (const image of images) {
      if (image.error) {
        add(q.id, 'figure-sequences', 'issue', 'image-shape', image.error)
        ok = false
        continue
      }
      if (image.duplicates.length) {
        add(q.id, 'figure-sequences', 'issue', 'duplicate-option', `${image.label}: identical options ${image.duplicates.join(', ')}`)
        ok = false
      }
      if (image.matches.length === 0) {
        add(q.id, 'figure-sequences', 'issue', 'no-matching-option', `${image.label}: the derived panel is not among the options`)
        ok = false
        continue
      }
      if (image.matches.length > 1) {
        add(q.id, 'figure-sequences', 'issue', 'ambiguous', `${image.label}: ${image.matches.length} options match the derivation`)
        ok = false
        continue
      }
      if (image.matches[0] !== image.stored) {
        add(q.id, 'figure-sequences', 'issue', 'wrong-key', `${image.label}: derived ${image.matches[0]}, key says ${image.stored}`)
        ok = false
      }
    }
    if (!ok) continue

    const optionIds = q.images.flatMap((image) =>
      image.options.filter((o) => o.id !== image.correctOptionId).map((o) => `${image.label}:${o.id}`),
    )
    checkProse(q, 'figure-sequences', optionIds)
    pass++
  }
  return { total: all.length, active: active.length, pass }
}

/* ---------------------------------------------------- cross-bank checks */

function auditRegistry() {
  const retiredFor = (section) => {
    try {
      const raw = JSON.parse(readFileSync(join(root, 'content/sections', section, 'retired.json'), 'utf8'))
      const list = Array.isArray(raw) ? raw : (raw.retired ?? raw.questions ?? [])
      return new Set(list.map((entry) => entry.id ?? entry.question?.id ?? entry))
    } catch {
      return new Set()
    }
  }

  for (const section of ['figure-sequences', 'mathematical-equations', 'latin-squares']) {
    const all = bank(section)
    const retired = retiredFor(section)
    const seen = new Set()
    for (const q of all) {
      if (seen.has(q.id)) add(q.id, section, 'issue', 'duplicate-id', 'the same id appears twice in the bank')
      seen.add(q.id)
      if (!q.meta?.quarantined && retired.has(q.id)) {
        add(q.id, section, 'issue', 'retired-but-active', 'id is in retired.json yet is served as active')
      }
      if (q.section !== section) {
        add(q.id, section, 'issue', 'section-mismatch', `question declares section "${q.section}"`)
      }
    }
  }
}

const me = auditME()
const ls = auditLS()
const fs = auditFS()
auditRegistry()

process.stdout.write(
  JSON.stringify({ generatedAt: new Date().toISOString(), me, ls, fs, findings }, null, 2),
)
