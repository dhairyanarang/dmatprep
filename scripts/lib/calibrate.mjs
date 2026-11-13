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
const ACTIVE_ROTATION = (r) => r?.type === 'rotate'
// `constant` is the absence of a colour rule, not a rule. Counting it as one
// inflated activeRules on 202 of the bank's 429 symbols and pushed twenty
// medium items into the high band for carrying colours that never change.
const ACTIVE_COLOUR = (c) => c?.type === 'cycle'

/**
 * Load is counted per symbol and then peaked, not summed: three rules riding one
 * symbol is a different kind of hard from three symbols carrying one rule each,
 * and only the first asks the candidate to hold several properties of the same
 * object in mind at once.
 */
/** A rule whose step grows, which the generator counts as load in its own right. */
const ACCELERATES = (r) =>
  r.movement?.step === 'x+1' || r.rotation?.accelerating === true || r.colour?.accelerating === true

/** Meeting a wall: the symbol's path has to be reasoned about, not just extended. */
const MEETS_WALL = (r) => r.movement?.boundary === 'bounce' || r.movement?.type === 'border'

export function calibrateFigureSequence(question) {
  const rules = Object.values(question.rules ?? {})

  /**
   * Load as the generator models it, not as a count of rule slots.
   *
   * A symbol has three slots — movement, rotation, colour — so counting only
   * those caps load at 3 and makes the high tier unreachable. The generator's
   * own comment is explicit that high is "reachable either by accelerating or
   * by stacking movement + rotation + colour on a symbol that also interacts
   * with a wall", so acceleration and a wall interaction each add load.
   */
  const perSymbol = rules.map(
    (r) =>
      (ACTIVE_MOVEMENT(r.movement) ? 1 : 0) +
      (ACTIVE_ROTATION(r.rotation) ? 1 : 0) +
      (ACTIVE_COLOUR(r.colour) ? 1 : 0) +
      (ACCELERATES(r) ? 1 : 0) +
      (MEETS_WALL(r) ? 1 : 0),
  )

  const accelerating = rules.filter(ACCELERATES).length

  const measures = {
    symbols: rules.length,
    // Transformations in play: movement, rotation and colour cycling only.
    activeRules: rules.reduce(
      (n, r) =>
        n +
        (ACTIVE_MOVEMENT(r.movement) ? 1 : 0) +
        (ACTIVE_ROTATION(r.rotation) ? 1 : 0) +
        (ACTIVE_COLOUR(r.colour) ? 1 : 0),
      0,
    ),
    // Load, which also counts acceleration and wall interaction. Kept apart
    // from activeRules because they answer different questions: how much is
    // changing, against how much a candidate must hold about one symbol.
    totalLoad: perSymbol.reduce((a, b) => a + b, 0),
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

  // Banded on peak load, which is the generator's own difficulty lever, with
  // symbol count breaking the tie only where it cannot cost a medium item: the
  // medium tier never exceeds three symbols.
  //
  // This will not reach full agreement on Figure Sequences, and should not be
  // tuned until it does. The generator overlaps the symbol ranges on purpose
  // and keeps acceleration out of some high items, so that the tier cannot be
  // read off the picture — spec §2.3. Sixteen medium and sixteen high items sit
  // at load 4 with three symbols and are not separable by anything in the
  // record. Fitting a threshold to split them would be fitting noise.
  if (peakLoad >= 5 || (peakLoad >= 4 && symbols >= 4)) {
    suggested = 'high'
    reasons.push(`peak load ${peakLoad} on one symbol, ${symbols} symbols, ${activeRules} rules`)
  } else if (peakLoad <= 2) {
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
function resolutionPath(parsed, variables, asked) {
  const equations = parsed.map((eq) => new Set([...varsIn(eq.lhs), ...varsIn(eq.rhs)]))
  const known = new Set()
  const open = () => equations.map((vars, i) => ({ i, vars })).filter((e) => [...e.vars].some((v) => !known.has(v)))

  /**
   * The smallest set of equations that can be solved together: k equations
   * whose unresolved letters number exactly k. Taking the smallest keeps a
   * two-letter elimination from being reported as a four-letter one just
   * because two unrelated equations were still open.
   */
  const smallestCluster = (candidates) => {
    for (let size = 2; size <= candidates.length; size++) {
      for (let mask = 1; mask < 1 << candidates.length; mask++) {
        const chosen = candidates.filter((_, b) => mask & (1 << b))
        if (chosen.length !== size) continue
        const unknowns = new Set(chosen.flatMap((e) => [...e.vars].filter((v) => !known.has(v))))
        if (unknowns.size === size) return unknowns
      }
    }
    return null
  }

  let rounds = 0
  let eliminationUsed = false
  let largestCluster = 0

  for (let guard = 0; guard <= variables.length + 2; guard++) {
    const candidates = open()
    if (!candidates.length) break

    const singles = candidates.filter((e) => [...e.vars].filter((v) => !known.has(v)).length === 1)
    if (singles.length) {
      rounds++
      for (const e of singles) for (const v of e.vars) known.add(v)
    } else {
      const cluster = smallestCluster(candidates)
      if (!cluster) break
      rounds++
      eliminationUsed = true
      largestCluster = Math.max(largestCluster, cluster.size)
      for (const v of cluster) known.add(v)
    }
    if (known.has(asked)) return { rounds, eliminationUsed, largestCluster }
  }
  return { rounds: known.has(asked) ? rounds : null, eliminationUsed, largestCluster }
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

  const path = resolutionPath(parsed, question.variables, question.asked)
  const operations = question.equations.join(' ').match(/[+−×÷]/g)?.length ?? 0

  const measures = {
    variables: question.variables.length,
    equations: question.equations.length,
    // Rounds of deduction on the path to the asked letter. Letters the question
    // never needs do not count: a four-letter system whose answer falls out of
    // one equation is one step of work, whatever else is on the page.
    resolutionRounds: path.rounds,
    requiresElimination: path.eliminationUsed,
    largestEliminationCluster: path.largestCluster,
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

  const { nonlinear } = measures
  const rounds = path.rounds ?? 0
  const describe = path.eliminationUsed
    ? `${rounds} round(s), including a ${path.largestCluster}-letter elimination`
    : `${rounds} substitution step(s) to reach ${question.asked}`
  const reasons = []
  let suggested

  if (nonlinear) {
    suggested = 'high'
    reasons.push('a nonlinear relation — a variable multiplied or divided by a variable')
  } else if (
    rounds >= 3 ||
    path.largestCluster >= 3 ||
    (path.eliminationUsed && rounds >= 2)
  ) {
    suggested = 'high'
    reasons.push(describe)
  } else if (rounds <= 1 && !path.eliminationUsed) {
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

  // Depth alone bands the item. Sparsity is reported beside it but is not a
  // gate: an earlier version required few givens for the high band, which
  // demoted five genuinely deep puzzles for being generously filled, and
  // demoted shallow ones for being sparse. Few givens is a thing to aim for
  // when authoring, not evidence that a puzzle was hard to solve.
  if (depth >= 5) {
    suggested = 'high'
    reasons.push(`depth ${depth} from ${givens} given cells`)
  } else if (depth <= 2) {
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
