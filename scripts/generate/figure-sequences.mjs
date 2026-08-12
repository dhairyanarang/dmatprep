/**
 * Figure Sequences generator.
 *
 * Each item shows four matrices and asks for the fifth and sixth, choosing from
 * three options each — the exact shape of the official task (GAM PDF p. 7, and
 * the worked solutions on pp. 13-16, which read "Image 1: Matrix n / Image 2:
 * Matrix n").
 *
 * Difficulty is *transformation load*, not symbol count. The official exercises
 * escalate by stacking rules onto one symbol — Exercise 3 (medium) has a symbol
 * carrying border travel, a colour alternation and a rotation at once — and
 * never exceed three symbols. See DMAT_QUESTION_AUTHORING_SPEC.md §2.2.
 */
import {
  COLOURS,
  GRID,
  borderRing,
  cellName,
  describeRule,
  panelsEqual,
  simulateStates,
  stepSymbol,
} from '../lib/figures.mjs'
import { VERIFIED_AT, pick, randInt, shuffle } from '../lib/rng.mjs'

const GENERATOR = { name: 'figure-sequences', version: '2.0.0', verifiedAt: VERIFIED_AT }

/** Only shapes whose orientation is visible may rotate. */
const ROTATABLE = ['triangle', 'arrow']
const ALL_SHAPES = ['square', 'circle', 'triangle', 'diamond', 'hexagon', 'arrow', 'cross']

/** White needs a stroke to read on a light panel, so keep it out of cycles. */
const CYCLE_COLOURS = COLOURS.filter((c) => c !== 'white')

const RING = borderRing()
const onRing = (cell) => RING.some((c) => c.row === cell.row && c.col === cell.col)

/**
 * Spec §2.2. Boundary interaction counts because reading a bounce correctly is
 * a separate act of inference from reading the movement itself.
 */
function loadOf(rule, bounced) {
  const accel =
    rule.movement.step === 'x+1' ||
    Boolean(rule.rotation.accelerating) ||
    Boolean(rule.colour.accelerating)
  return (
    1 +
    (rule.rotation.type === 'rotate' ? 1 : 0) +
    (rule.colour.type === 'cycle' ? 1 : 0) +
    (accel ? 1 : 0) +
    (bounced ? 1 : 0)
  )
}

/** How each tier is composed. `extras` = how many of {rotation, colour} to add. */
const PLANS = {
  low: () => [{ extras: 0, accel: false }],
  medium: (rng) =>
    shuffle(rng, [
      { extras: 2, accel: false },
      { extras: rng() < 0.5 ? 1 : 0, accel: false },
    ]),
  high: (rng) =>
    shuffle(rng, [
      { extras: 2, accel: true },
      { extras: 1, accel: rng() < 0.4 },
      { extras: rng() < 0.6 ? 1 : 0, accel: false },
    ]),
}

