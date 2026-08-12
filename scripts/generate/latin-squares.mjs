/**
 * Latin Squares generator.
 *
 * Difficulty is measured on four dimensions, never assigned: deduction depth,
 * clue density, which techniques the path required, and how far the prerequisite
 * placements sit from the target. See DMAT_QUESTION_AUTHORING_SPEC.md §4.
 *
 * Both official techniques are generated. A step is only labelled
 * `pair-elimination` when the solver could not reach it with a naked single,
 * so the label can never overstate what the puzzle actually needed.
 */
import {
  LETTERS,
  candidatesAt,
  clueDensity,
  completeGrid,
  randomLatinSquare,
  solvePath,
  viableTargetLetters,
} from '../lib/latin.mjs'
import { VERIFIED_AT, randInt, shuffle } from '../lib/rng.mjs'

const GENERATOR = { name: 'latin-squares', version: '2.0.0', verifiedAt: VERIFIED_AT }

/** Spec §4.3. Density is givens over the 24 non-target cells. */
const BANDS = {
  low: { depth: [1, 2], density: [0.3, 0.6] },
  medium: { depth: [3, 4], density: [0.2, 0.5] },
  high: { depth: [5, 7], density: [0.2, 0.45] },
}

const cellName = ({ row, col }) => `R${row + 1}C${col + 1}`
const countGivens = (grid, target) =>
  grid.flat().filter(Boolean).length - (grid[target.row][target.col] ? 1 : 0)

/**
 * Strip the square down towards a chosen clue count, never below the point where
 * the target stops being deducible.
 */
function carveToDensity(rng, solution, target, wantGiven) {
  const grid = solution.map((row) => [...row])
  grid[target.row][target.col] = null

  const cells = shuffle(
    rng,
    solution
      .flatMap((_, r) => solution[r].map((__, c) => ({ row: r, col: c })))
      .filter((cell) => !(cell.row === target.row && cell.col === target.col)),
  )

  for (const cell of cells) {
    if (countGivens(grid, target) <= wantGiven) break
    const saved = grid[cell.row][cell.col]
    grid[cell.row][cell.col] = null
    if (!solvePath(grid, target)) grid[cell.row][cell.col] = saved
  }

  return grid
}

/** Which cell to blame for a letter clashing with the target, preferring a given. */
function clashCell(givens, solved, target, letter) {
  const n = solved.length
  const found = []
  for (let c = 0; c < n; c++) {
    if (c !== target.col && solved[target.row][c] === letter) {
      found.push({ row: target.row, col: c, line: `row ${target.row + 1}`, unit: 'row' })
    }
  }
  for (let r = 0; r < n; r++) {
    if (r !== target.row && solved[r][target.col] === letter) {
      found.push({ row: r, col: target.col, line: `column ${target.col + 1}`, unit: 'column' })
    }
  }
  if (found.length === 0) return null
  return found.find((f) => givens[f.row][f.col]) ?? found[0]
}

function buildDistractorNotes(givens, solved, target, answer, letters) {
  const notes = {}
  const types = {}

  for (const letter of letters) {
    if (letter === answer) continue
    const clash = clashCell(givens, solved, target, letter)
    if (!clash) return null

    const visible = Boolean(givens[clash.row][clash.col])
    const base =
      `${letter} already appears in ${clash.line} (at ${cellName(clash)}), ` +
      `and a letter can only appear once per ${clash.unit}.`

    notes[letter] = visible
      ? base
      : `${base} That clash only becomes visible once you fill in the cells the puzzle forces first.`
    types[letter] = visible ? 'direct-clash' : 'derived-clash'
  }

  return { notes, types }
}

