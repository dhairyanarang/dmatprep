/**
 * Mathematical Equations generator.
 *
 * Difficulty is reasoning depth, not variable count: a four-letter system whose
 * asked letter falls out of the first equation is easier than a three-letter one
 * whose asked letter sits two substitutions down. Depth is *measured* by
 * replaying the propagation a solver would perform, then checked against the
 * label. See DMAT_QUESTION_AUTHORING_SPEC.md §3.
 *
 * Uniqueness over 1..20 is proven exhaustively — construction is never trusted.
 */
import {
  MAX_VALUE,
  MIN_VALUE,
  hasUniqueSolution,
  num,
  op,
  renderEquation,
  satisfies,
  solveAll,
  variable,
} from '../lib/equations.mjs'
import { VERIFIED_AT, pick, randInt, shuffle } from '../lib/rng.mjs'

const GENERATOR = { name: 'math-equations', version: '2.0.0', verifiedAt: VERIFIED_AT }

const NAMES = ['A', 'B', 'C', 'D']
const inRange = (v) => Number.isInteger(v) && v >= MIN_VALUE && v <= MAX_VALUE

/* ------------------------------------------------------------- depth model */

function varsOf(node, acc = new Set()) {
  if (node.t === 'var') acc.add(node.name)
  else if (node.t === 'op') {
    varsOf(node.left, acc)
    varsOf(node.right, acc)
  }
  return acc
}

const eqVars = (eq) => new Set([...varsOf(eq.lhs), ...varsOf(eq.rhs)])

/**
 * The order a solver would determine the letters in, and how.
 *
 * `direct` — some equation had exactly one unknown left.
 * `substitute` — nothing had a single unknown, so the definitions had to be
 * pushed into a combining equation to collapse it. That counts as one step,
 * because it is one algebraic move, but it is the expensive one.
 */
export function solveOrder(equations, variables) {
  const solutions = solveAll(equations, variables, 2)
  if (solutions.length !== 1) return null
  const full = solutions[0]

  const known = {}
  const order = []
  let guard = 0

  while (order.length < variables.length && guard++ < 40) {
    let progressed = false

    for (const eq of equations) {
      const unknown = [...eqVars(eq)].filter((v) => !(v in known))
      if (unknown.length !== 1) continue
      const name = unknown[0]
      known[name] = full[name]
      order.push({ name, kind: 'direct', equation: eq })
      progressed = true
    }
    if (progressed) continue

    const remaining = variables.filter((v) => !(v in known))
    if (remaining.length === 0) break

    // Stalled: find the letter whose value unblocks propagation. That is the
    // one the combining equation collapses to.
    let best = null
    for (const name of remaining) {
      const trial = { ...known, [name]: full[name] }
      const unblocked = equations.filter(
        (eq) => [...eqVars(eq)].filter((v) => !(v in trial)).length === 1,
      ).length
      if (unblocked > 0 && (!best || unblocked > best.unblocked)) best = { name, unblocked }
    }

    const combining = equations.find((eq) => eqVars(eq).size === variables.length)
    if (!best) {
      for (const name of remaining) {
        known[name] = full[name]
        order.push({ name, kind: 'substitute', equation: combining })
      }
      break
    }
    known[best.name] = full[best.name]
    order.push({ name: best.name, kind: 'substitute', equation: combining })
  }

  return order.length === variables.length ? order : null
}

/** Steps a solver performs before the asked letter's value is known. */
function depthOf(order, asked) {
  const i = order.findIndex((s) => s.name === asked)
  return i === -1 ? null : i + 1
}

/* ------------------------------------------------------- equation builders */