function makeMovement(rng, difficulty, wantAccel) {
  const kinds =
    difficulty === 'low'
      ? ['linear', 'linear', 'diagonal', 'border', 'direction-cycle']
      : ['linear', 'diagonal', 'border', 'direction-cycle']
  const kind = pick(rng, kinds)

  // Every official linear/diagonal example moves "one field at a time"; only
  // border travel is attested at more than one ("by two squares at a time",
  // p. 15). Acceleration is the only other size either takes.
  const straightStep = wantAccel ? 'x+1' : 1

  if (kind === 'linear') {
    const axis = pick(rng, ['vertical', 'horizontal'])
    const line = randInt(rng, 0, (axis === 'vertical' ? GRID.cols : GRID.rows) - 1)
    const direction = axis === 'vertical' ? pick(rng, ['up', 'down']) : pick(rng, ['left', 'right'])
    const cell =
      axis === 'vertical'
        ? { row: randInt(rng, 0, GRID.rows - 1), col: line }
        : { row: line, col: randInt(rng, 0, GRID.cols - 1) }
    return {
      movement: { type: 'linear', axis, line, direction, step: straightStep, boundary: 'bounce' },
      cell,
      direction,
    }
  }

  if (kind === 'diagonal') {
    const direction = pick(rng, ['up-left', 'up-right', 'down-left', 'down-right'])
    return {
      movement: { type: 'diagonal', direction, step: straightStep, boundary: 'bounce' },
      cell: { row: randInt(rng, 0, GRID.rows - 1), col: randInt(rng, 0, GRID.cols - 1) },
      direction,
    }
  }

  if (kind === 'border') {
    return {
      movement: {
        type: 'border',
        direction: pick(rng, ['clockwise', 'counter-clockwise']),
        step: wantAccel ? 'x+1' : pick(rng, [1, 2]),
      },
      cell: pick(rng, RING),
      direction: null,
    }
  }

  // A closed four-step loop — the mechanic of the official instructions example,
  // "moves one field clockwise within the four middle fields".
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

function makeSymbol(rng, id, difficulty, plan, usedShapes) {
  // A symbol that must rotate needs a shape whose orientation is legible.
  const wantsRotation = plan.extras > 0 && (plan.extras === 2 || rng() < 0.5)
  const pool = wantsRotation
    ? ROTATABLE.filter((s) => !usedShapes.has(s))
    : ALL_SHAPES.filter((s) => !usedShapes.has(s))
  if (pool.length === 0) return null
  const shape = pick(rng, pool)
  usedShapes.add(shape)

  const canRotate = ROTATABLE.includes(shape)
  const { movement, cell, direction } = makeMovement(rng, difficulty, plan.accel)
  if (movement.type === 'border' && !onRing(cell)) return null

  const rotate = wantsRotation && canRotate
  const rotation = rotate
    ? {
        type: 'rotate',
        direction: pick(rng, ['cw', 'ccw']),
        degrees: 90,
        accelerating: plan.accel && rng() < 0.4,
      }
    : { type: 'none' }

  // Colour makes up the remaining extras.
  const wantColour = plan.extras - (rotate ? 1 : 0) > 0
  const accelColour = wantColour && plan.accel && !rotation.accelerating && rng() < 0.35
  const colour = wantColour
    ? {
        type: 'cycle',
        // An accelerating cycle needs three colours: with two, x+1 lands on the
        // same alternation an ordinary cycle would give.
        colours: shuffle(rng, CYCLE_COLOURS).slice(0, accelColour || rng() < 0.5 ? 3 : 2),
        accelerating: accelColour,
      }
    : { type: 'constant' }

  return {
    symbol: {
      id,
      shape,
      cell,
      rotation: canRotate ? pick(rng, [0, 90, 180, 270]) : 0,
      colour: colour.type === 'cycle' ? colour.colours[0] : pick(rng, CYCLE_COLOURS),
      direction,
    },
    rule: { movement, rotation, colour },
  }
}

/* ------------------------------------------------------------- distractors */

/**
 * A wrong panel is what a *specific misreading* produces, not a nudge to a
 * neighbouring cell. Each family below is a mistake a candidate actually makes,
 * and the note names it — which is what makes the wrong answers teach anything.
 */
const FAMILIES = ['movement-step', 'movement-direction', 'boundary', 'rotation', 'colour', 'acceleration']

function perturbRule(rule, family) {
  const move = rule.movement

  switch (family) {
    case 'movement-step': {
      if (move.type === 'direction-cycle') return null
      if (move.step === 'x+1') return null
      const step = move.step === 1 ? 2 : move.step - 1
      return { ...rule, movement: { ...move, step } }
    }
    case 'movement-direction': {
      if (move.type === 'border') {
        return {
          ...rule,
          movement: {
            ...move,
            direction: move.direction === 'clockwise' ? 'counter-clockwise' : 'clockwise',
          },
        }
      }
      if (move.type === 'direction-cycle') {
        return { ...rule, movement: { ...move, directions: [...move.directions].reverse() } }
      }
      // Linear and diagonal: turn round when the sequence does not, which is
      // what bouncing a panel too early looks like.
      return { ...rule, movement: { ...move, reverseHeading: true } }
    }
    case 'boundary': {
      // Reflection instead of reversal — the classic misreading of a bounce.
      if (move.type !== 'diagonal') return null
      return { ...rule, movement: { ...move, reflectInsteadOfReverse: true } }
    }
    case 'rotation': {
      if (rule.rotation.type !== 'rotate') return null
      return {
        ...rule,
        rotation: {
          ...rule.rotation,
          direction: rule.rotation.direction === 'cw' ? 'ccw' : 'cw',
          accelerating: false,
        },
      }
    }
    case 'colour': {
      if (rule.colour.type !== 'cycle') return null
      return { ...rule, colour: { ...rule.colour, skip: true } }
    }
    case 'acceleration': {
      const accelerates =
        move.step === 'x+1' || rule.rotation.accelerating || rule.colour.accelerating
      if (!accelerates) return null
      return {
        ...rule,
        movement: move.step === 'x+1' ? { ...move, step: 1 } : move,
        rotation: rule.rotation.accelerating ? { ...rule.rotation, accelerating: false } : rule.rotation,
        colour: rule.colour.accelerating ? { ...rule.colour, accelerating: false } : rule.colour,
      }
    }
    default:
      return null
  }
}

/** Apply a perturbed rule to the previous state, mimicking the real stepper. */
const REVERSE_DIR = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
  'up-left': 'down-right',
  'down-right': 'up-left',
  'up-right': 'down-left',
  'down-left': 'up-right',
}