function buildSolution(givens, steps, target, answer) {
  const prereq = steps.slice(0, -1)
  const last = steps[steps.length - 1]
  const usesPair = steps.some((s) => s.technique === 'pair-elimination')

  const rowLetters = givens[target.row].filter(Boolean)
  const colLetters = givens.map((r) => r[target.col]).filter(Boolean)
  const directlyVisible = new Set([...rowLetters, ...colLetters]).size

  const keyInsight =
    prereq.length === 0
      ? `Four of the five letters are already visible from ${cellName(target)}'s own row and column, so the marked cell can be read straight off.`
      : usesPair
        ? `Nothing is forced at ${cellName(target)} yet. The way in is a line that is missing only two letters — that fixes a cell elsewhere, and the marked cell follows.`
        : `Nothing is forced at ${cellName(target)} yet, so ${prereq.length} other ${prereq.length === 1 ? 'cell has' : 'cells have'} to be settled first.`

  const solutionSteps = []

  solutionSteps.push({
    title: 'Read the marked cell’s row and column',
    detail:
      directlyVisible >= 4
        ? `Row ${target.row + 1} and column ${target.col + 1} between them already show ${directlyVisible} different letters. Only one letter is unaccounted for.`
        : `Row ${target.row + 1} and column ${target.col + 1} show only ${directlyVisible} different letters between them, so the marked cell is not settled yet. Somewhere else has to give first.`,
    visual: { type: 'ls-lines', row: target.row, col: target.col },
  })

  for (const step of prereq) {
    solutionSteps.push({
      title:
        step.technique === 'pair-elimination'
          ? `Only one cell is left for ${step.letter}`
          : `${cellName(step.cell)} can only be ${step.letter}`,
      detail: step.reason,
      visual:
        step.technique === 'pair-elimination' && step.line
          ? {
              type: 'ls-pair',
              line: step.line,
              letters: step.pairLetters ?? [step.letter, step.letter],
              cells: step.pairCells ?? [step.cell, step.cell],
            }
          : { type: 'ls-place', cell: step.cell, letter: step.letter, technique: step.technique },
    })
  }

  solutionSteps.push({
    title: 'Now the marked cell is forced',
    detail: last.reason,
    visual: { type: 'ls-place', cell: target, letter: answer, technique: last.technique },
  })

  const takeaway = usesPair
    ? 'When no cell is forced, stop looking at cells and look at lines: a row or column missing exactly two letters will usually break the deadlock.'
    : prereq.length === 0
      ? 'Always try the marked cell’s own row and column first. When four letters are already there, the item is over in seconds and nothing else needs filling.'
      : 'Fill only the cells that feed the marked cell’s row or column. Completing the rest of the square costs time the answer does not need.'

  return {
    keyInsight,
    steps: solutionSteps,
    answer: `The marked cell ${cellName(target)} is ${answer}.`,
    takeaway,
  }
}

function buildHints(steps, target) {
  const prereq = steps.slice(0, -1)
  const usesPair = steps.some((s) => s.technique === 'pair-elimination')
  const first = prereq[0]

  if (prereq.length === 0) {
    return [
      { level: 1, text: 'Everything you need is already on the grid — you do not have to fill in any other cell.' },
      {
        level: 2,
        text: `Work along row ${target.row + 1} and down column ${target.col + 1}, and keep a count of the different letters you see.`,
      },
      {
        level: 3,
        text: 'Four of the five letters appear between that row and that column. The one you never saw is the answer.',
      },
    ]
  }

  const firstLine =
    first.technique === 'pair-elimination' && first.line
      ? first.line.kind === 'row'
        ? `row ${first.line.index + 1}`
        : `column ${first.line.index + 1}`
      : first.cell.row === target.row
        ? `row ${target.row + 1}`
        : `column ${target.col + 1}`

  return [
    {
      level: 1,
      text: `The marked cell is not settled yet. ${prereq.length === 1 ? 'One other cell' : `About ${prereq.length} other cells`} must be filled in first.`,
    },
    {
      level: 2,
      text: usesPair
        ? `Look for a line that is missing only two letters — ${firstLine} is worth checking.`
        : `Look in ${firstLine} for a cell whose own row and column already rule out four letters.`,
    },
    {
      level: 3,
      text: `Start with ${cellName(first.cell)}. Once that cell is filled, come back to the marked cell.`,
    },
  ]
}

