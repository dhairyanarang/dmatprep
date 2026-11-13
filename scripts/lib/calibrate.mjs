/**
 * What makes a question hard, measured rather than asserted.
 *
 * Every section gets its own rubric, because the thing that makes a figure
 * sequence hard has nothing in common with what makes a Latin square hard. A
 * single shared scale would flatten exactly the distinctions this is for.
 *
 * Two rules govern everything here:
 *
 *   Nothing in this file changes a question. `calibrate` reads a record and
 *   returns what it measured and what tier those measurements suggest. The
 *   stored `difficulty` is never consulted while measuring and never written.
 *   Disagreement between the two is a finding for a person, not a correction to
 *   apply — see scripts/calibrate-report.mjs.
 *
 *   Measures come from the record, not from `meta`. `meta.reasoningDepth` and
 *   friends were written by the generator that made the item; trusting them
 *   would make this a mirror rather than a check. Rules, equations and grids
 *   are re-read from the data every time.
 */
import { parseEquation } from './equations.mjs'

/* ------------------------------------------------------------ figure sequences */

const ACTIVE_MOVEMENT = (m) => Boolean(m) && m.type !== 'none' && m.type !== 'static'
const ACTIVE_ROTATION = (r) => Boolean(r) && r.type !== 'none'
const ACTIVE_COLOUR = (c) => Boolean(c) && c.type !== 'none'

/**
 * Load is counted per symbol and then peaked, not summed: three rules riding one
 * symbol is a different kind of hard from three symbols carrying one rule each,
 * and only the first asks the candidate to hold several properties of the same
 * object in mind at once.
 */
export function calibrateFigureSequence(question) {
  const rules = Object.values(question.rules ?? {})
  const perSymbol = rules.map(
    (r) =>
      (ACTIVE_MOVEMENT(r.movement) ? 1 : 0) +
      (ACTIVE_ROTATION(r.rotation) ? 1 : 0) +
      (ACTIVE_COLOUR(r.colour) ? 1 : 0),
  )

  const accelerating = rules.filter(
    (r) =>
      r.movement?.step === 'x+1' ||
      r.rotation?.accelerating === true ||
      r.colour?.accelerating === true,
  ).length

  const measures = {
    symbols: rules.length,
    activeRules: perSymbol.reduce((a, b) => a + b, 0),
    peakLoad: perSymbol.length ? Math.max(...perSymbol) : 0,
    rotating: rules.filter((r) => ACTIVE_ROTATION(r.rotation)).length,
    colourCycling: rules.filter((r) => ACTIVE_COLOUR(r.colour)).length,
    accelerating,
    boundaryInteracting: rules.filter(
      (r) => r.movement?.boundary === 'bounce' || r.movement?.type === 'border',
    ).length,
    movementKinds: new Set(rules.map((r) => r.movement?.type).filter(Boolean)).size,
  }

  const { symbols, peakLoad, activeRules } = measures
  const reasons = []
  let suggested

  if (symbols >= 4 || peakLoad >= 4 || (symbols >= 3 && peakLoad >= 3 && activeRules >= 7)) {
    suggested = 'high'
    reasons.push(
      symbols >= 4
        ? `${symbols} symbols to track`
        : peakLoad >= 4
          ? `${peakLoad} rules stacked on one symbol`
          : `${symbols} symbols carrying ${activeRules} rules, peak ${peakLoad}`,
    )
  } else if (symbols <= 2 && peakLoad <= 2 && activeRules <= 3) {
    suggested = 'low'
    reasons.push(`${symbols} symbol(s), ${activeRules} rule(s), peak load ${peakLoad}`)
  } else {
    suggested = 'medium'
    reasons.push(`${symbols} symbols, ${activeRules} rules, peak load ${peakLoad}`)
  }

  return { section: 'figure-sequences', measures, suggested, reasons }
}

/* ------------------------------------------------------- mathematical equations */

/** Variables appearing anywhere in an expression tree. */
function varsIn(node, out = new Set()) {
  if (!node) return out
  if (node.t === 'var') out.add(node.name)
  if (node.t === 'op') {
    varsIn(node.left, out)
    varsIn(node.right, out)
  }
  return out
}

