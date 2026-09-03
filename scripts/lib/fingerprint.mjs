/**
 * Structural fingerprints.
 *
 * The Phase 3 audit found the old dedup keys caught exact repeats and nothing
 * else: at 145 items per section it measured 88% / 55% / 37% genuinely distinct
 * structures, with clusters of 9 and 10 items differing only in their numbers or
 * their position on the grid. Changing a colour, a start cell or a letter order
 * is not a different question.
 *
 * Each fingerprint below deliberately discards the cosmetic dimensions and keeps
 * the ones a candidate actually reasons about. Generation caps how many items may
 * share one.
 */
import { createHash } from 'node:crypto'

const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16)

/* ------------------------------------------------------------ Figure Sequences */

/** The 8 symmetries of the square. */
const SYMMETRIES = [
  (r, c) => [r, c],
  (r, c, n) => [c, n - 1 - r],
  (r, c, n) => [n - 1 - r, n - 1 - c],
  (r, c, n) => [n - 1 - c, r],
  (r, c, n) => [r, n - 1 - c],
  (r, c, n) => [n - 1 - r, c],
  (r, c) => [c, r],
  (r, c, n) => [n - 1 - c, n - 1 - r],
]

/**
 * A symbol's track under whichever symmetry sorts smallest. A symbol running up
 * column 1 and one running down column 4 are the same reasoning task, and the
 * audit's exhaustive count of the low tier (178 configurations → 150 tracks → 26
 * genuinely distinct tasks) only becomes visible once they collide.
 */
function canonicalTrack(cells, n = 4) {
  let best = null
  for (const f of SYMMETRIES) {
    const s = cells.map(({ row, col }) => f(row, col, n).join('')).join('-')
    if (best === null || s < best) best = s
  }
  return best
}

const stepClass = (step) => (step === 'x+1' ? 'accel' : `s${step}`)

/**
 * Structural signature for a figure item. Ignores shape and colour identity —
 * both are cosmetic — but keeps cycle *length*, which changes the reasoning.
 */
export function figureFingerprint(question) {
  const symbols = question.given[0].symbols
  const parts = symbols
    .map((symbol) => {
      const rule = question.rules[symbol.id]
      const track = question.given.map((p) => p.symbols.find((s) => s.id === symbol.id).cell)
      return [
        rule.movement.type,
        stepClass(rule.movement.step ?? 1),
        rule.rotation.type === 'rotate' ? `rot${rule.rotation.degrees}${rule.rotation.accelerating ? 'a' : ''}` : 'norot',
        rule.colour.type === 'cycle' ? `col${rule.colour.colours.length}${rule.colour.accelerating ? 'a' : ''}` : 'nocol',
        canonicalTrack(track),
      ].join(':')
    })
    .sort()

  return {
    key: hash([question.difficulty, parts]),
    /** Coarser: the shape of the item, ignoring where on the grid it happens. */
    familyKey: hash([
      question.difficulty,
      symbols
        .map((symbol) => {
          const rule = question.rules[symbol.id]
          return [
            rule.movement.type,
            stepClass(rule.movement.step ?? 1),
            rule.rotation.type === 'rotate' ? 'rot' : '-',
            rule.colour.type === 'cycle' ? `col${rule.colour.colours.length}` : '-',
          ].join(':')
        })
        .sort(),
    ]),
    readable: `${question.difficulty}|${parts.join(' + ')}`,
  }
}

/* -------------------------------------------------------- Mathematical Equations */

/**
 * The equation skeleton: every numeral blanked, so `3 × A = 12` and `5 × A = 20`
 * collapse together. Sorted, because `buildSystem` shuffles the display order —
 * the old key hashed the shuffled join, so the same system in a different order
 * was a different key. That let 2 exact duplicates through at 145 items.
 */
export const equationSkeleton = (equations) =>
  equations
    .map((e) => e.replace(/\d+/g, '#'))
    .slice()
    .sort()

