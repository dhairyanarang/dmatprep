/**
 * Latin Squares generator.
 *
 * Every puzzle is carved down until exclusion-only deduction still reaches the
 * target, then its difficulty is *measured* as the number of forced placements
 * the deduction depends on — never assigned by feel.
 */
import {
  LETTERS,
  candidatesAt,
  carvePuzzle,
  describeClash,
  difficultyForDepth,
  forcedPlacementDepth,
  randomLatinSquare,
  solutionSteps,
} from '../lib/latin.mjs'
import { VERIFIED_AT, pick, shuffle } from '../lib/rng.mjs'

const GENERATOR = { name: 'latin-squares', version: '1.0.0', verifiedAt: VERIFIED_AT }

/** Restore givens until the puzzle sits at or below `maxDepth`. */
function relaxToDepth(rng, givens, solution, target, maxDepth) {
  const grid = givens.map((row) => [...row])
  let guard = 0

  while (guard++ < 40) {
    const depth = forcedPlacementDepth(grid, solution, target)
    if (depth !== null && depth <= maxDepth) return grid

    const empties = []
    for (let r = 0; r < solution.length; r++) {
      for (let c = 0; c < solution.length; c++) {
        if (!grid[r][c] && !(r === target.row && c === target.col)) empties.push({ row: r, col: c })
      }
    }
    if (empties.length === 0) return grid

    const cell = pick(rng, empties)
    grid[cell.row][cell.col] = solution[cell.row][cell.col]
  }
  return grid
}

function buildQuestion(rng, index, wanted) {
  const solution = randomLatinSquare(rng, 5, LETTERS)
  const target = { row: Math.floor(rng() * 5), col: Math.floor(rng() * 5) }

  let givens = carvePuzzle(rng, solution, target)
  if (wanted === 'low') givens = relaxToDepth(rng, givens, solution, target, 1)
  if (wanted === 'medium') givens = relaxToDepth(rng, givens, solution, target, 3)

  const depth = forcedPlacementDepth(givens, solution, target)
  if (depth === null) return null
  if (difficultyForDepth(depth) !== wanted) return null

  // The target must be uniquely determined — this is the hard gate.
  const answer = solution[target.row][target.col]
  const steps = solutionSteps(givens, solution, target)
  if (steps.length === 0) return null
  const last = steps[steps.length - 1]
  if (last.letter !== answer) return null

  // Rebuild the grid the candidate would end up with, for accurate clash notes.
  const solved = givens.map((row) => [...row])
  for (const step of steps) solved[step.cell.row][step.cell.col] = step.letter

  const distractorNotes = {}
  for (const letter of LETTERS) {
    if (letter === answer) continue
    const note = describeClash(solved, target.row, target.col, letter)
    const derived = steps.some(
      (s) =>
        s.letter === letter &&
        (s.cell.row === target.row || s.cell.col === target.col) &&
        !givens[s.cell.row][s.cell.col],
    )
    distractorNotes[letter] = derived
      ? `${note} That clash only becomes visible once you fill in the cells the puzzle forces first.`
      : note
  }

  const prerequisites = steps.slice(0, -1)
  const explanation =
    prerequisites.length === 0
      ? `${last.reason} Four of the five letters are already visible from the target's own row and column, so no other cell needs filling first.`
      : `Fill the forced cells first: ${prerequisites
          .map((s) => `R${s.cell.row + 1}C${s.cell.col + 1} must be ${s.letter} (${s.reason.replace(/\.$/, '')})`)
          .join('; ')}. ${last.reason}`

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
    solutionSteps: steps,
    forcedPlacementDepth: depth,
    explanation,
    distractorNotes,
    generator: GENERATOR,
  }
}

export function generateLatinSquares(rng, quotas = { low: 14, medium: 13, high: 13 }) {
  const out = []

  for (const [difficulty, count] of Object.entries(quotas)) {
    const seen = new Set()
    let made = 0
    let attempts = 0

    while (made < count && attempts < 20000) {
      attempts++
      const q = buildQuestion(rng, made + 1, difficulty)
      if (!q) continue

      // Reject duplicates by grid shape + target.
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

  // Givens must themselves form a valid partial Latin square.
  for (let r = 0; r < q.size; r++) {
    for (let c = 0; c < q.size; c++) {
      const letter = grid[r][c]
      if (!letter) continue
      if (!q.letters.includes(letter)) errors.push(`R${r + 1}C${c + 1}: unknown letter ${letter}`)
      for (let cc = 0; cc < q.size; cc++) {
        if (cc !== c && grid[r][cc] === letter) errors.push(`duplicate ${letter} in row ${r + 1}`)
      }
      for (let rr = 0; rr < q.size; rr++) {
        if (rr !== r && grid[rr][c] === letter) errors.push(`duplicate ${letter} in column ${c + 1}`)
      }
    }
  }

  if (grid[q.target.row][q.target.col] !== null) errors.push('target cell is not empty')

  // Replay the stored steps and confirm each one really was forced.
  const working = grid.map((row) => [...row])
  for (const step of q.solutionSteps) {
    const cands = candidatesAt(working, step.cell.row, step.cell.col, q.letters)
    if (cands.length !== 1) {
      errors.push(
        `step R${step.cell.row + 1}C${step.cell.col + 1} was not forced (${cands.length} candidates)`,
      )
      break
    }
    if (cands[0] !== step.letter) errors.push(`step disagrees with forced letter ${cands[0]}`)
    working[step.cell.row][step.cell.col] = step.letter
  }

  const finalLetter = working[q.target.row][q.target.col]
  if (finalLetter !== q.correctOptionId) {
    errors.push(`derived ${finalLetter}, but correctOptionId is ${q.correctOptionId}`)
  }

  const expected = difficultyForDepth(q.forcedPlacementDepth)
  if (expected !== q.difficulty) {
    errors.push(`depth ${q.forcedPlacementDepth} implies ${expected}, tagged ${q.difficulty}`)
  }

  return errors
}

export { shuffle }