function stepPerturbed(state, rule, transitionIndex) {
  if (rule.movement.reverseHeading) {
    const dir = REVERSE_DIR[state.direction ?? rule.movement.direction]
    if (!dir) return null
    const clean = { ...rule, movement: { ...rule.movement } }
    delete clean.movement.reverseHeading
    return stepSymbol({ ...state, direction: dir }, clean, transitionIndex)
  }
  if (rule.movement.reflectInsteadOfReverse) {
    // Flip one component only, the way a billiard ball would.
    const dir = state.direction ?? rule.movement.direction
    const flipped = {
      'up-left': 'down-left',
      'down-left': 'up-left',
      'up-right': 'down-right',
      'down-right': 'up-right',
    }[dir]
    const clean = { ...rule, movement: { ...rule.movement, direction: flipped } }
    delete clean.movement.reflectInsteadOfReverse
    return stepSymbol({ ...state, direction: flipped }, clean, transitionIndex)
  }
  if (rule.colour.skip) {
    const clean = { ...rule, colour: { ...rule.colour } }
    delete clean.colour.skip
    const next = stepSymbol(state, clean, transitionIndex)
    if (!next) return null
    const colours = rule.colour.colours
    next.colourIndex = next.colourIndex + 1
    next.colour = colours[next.colourIndex % colours.length]
    return next
  }
  return stepSymbol(state, rule, transitionIndex)
}

const NOTE = {
  'movement-step': (shape) =>
    `The ${shape} has moved the wrong number of fields. The step size is fixed for the whole sequence — check it across three transitions, not one.`,
  'movement-direction': (shape) =>
    `The ${shape} is travelling the wrong way round. Its direction is set in the first two matrices and never changes.`,
  boundary: (shape) =>
    `The ${shape} has been reflected off the wall like a billiard ball. A bouncing figure returns the way it came, reversing both parts of a diagonal.`,
  rotation: (shape) =>
    `The ${shape} has turned the wrong way. Check the direction of the turn separately from the movement — the eye follows the travel and stops registering orientation.`,
  colour: (shape) =>
    `The ${shape} is the wrong colour: the cycle has been advanced by an extra step. Colour runs on its own clock, independent of where the figure sits.`,
  acceleration: (shape) =>
    `The ${shape} has moved by a constant amount. This sequence accelerates by x + 1, so each transition is one field longer than the last.`,
}

