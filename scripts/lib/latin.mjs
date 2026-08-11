/**
 * Latin square construction, solving and difficulty measurement.
 *
 * The deduction model deliberately mirrors the official materials, which solve
 * purely by exclusion: "B is the only letter which does not already appear in
 * this row and column" (GAM PDF p. 25). So a cell is considered derivable only
 * when four of the five letters are already present in its row or column —
 * naked singles only, no hidden singles, no guessing.
 */
import { shuffle } from './rng.mjs'

export const LETTERS = ['A', 'B', 'C', 'D', 'E']

const key = ({ row, col }) => `${row},${col}`

/** A random complete Latin square, built by shuffling a cyclic base. */
export function randomLatinSquare(rng, n = 5, letters = LETTERS) {
  const rowOrder = shuffle(rng, [...Array(n).keys()])
  const colOrder = shuffle(rng, [...Array(n).keys()])
  const symbols = shuffle(rng, letters)

  const base = []
  for (let r = 0; r < n; r++) {
    base.push([])
    for (let c = 0; c < n; c++) base[r].push(symbols[(r + c) % n])
  }
  return rowOrder.map((r) => colOrder.map((c) => base[r][c]))
}

/** Letters already visible in a cell's row and column. */
function seenAround(grid, row, col) {
  const seen = new Set()
  for (let c = 0; c < grid.length; c++) if (c !== col && grid[row][c]) seen.add(grid[row][c])
  for (let r = 0; r < grid.length; r++) if (r !== row && grid[r][col]) seen.add(grid[r][col])
  return seen
}

/** Candidate letters for an empty cell. */
export function candidatesAt(grid, row, col, letters = LETTERS) {
  const seen = seenAround(grid, row, col)
  return letters.filter((l) => !seen.has(l))
}

/**
 * Minimal set of cells that must be filled before `target` becomes forced.
 *
 * For each letter that isn't the answer, the target's row or column must
 * contain it. Whichever of the two solution positions is cheaper to derive
 * gets chosen, recursively. Returns null when the target can't be reached by
 * exclusion alone.
 */
export function requiredPlacements(givens, solution, target, letters = LETTERS) {
  const n = solution.length
  const memo = new Map()

  function required(cell, visiting) {
    const k = key(cell)
    if (givens[cell.row][cell.col]) return new Set()
    if (memo.has(k)) return memo.get(k)
    if (visiting.has(k)) return null

    const nextVisiting = new Set(visiting).add(k)
    const answer = solution[cell.row][cell.col]
    const needed = new Set()

    for (const letter of letters) {
      if (letter === answer) continue

      // Already excluded by a given in this row or column?
      let satisfied = false
      for (let c = 0; c < n && !satisfied; c++) {
        if (c !== cell.col && givens[cell.row][c] === letter) satisfied = true
      }
      for (let r = 0; r < n && !satisfied; r++) {
        if (r !== cell.row && givens[r][cell.col] === letter) satisfied = true
      }
      if (satisfied) continue

      // Otherwise it must come from the letter's solution position in this
      // row or column, which itself has to be derived.
      const options = []
      for (let c = 0; c < n; c++) {
        if (c !== cell.col && solution[cell.row][c] === letter) {
          options.push({ row: cell.row, col: c })
        }
      }
      for (let r = 0; r < n; r++) {
        if (r !== cell.row && solution[r][cell.col] === letter) {
          options.push({ row: r, col: cell.col })
        }
      }

      let best = null
      for (const option of options) {
        const sub = required(option, nextVisiting)
        if (!sub) continue
        const combined = new Set(sub).add(key(option))
        if (!best || combined.size < best.size) best = combined
      }
      if (!best) {
        memo.set(k, null)
        return null
      }
      for (const c of best) needed.add(c)
    }

    memo.set(k, needed)
    return needed
  }

  return required(target, new Set())
}

/**
 * Difficulty metric: 1 when the target is forced straight from the givens, plus
 * one for every prior placement the deduction depends on.
 */