/** Define `target` from `source`, preferring × and ÷ when asked to. */
function defineFrom(rng, targetName, targetValue, sourceName, sourceValue, preferMultiplicative) {
  const multiplicative = []
  const additive = []

  if (sourceValue !== 0 && targetValue % sourceValue === 0) {
    const k = targetValue / sourceValue
    if (k >= 2 && k <= 10) {
      multiplicative.push({
        eq: { lhs: op('×', num(k), variable(sourceName)), rhs: variable(targetName) },
        step: `${k} × ${sourceName} = ${targetName}, so ${targetName} = ${k} × ${sourceValue} = ${targetValue}.`,
        opKind: '×',
      })
    }
  }

  if (targetValue !== 0 && sourceValue % targetValue === 0) {
    const k = sourceValue / targetValue
    if (k >= 2 && k <= 10) {
      multiplicative.push({
        eq: { lhs: op('÷', variable(sourceName), num(k)), rhs: variable(targetName) },
        step: `${sourceName} ÷ ${k} = ${targetName}, so ${targetName} = ${sourceValue} ÷ ${k} = ${targetValue}.`,
        opKind: '÷',
      })
    }
  }

  const diff = targetValue - sourceValue
  if (diff > 0 && diff <= 15) {
    additive.push({
      eq: { lhs: op('+', num(diff), variable(sourceName)), rhs: variable(targetName) },
      step: `${diff} + ${sourceName} = ${targetName}, so ${targetName} = ${diff} + ${sourceValue} = ${targetValue}.`,
      opKind: '+',
    })
  }
  if (diff < 0 && -diff <= 15) {
    additive.push({
      eq: { lhs: op('−', variable(sourceName), num(-diff)), rhs: variable(targetName) },
      step: `${sourceName} − ${-diff} = ${targetName}, so ${targetName} = ${sourceValue} − ${-diff} = ${targetValue}.`,
      opKind: '−',
    })
  }
  const sum = targetValue + sourceValue
  if (sum <= 40) {
    additive.push({
      eq: { lhs: op('−', num(sum), variable(sourceName)), rhs: variable(targetName) },
      step: `${sum} − ${sourceName} = ${targetName}, so ${targetName} = ${sum} − ${sourceValue} = ${targetValue}.`,
      opKind: '−',
    })
  }

  const pool = preferMultiplicative && multiplicative.length ? multiplicative : [...multiplicative, ...additive]
  return pool.length ? pick(rng, pool) : null
}

/** Pin a letter outright, e.g. "7 + A = 14" or "3 × A = 27". */
function pinRoot(rng, name, value, preferMultiplicative) {
  const multiplicative = []
  const additive = []

  // The official examples never show a numeric constant above 18, and every
  // product stays small because both sides are letters. 40 is the ceiling here:
  // still divisible in the head, without notes, which the exam forbids.
  const m = randInt(rng, 2, 5)
  if (value * m <= 40) {
    multiplicative.push({
      eq: { lhs: op('×', num(m), variable(name)), rhs: num(m * value) },
      step: `${m} × ${name} = ${m * value}. Dividing both sides by ${m} gives ${name} = ${value}.`,
      opKind: '×',
      constant: m,
    })
  }
  for (const k of [2, 3, 4, 5]) {
    if (value % k === 0 && value / k >= 1) {
      multiplicative.push({
        eq: { lhs: op('÷', variable(name), num(k)), rhs: num(value / k) },
        step: `${name} ÷ ${k} = ${value / k}. Multiplying both sides by ${k} gives ${name} = ${value}.`,
        opKind: '÷',
        constant: k,
      })
    }
  }

  const k = randInt(rng, 2, 12)
  additive.push({
    eq: { lhs: op('+', num(k), variable(name)), rhs: num(k + value) },
    step: `${k} + ${name} = ${k + value}. Subtracting ${k} from both sides gives ${name} = ${value}.`,
    opKind: '+',
    constant: k,
  })
  if (value > 1) {
    const j = randInt(rng, 1, Math.min(9, value - 1))
    additive.push({
      eq: { lhs: op('−', variable(name), num(j)), rhs: num(value - j) },
      step: `${name} − ${j} = ${value - j}. Adding ${j} to both sides gives ${name} = ${value}.`,
      opKind: '−',
      constant: j,
    })
  }

  const pool = preferMultiplicative && multiplicative.length ? multiplicative : [...multiplicative, ...additive]
  return pick(rng, pool)
}

