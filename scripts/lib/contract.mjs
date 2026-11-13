/**
 * The official-fidelity mechanics contract, in machine-readable form.
 *
 * Spec §16 and the Phase 3 audit both call for this: a generator must be
 * structurally incapable of producing a FORBIDDEN mechanic, not merely
 * discouraged from it by review. Everything here traces to the g.a.s.t. GAM
 * preparation PDF (04.08.2026 build); nothing was added because it is common in
 * other aptitude tests.
 *
 * Three classifications, and an inference is never promoted by being useful:
 *
 *   ALLOWED   stated in the rules, or demonstrated in a worked exercise
 *   REVIEW    composed from documented mechanics, or covered by a stated rule
 *             that no exercise demonstrates. Legitimate, but must be labelled
 *             `reasonable_extrapolation` and signed off per batch.
 *   FORBIDDEN unsupported, or inconsistent with the official material.
 */

/* ------------------------------------------------------------ Figure Sequences */

export const FS_CONTRACT = {
  allowed: {
    /**
     * `direction-cycle` was here and should not have been. `allowed` means
     * stated in the rules or demonstrated in a worked exercise, and a symbol
     * that changes its direction of travel every step is neither: the official
     * rule list names colour change, rotation about the symbol's own axis,
     * vertical/horizontal/diagonal movement, x+1 acceleration, and bouncing off
     * or travelling along a boundary. Nothing else. It also sat badly beside
     * this contract's own `forbidden` entry for a mid-sequence switch from one
     * movement type to another. See docs/DIRECTION_CYCLE.md.
     */
    movementTypes: ['linear', 'diagonal', 'border'],
    /** Every official linear/diagonal example moves "one field at a time". */
    linearSteps: [1, 'x+1'],
    diagonalSteps: [1, 'x+1'],
    /** Ex 6 (one space), Ex 3 (two squares), Ex 5 (x+1). */
    borderSteps: [1, 2, 'x+1'],
    rotationDegrees: [90],
    rotationAccelerating: true, // Ex 6
    colourCycleLengths: [2, 3], // Ex 3/Ex 6 (2), Ex 5/Ex 6 (3)
    /**
     * Ex 4 (medium) shows 3 symbols; Ex 5 and Ex 6 (high) show 4. Verified
     * visually from the diagrams on pp. 10-12 during the Phase 3 audit — the
     * previous cap of 3 was a transcription error in the spec.
     */
    maxSymbols: 4,
    minSymbols: 1,
  },
  review: {
    /** p. 8 names colour in the x+1 rule, but no exercise demonstrates it. */
    colourAccelerating: true,
    /** Ex 3 / Ex 6 each carry a rotation clause with no movement clause. */
    staticRotatingSymbol: true,
    rotationDegrees: [180, 270],
    /** Ex 5 cycles white→pink→yellow; we exclude it only for legibility. */
    whiteInCycle: true,
  },
  forbidden: [
    'wrap-around or teleportation',
    'billiard reflection as the correct boundary behaviour',
    'linear or diagonal movement above one field per step, other than x+1',
    'figures disappearing, overlapping, or leaving the matrix',
    'more than 4 symbols',
    'a mid-sequence switch from one movement type to another',
    'shown matrices admitting more than one legal continuation',
    'a colour cycle whose colours are not all visible in the shown matrices',
    'a symbol that cycles through directions of travel (`direction-cycle`)',
  ],
}

/**
 * Structural gate for one symbol's rule. Returns [] when every mechanic is
 * ALLOWED. REVIEW mechanics are rejected here too: the generator does not emit
 * them, so reaching this with one means something regressed.
 *
 * Note on `colourAccelerating`: it is REVIEW rather than ALLOWED, and the
 * generator no longer produces it at all. At the only attested cycle lengths it
 * is unusable — the colour index runs p(p+1)/2, which is 0,1,0,0,1,0 (mod 3), so
 * a three-colour accelerating cycle never renders its third colour in any of the
 * six panels while the explanation still names it. Two colours degenerate to a
 * plain alternation. See the Phase 3 implementation notes.
 */
export function figureRuleContractErrors(rule) {
  const errors = []
  const { allowed } = FS_CONTRACT
  const move = rule.movement

  if (!allowed.movementTypes.includes(move.type)) {
    errors.push(`movement type "${move.type}" is not an allowed mechanic`)
  }
  if (move.type === 'linear' && !allowed.linearSteps.includes(move.step)) {
    errors.push(`linear movement at step ${move.step}; only 1 and x+1 are attested`)
  }
  if (move.type === 'diagonal' && !allowed.diagonalSteps.includes(move.step)) {
    errors.push(`diagonal movement at step ${move.step}; only 1 and x+1 are attested`)
  }
  if (move.type === 'border' && !allowed.borderSteps.includes(move.step)) {
    errors.push(`border travel at step ${move.step}; only 1, 2 and x+1 are attested`)
  }

  if (rule.rotation.type === 'rotate') {
    if (!allowed.rotationDegrees.includes(rule.rotation.degrees)) {
      errors.push(`rotation of ${rule.rotation.degrees}°; only 90° is demonstrated`)
    }
  }

  if (rule.colour.type === 'cycle') {
    if (!allowed.colourCycleLengths.includes(rule.colour.colours.length)) {
      errors.push(`colour cycle of ${rule.colour.colours.length}; only 2 and 3 are attested`)
    }
    if (rule.colour.accelerating) {
      errors.push(
        'accelerating colour cycle: REVIEW-class, and unusable at attested lengths — a 3-colour cycle never renders its third colour',
      )
    }
  }

  return errors
}