/** Which letter each equation defines, so chain vs star is visible. */
export function equationTopology(equations, variables) {
  const sources = {}
  for (const equation of equations) {
    const [lhs, rhs] = equation.split(' = ')
    const lhsVars = [...new Set(lhs.match(/[A-Z]/g) ?? [])]
    const rhsVars = [...new Set(rhs.match(/[A-Z]/g) ?? [])]
    if (rhsVars.length === 1 && lhsVars.length === 1 && rhsVars[0] !== lhsVars[0]) {
      sources[rhsVars[0]] = lhsVars[0]
    }
  }
  const fanOut = {}
  for (const source of Object.values(sources)) fanOut[source] = (fanOut[source] ?? 0) + 1
  const maxFan = Math.max(0, ...Object.values(fanOut))
  const spansAll = equations.some(
    (e) => new Set(e.match(/[A-Z]/g) ?? []).size === variables.length && variables.length > 2,
  )
  if (maxFan >= 2) return spansAll ? 'star+combine' : 'star'
  if (spansAll) return 'chain+combine'
  return Object.keys(sources).length ? 'chain' : 'flat'
}

export function equationFingerprint(question) {
  const skeleton = equationSkeleton(question.equations)
  const topology = equationTopology(question.equations, question.variables)
  const depth = question.meta?.reasoningDepth ?? null
  const askedPosition = question.variables.indexOf(question.asked)

  return {
    key: hash([question.difficulty, skeleton, topology, depth, askedPosition]),
    /** Order-independent identity of the system itself, for exact-dupe detection. */
    systemKey: hash([question.equations.slice().sort(), question.asked]),
    familyKey: hash([question.difficulty, topology, depth, question.variables.length]),
    readable: `${question.difficulty}|${topology}|d${depth}|asked@${askedPosition}|${skeleton.join(' ; ')}`,
  }
}

/* ------------------------------------------------------------- Latin Squares */

const densityBand = (given) => {
  if (given <= 7) return 'sparse'
  if (given <= 11) return 'mid'
  return 'dense'
}

/**
 * Adds `targetDistance` — prerequisites lying outside the target's own row and
 * column. Spec §4.3 defines it and the generator already computes it for
 * `generationNotes`, but nothing ever constrained on it, so the whole medium
 * tier ended up with every prerequisite sitting on the target's own lines.
 */
export function latinFingerprint(question) {
  const given = question.grid.flat().filter(Boolean).length
  const steps = question.solutionSteps ?? []
  const techniques = [...new Set(steps.map((s) => s.technique))].sort()
  const prereq = steps.slice(0, -1)
  const targetDistance = prereq.filter(
    (s) => s.cell.row !== question.target.row && s.cell.col !== question.target.col,
  ).length
  const onDiagonal = question.target.row === question.target.col

  // The *shape* of the deduction, not just its summary statistics.
  //
  // Depth, density and technique-set alone proved far too coarse: they collapse
  // into ~16 buckets per tier, and capping each at 2 put the whole section's
  // ceiling at about 48 new items — a limit imposed by the fingerprint, not by
  // the content. Two depth-3 items whose prerequisites sit on different lines,
  // or that alternate techniques in a different order, are genuinely different
  // work for the candidate. Phase 18 is explicit that a uniqueness threshold
  // must not make legitimate generation impossible.
  const techniqueSequence = steps.map((s) => (s.technique === 'pair-elimination' ? 'P' : 'N')).join('')
  const onRow = prereq.filter((s) => s.cell.row === question.target.row).length
  const onCol = prereq.filter((s) => s.cell.col === question.target.col).length

  return {
    key: hash([
      question.difficulty,
      question.forcedPlacementDepth,
      densityBand(given),
      techniqueSequence,
      targetDistance,
      onRow,
      onCol,
      onDiagonal,
    ]),
    familyKey: hash([question.difficulty, question.forcedPlacementDepth, techniques]),
    readable: `${question.difficulty}|d${question.forcedPlacementDepth}|${densityBand(given)}|${techniqueSequence}|dist${targetDistance}|r${onRow}c${onCol}${onDiagonal ? '|diag' : ''}`,
    targetDistance,
  }
}

/* ------------------------------------------------------------------- shared */

export function fingerprintFor(question) {
  switch (question.kind) {
    case 'figure-sequence':
      return figureFingerprint(question)
    case 'math-equations':
      return equationFingerprint(question)
    case 'latin-square':
      return latinFingerprint(question)
    default:
      throw new Error(`no fingerprint for kind "${question.kind}"`)
  }
}

/**
 * Reuse budget. Generation rejects a candidate whose key already appears this
 * many times across the existing bank plus the batch so far — an absolute cap,
 * not the old `ceil(count / 3)`, which loosened as the batch grew (at count=58 it
 * would have allowed 20 items to share one signature).
 */
export const MAX_PER_FINGERPRINT = 2
export const MAX_PER_FAMILY = 6
