/**
 * Figure Sequences generator.
 *
 * Each item shows four matrices and asks for the fifth and sixth, choosing from
 * three options each — the exact shape of the official task (GAM PDF p. 7, and
 * the worked solutions on pp. 13-16, which read "Image 1: Matrix n / Image 2:
 * Matrix n").
 */
import {
  COLOURS,
  GRID,
  borderRing,
  cellName,
  describeDifference,
  describeRule,
  panelsEqual,
  simulate,
} from '../lib/figures.mjs'
import { VERIFIED_AT, pick, randInt, shuffle } from '../lib/rng.mjs'

const GENERATOR = { name: 'figure-sequences', version: '1.0.0', verifiedAt: VERIFIED_AT }

/**
 * Only shapes whose orientation is actually visible may rotate. A rotating
 * circle or square is an unanswerable question, not a hard one.
 */
const ROTATABLE = ['triangle', 'arrow']
const ALL_SHAPES = ['square', 'circle', 'triangle', 'diamond', 'hexagon', 'arrow', 'cross']

/** White needs a stroke to read on a white grid, so keep it out of cycles. */
const CYCLE_COLOURS = COLOURS.filter((c) => c !== 'white')

const RING = borderRing()
const onRing = (cell) => RING.some((c) => c.row === cell.row && c.col === cell.col)

function randomCell(rng) {
  return { row: randInt(rng, 0, GRID.rows - 1), col: randInt(rng, 0, GRID.cols - 1) }
}

function makeMovement(rng, difficulty) {
  const allowAccel = difficulty === 'high'
  const kinds =
    difficulty === 'low'
      ? ['linear', 'diagonal']
      : difficulty === 'medium'
        ? ['linear', 'diagonal', 'border', 'direction-cycle']
        : ['linear', 'diagonal', 'border', 'direction-cycle']

  const kind = pick(rng, kinds)

  // Every official linear/diagonal example moves "one field at a time"; only
  // border travel is attested at more than one field ("by two squares at a
  // time", GAM PDF p.15). Acceleration is the only other size either takes.
  const straightStep = allowAccel && rng() < 0.35 ? 'x+1' : 1
  const step = straightStep

  if (kind === 'linear') {
    const axis = pick(rng, ['vertical', 'horizontal'])
    const line = randInt(rng, 0, (axis === 'vertical' ? GRID.cols : GRID.rows) - 1)
    const direction = axis === 'vertical' ? pick(rng, ['up', 'down']) : pick(rng, ['left', 'right'])
    const cell =
      axis === 'vertical'
        ? { row: randInt(rng, 0, GRID.rows - 1), col: line }
        : { row: line, col: randInt(rng, 0, GRID.cols - 1) }
    return { movement: { type: 'linear', axis, line, direction, step, boundary: 'bounce' }, cell, direction }
  }

  if (kind === 'diagonal') {
    const direction = pick(rng, ['up-left', 'up-right', 'down-left', 'down-right'])
    return {
      movement: { type: 'diagonal', direction, step, boundary: 'bounce' },
      cell: randomCell(rng),
      direction,
    }
  }

  if (kind === 'border') {
    return {
      movement: {
        type: 'border',
        direction: pick(rng, ['clockwise', 'counter-clockwise']),
        // Two squares at a time is attested for border travel specifically.
        step: allowAccel && rng() < 0.3 ? 'x+1' : pick(rng, [1, 2]),
      },
      cell: pick(rng, RING),
      direction: null,
    }
  }

  // direction-cycle: a closed 4-step loop, so it can never leave the grid.
  const directions = pick(rng, [
    ['left', 'up', 'right', 'down'],
    ['down', 'right', 'up', 'left'],
    ['right', 'down', 'left', 'up'],
    ['up', 'left', 'down', 'right'],
  ])
  return {
    movement: { type: 'direction-cycle', directions, step: 1 },
    cell: { row: randInt(rng, 1, GRID.rows - 1), col: randInt(rng, 1, GRID.cols - 1) },
    direction: null,
  }
}

