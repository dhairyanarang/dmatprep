/**
 * Mathematical Equations generator.
 *
 * Systems are built as dependency chains, matching the shape of the official
 * exercises: one equation pins a root variable (directly at low difficulty, or
 * through a combining equation at medium and high), and the rest define the
 * remaining letters from it. Uniqueness over 1..20 is then proven exhaustively —
 * construction is never trusted on its own.
 */
import {
  MAX_VALUE,
  MIN_VALUE,
  hasUniqueSolution,
  num,
  op,
  renderEquation,
  solveAll,
  variable,
} from '../lib/equations.mjs'
import { VERIFIED_AT, pick, randInt, shuffle } from '../lib/rng.mjs'

const GENERATOR = { name: 'math-equations', version: '1.0.0', verifiedAt: VERIFIED_AT }

const NAMES = ['A', 'B', 'C', 'D']
const inRange = (v) => Number.isInteger(v) && v >= MIN_VALUE && v <= MAX_VALUE

/**
 * Define `target` in terms of `source`, returning the equation plus a plain
 * description of the rearrangement for the worked solution.
 */
function defineFrom(rng, targetName, targetValue, sourceName, sourceValue) {
  const forms = []

  if (sourceValue !== 0 && targetValue % sourceValue === 0) {
    const k = targetValue / sourceValue
    if (k >= 2 && k <= 10) {
      forms.push({
        eq: { lhs: op('×', num(k), variable(sourceName)), rhs: variable(targetName) },
        step: `${k} × ${sourceName} = ${targetName}, so ${targetName} = ${k} × ${sourceValue} = ${targetValue}.`,
      })
    }
  }

  if (targetValue !== 0 && sourceValue % targetValue === 0) {
    const k = sourceValue / targetValue
    if (k >= 2 && k <= 10) {
      forms.push({
        eq: { lhs: op('÷', variable(sourceName), num(k)), rhs: variable(targetName) },
        step: `${sourceName} ÷ ${k} = ${targetName}, so ${targetName} = ${sourceValue} ÷ ${k} = ${targetValue}.`,
      })
    }
  }

  const diff = targetValue - sourceValue
  if (diff > 0 && diff <= 15) {
    forms.push({
      eq: { lhs: op('+', num(diff), variable(sourceName)), rhs: variable(targetName) },
      step: `${diff} + ${sourceName} = ${targetName}, so ${targetName} = ${diff} + ${sourceValue} = ${targetValue}.`,
    })
  }
  if (diff < 0 && -diff <= 15) {
    forms.push({
      eq: { lhs: op('−', variable(sourceName), num(-diff)), rhs: variable(targetName) },
      step: `${sourceName} − ${-diff} = ${targetName}, so ${targetName} = ${sourceValue} − ${-diff} = ${targetValue}.`,
    })
  }

  const sum = targetValue + sourceValue
  if (sum <= 40) {
    forms.push({
      eq: { lhs: op('−', num(sum), variable(sourceName)), rhs: variable(targetName) },
      step: `${sum} − ${sourceName} = ${targetName}, so ${targetName} = ${sum} − ${sourceValue} = ${targetValue}.`,
    })
  }

  return forms.length ? pick(rng, forms) : null
}

/** Equation that pins the root directly, e.g. "7 + A = 14". */
function pinRoot(rng, name, value) {
  const forms = []
  const k = randInt(rng, 2, 12)
  forms.push({
    eq: { lhs: op('+', num(k), variable(name)), rhs: num(k + value) },
    step: `${k} + ${name} = ${k + value}. Subtracting ${k} from both sides gives ${name} = ${value}.`,
  })
  if (value > 1) {
    const j = randInt(rng, 1, Math.min(9, value - 1))
    forms.push({
      eq: { lhs: op('−', variable(name), num(j)), rhs: num(value - j) },
      step: `${name} − ${j} = ${value - j}. Adding ${j} to both sides gives ${name} = ${value}.`,
    })
  }
  const m = randInt(rng, 2, 5)
  if (value * m <= 99) {
    forms.push({
      eq: { lhs: op('×', num(m), variable(name)), rhs: num(m * value) },
      step: `${m} × ${name} = ${m * value}. Dividing both sides by ${m} gives ${name} = ${value}.`,
    })
  }
  return pick(rng, forms)
}

/**
 * Combining equation over every variable with alternating signs, e.g.
 * "A − B + C − D = 2" — the shape used in the official high-difficulty items.
 */
function combineAll(rng, names, values) {
  const order = shuffle(rng, names)
  const signs = order.map((_, i) => (i === 0 ? '+' : pick(rng, ['+', '−'])))

  let node = variable(order[0])
  let total = values[order[0]]
  for (let i = 1; i < order.length; i++) {
    node = op(signs[i], node, variable(order[i]))
    total += signs[i] === '+' ? values[order[i]] : -values[order[i]]
  }
  // Keep the right-hand side a positive integer: every official combining
  // equation is positive ("A − B + C − D = 2", "C + D − A = 1"), and a negative
  // constant has no place in the rendered notation.
  if (total < 1 || total > 60) return null

  return {
    eq: { lhs: node, rhs: num(total) },
    signs,
    order,
    total,
  }
}

