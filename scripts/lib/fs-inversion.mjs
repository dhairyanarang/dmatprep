/**
 * Figure Sequences rule-space inversion — the authoritative disambiguation gate.
 *
 * The exam task is not "does the stored rule produce the stored answer". It is
 * "do the four shown matrices imply exactly one continuation". The Phase 3 audit
 * found the old validator only ever asked the former, which is circular: it
 * re-simulated the stored rules and confirmed the marked panel matched. It could
 * never catch an item whose shown panels admit a second legal reading.
 *
 * It measured 7/45 committed items admitting more than one legal continuation,
 * and 2 of those offering the alternative reading *as a distractor* — telling a
 * candidate who reasoned correctly that they were wrong. Every case had one
 * cause: border travel and linear movement are observationally identical while a
 * symbol runs along an edge without turning a corner.
 *
 * This module enumerates the documented rule space, keeps every rule consistent
 * with the shown panels, and reports how many distinct continuations survive.
 * More than one ⇒ reject. The stored rule is never used to break a tie.
 *
 * ## Why this is cheap
 *
 * In `stepSymbol` the three aspects are independent: movement updates cell and
 * heading; rotation depends only on the transition index; colour likewise. So
 * the continuation set factorises —
 *
 *     |continuations| = |movements| × |rotations| × |colours|
 *
 * — and each aspect can be inverted on its own. That turns ~5000 six-panel
 * simulations per symbol into ~56, and tells us *which* aspect is ambiguous
 * rather than only that something is.
 *
 * ## Conservatism
 *
 * Symbols are inverted independently, ignoring the fact that an alternative
 * reading for one symbol might be excluded by overlapping another symbol's
 * forced position. That can only ever report ambiguity where a cross-symbol
 * check would find none — it rejects a few sound items, never accepts an
 * ambiguous one. That is the safe direction for a fidelity gate.
 */
import { COLOURS, GRID, stepSymbol } from './figures.mjs'

const DIAGONALS = ['up-left', 'up-right', 'down-left', 'down-right']

/**
 * The four closed direction cycles the official material demonstrates, plus
 * their mirrors. Ex 4: "left, up, right, down"; Ex 5: "down, right, up, left";
 * p. 7: "one field clockwise within the four middle fields".
 */
export const DIRECTION_CYCLES = [
  ['left', 'up', 'right', 'down'],
  ['down', 'right', 'up', 'left'],
  ['right', 'down', 'left', 'up'],
  ['up', 'left', 'down', 'right'],
  ['up', 'right', 'down', 'left'],
  ['right', 'up', 'left', 'down'],
  ['down', 'left', 'up', 'right'],
  ['left', 'down', 'right', 'up'],
]

/**
 * Every movement rule a candidate could legitimately read out of a start cell.
 *
 * Deliberately a superset of what the generator emits: it includes 180°/270°
 * rotation and both border step sizes even where the generator would not choose
 * them, because the gate must consider every reading *the candidate* could
 * defend, not every reading we happened to build.
 */
export function* candidateMovements(startCell) {
  for (const axis of ['vertical', 'horizontal']) {
    const line = axis === 'vertical' ? startCell.col : startCell.row
    const directions = axis === 'vertical' ? ['up', 'down'] : ['left', 'right']
    for (const direction of directions) {
      // Official linear/diagonal movement is always one field per step; the only
      // other attested size is x+1 (GAM PDF p. 8, Ex 5).
      for (const step of [1, 'x+1']) {
        yield { type: 'linear', axis, line, direction, step, boundary: 'bounce' }
      }
    }
  }
  for (const direction of DIAGONALS) {
    for (const step of [1, 'x+1']) {
      yield { type: 'diagonal', direction, step, boundary: 'bounce' }
    }
  }
  // Border travel at one field (Ex 6), two fields (Ex 3) or x+1 (Ex 5).
  for (const direction of ['clockwise', 'counter-clockwise']) {
    for (const step of [1, 2, 'x+1']) yield { type: 'border', direction, step }
  }
  for (const directions of DIRECTION_CYCLES) {
    yield { type: 'direction-cycle', directions, step: 1 }
  }
}