/**
 * A relation is nonlinear when a multiplication or division has a variable on
 * both sides: A × B, A × A, B ÷ C. A variable scaled by a constant is linear,
 * however large the constant.
 */
function nonlinearity(node, found = { product: false, square: false, varDivisor: false }) {
  if (node?.t !== 'op') return found
  nonlinearity(node.left, found)
  nonlinearity(node.right, found)
  if (node.o === '×' || node.o === '÷') {
    const left = varsIn(node.left)
    const right = varsIn(node.right)
    if (left.size && right.size) {
      if (node.o === '÷') found.varDivisor = true
      else found.product = true
      for (const v of left) if (right.has(v)) found.square = true
    }
  }
  return found
}

/**
 * How many waves of deduction stand between the equations and the asked letter.
 *
 * Each round resolves every equation that has exactly one unresolved variable
 * left in it. The count is the round on which the asked letter falls out, which
 * is the number of substitution steps a candidate actually has to make — not the
 * number of letters, which says nothing about the work.
 */
function substitutionDepth(parsed, variables, asked) {
  const known = new Set()
  for (let round = 1; round <= variables.length + 1; round++) {
    const resolvable = []
    for (const eq of parsed) {
      const unknown = [...varsIn(eq.lhs), ...varsIn(eq.rhs)].filter((v) => !known.has(v))
      if (new Set(unknown).size === 1) resolvable.push(unknown[0])
    }
    if (!resolvable.length) break
    for (const v of resolvable) known.add(v)
    if (known.has(asked)) return round
  }
  // Substitution alone never reaches the asked letter: the system has to be
  // solved as a whole, by elimination. That is harder than a chain, not easier,
  // and an earlier version of this function returned Infinity here and let the
  // band logic read it as zero — which made the hardest systems look easy.
  return null
}

export function calibrateMathEquations(question) {
  const parsed = question.equations.map(parseEquation)
  const flags = parsed.reduce(
    (acc, eq) => {
      const l = nonlinearity(eq.lhs)
      const r = nonlinearity(eq.rhs)
      return {
        product: acc.product || l.product || r.product,
        square: acc.square || l.square || r.square,
        varDivisor: acc.varDivisor || l.varDivisor || r.varDivisor,
      }
    },
    { product: false, square: false, varDivisor: false },
  )

  const steps = substitutionDepth(parsed, question.variables, question.asked)
  const requiresElimination = steps === null
  // A system that will not fall to substitution must be held together and solved
  // at once, so the work scales with how many letters are in play.
  const effectiveSteps = steps ?? Math.max(1, question.variables.length - 1)
  const operations = question.equations.join(' ').match(/[+−×÷]/g)?.length ?? 0

  const measures = {
    variables: question.variables.length,
    equations: question.equations.length,
    substitutionSteps: steps,
    requiresElimination,
    effectiveSteps,
    nonlinear: flags.product || flags.square || flags.varDivisor,
    variableProduct: flags.product,
    quadratic: flags.square,
    variableDivisor: flags.varDivisor,
    // An equation naming three or more letters forces them to be held together
    // rather than resolved one at a time.
    interactingConstraints: parsed.filter(
      (eq) => new Set([...varsIn(eq.lhs), ...varsIn(eq.rhs)]).size >= 3,
    ).length,
    operations,
    largestValue: Math.max(...Object.values(question.solution ?? { x: 0 })),
  }

  const { variables, nonlinear, interactingConstraints } = measures
  const describe = requiresElimination
    ? `${variables} letters solved together by elimination`
    : `${variables} letters, ${steps} substitution step(s)`
  const reasons = []
  let suggested

  if (nonlinear) {
    suggested = 'high'
    reasons.push('a nonlinear relation — a variable multiplied or divided by a variable')
  } else if (effectiveSteps >= 3 || (variables >= 4 && effectiveSteps >= 2)) {
    suggested = 'high'
    reasons.push(describe)
  } else if (variables <= 2 && effectiveSteps <= 1 && !interactingConstraints) {
    suggested = 'low'
    reasons.push(describe)
  } else {
    suggested = 'medium'
    reasons.push(describe)
  }

  return { section: 'mathematical-equations', measures, suggested, reasons }
}