export function forcedPlacementDepth(givens, solution, target, letters = LETTERS) {
  const needed = requiredPlacements(givens, solution, target, letters)
  return needed === null ? null : needed.size + 1
}

export function difficultyForDepth(depth) {
  if (depth <= 1) return 'low'
  if (depth <= 3) return 'medium'
  return 'high'
}

/**
 * Strip the grid down as far as exclusion-only deduction allows, so puzzles
 * aren't padded with givens that do no work.
 */
export function carvePuzzle(rng, solution, target, letters = LETTERS) {
  const n = solution.length
  const givens = solution.map((row) => [...row])
  givens[target.row][target.col] = null

  const removable = shuffle(
    rng,
    solution
      .flatMap((_, r) => solution[r].map((__, c) => ({ row: r, col: c })))
      .filter((cell) => !(cell.row === target.row && cell.col === target.col)),
  )

  for (const cell of removable) {
    const saved = givens[cell.row][cell.col]
    givens[cell.row][cell.col] = null
    if (forcedPlacementDepth(givens, solution, target, letters) === null) {
      givens[cell.row][cell.col] = saved
    }
  }
  return givens
}

/**
 * Ordered elimination steps, for the worked explanation: each prerequisite
 * placement first, then the target.
 */
export function solutionSteps(givens, solution, target, letters = LETTERS) {
  const needed = requiredPlacements(givens, solution, target, letters)
  if (!needed) return []

  const working = givens.map((row) => [...row])
  const steps = []
  const pending = new Set(needed)

  // Repeatedly take whichever pending cell is currently forced.
  while (pending.size > 0) {
    let progressed = false
    for (const k of pending) {
      const [row, col] = k.split(',').map(Number)
      const cands = candidatesAt(working, row, col, letters)
      if (cands.length === 1) {
        working[row][col] = cands[0]
        steps.push({
          cell: { row, col },
          letter: cands[0],
          reason: describeElimination(working, row, col, cands[0], letters),
        })
        pending.delete(k)
        progressed = true
        break
      }
    }
    if (!progressed) break
  }

  const answer = solution[target.row][target.col]
  working[target.row][target.col] = answer
  steps.push({
    cell: target,
    letter: answer,
    reason: describeElimination(working, target.row, target.col, answer, letters),
  })
  return steps
}

/** Human-readable reason a cell can only be one letter. */
export function describeElimination(grid, row, col, letter, letters = LETTERS) {
  const n = grid.length
  const inRow = []
  const inCol = []

  for (const other of letters) {
    if (other === letter) continue
    let found = false
    for (let c = 0; c < n; c++) {
      if (c !== col && grid[row][c] === other) {
        inRow.push(other)
        found = true
        break
      }
    }
    if (found) continue
    for (let r = 0; r < n; r++) {
      if (r !== row && grid[r][col] === other) {
        inCol.push(other)
        break
      }
    }
  }

  const verb = (list) => (list.length === 1 ? 'already appears' : 'already appear')
  const parts = []
  if (inRow.length) parts.push(`${inRow.join(', ')} ${verb(inRow)} in row ${row + 1}`)
  if (inCol.length) parts.push(`${inCol.join(', ')} ${verb(inCol)} in column ${col + 1}`)

  return parts.length
    ? `${parts.join('; ')} — so ${letter} is the only letter left for R${row + 1}C${col + 1}.`
    : `${letter} is the only letter that fits R${row + 1}C${col + 1}.`
}

/** Why a specific wrong letter cannot go in the target cell. */
export function describeClash(grid, row, col, letter) {
  const n = grid.length
  for (let c = 0; c < n; c++) {
    if (c !== col && grid[row][c] === letter) {
      return `${letter} already appears in row ${row + 1} (at R${row + 1}C${c + 1}), and a letter can only appear once per row.`
    }
  }
  for (let r = 0; r < n; r++) {
    if (r !== row && grid[r][col] === letter) {
      return `${letter} already appears in column ${col + 1} (at R${r + 1}C${col + 1}), and a letter can only appear once per column.`
    }
  }
  return `${letter} does not fit R${row + 1}C${col + 1}.`
}