function makeDistractor(rng, states, rules, panelIndex, correctPanel, taken) {
  const previous = states[panelIndex - 1]
  const order = shuffle(rng, FAMILIES)
  const symbolOrder = shuffle(rng, previous.map((s) => s.id))

  for (const family of order) {
    for (const symbolId of symbolOrder) {
      const rule = rules[symbolId]
      const perturbed = perturbRule(rule, family)
      if (!perturbed) continue

      const state = previous.find((s) => s.id === symbolId)
      const next = stepPerturbed(state, perturbed, panelIndex - 1)
      if (!next) continue
      if (next.cell.row < 0 || next.cell.row >= GRID.rows) continue
      if (next.cell.col < 0 || next.cell.col >= GRID.cols) continue

      const panel = {
        symbols: correctPanel.symbols.map((s) =>
          s.id === symbolId
            ? { id: s.id, shape: s.shape, cell: { ...next.cell }, rotation: next.rotation, colour: next.colour }
            : { ...s, cell: { ...s.cell } },
        ),
      }

      const cells = new Set()
      let overlap = false
      for (const s of panel.symbols) {
        const key = `${s.cell.row},${s.cell.col}`
        if (cells.has(key)) overlap = true
        cells.add(key)
      }
      if (overlap) continue
      if (panelsEqual(panel, correctPanel)) continue
      if (taken.some((p) => panelsEqual(panel, p.panel ?? p))) continue

      const shape = correctPanel.symbols.find((s) => s.id === symbolId).shape
      return { panel, family, note: NOTE[family](shape) }
    }
  }
  return null
}

/** Last resort: nudge a symbol to a neighbouring cell, when no rule error fits. */
function nudgeDistractor(rng, correctPanel, previousPanel, taken) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const panel = { symbols: correctPanel.symbols.map((s) => ({ ...s, cell: { ...s.cell } })) }
    const target = pick(rng, panel.symbols)
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

    const cells = new Set()
    let overlap = false
    for (const s of panel.symbols) {
      const key = `${s.cell.row},${s.cell.col}`
      if (cells.has(key)) overlap = true
      cells.add(key)
    }
    if (overlap) continue
    if (panelsEqual(panel, correctPanel)) continue
    if (taken.some((p) => panelsEqual(panel, p.panel ?? p))) continue

    return {
      panel,
      family: 'position',
      note: `The ${target.shape} is one field away from where the rule puts it. Re-apply the movement from the previous matrix and count the fields.`,
    }
  }
  return null
}

function buildImage(rng, label, panelIndex, panels, states, rules) {
  const correctPanel = panels[panelIndex]
  const distractors = []

  for (let i = 0; i < 2; i++) {
    const taken = [correctPanel, ...distractors]
    const d =
      makeDistractor(rng, states, rules, panelIndex, correctPanel, taken) ??
      nudgeDistractor(rng, correctPanel, panels[panelIndex - 1], taken)
    if (!d) return null
    distractors.push(d)
  }

  const ordered = shuffle(rng, [
    { panel: correctPanel, correct: true },
    ...distractors.map((d) => ({ panel: d.panel, correct: false, family: d.family, note: d.note })),
  ])

  const options = ordered.map((entry, i) => ({ id: `matrix${i + 1}`, panel: entry.panel }))
  const correctOptionId = options[ordered.findIndex((e) => e.correct)].id

  const notes = {}
  const families = {}
  ordered.forEach((entry, i) => {
    if (entry.correct) return
    notes[`${label}:matrix${i + 1}`] = entry.note
    families[`${label}:matrix${i + 1}`] = entry.family
  })

  return { image: { label, options, correctOptionId }, notes, families }
}

/* --------------------------------------------------------- solution + hints */

function aspectsOf(rule) {
  const list = ['movement']
  if (rule.rotation.type === 'rotate') list.push('rotation')
  if (rule.colour.type === 'cycle') list.push('colour')
  return list
}

