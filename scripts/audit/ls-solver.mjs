/**
 * An independent solver for Latin Squares.
 *
 * Reads ONLY `size`, `letters`, `grid` and `target`. It never looks at
 * `correctOptionId`, `solutionSteps`, `forcedPlacementDepth` or the
 * explanation, so the letter it returns is derived rather than confirmed.
 *
 * The documented constraint (GAM PDF p. 24): a 5×5 grid, letters A–E, each
 * appearing exactly once in every row and every column.
 *
 * It enumerates completions rather than propagating, because the question an
 * audit has to answer is not "can I reach the answer" but "is the answer the
 * ONLY one" — and a propagator that stalls proves nothing either way.
 */

/** Every letter that can legally stand in the target cell. */
export function solveTarget(question) {
  const n = question.size
  const letters = question.letters
  const grid = question.grid.map((row) => [...row])

  // A given that already breaks the constraint is a defect in the question,
  // not something to solve around.
  const conflict = findGivenConflict(grid, n)
  if (conflict) return { error: conflict }

  const empties = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) if (grid[r][c] === null) empties.push([r, c])
  }

  const possible = new Set()
  let solutions = 0

  const canPlace = (r, c, letter) => {
    for (let i = 0; i < n; i++) {
      if (grid[r][i] === letter) return false
      if (grid[i][c] === letter) return false
    }
    return true
  }

  const fill = (index) => {
    // Cap the search: two solutions already settle uniqueness, and a grid with
    // thousands would otherwise run for a long time to tell us the same thing.
    if (solutions > 1 && possible.size > 1) return
    if (index === empties.length) {
      solutions++
      possible.add(grid[question.target.row][question.target.col])
      return
    }
    // Most-constrained cell first, which is what keeps a sparse grid tractable.
    let best = index
    let bestCount = Infinity
    for (let k = index; k < empties.length; k++) {
      const [r, c] = empties[k]
      let count = 0
      for (const letter of letters) if (canPlace(r, c, letter)) count++
      if (count < bestCount) {
        bestCount = count
        best = k
        if (count <= 1) break
      }
    }
    ;[empties[index], empties[best]] = [empties[best], empties[index]]
    const [r, c] = empties[index]

    for (const letter of letters) {
      if (!canPlace(r, c, letter)) continue
      grid[r][c] = letter
      fill(index + 1)
      grid[r][c] = null
      if (solutions > 1 && possible.size > 1) break
    }
    ;[empties[index], empties[best]] = [empties[best], empties[index]]
  }

  fill(0)
  return { possible: [...possible].sort(), completions: solutions }
}

function findGivenConflict(grid, n) {
  for (let r = 0; r < n; r++) {
    const seen = new Set()
    for (let c = 0; c < n; c++) {
      const v = grid[r][c]
      if (v === null) continue
      if (seen.has(v)) return `letter ${v} appears twice in row ${r + 1}`
      seen.add(v)
    }
  }
  for (let c = 0; c < n; c++) {
    const seen = new Set()
    for (let r = 0; r < n; r++) {
      const v = grid[r][c]
      if (v === null) continue
      if (seen.has(v)) return `letter ${v} appears twice in column ${c + 1}`
      seen.add(v)
    }
  }
  return null
}
