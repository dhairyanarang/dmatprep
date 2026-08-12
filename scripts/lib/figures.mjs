/**
 * Figure Sequences simulation, validation and description.
 *
 * The rules are taken verbatim from the official materials (GAM PDF pp. 7-8):
 * figures may change colour, rotate about their own axis, and move vertically,
 * horizontally or diagonally; a diagonal mover may not switch to another
 * movement type; movement, colour or rotation may accelerate by x+1; figures
 * cannot disappear or overlap; and a figure meeting an outer boundary either
 * bounces off it or travels along it.
 *
 * "Bounce" means full reversal, not billiard reflection — the official solutions
 * describe a symbol returning "to the starting position in the same way", and a
 * diagonal mover reversing both components (GAM PDF pp. 14, 15).
 */

export const GRID = { rows: 4, cols: 4 }

export const COLOURS = ['black', 'white', 'pink', 'yellow', 'green', 'orange', 'blue']
export const SHAPES = ['square', 'circle', 'triangle', 'diamond', 'hexagon', 'arrow', 'cross']

const STRAIGHT = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }
const DIAGONAL = {
  'up-left': [-1, -1],
  'up-right': [-1, 1],
  'down-left': [1, -1],
  'down-right': [1, 1],
}

const REVERSE = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
  'up-left': 'down-right',
  'down-right': 'up-left',
  'up-right': 'down-left',
  'down-left': 'up-right',
}

const inBounds = ({ row, col }) => row >= 0 && row < GRID.rows && col >= 0 && col < GRID.cols

const delta = (dir) => STRAIGHT[dir] ?? DIAGONAL[dir]

const advance = (cell, dir) => {
  const [dr, dc] = delta(dir)
  return { row: cell.row + dr, col: cell.col + dc }
}

/** Perimeter cells, clockwise from the top-left corner. */
export function borderRing() {
  const ring = []
  for (let c = 0; c < GRID.cols; c++) ring.push({ row: 0, col: c })
  for (let r = 1; r < GRID.rows; r++) ring.push({ row: r, col: GRID.cols - 1 })
  for (let c = GRID.cols - 2; c >= 0; c--) ring.push({ row: GRID.rows - 1, col: c })
  for (let r = GRID.rows - 2; r >= 1; r--) ring.push({ row: r, col: 0 })
  return ring
}

const RING = borderRing()
const ringIndexOf = (cell) => RING.findIndex((c) => c.row === cell.row && c.col === cell.col)

const stepCount = (step, transitionIndex) =>
  step === 'x+1' ? transitionIndex + 1 : step

/**
 * Advance one symbol across a single panel transition.
 * `state` carries the mutable bits a rule needs: current cell, heading, rotation,
 * colour index and position in a direction cycle.
 */
export function stepSymbol(state, rule, transitionIndex) {
  const next = { ...state }
  const move = rule.movement

  switch (move.type) {
    case 'linear':
    case 'diagonal': {
      const n = stepCount(move.step, transitionIndex)
      let cell = next.cell
      let dir = next.direction
      for (let i = 0; i < n; i++) {
        let candidate = advance(cell, dir)
        if (!inBounds(candidate)) {
          dir = REVERSE[dir]
          candidate = advance(cell, dir)
          if (!inBounds(candidate)) return null // 1-wide track: nowhere to go
        }
        cell = candidate
      }
      next.cell = cell
      next.direction = dir
      break
    }

    case 'border': {
      const n = stepCount(move.step, transitionIndex)
      const idx = ringIndexOf(next.cell)
      if (idx === -1) return null
      const sign = move.direction === 'clockwise' ? 1 : -1
      const target = (((idx + sign * n) % RING.length) + RING.length) % RING.length
      next.cell = RING[target]
      break
    }

    case 'direction-cycle': {
      const dir = move.directions[next.cycleIndex % move.directions.length]
      let cell = next.cell
      for (let i = 0; i < move.step; i++) {
        cell = advance(cell, dir)
        if (!inBounds(cell)) return null
      }
      next.cell = cell
      next.cycleIndex = next.cycleIndex + 1
      break
    }

    case 'static':
      break

    default:
      return null
  }

  if (rule.rotation.type === 'rotate') {
    const turns = rule.rotation.accelerating ? transitionIndex + 1 : 1
    const sign = rule.rotation.direction === 'cw' ? 1 : -1
    const total = sign * rule.rotation.degrees * turns
    next.rotation = (((next.rotation + total) % 360) + 360) % 360
  }

  if (rule.colour.type === 'cycle') {
    // "Figures can also change their movement, colour or orientation by x + 1"
    // (GAM PDF p.8) — acceleration applies to colour as well, not just movement
    // and rotation.
    const advanceBy = rule.colour.accelerating ? transitionIndex + 1 : 1
    next.colourIndex = next.colourIndex + advanceBy
    next.colour = rule.colour.colours[next.colourIndex % rule.colour.colours.length]
  }

  return next
}

/**
 * Simulate `panelCount` panels. Returns null when the configuration breaks an
 * official rule — a symbol leaving the grid, or two symbols overlapping.
 */