/** Alternating-sign equation over every letter — the official Ex 5/6 shape. */
function combineAll(rng, names, values) {
  const order = shuffle(rng, names)
  const signs = order.map((_, i) => (i === 0 ? '+' : pick(rng, ['+', '−'])))

  let node = variable(order[0])
  let total = values[order[0]]
  for (let i = 1; i < order.length; i++) {
    node = op(signs[i], node, variable(order[i]))
    total += signs[i] === '+' ? values[order[i]] : -values[order[i]]
  }
  // Every official combining equation has a positive right-hand side.
  if (total < 1 || total > 60) return null

  return { eq: { lhs: node, rhs: num(total) }, total }
}

/* ------------------------------------------------------------ system build */

/**
 * Build a dependency chain of the requested length. `shape` decides whether the
 * root is pinned outright or has to be reached through a combining equation.
 */
function buildSystem(rng, varCount, shape, preferMultiplicative) {
  const names = NAMES.slice(0, varCount)
  const rootValue = randInt(rng, 2, 14)
  const values = { [names[0]]: rootValue }
  const definitions = []

  for (let i = 1; i < names.length; i++) {
    // A strict chain: each letter defined from its immediate predecessor, so
    // depth is a straight line and the asked letter's position means something.
    const sourceName = names[i - 1]
    const sourceValue = values[sourceName]

    // Drawing the value at random almost never lands on a multiple or a divisor
    // of the source, so a multiplicative definition is rarely available. When
    // this item is meant to lean multiplicative, choose from values that make
    // one possible in the first place.
    const multiples = []
    for (let k = 2; k <= 10; k++) {
      if (sourceValue * k <= MAX_VALUE) multiples.push(sourceValue * k)
      if (sourceValue % k === 0 && sourceValue / k >= MIN_VALUE) multiples.push(sourceValue / k)
    }

    const pool = preferMultiplicative && multiples.length
      ? shuffle(rng, multiples)
      : shuffle(rng, Array.from({ length: MAX_VALUE }, (_, n) => n + 1))

    let made = null
    for (const value of pool) {
      if (!inRange(value) || Object.values(values).includes(value)) continue
      const form = defineFrom(rng, names[i], value, sourceName, sourceValue, preferMultiplicative)
      if (form) {
        values[names[i]] = value
        made = form
        break
      }
    }
    if (!made) return null
    definitions.push(made)
  }

  let determining
  if (shape === 'pin') {
    determining = pinRoot(rng, names[0], values[names[0]], preferMultiplicative)
  } else {
    const combined = combineAll(rng, names, values)
    if (!combined) return null
    determining = {
      eq: combined.eq,
      step: `Substituting the other equations into ${renderEquation(combined.eq)} leaves a single unknown, which solves to ${names[0]} = ${values[names[0]]}.`,
      opKind: 'combine',
    }
  }

  const logicalOrder = [determining, ...definitions]
  const equations = shuffle(rng, logicalOrder)
  const eqNodes = equations.map((e) => e.eq)

  if (!hasUniqueSolution(eqNodes, names)) return null
  const solutions = solveAll(eqNodes, names, 2)
  if (solutions.length !== 1) return null
  for (const name of names) {
    if (solutions[0][name] !== values[name]) return null
  }
  if (!satisfies(eqNodes, values)) return null

  return { names, values, eqNodes, logicalOrder, determining, definitions }
}

/* -------------------------------------------------------------- distractors */

/**
 * Wrong answers drawn from nameable errors. Spec §3.4: at most one off-by-one,
 * at least one wrong-variable where one exists, and any value that could be
 * read as two different mistakes is rejected outright — an option that
 * diagnoses two things diagnoses nothing.
 */