function makeSymbol(rng, id, difficulty, usedShapes) {
  const available = ALL_SHAPES.filter((s) => !usedShapes.has(s))
  const shape = pick(rng, available.length ? available : ALL_SHAPES)
  usedShapes.add(shape)

  const { movement, cell, direction } = makeMovement(rng, difficulty)
  if (movement.type === 'border' && !onRing(cell)) return null

  const canRotate = ROTATABLE.includes(shape)
  const rotationChance = difficulty === 'low' ? 0 : difficulty === 'medium' ? 0.5 : 0.65
  const rotation =
    canRotate && rng() < rotationChance
      ? {
          type: 'rotate',
          direction: pick(rng, ['cw', 'ccw']),
          degrees: 90,
          accelerating: difficulty === 'high' && rng() < 0.3,
        }
      : { type: 'none' }

  const colourChance = difficulty === 'low' ? 0 : difficulty === 'medium' ? 0.35 : 0.5
  // An accelerating cycle needs three colours to be readable: with two, x + 1
  // advances land on the same alternation an ordinary cycle would produce.
  const accelColour = difficulty === 'high' && rng() < 0.3
  const cycleColours = shuffle(rng, CYCLE_COLOURS).slice(0, accelColour || rng() < 0.5 ? 3 : 2)
  const colour =
    rng() < colourChance
      ? { type: 'cycle', colours: cycleColours, accelerating: accelColour }
      : { type: 'constant' }

  const startColour = colour.type === 'cycle' ? colour.colours[0] : pick(rng, CYCLE_COLOURS)

  return {
    symbol: {
      id,
      shape,
      cell,
      rotation: canRotate ? pick(rng, [0, 90, 180, 270]) : 0,
      colour: startColour,
      direction,
    },
    rule: { movement, rotation, colour },
  }
}

/** Plausible near-misses built by nudging the correct panel. */
function makeDistractor(rng, correctPanel, previousPanel, rules, taken) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const panel = { symbols: correctPanel.symbols.map((s) => ({ ...s, cell: { ...s.cell } })) }
    const target = pick(rng, panel.symbols)
    const rule = rules[target.id]
    const mode = pick(rng, ['move', 'move', 'move', 'rotate', 'colour'])

    if (mode === 'rotate' && rule.rotation.type === 'rotate') {
      target.rotation = (target.rotation + pick(rng, [90, 180, 270])) % 360
    } else if (mode === 'colour' && rule.colour.type === 'cycle') {
      const others = rule.colour.colours.filter((c) => c !== target.colour)
      if (!others.length) continue
      target.colour = pick(rng, others)
    } else {
      // Where the symbol would land if it kept going, or fell short.
      const previous = previousPanel.symbols.find((s) => s.id === target.id)
      const options = []
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const cell = { row: target.cell.row + dr, col: target.cell.col + dc }
          if (cell.row < 0 || cell.row >= GRID.rows || cell.col < 0 || cell.col >= GRID.cols) continue
          if (previous && cell.row === previous.cell.row && cell.col === previous.cell.col) continue
          options.push(cell)
        }
      }
      if (!options.length) continue
      target.cell = pick(rng, options)
    }

    // Must stay legal: no overlap, and distinct from the correct panel and siblings.
    const seen = new Set()
    let overlap = false
    for (const s of panel.symbols) {
      const key = `${s.cell.row},${s.cell.col}`
      if (seen.has(key)) overlap = true
      seen.add(key)
    }
    if (overlap) continue
    if (panelsEqual(panel, correctPanel)) continue
    if (taken.some((p) => panelsEqual(panel, p))) continue

    return panel
  }
  return null
}

function buildImage(rng, label, correctPanel, previousPanel, rules) {
  const distractors = []
  for (let i = 0; i < 2; i++) {
    const d = makeDistractor(rng, correctPanel, previousPanel, rules, [...distractors, correctPanel])
    if (!d) return null
    distractors.push(d)
  }

  const ordered = shuffle(rng, [
    { panel: correctPanel, correct: true },
    ...distractors.map((panel) => ({ panel, correct: false })),
  ])

  const options = ordered.map((entry, i) => ({ id: `matrix${i + 1}`, panel: entry.panel }))
  const correctOptionId = options[ordered.findIndex((e) => e.correct)].id

  const notes = {}
  ordered.forEach((entry, i) => {
    if (entry.correct) return
    // Namespaced because both images reuse matrix1..3 as option ids.
    notes[`${label}:matrix${i + 1}`] = describeDifference(correctPanel, entry.panel)
  })

  return { image: { label, options, correctOptionId }, notes }
}