export function* candidateRotations() {
  yield { type: 'none' }
  for (const direction of ['cw', 'ccw']) {
    for (const degrees of [90, 180, 270]) {
      for (const accelerating of [false, true]) {
        yield { type: 'rotate', direction, degrees, accelerating }
      }
    }
  }
}

/** Orderings of the colours actually shown. See `assertColoursObservable`. */
export function* candidateColours(observed) {
  yield { type: 'constant' }
  const unique = [...new Set(observed)]
  if (unique.length < 2) return
  for (const colours of permutations(unique)) {
    for (const accelerating of [false, true]) yield { type: 'cycle', colours, accelerating }
  }
}

function permutations(arr) {
  if (arr.length <= 1) return [arr]
  return arr.flatMap((x, i) =>
    permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [x, ...p]),
  )
}

const NEUTRAL = { rotation: { type: 'none' }, colour: { type: 'constant' } }
const inBounds = ({ row, col }) => row >= 0 && row < GRID.rows && col >= 0 && col < GRID.cols

/**
 * Step one aspect across `panelCount` transitions from a start state, returning
 * the per-panel values or null if the rule is illegal for this symbol.
 */
function runAspect(start, rule, panelCount) {
  let state = { ...start, colourIndex: 0, cycleIndex: 0 }
  const out = [state]
  for (let panel = 1; panel < panelCount; panel++) {
    const next = stepSymbol(state, rule, panel - 1)
    if (!next) return null
    if (!inBounds(next.cell)) return null
    state = next
    out.push(state)
  }
  return out
}

const readCell = (s) => `${s.cell.row},${s.cell.col}`

/**
 * Invert one symbol's four shown states.
 *
 * Returns per-aspect option counts and the total continuation count. A symbol is
 * unambiguous exactly when every aspect has one option.
 */
export function invertSymbol(observed) {
  const start = {
    id: observed[0].id,
    shape: observed[0].shape,
    cell: { ...observed[0].cell },
    rotation: observed[0].rotation,
    colour: observed[0].colour,
    direction: null,
  }

  const movements = new Map()
  for (const movement of candidateMovements(start.cell)) {
    const run = runAspect({ ...start, direction: movement.direction ?? null }, { ...NEUTRAL, movement }, 6)
    if (!run) continue
    let ok = true
    for (let i = 0; i < 4; i++) {
      if (readCell(run[i]) !== readCell(observed[i])) {
        ok = false
        break
      }
    }
    if (!ok) continue
    const key = `${readCell(run[4])}|${readCell(run[5])}`
    if (!movements.has(key)) movements.set(key, { movement, fifth: run[4].cell, sixth: run[5].cell })
  }

  const rotations = new Map()
  for (const rotation of candidateRotations()) {
    const run = runAspect(start, { ...NEUTRAL, movement: { type: 'static' }, rotation }, 6)
    if (!run) continue
    let ok = true
    for (let i = 0; i < 4; i++) {
      if (run[i].rotation !== observed[i].rotation) {
        ok = false
        break
      }
    }
    if (!ok) continue
    const key = `${run[4].rotation}|${run[5].rotation}`
    if (!rotations.has(key)) rotations.set(key, { rotation, fifth: run[4].rotation, sixth: run[5].rotation })
  }

  const colours = new Map()
  for (const colour of candidateColours(observed.map((o) => o.colour))) {
    const run = runAspect(start, { ...NEUTRAL, movement: { type: 'static' }, colour }, 6)
    if (!run) continue
    let ok = true
    for (let i = 0; i < 4; i++) {
      if (run[i].colour !== observed[i].colour) {
        ok = false
        break
      }
    }
    if (!ok) continue
    const key = `${run[4].colour}|${run[5].colour}`
    if (!colours.has(key)) colours.set(key, { colour, fifth: run[4].colour, sixth: run[5].colour })
  }

  return {
    movements,
    rotations,
    colours,
    total: movements.size * rotations.size * colours.size,
  }
}