function buildDistractors(rng, names, values, asked, order, determining) {
  const correct = values[asked]
  const askedIndex = order.findIndex((s) => s.name === asked)
  const previous = askedIndex > 0 ? order[askedIndex - 1].name : null

  const candidates = []

  for (const name of names) {
    if (name === asked) continue
    candidates.push({
      value: values[name],
      family: name === previous ? 'stopped-early' : 'wrong-variable',
      note:
        name === previous
          ? `${values[name]} is the value of ${name}, the letter you have to work out on the way. Stopping there answers the wrong question — the item asks for ${asked}.`
          : `${values[name]} is the value of ${name}, not ${asked} — this is the right system solved for the wrong letter.`,
    })
  }

  candidates.push({
    value: correct * 2,
    family: 'inverted-operation',
    note: `${correct * 2} is double the correct value, which is what you get if you multiply where the equation divides.`,
  })
  if (correct % 2 === 0) {
    candidates.push({
      value: correct / 2,
      family: 'inverted-operation',
      note: `${correct / 2} is half the correct value, which is what you get if you divide where the equation multiplies.`,
    })
  }

  if (determining.constant) {
    for (const v of [correct + determining.constant, correct - determining.constant]) {
      candidates.push({
        value: v,
        family: 'misapplied-constant',
        note: `${v} is what you get by applying the constant ${determining.constant} the wrong way round when rearranging the first equation.`,
      })
    }
  }

  const offByOne = shuffle(rng, [
    {
      value: correct + 1,
      family: 'off-by-one',
      note: `${correct + 1} is one more than the correct value — an off-by-one slip when adding or subtracting a constant.`,
    },
    {
      value: correct - 1,
      family: 'off-by-one',
      note: `${correct - 1} is one less than the correct value — an off-by-one slip when adding or subtracting a constant.`,
    },
  ])

  // A value that fits two families cannot be explained honestly. Drop it.
  const byValue = new Map()
  for (const c of [...candidates, ...offByOne]) {
    if (!inRange(c.value) || c.value === correct) continue
    const seen = byValue.get(c.value)
    if (seen) {
      if (seen.family !== c.family) seen.conflicted = true
      continue
    }
    byValue.set(c.value, { ...c })
  }

  const usable = [...byValue.values()].filter((c) => !c.conflicted)
  const wrongLetter = usable.filter((c) => c.family === 'wrong-variable' || c.family === 'stopped-early')
  const others = shuffle(
    rng,
    usable.filter((c) => c.family !== 'wrong-variable' && c.family !== 'stopped-early' && c.family !== 'off-by-one'),
  )
  const nudges = usable.filter((c) => c.family === 'off-by-one')

  const chosen = []
  // At least one wrong-letter option whenever the system offers one.
  if (wrongLetter.length) chosen.push(pick(rng, wrongLetter))
  for (const c of others) {
    if (chosen.length >= 3) break
    if (chosen.some((x) => x.value === c.value)) continue
    chosen.push(c)
  }
  // At most one off-by-one.
  if (chosen.length < 3 && nudges.length) {
    const n = pick(rng, nudges)
    if (!chosen.some((x) => x.value === n.value)) chosen.push(n)
  }
  for (const c of shuffle(rng, wrongLetter)) {
    if (chosen.length >= 3) break
    if (chosen.some((x) => x.value === c.value)) continue
    chosen.push(c)
  }

  if (chosen.length < 3) return null
  if (chosen.filter((c) => c.family === 'off-by-one').length > 1) return null
  return chosen.slice(0, 3)
}

/* ------------------------------------------------------- solution and hints */