function buildQuestion(rng, index, difficulty) {
  const symbolCount = difficulty === 'low' ? 1 : difficulty === 'medium' ? 2 : randInt(rng, 3, 4)

  const symbols = []
  const rules = {}
  const usedShapes = new Set()
  const usedCells = new Set()

  for (let i = 0; i < symbolCount; i++) {
    const made = makeSymbol(rng, `s${i + 1}`, difficulty, usedShapes)
    if (!made) return null
    const key = `${made.symbol.cell.row},${made.symbol.cell.col}`
    if (usedCells.has(key)) return null
    usedCells.add(key)
    symbols.push(made.symbol)
    rules[made.symbol.id] = made.rule
  }

  const panels = simulate(symbols, rules, 6)
  if (!panels) return null

  // A sequence whose symbols never move is not a sequence.
  const moved = panels[0].symbols.some((s, i) => {
    const last = panels[5].symbols[i]
    return s.cell.row !== last.cell.row || s.cell.col !== last.cell.col
  })
  if (!moved) return null

  // Reject repeated panels. A multi-cell step that bounces mid-move can land
  // back where it started, which is rule-faithful but reads as "nothing
  // happened" and makes the item needlessly ambiguous.
  for (let i = 1; i < panels.length; i++) {
    if (panelsEqual(panels[i], panels[i - 1])) return null
  }

  // Reject degenerate oscillations. A symbol that immediately bounces flips
  // between two cells forever: legal, but it teaches nothing and is trivially
  // guessable. Require every symbol to visit at least three distinct cells.
  for (const symbol of symbols) {
    const visited = new Set(
      panels.map((panel) => {
        const s = panel.symbols.find((x) => x.id === symbol.id)
        return `${s.cell.row},${s.cell.col}`
      }),
    )
    if (visited.size < 3) return null
  }

  const image1 = buildImage(rng, 'image1', panels[4], panels[3], rules)
  if (!image1) return null
  const image2 = buildImage(rng, 'image2', panels[5], panels[4], rules)
  if (!image2) return null

  const ruleText = symbols.map((s) => describeRule(s, rules[s.id])).join(' ')
  const explanation = `${ruleText} Continuing that from the fourth matrix gives the fifth matrix with ${panels[4].symbols
    .map((s) => `the ${s.shape} at ${cellName(s.cell)}`)
    .join(', ')}, and the sixth with ${panels[5].symbols
    .map((s) => `the ${s.shape} at ${cellName(s.cell)}`)
    .join(', ')}.`

  return {
    id: `fs-${difficulty}-${String(index).padStart(3, '0')}`,
    kind: 'figure-sequence',
    section: 'figure-sequences',
    difficulty,
    grid: { rows: GRID.rows, cols: GRID.cols },
    given: panels.slice(0, 4),
    images: [image1.image, image2.image],
    rules,
    explanation,
    distractorNotes: { ...image1.notes, ...image2.notes },
    generator: GENERATOR,
  }
}

export function generateFigureSequences(rng, quotas = { low: 14, medium: 13, high: 13 }) {
  const out = []

  for (const [difficulty, count] of Object.entries(quotas)) {
    const seen = new Set()
    let made = 0
    let attempts = 0

    while (made < count && attempts < 100000) {
      attempts++
      const q = buildQuestion(rng, made + 1, difficulty)
      if (!q) continue

      const fingerprint = JSON.stringify([q.given, q.rules])
      if (seen.has(fingerprint)) continue
      seen.add(fingerprint)

      out.push(q)
      made++
    }

    if (made < count) {
      throw new Error(`figure-sequences: only produced ${made}/${count} ${difficulty} items`)
    }
  }

  return out
}