export function simulate(symbols, rules, panelCount = 6) {
  let states = symbols.map((s) => ({
    id: s.id,
    shape: s.shape,
    cell: s.cell,
    rotation: s.rotation,
    colour: s.colour,
    direction: s.direction,
    colourIndex: 0,
    cycleIndex: 0,
  }))

  const panels = []

  for (let panel = 0; panel < panelCount; panel++) {
    if (panel > 0) {
      const advanced = []
      for (const state of states) {
        const next = stepSymbol(state, rules[state.id], panel - 1)
        if (!next) return null
        advanced.push(next)
      }
      states = advanced
    }

    // "Figures cannot disappear or overlap."
    const occupied = new Set()
    for (const s of states) {
      if (!inBounds(s.cell)) return null
      const key = `${s.cell.row},${s.cell.col}`
      if (occupied.has(key)) return null
      occupied.add(key)
    }

    panels.push({
      symbols: states.map((s) => ({
        id: s.id,
        shape: s.shape,
        cell: { ...s.cell },
        rotation: s.rotation,
        colour: s.colour,
      })),
    })
  }

  return panels
}

export const panelsEqual = (a, b) =>
  JSON.stringify(normalise(a)) === JSON.stringify(normalise(b))

const normalise = (panel) => ({
  symbols: [...panel.symbols]
    .sort((x, y) => x.id.localeCompare(y.id))
    .map((s) => ({ id: s.id, shape: s.shape, cell: s.cell, rotation: s.rotation, colour: s.colour })),
})

export const cellName = ({ row, col }) => `R${row + 1}C${col + 1}`

const ORDINAL = ['first', 'second', 'third', 'fourth']
const NUMBER_WORD = { 2: 'two', 3: 'three', 4: 'four' }

/** Plain-language description of a symbol's rule, in the style of the official solutions. */
export function describeRule(symbol, rule) {
  const subject = `The ${symbol.colour} ${symbol.shape}`
  const parts = []
  const move = rule.movement

  const amountOf = (step) =>
    step === 'x+1'
      ? 'by x + 1 fields (one, then two, then three, and so on)'
      : step === 1
        ? 'one field at a time'
        : `${NUMBER_WORD[step] ?? step} fields at a time`

  if (move.type === 'linear') {
    const lane = `${ORDINAL[move.line] ?? `${move.line + 1}th`} ${move.axis === 'vertical' ? 'column' : 'row'}`
    parts.push(
      `moves ${move.axis === 'vertical' ? 'vertically' : 'horizontally'} along the ${lane}, ${amountOf(move.step)}, bouncing off the ${move.axis === 'vertical' ? 'upper and lower' : 'left and right'} boundary and returning the same way`,
    )
  } else if (move.type === 'diagonal') {
    parts.push(
      `moves diagonally ${move.direction.replace('-', 'wards to the ')}, ${amountOf(move.step)}, and when it meets a boundary it reverses and returns the same way`,
    )
  } else if (move.type === 'border') {
    parts.push(
      `travels along the outer border ${move.direction === 'clockwise' ? 'clockwise' : 'counter clockwise'}, ${amountOf(move.step)}`,
    )
  } else if (move.type === 'direction-cycle') {
    parts.push(
      `moves one field at a time, repeating the direction order ${move.directions.join(', ')}`,
    )
  } else {
    parts.push('stays in place')
  }

  if (rule.rotation.type === 'rotate') {
    parts.push(
      rule.rotation.accelerating
        ? `rotates ${rule.rotation.degrees} degrees to the ${rule.rotation.direction === 'cw' ? 'right' : 'left'} x + 1 times from panel to panel`
        : `rotates ${rule.rotation.degrees} degrees to the ${rule.rotation.direction === 'cw' ? 'right' : 'left'} from panel to panel`,
    )
  }

  if (rule.colour.type === 'cycle') {
    parts.push(
      rule.colour.accelerating
        ? `advances through the colours ${rule.colour.colours.join(' → ')} by x + 1 each panel`
        : `changes colour in the order ${rule.colour.colours.join(' → ')}, repeating`,
    )
  }

  return `${subject} ${parts.join(', and ')}.`
}

/** What differs between the correct panel and a distractor, for the wrong-answer note. */
export function describeDifference(correctPanel, wrongPanel) {
  const differences = []

  for (const wrong of wrongPanel.symbols) {
    const right = correctPanel.symbols.find((s) => s.id === wrong.id)
    if (!right) continue

    if (right.cell.row !== wrong.cell.row || right.cell.col !== wrong.cell.col) {
      differences.push(
        `the ${right.shape} sits at ${cellName(wrong.cell)} instead of ${cellName(right.cell)}`,
      )
    }
    if (right.rotation !== wrong.rotation) {
      differences.push(
        `the ${right.shape} is turned to ${wrong.rotation}° instead of ${right.rotation}°`,
      )
    }
    if (right.colour !== wrong.colour) {
      differences.push(`the ${right.shape} is ${wrong.colour} instead of ${right.colour}`)
    }
  }

  if (differences.length === 0) return 'This matrix does not continue the sequence.'
  return `In this matrix ${differences.join(', and ')} — so it breaks the rule the sequence has followed all along.`
}
