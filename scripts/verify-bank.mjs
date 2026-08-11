#!/usr/bin/env node
/**
 * Independent re-verification of every committed question.
 *
 * This deliberately re-derives each answer from the data actually in
 * questions.json rather than trusting the generator that produced it: equations
 * are re-parsed from their rendered strings and re-solved, Latin squares are
 * re-propagated, and figure sequences are re-simulated from the first panel.
 * A bank that passes this has been checked, not asserted.
 */
import { readFileSync } from 'node:fs'

import { verifyLatinSquare } from './generate/latin-squares.mjs'
import { parseEquation, solveAll } from './lib/equations.mjs'
import { panelsEqual, simulate } from './lib/figures.mjs'

const SECTIONS = ['figure-sequences', 'mathematical-equations', 'latin-squares']
const DIFFICULTIES = ['low', 'medium', 'high']

function verifyCommon(q) {
  const errors = []
  if (!q.id) errors.push('missing id')
  if (!DIFFICULTIES.includes(q.difficulty)) errors.push(`bad difficulty: ${q.difficulty}`)
  if (!q.explanation || q.explanation.trim().length < 20) errors.push('missing or trivial explanation')
  if (!q.generator?.name) errors.push('missing generator stamp')
  return errors
}

/** Every wrong option must carry a note saying why it is wrong. */
function verifyDistractorCoverage(q) {
  const errors = []
  const notes = q.distractorNotes ?? {}

  const expectKey = (key, label) => {
    if (!notes[key] || notes[key].trim().length < 10) {
      errors.push(`no distractor note for ${label}`)
    }
  }

  if (q.kind === 'figure-sequence') {
    for (const image of q.images) {
      for (const option of image.options) {
        if (option.id === image.correctOptionId) continue
        expectKey(`${image.label}:${option.id}`, `${image.label}/${option.id}`)
      }
    }
  } else {
    for (const option of q.options) {
      if (option.id === q.correctOptionId) continue
      expectKey(option.id, option.id)
    }
  }
  return errors
}

function verifyMathEquations(q) {
  const errors = []
  let parsed
  try {
    parsed = q.equations.map(parseEquation)
  } catch (e) {
    return [`unparseable equation: ${e.message}`]
  }

  const solutions = solveAll(parsed, q.variables, 2)
  if (solutions.length === 0) errors.push('system has no solution over 1..20')
  if (solutions.length > 1) errors.push('system does not have a unique solution')

  if (solutions.length === 1) {
    for (const name of q.variables) {
      if (solutions[0][name] !== q.solution[name]) {
        errors.push(`stored ${name}=${q.solution[name]}, re-solved ${name}=${solutions[0][name]}`)
      }
    }
    const correct = q.options.find((o) => o.id === q.correctOptionId)
    if (!correct) errors.push('correctOptionId is not among the options')
    else if (correct.value !== solutions[0][q.asked]) {
      errors.push(`correct option is ${correct.value}, but ${q.asked} = ${solutions[0][q.asked]}`)
    }
  }

  const values = q.options.map((o) => o.value)
  if (new Set(values).size !== values.length) errors.push('duplicate option values')
  if (!q.variables.includes(q.asked)) errors.push(`asked letter ${q.asked} is not in the system`)

  return errors
}

function verifyFigureSequence(q) {
  const errors = []

  // Rebuild the starting state: panels carry no heading, so it comes from the rule.
  const symbols = q.given[0].symbols.map((s) => ({
    ...s,
    direction: q.rules[s.id]?.movement?.direction ?? null,
  }))

  const panels = simulate(symbols, q.rules, 6)
  if (!panels) return ['re-simulation failed: a symbol leaves the grid or two overlap']

  for (let i = 0; i < 4; i++) {
    if (!panelsEqual(panels[i], q.given[i])) errors.push(`given panel ${i + 1} does not match the rules`)
  }

  const expected = [panels[4], panels[5]]
  q.images.forEach((image, i) => {
    const correct = image.options.find((o) => o.id === image.correctOptionId)
    if (!correct) {
      errors.push(`${image.label}: correctOptionId missing from options`)
      return
    }
    if (!panelsEqual(correct.panel, expected[i])) {
      errors.push(`${image.label}: the marked answer is not the panel the rules produce`)
    }
    if (image.options.length !== 3) errors.push(`${image.label}: expected 3 options`)

    // No two options may be identical, or more than one would be defensible.
    for (let a = 0; a < image.options.length; a++) {
      for (let b = a + 1; b < image.options.length; b++) {
        if (panelsEqual(image.options[a].panel, image.options[b].panel)) {
          errors.push(`${image.label}: options ${a + 1} and ${b + 1} are identical`)
        }
      }
    }

    // And no distractor may also satisfy the rules.
    for (const option of image.options) {
      if (option.id === image.correctOptionId) continue
      if (panelsEqual(option.panel, expected[i])) {
        errors.push(`${image.label}: distractor ${option.id} is also correct`)
      }
    }
  })

  if (q.given.length !== 4) errors.push(`expected 4 given matrices, found ${q.given.length}`)
  if (q.images.length !== 2) errors.push(`expected 2 images, found ${q.images.length}`)

  return errors
}

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
    solutions.length === 1 &&
    fixture.variables.every((v) => solutions[0][v] === fixture.expect[v])
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

for (const section of SECTIONS) {
  const path = new URL(`../content/sections/${section}/questions.json`, import.meta.url)
  const questions = JSON.parse(readFileSync(path, 'utf8'))
  const ids = new Set()
  const counts = { low: 0, medium: 0, high: 0 }
  let failures = 0

  for (const q of questions) {
    totalChecked++
    const errors = [
      ...verifyCommon(q),
      ...verifyDistractorCoverage(q),
      ...(q.kind === 'latin-square' ? verifyLatinSquare(q) : []),
      ...(q.kind === 'math-equations' ? verifyMathEquations(q) : []),
      ...(q.kind === 'figure-sequence' ? verifyFigureSequence(q) : []),
    ]

    if (ids.has(q.id)) errors.push('duplicate id')
    ids.add(q.id)
    if (q.section !== section) errors.push(`section mismatch: ${q.section}`)
    if (counts[q.difficulty] !== undefined) counts[q.difficulty]++

    if (errors.length) {
      failures++
      totalFailures++
      console.error(`✗ ${q.id}`)
      for (const e of errors) console.error(`    ${e}`)
    }
  }

  const summary = `${questions.length} items (low ${counts.low}, medium ${counts.medium}, high ${counts.high})`
  console.log(`${failures === 0 ? '✓' : '✗'} ${section}: ${summary}${failures ? ` — ${failures} FAILED` : ''}`)
}

console.log(`\n${totalChecked} questions checked, ${totalFailures} failed.`)
if (totalFailures > 0) process.exit(1)