function buildWalkthrough(symbols, rules, panels, bouncedBy) {
  const steps = []
  const multi = symbols.length > 1

  const keyInsight = multi
    ? `${symbols.length} symbols, each following its own rule. Take one at a time and ignore the rest — the item is ${symbols.length} small problems, not one large one.`
    : 'One symbol, one rule. Work out how it changes between consecutive matrices, then apply that twice.'

  for (const symbol of symbols) {
    const rule = rules[symbol.id]
    const aspects = aspectsOf(rule)

    steps.push({
      title: `Track the ${symbol.shape}`,
      detail: `Follow only the ${symbol.shape} across all four matrices. It ${
        aspects.length === 1
          ? 'only changes position'
          : `changes ${aspects.join(', ')} — settle each one separately`
      }.`,
      visual: { type: 'fs-track', symbolId: symbol.id, panels: [0, 1, 2, 3] },
    })

    steps.push({
      title: `How the ${symbol.shape} moves`,
      detail: describeRule(symbol, { ...rule, rotation: { type: 'none' }, colour: { type: 'constant' } }),
      visual: { type: 'fs-aspect', symbolId: symbol.id, aspect: 'movement', panels: [0, 1, 2, 3] },
    })

    if (bouncedBy.has(symbol.id)) {
      steps.push({
        title: 'It meets a boundary',
        detail:
          'The sequence shows you what happens at the wall rather than leaving you to assume it: the figure reverses and retraces its path. Use that observation instead of guessing which boundary rule applies.',
        visual: { type: 'fs-aspect', symbolId: symbol.id, aspect: 'boundary', panels: [0, 1, 2, 3] },
      })
    }

    if (rule.rotation.type === 'rotate') {
      steps.push({
        title: `The ${symbol.shape} also turns`,
        detail: `${rule.rotation.accelerating ? 'It turns x + 1 times each panel' : `It turns ${rule.rotation.degrees}° to the ${rule.rotation.direction === 'cw' ? 'right' : 'left'} every panel`} — check the facing separately from the travel, because the eye follows movement and stops registering orientation.`,
        visual: { type: 'fs-aspect', symbolId: symbol.id, aspect: 'rotation', panels: [0, 1, 2, 3] },
      })
    }

    if (rule.colour.type === 'cycle') {
      steps.push({
        title: `The ${symbol.shape} also changes colour`,
        detail: `${rule.colour.colours.join(' → ')}, repeating${rule.colour.accelerating ? ', advancing by x + 1 each panel' : ''}. Colour runs on its own clock, independent of position.`,
        visual: { type: 'fs-aspect', symbolId: symbol.id, aspect: 'colour', panels: [0, 1, 2, 3] },
      })
    }
  }

  steps.push({
    title: 'Apply every rule once for the fifth matrix',
    detail: `That gives ${panels[4].symbols.map((s) => `the ${s.shape} at ${cellName(s.cell)}`).join(', ')}.`,
    visual: { type: 'fs-predict', panel: 4 },
  })
  steps.push({
    title: 'Then once more for the sixth',
    detail: `Starting from the fifth — not the fourth — gives ${panels[5].symbols.map((s) => `the ${s.shape} at ${cellName(s.cell)}`).join(', ')}.`,
    visual: { type: 'fs-predict', panel: 5 },
  })

  const accelerates = Object.values(rules).some(
    (r) => r.movement.step === 'x+1' || r.rotation.accelerating || r.colour.accelerating,
  )

  return {
    keyInsight,
    steps,
    answer: `Fifth matrix: ${panels[4].symbols.map((s) => `${s.colour} ${s.shape} at ${cellName(s.cell)}`).join(', ')}. Sixth: ${panels[5].symbols.map((s) => `${s.colour} ${s.shape} at ${cellName(s.cell)}`).join(', ')}.`,
    takeaway: accelerates
      ? 'Derive the sixth matrix from the fifth, never from the fourth in one jump. With x + 1 the two steps are different sizes, which is exactly where the slip happens.'
      : 'Settle the fifth matrix completely, then treat it as the new starting point. Compare the three options for what differs between them before deriving everything.',
  }
}