function buildSystem(rng, difficulty) {
  const varCount = difficulty === 'low' ? 2 : difficulty === 'medium' ? 3 : 4
  const names = NAMES.slice(0, varCount)

  // Chain: root, then each variable defined from an earlier one.
  const rootValue = randInt(rng, 2, 14)
  const values = { [names[0]]: rootValue }
  const definitions = []

  for (let i = 1; i < names.length; i++) {
    const sourceName = pick(rng, names.slice(0, i))
    let made = null
    for (let attempt = 0; attempt < 25 && !made; attempt++) {
      const value = randInt(rng, MIN_VALUE, MAX_VALUE)
      // Distinct values across letters: every official example has them, and a
      // repeated value makes the "that's another letter's value" note ambiguous.
      if (!inRange(value) || Object.values(values).includes(value)) continue
      const form = defineFrom(rng, names[i], value, sourceName, values[sourceName])
      if (form) {
        values[names[i]] = value
        made = form
      }
    }
    if (!made) return null
    definitions.push(made)
  }

  let determining
  if (difficulty === 'low') {
    determining = pinRoot(rng, names[0], values[names[0]])
  } else {
    const combined = combineAll(rng, names, values)
    if (!combined) return null
    determining = {
      eq: combined.eq,
      step: `Substituting the other equations into ${renderEquation(combined.eq)} leaves a single unknown, which solves to ${names[0]} = ${values[names[0]]}.`,
    }
  }

  // Display order is shuffled so the system doesn't read as a recipe, but the
  // worked solution keeps logical order: pin the root first, then substitute.
  const logicalOrder = [determining, ...definitions]
  const equations = shuffle(rng, logicalOrder)
  const eqNodes = equations.map((e) => e.eq)

  if (!hasUniqueSolution(eqNodes, names)) return null

  const solutions = solveAll(eqNodes, names, 2)
  if (solutions.length !== 1) return null
  for (const name of names) {
    if (solutions[0][name] !== values[name]) return null
  }

  return { names, values, equations, eqNodes, logicalOrder }
}

/** Wrong answers drawn from real mistakes, each with a note explaining the slip. */
function buildDistractors(rng, names, values, asked) {
  const correct = values[asked]
  const candidates = []

  for (const name of names) {
    if (name === asked) continue
    candidates.push({
      value: values[name],
      note: `${values[name]} is the value of ${name}, not ${asked} — this is the right system solved for the wrong letter.`,
    })
  }

  candidates.push({
    value: correct + 1,
    note: `${correct + 1} is one more than the correct value — an off-by-one slip when adding or subtracting the constant.`,
  })
  candidates.push({
    value: correct - 1,
    note: `${correct - 1} is one less than the correct value — an off-by-one slip when adding or subtracting the constant.`,
  })
  candidates.push({
    value: correct * 2,
    note: `${correct * 2} is double the correct value, which is what you get if you multiply where the equation divides.`,
  })
  if (correct % 2 === 0) {
    candidates.push({
      value: correct / 2,
      note: `${correct / 2} is half the correct value, which is what you get if you divide where the equation multiplies.`,
    })
  }

  const seen = new Set([correct])
  const chosen = []
  for (const candidate of shuffle(rng, candidates)) {
    if (chosen.length === 3) break
    if (!inRange(candidate.value) || seen.has(candidate.value)) continue
    seen.add(candidate.value)
    chosen.push(candidate)
  }

  // Top up with nearby values if the error modes collided.
  let delta = 2
  while (chosen.length < 3 && delta < 20) {
    for (const value of [correct + delta, correct - delta]) {
      if (chosen.length === 3) break
      if (!inRange(value) || seen.has(value)) continue
      seen.add(value)
      chosen.push({
        value,
        note: `${value} does not satisfy every equation at once — check it against each line of the system.`,
      })
    }
    delta++
  }

  return chosen
}

function buildQuestion(rng, index, difficulty) {
  const system = buildSystem(rng, difficulty)
  if (!system) return null

  const { names, values, eqNodes, logicalOrder } = system
  const asked = pick(rng, names)
  const correct = values[asked]

  const distractors = buildDistractors(rng, names, values, asked)
  if (distractors.length < 3) return null

  const options = shuffle(rng, [
    { id: `opt-${correct}`, value: correct },
    ...distractors.map((d) => ({ id: `opt-${d.value}`, value: d.value })),
  ])

  const distractorNotes = {}
  for (const d of distractors) distractorNotes[`opt-${d.value}`] = d.note

  const solutionSteps = logicalOrder.map((e) => e.step)
  solutionSteps.push(
    `Full solution: ${names.map((n) => `${n} = ${values[n]}`).join(', ')}. The question asks for ${asked}, so the answer is ${correct}.`,
  )

  return {
    id: `me-${difficulty}-${String(index).padStart(3, '0')}`,
    kind: 'math-equations',
    section: 'mathematical-equations',
    difficulty,
    equations: eqNodes.map(renderEquation),
    variables: names,
    asked,
    options,
    correctOptionId: `opt-${correct}`,
    solution: values,
    solutionSteps,
    explanation: `${solutionSteps.join(' ')}`,
    distractorNotes,
    generator: GENERATOR,
  }
}

export function generateMathEquations(rng, quotas = { low: 14, medium: 13, high: 13 }) {
  const out = []

  for (const [difficulty, count] of Object.entries(quotas)) {
    const seen = new Set()
    let made = 0
    let attempts = 0

    while (made < count && attempts < 50000) {
      attempts++
      const q = buildQuestion(rng, made + 1, difficulty)
      if (!q) continue

      const fingerprint = q.equations.join(' | ')
      if (seen.has(fingerprint)) continue
      seen.add(fingerprint)

      out.push(q)
      made++
    }

    if (made < count) {
      throw new Error(`math-equations: only produced ${made}/${count} ${difficulty} items`)
    }
  }

  return out
}