/* -------------------------------------------------------- Mathematical Equations */

export const ME_CONTRACT = {
  allowed: {
    operators: ['+', '−', '×', '÷'],
    minValue: 1,
    maxValue: 20,
    variableCounts: [2, 3, 4],
    /** Every documented system shape, verified against Ex 1-6 and Examples 1-2. */
    equationShapes: [
      'pin-constant', // B = 6                (Example 1)
      'pin-operated', // 7 + A = 14           (Ex 1)
      'define-linear', // B − 3 = A            (Ex 1)
      'define-multiplicative', // 3 × A = C    (Ex 4)
      'define-compound', // 3 × C − 1 = B      (Ex 6)
      'pair-constant', // A + C = 8            (Ex 3)
      'multi-term', // 2 × A + 2 × C = B       (Ex 3)
      'combining', // A − B + C − D = 2        (Ex 5, 6)
    ],
    topologies: ['chain', 'star', 'mixed'],
  },
  review: {
    /** No official constant exceeds 18. */
    constantsAbove: 18,
    /**
     * The prep material presents these exercises with no options at all; the
     * four-option single-choice format comes from d-mat.de. Example 1 does ask
     * for a single letter, so the *asking* is documented; the option count is not.
     */
    fourOptionFormat: true,
  },
  forbidden: [
    'operators beyond + − × ÷',
    'quadratic or higher-power terms',
    'non-integer, zero or negative letter values',
    'letter values outside 1..20',
    'systems without exactly one solution',
  ],
}

/** Structural gate over a rendered system. */
export function equationContractErrors({ equations, solution, variables }) {
  const errors = []
  const text = equations.join(' ')

  for (const ch of text) {
    if (/[A-Z0-9\s=()]/.test(ch)) continue
    if (!ME_CONTRACT.allowed.operators.includes(ch)) {
      errors.push(`character "${ch}" is not an allowed operator`)
    }
  }
  if (/\^|\*\*|√|%/.test(text)) errors.push('system contains an unsupported algebraic construct')
  // A letter multiplied by a letter is a quadratic term.
  if (/[A-Z]\s*[×÷]\s*[A-Z]/.test(text)) errors.push('system multiplies or divides two letters — quadratic')

  if (!ME_CONTRACT.allowed.variableCounts.includes(variables.length)) {
    errors.push(`${variables.length} variables; the official exercises use 2 to 4`)
  }
  for (const [name, value] of Object.entries(solution ?? {})) {
    if (!Number.isInteger(value) || value < ME_CONTRACT.allowed.minValue || value > ME_CONTRACT.allowed.maxValue) {
      errors.push(`${name} = ${value} is outside the documented 1..20 range`)
    }
  }
  return errors
}

/* ------------------------------------------------------------- Latin Squares */

export const LS_CONTRACT = {
  allowed: {
    size: 5,
    letters: ['A', 'B', 'C', 'D', 'E'],
    techniques: ['naked-single', 'pair-elimination'],
    maxDepth: 7,
  },
  review: {
    deepChain: 'deduction depth 6-7',
    sparseGrid: 'clue density below 0.20',
  },
  forbidden: [
    'hidden singles (a letter with one possible cell in a line missing 3+ letters)',
    'any path requiring a guess or trial-and-error',
    'grids where more than one letter completes the target',
    'invalid row or column structure',
  ],
}

export function latinContractErrors(q) {
  const errors = []
  if (q.size !== LS_CONTRACT.allowed.size) errors.push(`grid is ${q.size}×${q.size}`)
  if (q.letters.join('') !== LS_CONTRACT.allowed.letters.join('')) {
    errors.push(`letter set is ${q.letters.join('')}`)
  }
  for (const step of q.solutionSteps ?? []) {
    if (step.technique && !LS_CONTRACT.allowed.techniques.includes(step.technique)) {
      errors.push(`step uses technique "${step.technique}", which is not documented`)
    }
  }
  if ((q.forcedPlacementDepth ?? 0) > LS_CONTRACT.allowed.maxDepth) {
    errors.push(`deduction depth ${q.forcedPlacementDepth} exceeds the ${LS_CONTRACT.allowed.maxDepth} ceiling`)
  }
  return errors
}