/* ----------------------------------------------------------------- latin squares */

export function calibrateLatinSquare(question) {
  const givens = question.grid.flat().filter(Boolean).length
  const steps = question.solutionSteps ?? []
  const target = question.target

  const measures = {
    givens,
    cells: question.size * question.size,
    density: Number((givens / (question.size * question.size)).toFixed(2)),
    forcedPlacementDepth: question.forcedPlacementDepth ?? null,
    deductionSteps: steps.length,
    // Placements the deduction needed that lie outside the target's own row and
    // column: the measure of how far the chain reaches before it comes back.
    offLinePrerequisites: steps.filter(
      (s) => s.cell.row !== target.row && s.cell.col !== target.col,
    ).length,
    techniques: [...new Set(steps.map((s) => s.technique).filter(Boolean))],
  }

  const depth = measures.forcedPlacementDepth ?? 0
  const reasons = []
  let suggested

  if (depth >= 5 && givens <= 9) {
    suggested = 'high'
    reasons.push(`depth ${depth} from only ${givens} given cells`)
  } else if (depth <= 2 && givens >= 10) {
    suggested = 'low'
    reasons.push(`depth ${depth} with ${givens} given cells`)
  } else {
    suggested = 'medium'
    reasons.push(`depth ${depth}, ${givens} given cells`)
  }

  return { section: 'latin-squares', measures, suggested, reasons }
}

/* -------------------------------------------------------------------------- GAM */

/**
 * GAM is calibrated from the question and its adjudication, not from the length
 * of the passage. A long source is not a hard question; it is a long source.
 */
export function calibrateGam(question, { adjudication } = {}) {
  const measures = {
    reasoningSteps: question.meta?.stepCount ?? null,
    blocksToCombine: question.meta?.blockSpan ?? null,
    transferDistance: question.meta?.transferDistance ?? null,
    requiresExhibit: question.meta?.requiresExhibit ?? null,
    sourceBlocksCited: (question.dependsOn ?? []).length,
    supportSpans: (question.supportSpans ?? []).length,
    hasComputation: Boolean(question.computation),
    // From the qualifying adjudication round, where one was supplied.
    sourceMateriallyContributes: adjudication?.sourceMateriallyContributes ?? null,
    recognitionNotTransfer: adjudication?.recognitionNotTransfer ?? null,
    ablationDeterminable: adjudication?.evidence?.ablationVerdict === 'determinable',
  }

  const steps = measures.reasoningSteps ?? 0
  const blocks = measures.blocksToCombine ?? 0
  const recall = measures.recognitionNotTransfer === true
  const reasons = []
  let suggested

  if (steps >= 3 && blocks >= 2 && !recall) {
    suggested = 'high'
    reasons.push(`${steps} steps combining ${blocks} source blocks, judged transfer not recall`)
  } else if (steps <= 1 && blocks <= 1) {
    suggested = 'low'
    reasons.push(`${steps} step(s), ${blocks} block(s)`)
  } else {
    suggested = 'medium'
    reasons.push(`${steps} steps, ${blocks} blocks${recall ? ', judged recall rather than transfer' : ''}`)
  }

  if (measures.ablationDeterminable) {
    reasons.push('WARNING: an adjudicator answered this without the source')
  }

  return { section: 'gam', measures, suggested, reasons }
}

/* --------------------------------------------------------------------- dispatch */

export function calibrate(question, context) {
  switch (question.kind) {
    case 'figure-sequence':
      return calibrateFigureSequence(question)
    case 'math-equations':
      return calibrateMathEquations(question)
    case 'latin-square':
      return calibrateLatinSquare(question)
    default:
      // GAM questions carry no `kind`; they are identified by their pack id.
      if (question.packId) return calibrateGam(question, context)
      throw new Error(`cannot calibrate: unknown question shape (${question.id})`)
  }
}

export const BANDS = ['low', 'medium', 'high']
