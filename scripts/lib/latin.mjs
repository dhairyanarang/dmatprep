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

/* ------------------------------------------------------------------------- */
/* Two-technique solving.                                                     */
/*                                                                            */
/* The official solution paths use two distinct moves, and a bank that trains  */
/* only the first is incomplete (see DMAT_QUESTION_AUTHORING_SPEC.md §4.2):    */
/*                                                                            */
/*   A  naked single      — which letter must this cell take?                 */
/*   B  pair elimination  — which cell must this letter occupy?               */
/*                                                                            */
/* B is what the official solutions lead with: "In column β, C and D are      */
/* missing. C is already in row 4, so D must be inserted in β4."              */
/* ------------------------------------------------------------------------- */

const cellName = ({ row, col }) => `R${row + 1}C${col + 1}`

/** Every row and column, as a list of its cells. */
function linesOf(n) {
  const lines = []
  for (let r = 0; r < n; r++) {
    lines.push({
      kind: 'row',
      index: r,
      label: `row ${r + 1}`,
      cells: Array.from({ length: n }, (_, c) => ({ row: r, col: c })),
    })
  }
  for (let c = 0; c < n; c++) {
    lines.push({
      kind: 'col',
      index: c,
      label: `column ${c + 1}`,
      cells: Array.from({ length: n }, (_, r) => ({ row: r, col: c })),
    })
  }
  return lines
}

/** Technique A: every cell whose row and column between them exclude four letters. */
export function nakedSingles(grid, letters) {
  const n = grid.length
  const found = []

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c]) continue
      const cands = candidatesAt(grid, r, c, letters)
      if (cands.length !== 1) continue
      found.push({ cell: { row: r, col: c }, letter: cands[0], technique: 'naked-single' })
    }
  }
  return found
}

/**
 * Technique B: a line missing exactly two letters across exactly two empty
 * cells, where one of those letters is blocked from one cell by its crossing
 * line — so it must take the other, and the pair resolves.
 *
 * Only reachable when no naked single exists: if a line is missing two letters,
 * each of its empty cells already has at most those two as candidates, so a
 * single-candidate cell would have been caught by technique A first.
 */
export function pairEliminations(grid, letters) {
  const n = grid.length
  const found = []

  for (const line of linesOf(n)) {
    const empties = line.cells.filter(({ row, col }) => !grid[row][col])
    if (empties.length !== 2) continue

    const present = new Set(line.cells.map(({ row, col }) => grid[row][col]).filter(Boolean))
    const missing = letters.filter((l) => !present.has(l))
    if (missing.length !== 2) continue

    for (const letter of missing) {
      const fits = empties.filter((cell) =>
        candidatesAt(grid, cell.row, cell.col, letters).includes(letter),
      )
      if (fits.length !== 1) continue

      const cell = fits[0]
      const blocked = empties.find((c) => c.row !== cell.row || c.col !== cell.col)
      const other = missing.find((l) => l !== letter)

      // Name the crossing line that rules the letter out of the other cell.
      const crossing =
        line.kind === 'row'
          ? `column ${blocked.col + 1}`
          : `row ${blocked.row + 1}`

      found.push({
        cell,
        letter,
        technique: 'pair-elimination',
        line: { kind: line.kind, index: line.index },
        pairLetters: [missing[0], missing[1]],
        pairCells: [empties[0], empties[1]],
        reason:
          `In ${line.label}, ${missing[0]} and ${missing[1]} are missing. ` +
          `${letter} cannot go in ${cellName(blocked)} because it already appears in ${crossing}, ` +
          `so ${letter} must go in ${cellName(cell)}${other ? ` — which leaves ${other} for ${cellName(blocked)}` : ''}.`,
      })
    }
  }

  return found
}

/**
 * Solve towards `target`, preferring naked singles so that any pair-elimination
 * step in the result was genuinely necessary — the label can never overstate
 * what the puzzle required.
 */