/**
 * The cheap structural predicate the audit identified, kept as an early reject.
 *
 * A symbol whose four shown cells all lie on the perimeter and whose heading
 * never changes is readable as either border travel or linear movement — the
 * single cause of every ambiguous item measured. The full inversion below
 * catches this too; this just catches it in microseconds.
 */
export function looksBorderLinearAmbiguous(observed) {
  const onPerimeter = observed.every(
    (o) => o.cell.row === 0 || o.cell.row === GRID.rows - 1 || o.cell.col === 0 || o.cell.col === GRID.cols - 1,
  )
  if (!onPerimeter) return false
  const headings = new Set()
  for (let i = 1; i < observed.length; i++) {
    headings.add(`${observed[i].cell.row - observed[i - 1].cell.row},${observed[i].cell.col - observed[i - 1].cell.col}`)
  }
  return headings.size === 1
}

/**
 * A candidate cannot infer a colour they have never seen. If a symbol's cycle
 * contains a colour absent from the four shown panels, the item is unanswerable
 * however unique its rule is — the official Ex 5 shows all three of
 * white→pink→yellow within the shown panels.
 */
export function coloursAllObservable(rule, observed) {
  if (rule.colour?.type !== 'cycle') return true
  const seen = new Set(observed.map((o) => o.colour))
  return rule.colour.colours.every((c) => seen.has(c))
}

/**
 * THE GATE. Returns [] when the four shown matrices imply exactly one
 * continuation, or a list of reasons why they do not.
 *
 * `given` is the four shown panels. `rules` is optional: when supplied, the
 * single surviving continuation is additionally required to be the one those
 * rules produce, which catches a stored rule that sits *outside* the documented
 * space (it would otherwise leave one legal continuation that is not ours).
 */
export function disambiguationErrors(given, rules) {
  const errors = []
  if (given.length !== 4) return [`expected 4 shown matrices, got ${given.length}`]

  for (const symbol of given[0].symbols) {
    const observed = given.map((p) => p.symbols.find((s) => s.id === symbol.id))
    if (observed.some((o) => !o)) {
      errors.push(`symbol ${symbol.id} is missing from a shown matrix`)
      continue
    }

    if (rules && !coloursAllObservable(rules[symbol.id], observed)) {
      errors.push(
        `${symbol.shape} (${symbol.id}) cycles through a colour that never appears in the four shown matrices`,
      )
    }

    const inverted = invertSymbol(observed)

    if (inverted.movements.size === 0) {
      errors.push(`${symbol.shape} (${symbol.id}) has no documented movement rule matching the shown matrices`)
    } else if (inverted.movements.size > 1) {
      const families = [...new Set([...inverted.movements.values()].map((m) => m.movement.type))]
      errors.push(
        `${symbol.shape} (${symbol.id}) admits ${inverted.movements.size} legal movement continuations (${families.join(' vs ')})`,
      )
    }
    if (inverted.rotations.size > 1) {
      errors.push(`${symbol.shape} (${symbol.id}) admits ${inverted.rotations.size} legal rotation continuations`)
    }
    if (inverted.colours.size > 1) {
      errors.push(`${symbol.shape} (${symbol.id}) admits ${inverted.colours.size} legal colour continuations`)
    }

    // The surviving reading must be the one the stored rules produce.
    if (rules && inverted.movements.size === 1) {
      const only = [...inverted.movements.values()][0]
      const start = { ...observed[0], direction: rules[symbol.id].movement.direction ?? null, colourIndex: 0, cycleIndex: 0 }
      const run = runAspect(start, { ...NEUTRAL, movement: rules[symbol.id].movement }, 6)
      if (!run) {
        errors.push(`${symbol.shape} (${symbol.id}): stored movement rule does not simulate`)
      } else if (readCell(run[4]) !== `${only.fifth.row},${only.fifth.col}`) {
        errors.push(
          `${symbol.shape} (${symbol.id}): the only legal reading puts it at R${only.fifth.row + 1}C${only.fifth.col + 1}, but the stored rule produces R${run[4].cell.row + 1}C${run[4].cell.col + 1}`,
        )
      }
    }
  }

  return errors
}

export { COLOURS }