function buildHints(symbols, rules, bouncedBy) {
  const first = symbols[0]
  const rule = rules[first.id]
  const aspects = aspectsOf(rule)
  const accelerates =
    rule.movement.step === 'x+1' || rule.rotation.accelerating || rule.colour.accelerating

  const level1 =
    symbols.length > 1
      ? `Do not try to read the whole grid at once. Pick one symbol — the ${first.shape} is a good place to start — and follow only that one across the four matrices.`
      : `Follow the ${first.shape} from matrix to matrix and describe what changes between each pair.`

  const level2 =
    aspects.length > 1
      ? `The ${first.shape} changes more than one thing: ${aspects.join(' and ')}. Settle them one at a time rather than together.`
      : `The ${first.shape} only changes position. Work out the direction first, then the size of the step.`

  const level3 = bouncedBy.has(first.id)
    ? `Count the fields between consecutive positions of the ${first.shape}, and look closely at the matrix where it reaches an edge — the sequence shows you what it does there.`
    : accelerates
      ? `The gaps between consecutive positions of the ${first.shape} are not equal. Measure all three, then continue the pattern.`
      : `Measure the gap between consecutive positions of the ${first.shape} across three transitions before you commit to a step size.`

  return [
    { level: 1, text: level1 },
    { level: 2, text: level2 },
    { level: 3, text: level3 },
  ]
}

/* ---------------------------------------------------------------- assembly */