export function solvePath(givens, target, letters = LETTERS, maxSteps = 14) {
  const grid = givens.map((row) => [...row])
  const steps = []

  for (let i = 0; i < maxSteps; i++) {
    const targetCands = candidatesAt(grid, target.row, target.col, letters)
    if (targetCands.length === 1) {
      const letter = targetCands[0]
      grid[target.row][target.col] = letter
      steps.push({
        cell: { ...target },
        letter,
        technique: 'naked-single',
        reason: describeElimination(grid, target.row, target.col, letter, letters),
      })
      return { steps, grid }
    }

    // Priority matters. Naked singles come first so a pair-elimination label can
    // never overstate what the puzzle needed — but only naked singles that bear
    // on the target, otherwise an irrelevant one elsewhere on the grid gets
    // taken every round, inflating the path and hiding the pair steps that the
    // target's own lines actually require.
    const onTargetLine = (s) => s.cell.row === target.row || s.cell.col === target.col
    const singles = nakedSingles(grid, letters)
    const pairs = pairEliminations(grid, letters)

    const step =
      singles.find(onTargetLine) ??
      pairs.find(onTargetLine) ??
      singles[0] ??
      pairs[0]
    if (!step) return null

    // The target may itself be settled by pair elimination.
    if (step.cell.row === target.row && step.cell.col === target.col) {
      grid[step.cell.row][step.cell.col] = step.letter
      steps.push({
        cell: step.cell,
        letter: step.letter,
        technique: step.technique,
        reason: step.reason ?? describeElimination(grid, step.cell.row, step.cell.col, step.letter, letters),
      })
      return { steps, grid }
    }

    grid[step.cell.row][step.cell.col] = step.letter
    steps.push({
      cell: step.cell,
      letter: step.letter,
      technique: step.technique,
      reason:
        step.reason ?? describeElimination(grid, step.cell.row, step.cell.col, step.letter, letters),
    })
  }

  return null
}

/** Replay a stored path, confirming every step really was forced by its technique. */
export function replayPath(givens, steps, letters = LETTERS) {
  const grid = givens.map((row) => [...row])

  for (const step of steps) {
    const { row, col } = step.cell
    if (grid[row][col]) return { ok: false, error: `${cellName(step.cell)} was already filled` }

    if (step.technique === 'pair-elimination') {
      const match = pairEliminations(grid, letters).some(
        (s) => s.cell.row === row && s.cell.col === col && s.letter === step.letter,
      )
      if (!match) {
        return { ok: false, error: `${cellName(step.cell)} is not forced by pair elimination` }
      }
    } else {
      const cands = candidatesAt(grid, row, col, letters)
      if (cands.length !== 1 || cands[0] !== step.letter) {
        return { ok: false, error: `${cellName(step.cell)} is not a naked single (${cands.length} candidates)` }
      }
    }

    grid[row][col] = step.letter
  }

  return { ok: true, grid }
}

/** First full completion of a partial square, or null. Backtracking, MRV order. */
export function completeGrid(grid, letters = LETTERS) {
  const n = grid.length
  const g = grid.map((r) => [...r])

  const solve = () => {
    let best = null
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (g[r][c]) continue
        const cands = candidatesAt(g, r, c, letters)
        if (cands.length === 0) return false
        if (!best || cands.length < best.cands.length) best = { r, c, cands }
      }
    }
    if (!best) return true
    for (const letter of best.cands) {
      g[best.r][best.c] = letter
      if (solve()) return true
      g[best.r][best.c] = null
    }
    return false
  }

  return solve() ? g : null
}

/**
 * The strong uniqueness gate: every letter that could sit in the target is
 * tried and the rest of the square searched exhaustively. Anything other than
 * exactly one survivor is an ambiguous item, whatever the deduction path says.
 */
export function viableTargetLetters(grid, target, letters = LETTERS) {
  const viable = []
  for (const letter of letters) {
    if (!candidatesAt(grid, target.row, target.col, letters).includes(letter)) continue
    const trial = grid.map((r) => [...r])
    trial[target.row][target.col] = letter
    if (completeGrid(trial, letters)) viable.push(letter)
  }
  return viable
}

/** Givens as a fraction of the 24 cells that are not the target. */
export function clueDensity(grid, target) {
  const n = grid.length
  let given = 0
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (r === target.row && c === target.col) continue
      if (grid[r][c]) given++
    }
  }
  return given / (n * n - 1)
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