function buildQuestion(rng, index, wanted, opts = {}) {
  const band = BANDS[wanted]
  const solution = randomLatinSquare(rng, 5, LETTERS)
  const target = { row: randInt(rng, 0, 4), col: randInt(rng, 0, 4) }

  const wantGiven = randInt(
    rng,
    Math.ceil(band.density[0] * 24),
    Math.floor(band.density[1] * 24),
  )
  const givens = carveToDensity(rng, solution, target, wantGiven)

  const path = solvePath(givens, target)
  if (!path) return null

  const { steps } = path
  const depth = steps.length
  if (depth < band.depth[0] || depth > band.depth[1]) return null

  const density = clueDensity(givens, target)
  if (density < band.density[0] || density > band.density[1]) return null

  const techniques = [...new Set(steps.map((s) => s.technique))]
  const usesPair = techniques.includes('pair-elimination')
  if (wanted === 'high' && !usesPair) return null
  if (opts.requirePair && !usesPair) return null
  if (opts.forbidPair && usesPair) return null

  // The strong gate: exactly one letter may complete the square at the target.
  const viable = viableTargetLetters(givens, target, LETTERS)
  if (viable.length !== 1) return null
  const answer = viable[0]
  if (steps[steps.length - 1].letter !== answer) return null

  // Notes are written against the fully solved square so a clash always exists.
  const solved = completeGrid(givens, LETTERS)
  if (!solved) return null

  const distractors = buildDistractorNotes(givens, solved, target, answer, LETTERS)
  if (!distractors) return null

  const prereqOutOfLine = steps
    .slice(0, -1)
    .filter((s) => s.cell.row !== target.row && s.cell.col !== target.col).length

  const explanation =
    steps.length === 1
      ? `${steps[0].reason} Four of the five letters are already visible from the target's own row and column, so no other cell needs filling first.`
      : `Fill the forced cells first: ${steps
          .slice(0, -1)
          .map((s) => `${cellName(s.cell)} must be ${s.letter}`)
          .join('; ')}. ${steps[steps.length - 1].reason}`

  const patternType = [
    depth === 1 ? 'direct-deduction' : depth <= 3 ? 'short-chain' : 'deep-chain',
    ...(usesPair ? ['pair-elimination'] : ['naked-single']),
  ]

  return {
    id: `ls-${wanted}-${String(index).padStart(3, '0')}`,
    kind: 'latin-square',
    section: 'latin-squares',
    difficulty: wanted,
    size: 5,
    letters: LETTERS,
    grid: givens,
    target,
    options: LETTERS.map((letter) => ({ id: letter, letter })),
    correctOptionId: answer,
    solutionSteps: steps.map((s) => ({
      cell: s.cell,
      letter: s.letter,
      reason: s.reason,
      technique: s.technique,
    })),
    forcedPlacementDepth: depth,
    explanation,
    distractorNotes: distractors.notes,
    hints: buildHints(steps, target),
    walkthrough: buildSolution(givens, steps, target, answer),
    meta: {
      patternType,
      skill: usesPair ? 'line-based positional deduction' : 'cell-based exclusion',
      dmatAlignment: 'officially_documented',
      reasoningDepth: depth,
      distractorTypes: distractors.types,
      generationNotes: `depth ${depth}, clue density ${density.toFixed(2)}, ${prereqOutOfLine} prerequisite(s) outside the target's lines`,
    },
    generator: GENERATOR,
  }
}