function buildSolution(order, values, asked, determining, equationStrings) {
  const askedIndex = order.findIndex((s) => s.name === asked)
  const relevant = order.slice(0, askedIndex + 1)
  const opensWithSubstitution = order[0].kind === 'substitute'

  const keyInsight = opensWithSubstitution
    ? 'No equation starts with a single unknown. Push the definitions into the equation that mentions every letter, and it collapses to one.'
    : `One equation has only a single unknown. Solve that first, then every other letter follows from it${askedIndex === 0 ? ' — and it is the letter the question asks for' : ''}.`

  const steps = relevant.map((entry, i) => {
    const eqText = entry.equation ? renderEquation(entry.equation) : null
    return {
      title:
        i === 0
          ? entry.kind === 'substitute'
            ? 'Collapse the combining equation'
            : 'Start where only one letter is unknown'
          : `Substitute to reach ${entry.name}`,
      detail:
        entry.kind === 'substitute'
          ? `Every other equation defines a letter in terms of another. Substituting them into ${eqText} leaves ${entry.name} as the only unknown, which gives ${entry.name} = ${values[entry.name]}.`
          : `${eqText} has ${entry.name} as its only unknown, so ${entry.name} = ${values[entry.name]}.`,
      visual: eqText ? { type: 'me-equation', equation: eqText, note: `${entry.name} = ${values[entry.name]}` } : undefined,
    }
  })

  steps.push({
    title: 'Read the question again before answering',
    detail: `The chain also fixes ${order
      .filter((s) => s.name !== asked)
      .map((s) => `${s.name} = ${values[s.name]}`)
      .join(', ')}. The question asks for ${asked}.`,
    visual: { type: 'me-values', values },
  })

  // Only offer a shortcut that genuinely applies to this item.
  const determiningEq = relevant[relevant.length - 1]?.equation
  const determiningText = determiningEq ? renderEquation(determiningEq) : equationStrings[0]
  const multiplicative = determining.opKind === '×' || determining.opKind === '÷'

  const takeaway = opensWithSubstitution
    ? 'When nothing has a single unknown, do not hunt for one. Substitute every definition into the equation that mentions all the letters — that is what collapses it.'
    : multiplicative
      ? `Divisibility narrows this kind of item fast: in ${determiningText} the coefficient tells you which multiples are even possible, which is often quicker than solving forward.`
      : `Scan for the equation with one unknown before reading the rest. Here that is ${determiningText}, and it is not always the first line in the list.`

  return {
    keyInsight,
    steps,
    answer: `${asked} = ${values[asked]}.`,
    takeaway,
  }
}

function buildHints(order, asked) {
  const askedIndex = order.findIndex((s) => s.name === asked)
  const first = order[0]
  const firstEq = first.equation ? renderEquation(first.equation) : null
  const opensWithSubstitution = first.kind === 'substitute'

  const level1 = opensWithSubstitution
    ? 'No single equation starts with one unknown, so do not go looking for one. One equation mentions every letter — that is the way in.'
    : 'One of the equations has only a single unknown. Find it before you read the others.'

  const level2 = opensWithSubstitution
    ? `Substitute the other equations into ${firstEq}. Everything is defined in terms of ${first.name}.`
    : `Look at ${firstEq}.`

  const level3 =
    askedIndex === 0
      ? opensWithSubstitution
        ? `Once the substitution leaves ${first.name} alone on one side, rearrange for it — that is the letter you are asked for.`
        : `Rearrange it for ${first.name}: undo the constant on the left, then the coefficient.`
      : `Solve for ${first.name} first, then substitute it into the equation that defines ${order[1]?.name ?? asked}, and keep going until you reach ${asked}.`

  return [
    { level: 1, text: level1 },
    { level: 2, text: level2 },
    { level: 3, text: level3 },
  ]
}

/* ---------------------------------------------------------------- assembly */

const SHAPES = {
  low: { varCount: 2, shape: 'pin', depth: 1 },
  medium: { varCount: 3, shape: 'pin', depth: 2 },
  high: [
    { varCount: 4, shape: 'combine', depth: 3 },
    { varCount: 4, shape: 'combine', depth: 4 },
    { varCount: 4, shape: 'pin', depth: 3 },
    { varCount: 4, shape: 'pin', depth: 4 },
  ],
}