function buildQuestion(rng, index, difficulty) {
  const plans = PLANS[difficulty](rng)

  const symbols = []
  const rules = {}
  const usedShapes = new Set()
  const usedCells = new Set()

  for (let i = 0; i < plans.length; i++) {
    const made = makeSymbol(rng, `s${i + 1}`, difficulty, plans[i], usedShapes)
    if (!made) return null
    const key = `${made.symbol.cell.row},${made.symbol.cell.col}`
    if (usedCells.has(key)) return null
    usedCells.add(key)
    symbols.push(made.symbol)
    rules[made.symbol.id] = made.rule
  }

  const run = simulateStates(symbols, rules, 6)
  if (!run) return null
  const { panels, states } = run

  // Reject sequences that teach nothing: nothing moving, a repeated panel, or a
  // symbol oscillating between two cells.
  for (let i = 1; i < panels.length; i++) {
    if (panelsEqual(panels[i], panels[i - 1])) return null
  }
  for (const symbol of symbols) {
    const visited = new Set(
      panels.map((p) => {
        const s = p.symbols.find((x) => x.id === symbol.id)
        return `${s.cell.row},${s.cell.col}`
      }),
    )
    if (visited.size < 3) return null
  }

  // Which symbols actually reversed at a wall inside the six panels.
  const bouncedBy = new Set()
  for (const symbol of symbols) {
    const rule = rules[symbol.id]
    if (rule.movement.type !== 'linear' && rule.movement.type !== 'diagonal') continue
    const track = panels.map((p) => p.symbols.find((x) => x.id === symbol.id).cell)
    for (let i = 2; i < track.length; i++) {
      const d1 = { r: track[i - 1].row - track[i - 2].row, c: track[i - 1].col - track[i - 2].col }
      const d2 = { r: track[i].row - track[i - 1].row, c: track[i].col - track[i - 1].col }
      if ((d1.r || d1.c) && d2.r === -d1.r && d2.c === -d1.c) bouncedBy.add(symbol.id)
    }
  }

  // Measure the load, then check it against the tier. The label is never
  // inherited from what the plan intended to build.
  const loads = symbols.map((s) => loadOf(rules[s.id], bouncedBy.has(s.id)))
  const peakLoad = Math.max(...loads)
  const totalLoad = loads.reduce((a, b) => a + b, 0)
  const accelerates = symbols.some((s) => {
    const r = rules[s.id]
    return r.movement.step === 'x+1' || r.rotation.accelerating || r.colour.accelerating
  })

  if (difficulty === 'low' && (symbols.length !== 1 || peakLoad > 2)) return null
  if (difficulty === 'medium' && (symbols.length !== 2 || peakLoad < 3)) return null
  if (difficulty === 'high' && (symbols.length !== 3 || (peakLoad < 4 && !accelerates))) return null

  const image1 = buildImage(rng, 'image1', 4, panels, states, rules)
  if (!image1) return null
  const image2 = buildImage(rng, 'image2', 5, panels, states, rules)
  if (!image2) return null

  // Spec §2.4: the four distractors must cover at least two error families
  // wherever the rule set allows one.
  const families = { ...image1.families, ...image2.families }
  const distinct = new Set(Object.values(families))
  if (distinct.size < 2 && peakLoad > 1) return null

  const ruleText = symbols.map((s) => describeRule(s, rules[s.id])).join(' ')
  const explanation = `${ruleText} Continuing that from the fourth matrix gives the fifth matrix with ${panels[4].symbols
    .map((s) => `the ${s.shape} at ${cellName(s.cell)}`)
    .join(', ')}, and the sixth with ${panels[5].symbols
    .map((s) => `the ${s.shape} at ${cellName(s.cell)}`)
    .join(', ')}.`

  const moveTypes = symbols.map((s) => rules[s.id].movement.type)
  const patternType = [
    ...new Set([
      ...moveTypes.map((t) => (t === 'border' ? 'boundary-travel' : `${t}-movement`)),
      ...(bouncedBy.size ? ['boundary-bounce'] : []),
      ...(symbols.some((s) => rules[s.id].rotation.type === 'rotate') ? ['rotation'] : []),
      ...(symbols.some((s) => rules[s.id].colour.type === 'cycle') ? ['colour-cycle'] : []),
      ...(accelerates ? ['x-plus-one'] : []),
      ...(symbols.length > 1 ? ['multiple-symbol'] : []),
      ...(peakLoad >= 3 ? ['compound-rule'] : []),
    ]),
  ]

  const usesAcceleratedColour = symbols.some((s) => rules[s.id].colour.accelerating)

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
    hints: buildHints(symbols, rules, bouncedBy),
    walkthrough: buildWalkthrough(symbols, rules, panels, bouncedBy),
    meta: {
      patternType,
      skill: peakLoad >= 3 ? 'reading stacked transformations on one symbol' : 'reading a single transformation',
      // The p.8 rule names colour explicitly, but no official exercise shows an
      // accelerating colour cycle — so those items are extrapolative.
      dmatAlignment: usesAcceleratedColour ? 'reasonable_extrapolation' : 'officially_documented',
      reasoningDepth: totalLoad,
      distractorTypes: families,
      generationNotes: `${symbols.length} symbol(s), peak transformation load ${peakLoad}, total ${totalLoad}${accelerates ? ', accelerating' : ''}`,
    },
    generator: GENERATOR,
  }
}

export function generateFigureSequences(rng, quotas = { low: 12, medium: 18, high: 15 }) {
  const out = []

  for (const [difficulty, count] of Object.entries(quotas)) {
    const seen = new Set()
    const shapeMix = new Map()
    let made = 0
    let attempts = 0

    while (made < count && attempts < 400000) {
      attempts++
      const q = buildQuestion(rng, made + 1, difficulty)
      if (!q) continue

      const fingerprint = JSON.stringify([q.given, q.rules])
      if (seen.has(fingerprint)) continue

      // Structural variety guard: the old low tier was 11 identical shapes.
      // Cap how many items may share one movement/transformation signature.
      const signature = q.meta.patternType.slice().sort().join('|')
      const cap = Math.max(2, Math.ceil(count / 3))
      if ((shapeMix.get(signature) ?? 0) >= cap) continue

      seen.add(fingerprint)
      shapeMix.set(signature, (shapeMix.get(signature) ?? 0) + 1)
      out.push(q)
      made++
    }

    if (made < count) {
      throw new Error(`figure-sequences: only produced ${made}/${count} ${difficulty} items`)
    }
  }

  return out
}