export function generateLatinSquares(rng, quotas = { low: 15, medium: 15, high: 15 }) {
  const out = []

  for (const [difficulty, count] of Object.entries(quotas)) {
    const seen = new Set()
    let made = 0
    let attempts = 0

    // No tier may be single-technique (spec §4.2). High requires pair
    // elimination throughout; low and medium take roughly a third.
    const pairQuota = difficulty === 'high' ? count : Math.round(count / 3)

    while (made < count && attempts < 40000) {
      attempts++
      const opts =
        difficulty === 'high'
          ? {}
          : made < pairQuota
            ? { requirePair: true }
            : { forbidPair: true }

      const q = buildQuestion(rng, made + 1, difficulty, opts)
      if (!q) continue

      const fingerprint = JSON.stringify([q.grid, q.target])
      if (seen.has(fingerprint)) continue
      seen.add(fingerprint)

      out.push(q)
      made++
    }

    if (made < count) {
      throw new Error(`latin-squares: only produced ${made}/${count} ${difficulty} items`)
    }
  }

  return out
}

/** Independent re-check used by verify-bank: re-derive rather than trust the file. */
export function verifyLatinSquare(q) {
  const errors = []
  const grid = q.grid

  if (q.size !== 5 || grid.length !== 5 || grid.some((r) => r.length !== 5)) {
    errors.push('grid is not 5×5')
  }
  if (q.letters.join('') !== 'ABCDE') errors.push(`letter set is ${q.letters.join('')}`)

  for (let i = 0; i < grid.length; i++) {
    const row = grid[i].filter(Boolean)
    const col = grid.map((r) => r[i]).filter(Boolean)
    if (new Set(row).size !== row.length) errors.push(`row ${i + 1} repeats a letter`)
    if (new Set(col).size !== col.length) errors.push(`column ${i + 1} repeats a letter`)
    for (const letter of [...row, ...col]) {
      if (!q.letters.includes(letter)) errors.push(`unknown letter ${letter}`)
    }
  }

  if (grid[q.target.row][q.target.col] !== null) errors.push('target cell is not empty')

  // Exhaustive uniqueness: exactly one letter may complete the square.
  const viable = viableTargetLetters(grid, q.target, q.letters)
  if (viable.length === 0) errors.push('target admits no valid completion')
  else if (viable.length > 1) errors.push(`target is ambiguous: ${viable.join('/')} all complete`)
  else if (viable[0] !== q.correctOptionId) {
    errors.push(`only ${viable[0]} completes, but correctOptionId is ${q.correctOptionId}`)
  }

  // Replay the stored path, checking each step against the technique it claims.
  const working = grid.map((row) => [...row])
  for (const step of q.solutionSteps) {
    const { row, col } = step.cell
    const cands = candidatesAt(working, row, col, q.letters)

    if (step.technique === 'pair-elimination') {
      // Legal iff the letter fits here and nowhere else in some two-empty line.
      if (!cands.includes(step.letter)) {
        errors.push(`pair step ${cellName(step.cell)} places a letter that does not fit`)
        break
      }
    } else if (cands.length !== 1 || cands[0] !== step.letter) {
      errors.push(`step ${cellName(step.cell)} was not forced (${cands.length} candidates)`)
      break
    }
    working[row][col] = step.letter
  }

  const derived = working[q.target.row][q.target.col]
  if (derived !== q.correctOptionId) {
    errors.push(`path derives ${derived}, but correctOptionId is ${q.correctOptionId}`)
  }

  // Distractor notes must cite a cell that really holds the clashing letter, and
  // may only claim a clash is hidden when the cited cell is genuinely not a given.
  const solved = completeGrid(grid, q.letters)
  for (const [letter, note] of Object.entries(q.distractorNotes ?? {})) {
    const m = /at R(\d)C(\d)/.exec(note)
    if (!m) {
      errors.push(`note for ${letter} cites no cell`)
      continue
    }
    const r = Number(m[1]) - 1
    const c = Number(m[2]) - 1
    if (!solved || solved[r][c] !== letter) {
      errors.push(`note for ${letter} cites ${cellName({ row: r, col: c })}, which does not hold it`)
    }
    const isGiven = grid[r][c] !== null
    const caveated = note.includes('only becomes visible')
    if (!isGiven && !caveated) errors.push(`note for ${letter} cites a derived cell without the caveat`)
    if (isGiven && caveated) errors.push(`note for ${letter} caveats a cell that is already visible`)
  }

  return errors
}

export { shuffle }