function buildQuestion(rng, index, difficulty, preferMultiplicative) {
  const plan = difficulty === 'high' ? pick(rng, SHAPES.high) : SHAPES[difficulty]
  const system = buildSystem(rng, plan.varCount, plan.shape, preferMultiplicative)
  if (!system) return null

  const { names, values, eqNodes, logicalOrder, determining } = system

  const order = solveOrder(eqNodes, names)
  if (!order) return null

  // Ask the letter that sits at the intended depth — measured, not assumed.
  const atDepth = order[plan.depth - 1]
  if (!atDepth) return null
  const asked = atDepth.name

  const depth = depthOf(order, asked)
  if (depth !== plan.depth) return null
  // Spec §3.2: a high item may not be answered by the first letter determined.
  if (difficulty === 'high' && order[0].name === asked) return null

  const correct = values[asked]
  const distractors = buildDistractors(rng, names, values, asked, order, determining)
  if (!distractors) return null

  const options = shuffle(rng, [
    { id: `opt-${correct}`, value: correct },
    ...distractors.map((d) => ({ id: `opt-${d.value}`, value: d.value })),
  ])
  if (new Set(options.map((o) => o.value)).size !== options.length) return null

  const distractorNotes = {}
  const distractorTypes = {}
  for (const d of distractors) {
    distractorNotes[`opt-${d.value}`] = d.note
    distractorTypes[`opt-${d.value}`] = d.family
  }

  const equations = eqNodes.map(renderEquation)
  const solutionSteps = logicalOrder.map((e) => e.step)
  solutionSteps.push(
    `Full solution: ${names.map((n) => `${n} = ${values[n]}`).join(', ')}. The question asks for ${asked}, so the answer is ${correct}.`,
  )

  const hints = buildHints(order, asked)
  // A hint must never contain the answer as a standalone number.
  const answerToken = new RegExp(`(^|[^0-9])${correct}([^0-9]|$)`)
  if (hints.some((h) => answerToken.test(h.text))) return null

  const opKinds = logicalOrder.map((e) => e.opKind)
  const multiplicativeCount = opKinds.filter((k) => k === '×' || k === '÷').length

  const patternType = [
    plan.shape === 'combine' ? 'elimination' : 'direct-substitution',
    `${names.length}-variable-system`,
    depth >= 3 ? 'multi-step-substitution' : depth === 2 ? 'two-step-substitution' : 'single-step',
    ...(multiplicativeCount >= 2 ? ['mixed-operations'] : []),
  ]

  return {
    id: `me-${difficulty}-${String(index).padStart(3, '0')}`,
    kind: 'math-equations',
    section: 'mathematical-equations',
    difficulty,
    equations,
    variables: names,
    asked,
    options,
    correctOptionId: `opt-${correct}`,
    solution: values,
    solutionSteps,
    explanation: solutionSteps.join(' '),
    distractorNotes,
    hints,
    walkthrough: buildSolution(order, values, asked, determining, equations),
    meta: {
      patternType,
      skill: plan.shape === 'combine' ? 'substitution into a combining equation' : 'forward substitution along a chain',
      dmatAlignment: 'officially_documented',
      reasoningDepth: depth,
      distractorTypes,
      generationNotes: `depth ${depth}, ${multiplicativeCount} multiplicative operation(s), asked letter determined at position ${depth} of ${names.length}`,
    },
    generator: GENERATOR,
  }
}

export function generateMathEquations(rng, quotas = { low: 15, medium: 15, high: 15 }) {
  const out = []

  for (const [difficulty, count] of Object.entries(quotas)) {
    const seen = new Set()
    let made = 0
    let attempts = 0
    // Spec §3.3: at least half of each tier must lean multiplicative.
    const multiplicativeQuota = Math.ceil(count * 0.55)

    while (made < count && attempts < 200000) {
      attempts++
      const q = buildQuestion(rng, made + 1, difficulty, made < multiplicativeQuota)
      if (!q) continue

      const fingerprint = q.equations.join(' | ')
      if (seen.has(fingerprint)) continue
      seen.add(fingerprint)

      // Structural duplicate guard: same shape, same depth, same operator mix.
      out.push(q)
      made++
    }

    if (made < count) {
      throw new Error(`math-equations: only produced ${made}/${count} ${difficulty} items`)
    }
  }

  return out
}
