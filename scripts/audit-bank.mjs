#!/usr/bin/env node
/**
 * TEMPORARY audit harness for the Module A question bank (Phase 2).
 *
 * This is analysis only: it never writes to the bank. It goes beyond
 * verify-bank in three ways —
 *
 *   1. stronger technical checks (exhaustive Latin-square uniqueness, explicit
 *      equation satisfaction, per-note factual checks),
 *   2. feature extraction so difficulty can be judged against the reasoning
 *      actually required rather than the label the generator assigned,
 *   3. structural fingerprinting for duplicate/near-duplicate clustering.
 *
 * Delete once the Phase 2 decisions are made.
 */
import { readFileSync } from 'node:fs'

import { candidatesAt } from './lib/latin.mjs'
import { parseEquation, satisfies, solveAll } from './lib/equations.mjs'
import { panelsEqual, simulate } from './lib/figures.mjs'

const read = (s) =>
  JSON.parse(readFileSync(new URL(`../content/sections/${s}/questions.json`, import.meta.url), 'utf8'))

const FS = read('figure-sequences')
const ME = read('mathematical-equations')
const LS = read('latin-squares')

const out = { figureSequences: [], mathEquations: [], latinSquares: [] }

/* ============================================================ Latin Squares */

/** First completion of a partial Latin square, or null. Backtracking, MRV order. */
function completes(grid, letters) {
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

for (const q of LS) {
  const errors = []
  const notes = []
  const { grid, target, letters, size } = q

  if (size !== 5 || grid.length !== 5 || grid.some((r) => r.length !== 5)) errors.push('not a 5x5 grid')
  if (letters.join('') !== 'ABCDE') errors.push(`letter set is ${letters.join('')}, expected ABCDE`)
  if (q.options.map((o) => o.letter).join('') !== 'ABCDE') errors.push('options are not A-E')
  if (grid[target.row][target.col] !== null) errors.push('target cell is not empty')

  // Row/column consistency of the givens.
  for (let i = 0; i < 5; i++) {
    const row = grid[i].filter(Boolean)
    const col = grid.map((r) => r[i]).filter(Boolean)
    if (new Set(row).size !== row.length) errors.push(`row ${i + 1} repeats a letter`)
    if (new Set(col).size !== col.length) errors.push(`column ${i + 1} repeats a letter`)
  }

  // THE strong check: how many letters at the target admit a full completion?
  const viable = []
  for (const letter of letters) {
    const trial = grid.map((r) => [...r])
    if (candidatesAt(trial, target.row, target.col, letters).includes(letter)) {
      trial[target.row][target.col] = letter
      if (completes(trial, letters)) viable.push(letter)
    }
  }
  if (viable.length === 0) errors.push('target admits no valid completion')
  if (viable.length > 1) errors.push(`target is ambiguous: ${viable.join('/')} all complete`)
  if (viable.length === 1 && viable[0] !== q.correctOptionId) {
    errors.push(`only ${viable[0]} completes, but correctOptionId is ${q.correctOptionId}`)
  }

  // Distractor notes are written against the grid AFTER the forced prerequisite
  // placements, so check them against that — and require the caveat whenever the
  // cited cell is not visible in the published grid.
  // Against the fully completed square, not just the steps: a clash may sit in a
  // cell the deduction never needed to place. This mirrors verify-bank, which is
  // the authoritative gate.
  const afterSteps = completes(grid.map((r) => [...r]), letters) ?? grid.map((r) => [...r])

  let derivedNotes = 0
  for (const [letter, note] of Object.entries(q.distractorNotes)) {
    const m = /at R(\d)C(\d)/.exec(note)
    if (!m) {
      notes.push(`${letter}: note cites no cell`)
      continue
    }
    const r = Number(m[1]) - 1
    const c = Number(m[2]) - 1
    if (afterSteps[r][c] !== letter) {
      errors.push(`note for ${letter} cites R${r + 1}C${c + 1}, which holds ${afterSteps[r][c] ?? 'nothing'}`)
    }
    const isGiven = grid[r][c] !== null
    const caveated = note.includes('only becomes visible')
    if (!isGiven) {
      derivedNotes++
      if (!caveated) errors.push(`note for ${letter} cites derived cell R${r + 1}C${c + 1} without the caveat`)
    }
    if (isGiven && caveated) notes.push(`${letter}: caveated although the cited cell is a given`)
    if (r !== target.row && c !== target.col) notes.push(`${letter}: cited cell outside the target's lines`)
  }

  // Feature extraction.
  const givenCount = grid.flat().filter(Boolean).length
  const rowFilled = grid[target.row].filter(Boolean).length
  const colFilled = grid.map((r) => r[target.col]).filter(Boolean).length
  const direct = new Set([
    ...grid[target.row].filter(Boolean),
    ...grid.map((r) => r[target.col]).filter(Boolean),
  ]).size
  const prereq = q.solutionSteps.slice(0, -1)
  const prereqInLine = prereq.filter(
    (s) => s.cell.row === target.row || s.cell.col === target.col,
  ).length

  let pattern
  if (q.forcedPlacementDepth === 1) {
    const rowOnly = new Set(grid[target.row].filter(Boolean)).size === 4
    const colOnly = new Set(grid.map((r) => r[target.col]).filter(Boolean)).size === 4
    pattern = rowOnly && !colOnly ? 'direct-row' : colOnly && !rowOnly ? 'direct-column' : 'row-column-intersection'
  } else if (q.forcedPlacementDepth === 2) pattern = 'one-step-deduction'
  else if (q.forcedPlacementDepth <= 4) pattern = 'multi-step-deduction'
  else pattern = 'deep-chain'

  out.latinSquares.push({
    id: q.id,
    difficulty: q.difficulty,
    depth: q.forcedPlacementDepth,
    pattern,
    givenCount,
    rowFilled,
    colFilled,
    directlyExcluded: direct,
    prereqCount: prereq.length,
    prereqInLine,
    prereqOutOfLine: prereq.length - prereqInLine,
    derivedNotes,
    explanationLen: q.explanation.length,
    errors,
    notes,
    fingerprint: `d${q.forcedPlacementDepth}|g${givenCount}|excl${direct}|out${prereq.length - prereqInLine}`,
  })
}

/* ====================================================== Mathematical Equations */

/** Which letter each equation defines, so the dependency chain can be walked. */
function analyseSystem(q) {
  const parsed = q.equations.map(parseEquation)
  const varsIn = (node, acc = new Set()) => {
    if (node.t === 'var') acc.add(node.name)
    else if (node.t === 'op') {
      varsIn(node.left, acc)
      varsIn(node.right, acc)
    }
    return acc
  }
  const ops = (node, acc = []) => {
    if (node.t === 'op') {
      acc.push(node.o)
      ops(node.left, acc)
      ops(node.right, acc)
    }
    return acc
  }

  const defines = {}
  let combining = null
  let pinning = null
  const allOps = []

  parsed.forEach((eq, i) => {
    const lv = varsIn(eq.lhs)
    const rv = varsIn(eq.rhs)
    const all = new Set([...lv, ...rv])
    allOps.push(...ops(eq.lhs), ...ops(eq.rhs))

    if (all.size === 1 && (lv.size === 0 || rv.size === 0)) pinning = i
    else if (all.size === q.variables.length && q.variables.length > 2) combining = i
    else if (rv.size === 1 && lv.size === 1) {
      const targetName = [...rv][0]
      const sourceName = [...lv][0]
      if (targetName !== sourceName) defines[targetName] = sourceName
    }
  })

  // Depth of `asked` along the definition chain from the root.
  let depth = 0
  let cur = q.asked
  const guard = new Set()
  while (defines[cur] && !guard.has(cur)) {
    guard.add(cur)
    cur = defines[cur]
    depth++
  }

  return { parsed, defines, combining, pinning, chainDepth: depth, ops: allOps, root: cur }
}

/**
 * The note the generator wrote takes precedence: "another letter's value" is
 * checked first, because a letter's value can *also* be correct±1 and the
 * arithmetic coincidence does not make the note wrong.
 */
const ME_MODE = (value, correct, solution, asked) => {
  for (const [name, v] of Object.entries(solution)) {
    if (name !== asked && v === value) return 'other-variable'
  }
  if (value === correct + 1) return 'plus-one'
  if (value === correct - 1) return 'minus-one'
  if (value === correct * 2) return 'double'
  if (correct % 2 === 0 && value === correct / 2) return 'half'
  return 'filler'
}

/** Whether a value ALSO coincides with a near-miss relation, for redundancy stats. */
const ME_OVERLAPS = (value, correct) =>
  [
    value === correct + 1 && 'plus-one',
    value === correct - 1 && 'minus-one',
    value === correct * 2 && 'double',
    correct % 2 === 0 && value === correct / 2 && 'half',
  ].filter(Boolean)

for (const q of ME) {
  const errors = []
  const notes = []
  const a = analyseSystem(q)

  const solutions = solveAll(a.parsed, q.variables, 2)
  if (solutions.length === 0) errors.push('no solution over 1..20')
  if (solutions.length > 1) errors.push('solution is not unique')

  for (const [name, v] of Object.entries(q.solution)) {
    if (!Number.isInteger(v) || v < 1 || v > 20) errors.push(`${name} = ${v} is outside 1..20`)
  }
  if (!satisfies(a.parsed, q.solution)) errors.push('stored solution does not satisfy every equation')
  if (solutions.length === 1) {
    for (const name of q.variables) {
      if (solutions[0][name] !== q.solution[name]) errors.push(`stored ${name} disagrees with re-solve`)
    }
  }

  const correctOpt = q.options.find((o) => o.id === q.correctOptionId)
  const answer = q.solution[q.asked]
  if (!correctOpt) errors.push('correctOptionId not among options')
  else if (correctOpt.value !== answer) errors.push(`correct option ${correctOpt.value} !== ${q.asked}=${answer}`)

  const matching = q.options.filter((o) => o.value === answer)
  if (matching.length !== 1) errors.push(`${matching.length} options equal the answer`)
  const values = q.options.map((o) => o.value)
  if (new Set(values).size !== values.length) errors.push('duplicate option values')
  if (new Set(q.options.map((o) => o.id)).size !== q.options.length) errors.push('duplicate option ids')

  // Explanation must actually state the answer it claims.
  if (!q.explanation.includes(`the answer is ${answer}`)) notes.push('explanation does not state the answer')
  for (const [name, v] of Object.entries(q.solution)) {
    if (!q.explanation.includes(`${name} = ${v}`)) notes.push(`explanation never derives ${name} = ${v}`)
  }

  // Distractor notes: the number the note talks about must be the option's value.
  const modes = {}
  const overlaps = []
  for (const opt of q.options) {
    if (opt.id === q.correctOptionId) continue
    const note = q.distractorNotes[opt.id]
    if (!note) {
      errors.push(`no note for ${opt.id}`)
      continue
    }
    if (!note.startsWith(`${opt.value} `)) notes.push(`note for ${opt.id} does not open with its value`)
    const mode = ME_MODE(opt.value, answer, q.solution, q.asked)
    modes[opt.id] = mode
    overlaps.push(...ME_OVERLAPS(opt.value, answer))
    const claimsOther = note.includes('is the value of')
    if (mode === 'other-variable' && !claimsOther) notes.push(`${opt.id}: is another letter's value but the note says otherwise`)
    if (claimsOther && mode !== 'other-variable') errors.push(`${opt.id}: note claims another letter's value, but no letter has it`)
  }

  const opCounts = a.ops.reduce((m, o) => ((m[o] = (m[o] ?? 0) + 1), m), {})
  const pattern = []
  if (q.variables.length === 2) pattern.push('two-variable-chain')
  if (q.variables.length === 3) pattern.push('three-variable-system')
  if (q.variables.length === 4) pattern.push('four-variable-system')
  if (a.combining !== null) pattern.push('elimination')
  if (a.pinning !== null && a.chainDepth === 0) pattern.push('direct-substitution')
  if (a.chainDepth >= 2) pattern.push('multi-step-substitution')
  if ((opCounts['×'] ?? 0) + (opCounts['÷'] ?? 0) >= 2) pattern.push('mixed-operations')

  out.mathEquations.push({
    id: q.id,
    difficulty: q.difficulty,
    varCount: q.variables.length,
    eqCount: q.equations.length,
    asked: q.asked,
    askedIsRoot: q.asked === a.root,
    chainDepth: a.chainDepth,
    hasCombining: a.combining !== null,
    hasPinning: a.pinning !== null,
    ops: opCounts,
    pattern,
    modes,
    modeList: Object.values(modes).sort(),
    overlaps,
    maxValue: Math.max(...Object.values(q.solution)),
    equations: q.equations,
    errors,
    notes,
    fingerprint: `v${q.variables.length}|${a.combining !== null ? 'combine' : 'pin'}|chain${a.chainDepth}|${Object.entries(opCounts).sort().map(([o, n]) => o + n).join('')}`,
  })
}

/* ==================================================== Figure Sequences */

for (const q of FS) {
  const errors = []
  const notes = []

  if (q.grid.rows !== 4 || q.grid.cols !== 4) errors.push(`grid is ${q.grid.rows}x${q.grid.cols}`)

  const start = q.given[0].symbols.map((s) => ({
    ...s,
    direction: q.rules[s.id]?.movement?.direction ?? null,
  }))
  const panels = simulate(start, q.rules, 6)
  if (!panels) {
    errors.push('re-simulation failed (out of bounds or overlap)')
    out.figureSequences.push({ id: q.id, difficulty: q.difficulty, errors, notes })
    continue
  }

  for (let i = 0; i < 4; i++) {
    if (!panelsEqual(panels[i], q.given[i])) errors.push(`given panel ${i + 1} does not follow the rules`)
  }

  const n = q.given[0].symbols.length
  const allPanels = [...panels, ...q.images.flatMap((im) => im.options.map((o) => o.panel))]
  for (const p of allPanels) {
    if (p.symbols.length !== n) errors.push('a panel has a different symbol count')
    const cells = new Set()
    for (const s of p.symbols) {
      if (s.cell.row < 0 || s.cell.row > 3 || s.cell.col < 0 || s.cell.col > 3) errors.push('symbol outside the matrix')
      const k = `${s.cell.row},${s.cell.col}`
      if (cells.has(k)) errors.push('two symbols overlap in a panel')
      cells.add(k)
    }
  }

  const expected = [panels[4], panels[5]]
  q.images.forEach((image, i) => {
    if (image.options.length !== 3) errors.push(`${image.label}: ${image.options.length} options`)
    const correct = image.options.filter((o) => panelsEqual(o.panel, expected[i]))
    if (correct.length !== 1) errors.push(`${image.label}: ${correct.length} options match the rules`)
    else if (correct[0].id !== image.correctOptionId) errors.push(`${image.label}: correctOptionId points elsewhere`)
    for (let x = 0; x < 3; x++) {
      for (let y = x + 1; y < 3; y++) {
        if (panelsEqual(image.options[x].panel, image.options[y].panel)) errors.push(`${image.label}: identical options`)
      }
    }
    for (const o of image.options) {
      if (o.id === image.correctOptionId) continue
      const note = q.distractorNotes[`${image.label}:${o.id}`]
      if (!note) errors.push(`${image.label}:${o.id} has no note`)
    }
  })

  // Explanation must name the true final cells.
  for (const s of panels[4].symbols) {
    const cell = `R${s.cell.row + 1}C${s.cell.col + 1}`
    if (!q.explanation.includes(cell)) notes.push(`explanation omits panel-5 cell ${cell}`)
  }

  // Features.
  const rules = Object.values(q.rules)
  const moveTypes = rules.map((r) => r.movement.type)
  const rotating = rules.filter((r) => r.rotation.type === 'rotate').length
  const cycling = rules.filter((r) => r.colour.type === 'cycle').length
  const accelMove = rules.filter((r) => r.movement.step === 'x+1').length
  const accelRot = rules.filter((r) => r.rotation.accelerating).length
  const accelCol = rules.filter((r) => r.colour.accelerating).length

  // How often a symbol actually reversed at a wall across the six panels.
  let bounces = 0
  for (const s of q.given[0].symbols) {
    const rule = q.rules[s.id]
    if (rule.movement.type !== 'linear' && rule.movement.type !== 'diagonal') continue
    const track = panels.map((p) => p.symbols.find((x) => x.id === s.id).cell)
    for (let i = 2; i < track.length; i++) {
      const d1 = { r: track[i - 1].row - track[i - 2].row, c: track[i - 1].col - track[i - 2].col }
      const d2 = { r: track[i].row - track[i - 1].row, c: track[i].col - track[i - 1].col }
      if ((d1.r !== 0 || d1.c !== 0) && (d2.r === -d1.r && d2.c === -d1.c)) bounces++
    }
  }

  const pattern = []
  if (moveTypes.includes('linear')) pattern.push('linear-movement')
  if (moveTypes.includes('diagonal')) pattern.push('diagonal-movement')
  if (moveTypes.includes('direction-cycle')) pattern.push('direction-cycle')
  if (moveTypes.includes('border')) pattern.push('boundary-travel')
  if (bounces > 0) pattern.push('boundary-bounce')
  if (rotating) pattern.push('rotation')
  if (cycling) pattern.push('colour-cycle')
  if (accelMove + accelRot + accelCol) pattern.push('x-plus-one')
  if (n > 1) pattern.push('multiple-symbol')
  const transformsPerSymbol = rules.map(
    (r) => 1 + (r.rotation.type === 'rotate' ? 1 : 0) + (r.colour.type === 'cycle' ? 1 : 0),
  )
  if (Math.max(...transformsPerSymbol) >= 3) pattern.push('compound-rule')

  out.figureSequences.push({
    id: q.id,
    difficulty: q.difficulty,
    symbols: n,
    moveTypes,
    rotating,
    cycling,
    accelMove,
    accelRot,
    accelCol,
    bounces,
    maxTransforms: Math.max(...transformsPerSymbol),
    totalTransforms: transformsPerSymbol.reduce((x, y) => x + y, 0),
    pattern,
    errors,
    notes,
    fingerprint: `n${n}|${[...moveTypes].sort().join(',')}|rot${rotating}|col${cycling}|acc${accelMove + accelRot + accelCol}`,
  })
}

/* ================================================================== output */

const summarise = (rows, label) => {
  const fails = rows.filter((r) => r.errors.length)
  const warns = rows.filter((r) => !r.errors.length && r.notes.length)
  console.log(`\n=== ${label}: ${rows.length} items, ${fails.length} technical failures, ${warns.length} with warnings`)
  for (const r of fails) console.log(`  ✗ ${r.id}: ${r.errors.join('; ')}`)
  for (const r of warns) console.log(`  ! ${r.id}: ${r.notes.join('; ')}`)
}

summarise(out.figureSequences, 'Figure Sequences')
summarise(out.mathEquations, 'Mathematical Equations')
summarise(out.latinSquares, 'Latin Squares')

console.log('\n@@JSON@@')
console.log(JSON.stringify(out))
