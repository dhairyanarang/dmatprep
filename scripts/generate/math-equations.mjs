/**
 * Mathematical Equations generator.
 *
 * Difficulty is reasoning depth, not variable count: a four-letter system whose
 * asked letter falls out of the first equation is easier than a three-letter one
 * whose asked letter sits two substitutions down. Depth is *measured* by
 * replaying the propagation a solver would perform, then checked against the
 * label. See DMAT_QUESTION_AUTHORING_SPEC.md §3.
 *
 * Uniqueness over 1..20 is proven exhaustively — construction is never trusted.
 */
import {
  MAX_VALUE,
  MIN_VALUE,
  hasUniqueSolution,
  num,
  op,
  render,
  renderEquation,
  satisfies,
  solveAll,
  variable,
} from '../lib/equations.mjs'
import { generateBatch } from '../lib/batch.mjs'
import { pick, randInt, shuffle } from '../lib/rng.mjs'

export const GENERATOR_NAME = 'math-equations'
/**
 * 3.0.0 — Phase 3 fixes: the four missing official equation shapes (bare pin,
 * two-unknown constant, multi-term, compound coefficient+offset), star and mixed
 * topologies, subset combining equations, difficulty decoupled from letter
 * count, order-independent dedup, operator-gated distractor notes.
 *
 * 3.1.0 — Phase 5 pilot fixes: `misapplied-constant` distractors are derived from
 * an actual misapplication of the determining equation (and only when the asked
 * letter is the one that equation fixes), notes quote the equation by its
 * rendered text rather than by display position, and a system may not repeat a
 * left-hand side.
 *
 * 3.2.0 — a generation plan may set a per-slot structure target (bare pin,
 * multi-term, subset-spanning combining), so the rarer documented shapes are
 * exercised deliberately. Targets steer construction only; every gate is
 * unchanged.
 *
 * 3.3.0 — second-pilot fixes: a bare pin gets its own level-2 hint (there is no
 * operation to undo), a bare-pinned letter is never the asked letter (the answer
 * would otherwise be printed on the page — official Example 1 gives `B = 6` so
 * that A can be solved for), and a slot may target the exact two-coefficient
 * multi-term form.
 *
 * 4.0.0 — quadratic-type shapes, on the repository owner's first-hand account of
 * the 26 September 2026 sitting. Two new determining forms: `square-pin`
 * (`A × A = 169`) at medium and high, and `product-pair` (`A × B = 72` with
 * `A − B = 1`) at high. Both are REVIEW-class — no official exercise multiplies
 * two unknowns — so `classifyMechanics` grades any item using them
 * `extrapolated`, and they can never roll up to `officially_documented`.
 * Major version because `ME_CONTRACT` moved a rule out of `forbidden`.
 *
 * 4.1.0 — two fixes from the 22 November 2026 review. A product pair is now
 * refused unless its product has at least TWO factor pairs inside 1..20, since
 * with only one the difference equation picks nothing and the item is far
 * easier than its tier claims; the explanation also names the exact pair count
 * instead of saying "several". And a deliberate `lcm-pin` family: two divisions
 * of one letter by different constants, which settle it only together, so the
 * way in is the lowest common multiple. That family is built from documented
 * mechanics alone (official Ex 2's `B ÷ 2 = A`, twice) and needs no REVIEW grade.
 */
export const GENERATOR_VERSION = '4.1.0'

const NAMES = ['A', 'B', 'C', 'D']
const inRange = (v) => Number.isInteger(v) && v >= MIN_VALUE && v <= MAX_VALUE

/* ------------------------------------------------------------- depth model */

function varsOf(node, acc = new Set()) {
  if (node.t === 'var') acc.add(node.name)
  else if (node.t === 'op') {
    varsOf(node.left, acc)
    varsOf(node.right, acc)
  }
  return acc
}

const eqVars = (eq) => new Set([...varsOf(eq.lhs), ...varsOf(eq.rhs)])

/**
 * The order a solver would determine the letters in, and how.
 *
 * `direct` — some equation had exactly one unknown left.
 * `substitute` — nothing had a single unknown, so the definitions had to be
 * pushed into a combining equation to collapse it. That counts as one step,
 * because it is one algebraic move, but it is the expensive one.
 */
export function solveOrder(equations, variables) {
  const solutions = solveAll(equations, variables, 2)
  if (solutions.length !== 1) return null
  const full = solutions[0]

  const known = {}
  const order = []
  let guard = 0

  while (order.length < variables.length && guard++ < 40) {
    let progressed = false

    for (const eq of equations) {
      const unknown = [...eqVars(eq)].filter((v) => !(v in known))
      if (unknown.length !== 1) continue
      const name = unknown[0]
      known[name] = full[name]
      order.push({ name, kind: 'direct', equation: eq })
      progressed = true
    }
    if (progressed) continue

    const remaining = variables.filter((v) => !(v in known))
    if (remaining.length === 0) break

    // Stalled: find the letter whose value unblocks propagation. That is the
    // one the combining equation collapses to.
    let best = null
    for (const name of remaining) {
      const trial = { ...known, [name]: full[name] }
      const unblocked = equations.filter(
        (eq) => [...eqVars(eq)].filter((v) => !(v in trial)).length === 1,
      ).length
      if (unblocked > 0 && (!best || unblocked > best.unblocked)) best = { name, unblocked }
    }

    const combining =
      equations.find((eq) => eqVars(eq).size === variables.length) ??
      equations.find((eq) => eqVars(eq).size >= 2)
    // Collapsing a combining equation is not one move. Official Ex 5 pushes three
    // definitions into `A − B + C − D = 2` and simplifies
    // `5B − B + 10B − (11 + B) = 2` before B falls out — and both exercises that
    // work this way are graded high. Costing it as a single step made a
    // three-equation collapse score depth 1 and land in the low tier.
    const substituted = equations.length - 1
    if (!best) {
      for (const name of remaining) {
        known[name] = full[name]
        order.push({ name, kind: 'substitute', equation: combining, cost: 1 + substituted })
      }
      break
    }
    known[best.name] = full[best.name]
    order.push({ name: best.name, kind: 'substitute', equation: combining, cost: 1 + substituted })
  }

  return order.length === variables.length ? order : null
}

/**
 * Reasoning depth: the cost of every step up to and including the asked letter.
 * A direct read costs 1; a combining-equation collapse costs one move per
 * definition pushed into it, plus the rearrangement.
 */
function depthOf(order, asked) {
  const i = order.findIndex((s) => s.name === asked)
  if (i === -1) return null
  let depth = 0
  for (let k = 0; k <= i; k++) depth += order[k].cost ?? 1
  return depth
}

/* ------------------------------------------------------- equation builders */

/**
 * Define `target` from `source`.
 *
 * Covers every one-source definition shape the official exercises use:
 * `B − 3 = A` (Ex 1), `3 × A = C` (Ex 4), `B ÷ 2 = A` (Ex 2), `11 + B = D`
 * (Ex 5), `13 − C = A` (Ex 6) and the compound `3 × C − 1 = B` (Ex 6).
 */
function defineFrom(rng, targetName, targetValue, sourceName, sourceValue, opts = {}) {
  const { preferMultiplicative = false, allowCompound = true } = opts
  const multiplicative = []
  const additive = []
  const compound = []

  if (sourceValue !== 0 && targetValue % sourceValue === 0) {
    const k = targetValue / sourceValue
    if (k >= 2 && k <= 10) {
      multiplicative.push({
        eq: { lhs: op('×', num(k), variable(sourceName)), rhs: variable(targetName) },
        step: `${k} × ${sourceName} = ${targetName}, so ${targetName} = ${k} × ${sourceValue} = ${targetValue}.`,
        opKind: '×',
        shape: 'define-multiplicative',
      })
    }
  }

  if (targetValue !== 0 && sourceValue % targetValue === 0) {
    const k = sourceValue / targetValue
    if (k >= 2 && k <= 10) {
      multiplicative.push({
        eq: { lhs: op('÷', variable(sourceName), num(k)), rhs: variable(targetName) },
        step: `${sourceName} ÷ ${k} = ${targetName}, so ${targetName} = ${sourceValue} ÷ ${k} = ${targetValue}.`,
        opKind: '÷',
        shape: 'define-multiplicative',
      })
    }
  }

  const diff = targetValue - sourceValue
  if (diff > 0 && diff <= 15) {
    additive.push({
      eq: { lhs: op('+', num(diff), variable(sourceName)), rhs: variable(targetName) },
      step: `${diff} + ${sourceName} = ${targetName}, so ${targetName} = ${diff} + ${sourceValue} = ${targetValue}.`,
      opKind: '+',
      shape: 'define-linear',
    })
  }
  if (diff < 0 && -diff <= 15) {
    additive.push({
      eq: { lhs: op('−', variable(sourceName), num(-diff)), rhs: variable(targetName) },
      step: `${sourceName} − ${-diff} = ${targetName}, so ${targetName} = ${sourceValue} − ${-diff} = ${targetValue}.`,
      opKind: '−',
      shape: 'define-linear',
    })
  }
  const sum = targetValue + sourceValue
  // No official constant exceeds 18 (ME_CONTRACT.review.constantsAbove).
  if (sum <= 18) {
    additive.push({
      eq: { lhs: op('−', num(sum), variable(sourceName)), rhs: variable(targetName) },
      step: `${sum} − ${sourceName} = ${targetName}, so ${targetName} = ${sum} − ${sourceValue} = ${targetValue}.`,
      opKind: '−',
      shape: 'define-linear',
    })
  }

  // Compound coefficient-plus-offset — official Ex 6, `3 × C − 1 = B`.
  if (allowCompound) {
    for (const k of [2, 3, 4, 5]) {
      const product = k * sourceValue
      if (product > 40) continue
      const offset = targetValue - product
      if (offset === 0 || Math.abs(offset) > 9) continue
      const sign = offset > 0 ? '+' : '−'
      compound.push({
        eq: {
          lhs: op(sign, op('×', num(k), variable(sourceName)), num(Math.abs(offset))),
          rhs: variable(targetName),
        },
        step: `${k} × ${sourceName} ${sign} ${Math.abs(offset)} = ${targetName}, so ${targetName} = ${k} × ${sourceValue} ${sign} ${Math.abs(offset)} = ${targetValue}.`,
        opKind: '×',
        shape: 'define-compound',
      })
    }
  }

  const pool = preferMultiplicative && multiplicative.length
    ? [...multiplicative, ...compound]
    : [...multiplicative, ...additive, ...compound]
  return pool.length ? pick(rng, pool) : null
}

/**
 * Pin a letter outright.
 *
 * `bare` is the official Example 1 form (`B = 6`) — the simplest documented
 * equation shape, and one the old generator could not produce at all.
 */
function pinRoot(rng, name, value, preferMultiplicative, allowBare = true) {
  const multiplicative = []
  const additive = []
  const bare = []

  if (allowBare) {
    bare.push({
      eq: { lhs: variable(name), rhs: num(value) },
      step: `${name} = ${value} is given directly.`,
      opKind: 'none',
      shape: 'pin-constant',
      constant: null,
    })
  }

  // `wrongInverse` is the value a candidate actually reaches by undoing the
  // operation the wrong way round. It is computed from the equation, never
  // assumed: the Phase 5 pilot found the old family offering `correct ± constant`
  // while claiming a mechanism that could not produce it (`A ÷ 4 = 3` giving
  // "distractors" 8 and 16, when misapplying that equation yields 3÷4, 3×4, 3+4
  // or 3−4 — never 8 or 16).
  const m = randInt(rng, 2, 5)
  if (value * m <= 40) {
    const rhs = m * value
    multiplicative.push({
      eq: { lhs: op('×', num(m), variable(name)), rhs: num(rhs) },
      step: `${m} × ${name} = ${rhs}. Dividing both sides by ${m} gives ${name} = ${value}.`,
      opKind: '×',
      shape: 'pin-operated',
      constant: m,
      wrongInverse: { value: rhs * m, how: `multiplying by ${m} instead of dividing by it` },
    })
  }
  for (const k of [2, 3, 4, 5]) {
    if (value % k === 0 && value / k >= 1) {
      const rhs = value / k
      multiplicative.push({
        eq: { lhs: op('÷', variable(name), num(k)), rhs: num(rhs) },
        step: `${name} ÷ ${k} = ${rhs}. Multiplying both sides by ${k} gives ${name} = ${value}.`,
        opKind: '÷',
        shape: 'pin-operated',
        constant: k,
        wrongInverse:
          rhs % k === 0 ? { value: rhs / k, how: `dividing by ${k} again instead of multiplying by it` } : null,
      })
    }
  }

  const k = randInt(rng, 2, 12)
  if (k + value <= 18) {
    const rhs = k + value
    additive.push({
      eq: { lhs: op('+', num(k), variable(name)), rhs: num(rhs) },
      step: `${k} + ${name} = ${rhs}. Subtracting ${k} from both sides gives ${name} = ${value}.`,
      opKind: '+',
      shape: 'pin-operated',
      constant: k,
      wrongInverse: { value: rhs + k, how: `adding ${k} instead of subtracting it` },
    })
  }
  if (value > 1) {
    const j = randInt(rng, 1, Math.min(9, value - 1))
    const rhs = value - j
    additive.push({
      eq: { lhs: op('−', variable(name), num(j)), rhs: num(rhs) },
      step: `${name} − ${j} = ${rhs}. Adding ${j} to both sides gives ${name} = ${value}.`,
      opKind: '−',
      shape: 'pin-operated',
      constant: j,
      wrongInverse: { value: rhs - j, how: `subtracting ${j} again instead of adding it` },
    })
  }

  const pool = preferMultiplicative && multiplicative.length
    ? multiplicative
    : [...multiplicative, ...additive, ...bare]
  return pool.length ? pick(rng, pool) : null
}

/**
 * Two unknowns summing to a constant — official Ex 3, `A + C = 8`.
 *
 * Neither letter falls out on its own: the candidate has to substitute one
 * definition into it. This is the shape that makes a two-variable system able to
 * carry real reasoning depth, which is what decouples depth from letter count.
 */
function pairConstant(rng, aName, aValue, bName, bValue) {
  const total = aValue + bValue
  if (total > 18) return null
  const [x, y] = rng() < 0.5 ? [aName, bName] : [bName, aName]
  return {
    eq: { lhs: op('+', variable(x), variable(y)), rhs: num(total) },
    step: `${x} + ${y} = ${total} ties the two letters together.`,
    opKind: '+',
    shape: 'pair-constant',
    constant: total,
    // Adding the partner's value instead of subtracting it.
    wrongInverse: { value: total + bValue, how: `adding ${bName} instead of subtracting it`, partner: bName },
  }
}

/**
 * Two multiplicative terms — official Ex 3, `2 × A + 2 × C = B`.
 *
 * Defines `targetName` from two already-known letters.
 */
function multiTerm(rng, targetName, targetValue, xName, xValue, yName, yValue, opts = {}) {
  // `bothCoefficients` restricts to the exact demonstrated form,
  // `2 × A + 2 × C = B` (official Ex 3). Without it the builder also produces the
  // one-bare-term variant `2 × D + A = C`, which stays valid: a sum of
  // multiplicative terms defining a letter is the documented mechanic, and the
  // coefficients are parameters within it.
  const { bothCoefficients = false } = opts
  const range = bothCoefficients ? [2, 3, 4] : [1, 2, 3]
  for (const a of shuffle(rng, range)) {
    for (const b of shuffle(rng, range)) {
      if (a * xValue + b * yValue !== targetValue) continue
      if (a === 1 && b === 1) continue // that is just `X + Y = Z`, covered elsewhere
      const left = a === 1 ? variable(xName) : op('×', num(a), variable(xName))
      const right = b === 1 ? variable(yName) : op('×', num(b), variable(yName))
      return {
        eq: { lhs: op('+', left, right), rhs: variable(targetName) },
        step: `${a === 1 ? '' : `${a} × `}${xName} + ${b === 1 ? '' : `${b} × `}${yName} = ${targetName}, so ${targetName} = ${a * xValue} + ${b * yValue} = ${targetValue}.`,
        opKind: '×',
        shape: 'multi-term',
      }
    }
  }
  return null
}

/**
 * Alternating-sign combining equation — the official Ex 5/6 shape.
 *
 * `subset` allows it to span only some of the letters: Ex 6's `C + D − A = 1`
 * leaves B out entirely, and the old generator always spanned every letter.
 */
function combineOver(rng, names, values) {
  const order = shuffle(rng, names)
  const signs = order.map((_, i) => (i === 0 ? '+' : pick(rng, ['+', '−'])))

  let node = variable(order[0])
  let total = values[order[0]]
  for (let i = 1; i < order.length; i++) {
    node = op(signs[i], node, variable(order[i]))
    total += signs[i] === '+' ? values[order[i]] : -values[order[i]]
  }
  // Every official combining equation has a small positive right-hand side.
  if (total < 1 || total > 18) return null

  return {
    eq: { lhs: node, rhs: num(total) },
    total,
    shape: 'combining',
    spans: order.length,
  }
}

/* ------------------------------------------- quadratic-type builders (REVIEW) */

/**
 * Squares small enough to be recognised rather than computed.
 *
 * Capped at 14 deliberately. The subtest allows no notes and no calculator, so
 * a square the candidate cannot recognise on sight is a lookup they cannot
 * perform — that is lengthening the arithmetic, not deepening the reasoning,
 * and the brief ruled it out explicitly.
 *
 * It starts at 4 for the opposite reason: `A × A = 4` and `A × A = 9` are read
 * at a glance and add no step at all, and their right-hand sides are small
 * enough to be mistaken for the ordinary constants the other shapes use.
 */
const SQUARE_ROOTS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

/**
 * Pin a letter by its own square: `A × A = 169`.
 *
 * REVIEW-class — see `ME_CONTRACT.review.letterProduct`. No official exercise
 * squares a letter; this exists because the repository owner met squared values
 * in the live September 2026 sitting.
 *
 * It is one solving step but not a trivial one: the candidate must recognise
 * the square and take its root. Only the positive root is in range, so the
 * 1..20 rule keeps the system single-valued without any extra constraint —
 * which is exactly why this form is safe to generate.
 */
function squarePin(name, value) {
  if (!SQUARE_ROOTS.includes(value)) return null
  const square = value * value
  return {
    eq: { lhs: op('×', variable(name), variable(name)), rhs: num(square) },
    step: `${name} × ${name} = ${square}. Only ${value} squares to ${square} within 1–20, so ${name} = ${value}.`,
    opKind: 'square',
    shape: 'square-pin',
    constant: square,
  }
}

/**
 * Fix two letters together by their product and their difference:
 * `A × B = 72` with `A − B = 1`, giving A = 9 and B = 8.
 *
 * REVIEW-class, and the genuinely quadratic shape of the two: neither equation
 * determines a letter on its own, so the candidate has to enumerate the divisor
 * pairs of the product and test them against the difference. That is the
 * reasoning the brief asks for, and it is why no item built this way can be
 * answered by reading one equation.
 *
 * **The second constraint is a difference, never a sum, and that is load-bearing.**
 * `A × B = 72` with `A + B = 17` is satisfied by (8,9) *and* (9,8) — the letters
 * are distinguishable, so a symmetric pair of constraints always admits two
 * solutions and breaks the official one-solution rule. A difference is
 * antisymmetric and fixes which letter is which.
 */
/** Every factor pair of `product` with both factors inside the 1..20 rule. */
function inRangeFactorPairs(product) {
  const pairs = []
  for (let a = MIN_VALUE; a <= MAX_VALUE; a++) {
    if (product % a !== 0) continue
    const b = product / a
    if (b > a && b <= MAX_VALUE) pairs.push([b, a])
  }
  return pairs
}

function productPair(hiName, hiValue, loName, loValue) {
  if (!inRange(hiValue) || !inRange(loValue)) return null
  if (hiValue <= loValue) return null
  const product = hiValue * loValue
  const difference = hiValue - loValue
  // Official combining equations all carry a small positive right-hand side;
  // the product is unavoidably larger, but the difference stays in that shape.
  if (product > 200 || difference > 18) return null

  /**
   * THE DIFFERENCE EQUATION MUST DO WORK.
   *
   * Review of the first batch found two items where it did none: 143 and 55
   * each have exactly one factor pair inside 1..20 (11×13 and 5×11), so the
   * product alone already fixed both letters and the difference merely agreed
   * with it. Those items were still correct and uniquely solvable — they were
   * simply far easier than their tier claimed, and their explanation said the
   * difference picked a pair "out of the several", which was not true of them.
   *
   * Requiring two or more in-range pairs makes the divisor search real: the
   * candidate must enumerate the pairs and test them, which is the whole reason
   * this shape exists.
   */
  const pairs = inRangeFactorPairs(product)
  if (pairs.length < 2) return null

  // Name the count rather than saying "several", so the explanation is exactly
  // true of this item instead of being true of the family on average.
  const pairWord = `${pairs.length} factor pairs of ${product} that fit 1–20`

  return {
    product: {
      eq: { lhs: op('×', variable(hiName), variable(loName)), rhs: num(product) },
      step: `${hiName} × ${loName} = ${product} and ${hiName} − ${loName} = ${difference}. Of the ${pairWord}, only ${hiValue} × ${loValue} differs by ${difference}, so ${hiName} = ${hiValue} and ${loName} = ${loValue}.`,
      opKind: 'product',
      shape: 'product-pair',
      constant: product,
    },
    difference: {
      eq: { lhs: op('−', variable(hiName), variable(loName)), rhs: num(difference) },
      step: `${hiName} − ${loName} = ${difference} is what picks that pair out of the ${pairWord}; the product alone does not settle either letter.`,
      opKind: '−',
      shape: 'product-pair-difference',
      constant: difference,
    },
  }
}

/* ------------------------------------------------- lowest common multiple */

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b))
const lcm = (a, b) => (a / gcd(a, b)) * b

/**
 * Divisor pairs whose lowest common multiple is the ONLY common multiple in 1..20.
 *
 * This is what makes an LCM item single-valued without any extra constraint:
 * if `D ÷ 3` and `D ÷ 4` are both whole, D is a multiple of 12, and the next
 * one — 24 — is outside the documented range. So the pair of divisions pins D
 * on its own, and the candidate gets there by finding the lowest common
 * multiple rather than by substitution.
 *
 * Built rather than listed, so the range rule is enforced by the same constant
 * everywhere. The quotients are required distinct from each other and from the
 * root: a system where two letters share a value is harder to write honest
 * `wrong-variable` distractors for.
 *
 * **Entirely within the documented mechanics.** A letter divided by a constant
 * is official Exercise 2 (`B ÷ 2 = A`); two of them against one root is two
 * documented definitions, not a new shape. Unlike the quadratic families this
 * needs no REVIEW grade — `classifyMechanics` leaves it `documented`.
 */
const LCM_PAIRS = (() => {
  const out = []
  // NEITHER divisor may exceed 10. A divisor above half the range has exactly
  // one multiple inside 1..20, so `D ÷ 12 = X` pins D on its own and the second
  // division contributes nothing — the item would look like an LCM question and
  // be solvable without ever taking a common multiple. Caught while checking
  // the generated table rather than by assuming the construction was sound.
  const SOLE_PIN = Math.floor(MAX_VALUE / 2)
  for (let d1 = 2; d1 <= SOLE_PIN; d1++) {
    for (let d2 = d1 + 1; d2 <= SOLE_PIN; d2++) {
      const L = lcm(d1, d2)
      if (L > MAX_VALUE) continue // no common multiple in range at all
      if (L * 2 <= MAX_VALUE) continue // a second one fits, so the root is not pinned
      const q1 = L / d1
      const q2 = L / d2
      if (q1 === q2 || q1 === L || q2 === L) continue
      if (!inRange(q1) || !inRange(q2)) continue
      out.push({ d1, d2, lcm: L, q1, q2 })
    }
  }
  return out
})()

/* ------------------------------------------------------------ system build */

const TOPOLOGIES = ['chain', 'star', 'mixed']

/**
 * Build a system of `varCount` letters.
 *
 * `topology` decides how definitions hang together — a chain (each letter from
 * its predecessor), a star (every letter from the root, which is official Ex 5:
 * `10 × B = C`, `5 × B = A`, `11 + B = D`), or a mix. The old generator only
 * ever built chains, so none of Ex 3, Ex 5 or Ex 6's shapes were reachable.
 */
function buildSystem(rng, { varCount, topology, determining: determiningKind, preferMultiplicative, useMultiTerm, forceBare = false, forceSubsetCombine = false, multiTermBothCoefficients = false }) {
  // Which letter plays which role is drawn, not fixed. With `names` hard-coded to
  // A, B, C, D the root was always A, so every depth-1 item asked for A — the
  // audit measured the asked letter at A=16, B=15, D=9, C=5 across the bank.
  const names = shuffle(rng, NAMES).slice(0, varCount)
  // A square pin can only fix a value whose square is recognisable, so the root
  // is drawn from that set rather than from the general range.
  const rootValue =
    determiningKind === 'square' ? pick(rng, SQUARE_ROOTS) : randInt(rng, 2, 14)
  const values = { [names[0]]: rootValue }
  const definitions = []

  // `multi-term` consumes two known letters to define a third, so it can only be
  // the last definition and needs at least three letters.
  const multiTermAt = useMultiTerm && varCount >= 3 ? varCount - 1 : -1

  // A product pair fixes names[0] and names[1] TOGETHER, so names[1] is not
  // defined from the root the way every other shape defines its letters — the
  // ordinary definition loop therefore starts one letter later.
  let firstDefined = 1
  let lcmChoice = null
  if (determiningKind === 'lcm') {
    if (varCount < 3 || LCM_PAIRS.length === 0) return null
    lcmChoice = pick(rng, LCM_PAIRS)
    values[names[0]] = lcmChoice.lcm
    values[names[1]] = lcmChoice.q1
    values[names[2]] = lcmChoice.q2
    // The second division joins the ordinary definition list; the first plays
    // the determining role. Neither settles the root alone — it is the pair
    // that does, which is the whole point of the family.
    definitions.push({
      eq: { lhs: op('÷', variable(names[0]), num(lcmChoice.d2)), rhs: variable(names[2]) },
      step: `${names[0]} ÷ ${lcmChoice.d2} = ${names[2]}, so ${names[2]} = ${lcmChoice.lcm} ÷ ${lcmChoice.d2} = ${lcmChoice.q2}.`,
      opKind: '÷',
      shape: 'lcm-division',
      constant: lcmChoice.d2,
    })
    firstDefined = 3
  }
  if (determiningKind === 'product') {
    if (varCount < 2) return null
    const hiValue = randInt(rng, 4, 16)
    const loPool = []
    for (let lo = 2; lo < hiValue; lo++) {
      if (hiValue * lo <= 200 && hiValue - lo <= 18) loPool.push(lo)
    }
    if (loPool.length === 0) return null
    const loValue = pick(rng, loPool)
    const pair = productPair(names[0], hiValue, names[1], loValue)
    if (!pair) return null
    values[names[0]] = hiValue
    values[names[1]] = loValue
    definitions.push(pair.difference)
    firstDefined = 2
  }

  for (let i = firstDefined; i < names.length; i++) {
    const defined = names.slice(0, i)
    const sourceName =
      topology === 'chain'
        ? names[i - 1]
        : topology === 'star'
          ? names[0]
          : pick(rng, defined)
    const sourceValue = values[sourceName]

    if (i === multiTermAt) {
      const [xName, yName] = shuffle(rng, defined).slice(0, 2)
      let made = null
      for (const value of shuffle(rng, Array.from({ length: MAX_VALUE }, (_, n) => n + 1))) {
        if (Object.values(values).includes(value)) continue
        const form = multiTerm(rng, names[i], value, xName, values[xName], yName, values[yName], {
          bothCoefficients: multiTermBothCoefficients,
        })
        if (form) {
          values[names[i]] = value
          made = form
          break
        }
      }
      if (!made) return null
      definitions.push(made)
      continue
    }

    // Drawing at random rarely lands on a multiple or divisor of the source, so
    // when the item is meant to lean multiplicative, choose from values that make
    // one possible in the first place.
    const multiples = []
    for (let k = 2; k <= 10; k++) {
      if (sourceValue * k <= MAX_VALUE) multiples.push(sourceValue * k)
      if (sourceValue % k === 0 && sourceValue / k >= MIN_VALUE) multiples.push(sourceValue / k)
    }
    const pool =
      preferMultiplicative && multiples.length
        ? shuffle(rng, multiples)
        : shuffle(rng, Array.from({ length: MAX_VALUE }, (_, n) => n + 1))

    let made = null
    for (const value of pool) {
      if (!inRange(value) || Object.values(values).includes(value)) continue
      const form = defineFrom(rng, names[i], value, sourceName, sourceValue, { preferMultiplicative })
      if (form) {
        values[names[i]] = value
        made = form
        break
      }
    }
    if (!made) return null
    definitions.push(made)
  }

  let determining
  if (determiningKind === 'lcm') {
    determining = lcmChoice
      ? {
          eq: { lhs: op('÷', variable(names[0]), num(lcmChoice.d1)), rhs: variable(names[1]) },
          step: `${names[0]} ÷ ${lcmChoice.d1} and ${names[0]} ÷ ${lcmChoice.d2} both come out whole, so ${names[0]} is a multiple of ${lcmChoice.d1} and of ${lcmChoice.d2}. The lowest such number is ${lcmChoice.lcm}, and the next one is ${lcmChoice.lcm * 2}, which is outside 1–20 — so ${names[0]} = ${lcmChoice.lcm} and ${names[1]} = ${lcmChoice.q1}.`,
          opKind: 'lcm',
          shape: 'lcm-pin',
          constant: lcmChoice.d1,
        }
      : null
  } else if (determiningKind === 'square') {
    determining = squarePin(names[0], values[names[0]])
  } else if (determiningKind === 'product') {
    const pair = productPair(names[0], values[names[0]], names[1], values[names[1]])
    determining = pair?.product ?? null
  } else if (determiningKind === 'pin') {
    determining = forceBare
      ? { eq: { lhs: variable(names[0]), rhs: num(values[names[0]]) }, step: `${names[0]} = ${values[names[0]]} is given directly.`, opKind: 'none', shape: 'pin-constant', constant: null }
      : pinRoot(rng, names[0], values[names[0]], preferMultiplicative)
  } else if (determiningKind === 'pair' && varCount >= 2) {
    // The root is fixed by pairing it with another letter against a constant.
    const partner = pick(rng, names.slice(1))
    determining = pairConstant(rng, names[0], values[names[0]], partner, values[partner])
    if (determining) {
      determining.step = `Substituting the definition of ${partner} into ${renderEquation(determining.eq)} leaves ${names[0]} as the only unknown, which gives ${names[0]} = ${values[names[0]]}.`
    }
  } else {
    // Combining, over every letter or a subset of at least three.
    const spanning =
      varCount >= 4 && (forceSubsetCombine || rng() < 0.45)
        ? shuffle(rng, names).slice(0, varCount - 1)
        : names
    const combined = combineOver(rng, spanning, values)
    if (!combined) return null
    determining = {
      eq: combined.eq,
      step: `Substituting the other equations into ${renderEquation(combined.eq)} leaves a single unknown, which solves to ${names[0]} = ${values[names[0]]}.`,
      opKind: 'combine',
      shape: 'combining',
    }
  }
  if (!determining) return null

  const logicalOrder = [determining, ...definitions]
  const equations = shuffle(rng, logicalOrder)
  const eqNodes = equations.map((e) => e.eq)

  // No official exercise repeats a left-hand side. `A ÷ 4 = 3` alongside
  // `A ÷ 4 = D` is valid and unique but reads like a typo, and the second line
  // does no work beyond restating the first (Phase 5 pilot, me-low-b2-005).
  const renderedLhs = eqNodes.map((e) => render(e.lhs))
  if (new Set(renderedLhs).size !== renderedLhs.length) return null

  if (!hasUniqueSolution(eqNodes, names)) return null
  const solutions = solveAll(eqNodes, names, 2)
  if (solutions.length !== 1) return null
  for (const name of names) {
    if (solutions[0][name] !== values[name]) return null
  }
  if (!satisfies(eqNodes, values)) return null

  return { names, values, eqNodes, logicalOrder, determining, definitions, topology }
}

/* -------------------------------------------------------------- distractors */

/**
 * Wrong answers drawn from nameable errors. Spec §3.4: at most one off-by-one,
 * at least one wrong-variable where one exists, and any value that could be
 * read as two different mistakes is rejected outright — an option that
 * diagnoses two things diagnoses nothing.
 */
function buildDistractors(rng, names, values, asked, order, determining, equationStrings) {
  const correct = values[asked]
  const askedIndex = order.findIndex((s) => s.name === asked)
  const previous = askedIndex > 0 ? order[askedIndex - 1].name : null

  const candidates = []

  for (const name of names) {
    if (name === asked) continue
    candidates.push({
      value: values[name],
      family: name === previous ? 'stopped-early' : 'wrong-variable',
      note:
        name === previous
          ? `${values[name]} is the value of ${name}, the letter you have to work out on the way. Stopping there answers the wrong question — the item asks for ${asked}.`
          : `${values[name]} is the value of ${name}, not ${asked} — this is the right system solved for the wrong letter.`,
    })
  }

  // An inverted-operation distractor may only be offered when the system really
  // contains the operation its note blames. The audit found 8 of 135 committed
  // notes (and 53 of 435 at scale) telling the candidate they "multiplied where
  // the equation divides" in a system containing no division at all.
  const operators = new Set(equationStrings.join(' ').match(/[+−×÷]/g) ?? [])
  if (operators.has('÷')) {
    candidates.push({
      value: correct * 2,
      family: 'inverted-operation',
      note: `${correct * 2} is double the correct value, which is what you get if you multiply where the equation divides.`,
    })
  }
  if (operators.has('×') && correct % 2 === 0) {
    candidates.push({
      value: correct / 2,
      family: 'inverted-operation',
      note: `${correct / 2} is half the correct value, which is what you get if you divide where the equation multiplies.`,
    })
  }

  // A misapplied-constant distractor is only offered when undoing the determining
  // equation the wrong way round genuinely lands on that value, and the note
  // names the equation by its rendered text — never by display position, since
  // the equations are shuffled and "the first equation" was usually not the one
  // the constant came from (9 of 17 in the Phase 5 pilot pointed at the wrong
  // line). If no valid mechanism produces a value, the family is simply skipped
  // and the other families fill the options.
  //
  // It is offered only when the asked letter is the one the determining equation
  // fixes. Otherwise the misapplication produces a wrong value for *that* letter,
  // which the candidate would then propagate down the chain to some third number
  // — so presenting it as an answer to a different letter would describe a
  // mistake that does not lead there.
  const inverse = asked === names[0] ? determining.wrongInverse : null
  if (inverse && Number.isInteger(inverse.value)) {
    const eqText = renderEquation(determining.eq)
    candidates.push({
      value: inverse.value,
      family: 'misapplied-constant',
      note: `${inverse.value} is what you get from ${eqText} by ${inverse.how}. Undoing an operation means applying its inverse, not repeating it.`,
    })
  }

  const offByOne = shuffle(rng, [
    {
      value: correct + 1,
      family: 'off-by-one',
      note: `${correct + 1} is one more than the correct value — an off-by-one slip when adding or subtracting a constant.`,
    },
    {
      value: correct - 1,
      family: 'off-by-one',
      note: `${correct - 1} is one less than the correct value — an off-by-one slip when adding or subtracting a constant.`,
    },
  ])

  // A value that fits two families cannot be explained honestly. Drop it.
  const byValue = new Map()
  for (const c of [...candidates, ...offByOne]) {
    if (!inRange(c.value) || c.value === correct) continue
    const seen = byValue.get(c.value)
    if (seen) {
      if (seen.family !== c.family) seen.conflicted = true
      continue
    }
    byValue.set(c.value, { ...c })
  }

  const usable = [...byValue.values()].filter((c) => !c.conflicted)
  const wrongLetter = usable.filter((c) => c.family === 'wrong-variable' || c.family === 'stopped-early')
  const others = shuffle(
    rng,
    usable.filter((c) => c.family !== 'wrong-variable' && c.family !== 'stopped-early' && c.family !== 'off-by-one'),
  )
  const nudges = usable.filter((c) => c.family === 'off-by-one')

  const chosen = []
  // At least one wrong-letter option whenever the system offers one.
  if (wrongLetter.length) chosen.push(pick(rng, wrongLetter))
  for (const c of others) {
    if (chosen.length >= 3) break
    if (chosen.some((x) => x.value === c.value)) continue
    chosen.push(c)
  }
  // At most one off-by-one.
  if (chosen.length < 3 && nudges.length) {
    const n = pick(rng, nudges)
    if (!chosen.some((x) => x.value === n.value)) chosen.push(n)
  }
  for (const c of shuffle(rng, wrongLetter)) {
    if (chosen.length >= 3) break
    if (chosen.some((x) => x.value === c.value)) continue
    chosen.push(c)
  }

  if (chosen.length < 3) return null
  if (chosen.filter((c) => c.family === 'off-by-one').length > 1) return null
  return chosen.slice(0, 3)
}

/* ------------------------------------------------------- solution and hints */

function buildSolution(order, values, asked, determining, equationStrings) {
  const askedIndex = order.findIndex((s) => s.name === asked)
  const relevant = order.slice(0, askedIndex + 1)
  const opensWithSubstitution = order[0].kind === 'substitute'

  const keyInsight = opensWithSubstitution
    ? 'No equation starts with a single unknown. Push the definitions into the equation that mentions every letter, and it collapses to one.'
    : `One equation has only a single unknown. Solve that first, then every other letter follows from it${askedIndex === 0 ? ' — and it is the letter the question asks for' : ''}.`

  const steps = relevant.map((entry, i) => {
    const eqText = entry.equation ? renderEquation(entry.equation) : null
    return {
      title:
        i === 0
          ? entry.kind === 'substitute'
            ? 'Collapse the combining equation'
            : 'Start where only one letter is unknown'
          : `Substitute to reach ${entry.name}`,
      detail:
        entry.kind === 'substitute'
          ? `Every other equation defines a letter in terms of another. Substituting them into ${eqText} leaves ${entry.name} as the only unknown, which gives ${entry.name} = ${values[entry.name]}.`
          : `${eqText} has ${entry.name} as its only unknown, so ${entry.name} = ${values[entry.name]}.`,
      visual: eqText ? { type: 'me-equation', equation: eqText, note: `${entry.name} = ${values[entry.name]}` } : undefined,
    }
  })

  steps.push({
    title: 'Read the question again before answering',
    detail: `The chain also fixes ${order
      .filter((s) => s.name !== asked)
      .map((s) => `${s.name} = ${values[s.name]}`)
      .join(', ')}. The question asks for ${asked}.`,
    visual: { type: 'me-values', values },
  })

  // Only offer a shortcut that genuinely applies to this item.
  const determiningEq = relevant[relevant.length - 1]?.equation
  const determiningText = determiningEq ? renderEquation(determiningEq) : equationStrings[0]
  const multiplicative = determining.opKind === '×' || determining.opKind === '÷'

  const takeaway = determining.opKind === 'lcm'
    ? 'When one letter is divided by two different numbers, it has to be a common multiple of both. The lowest common multiple is usually the only one that fits inside 1–20, which settles the letter without any substitution at all.'
    : determining.opKind === 'product'
    ? 'A product of two letters is a divisor search, not a rearrangement. List the factor pairs of the product that fall inside 1–20, then let the second equation pick the pair — that is far quicker than substituting.'
    : determining.opKind === 'square'
      ? 'Knowing the squares to 14 × 14 on sight turns this whole family into a one-step read. Only the positive root is in range, so a square never leaves two cases to check.'
      : opensWithSubstitution
        ? 'When nothing has a single unknown, do not hunt for one. Substitute every definition into the equation that mentions all the letters — that is what collapses it.'
        : multiplicative
          ? `Divisibility narrows this kind of item fast: in ${determiningText} the coefficient tells you which multiples are even possible, which is often quicker than solving forward.`
          : `Scan for the equation with one unknown before reading the rest. Here that is ${determiningText}, and it is not always the first line in the list.`

  return {
    keyInsight,
    steps,
    answer: `${asked} = ${values[asked]}.`,
    takeaway,
  }
}

const OPERATION_WORD = {
  '+': 'adds a number to',
  '−': 'subtracts from or from a number',
  '×': 'multiplies',
  '÷': 'divides',
  square: 'multiplies by itself',
  product: 'multiplies by another letter',
  lcm: 'divides, alongside a second division of the same letter',
}

function buildHints(order, asked, determining) {
  const askedIndex = order.findIndex((s) => s.name === asked)
  const first = order[0]
  const firstEq = first.equation ? renderEquation(first.equation) : null
  const opensWithSubstitution = first.kind === 'substitute'
  const lcmPinned = determining?.opKind === 'lcm'

  // A product pair also "opens with substitution" as far as the solver is
  // concerned, but the generic level-1 text points at a combining equation that
  // mentions every letter — and a product-pair system has no such equation. The
  // hint would have sent the candidate looking for a line that is not there.
  const level1 = lcmPinned
    ? 'No single equation starts with one unknown. Two of them divide the SAME letter by different numbers, which tells you something about that letter before you know its value.'
    : determining?.opKind === 'product'
    ? 'No single equation starts with one unknown. Two of them share the same pair of letters — take those two together rather than hunting for a line you can solve alone.'
    : opensWithSubstitution
      ? 'No single equation starts with one unknown, so do not go looking for one. One equation mentions every letter — that is the way in.'
      : 'One of the equations has only a single unknown. Find it before you read the others.'

  // Quoting the starting equation is the documented job of level 2 (spec §8) —
  // but when that equation contains only the asked letter, quoting it *is* the
  // answer. The audit found all 15 low items doing this ("Look at A ÷ 3 = 3."),
  // collapsing the three-level ladder to two. In that case, name the operation
  // to undo instead: it still narrows the search, without handing over the sum.
  const firstEqLetters = firstEq ? [...new Set(firstEq.match(/[A-Z]/g) ?? [])] : []
  const quotingWouldReveal = firstEqLetters.length === 1 && firstEqLetters[0] === asked

  // A bare pin (`B = 6`, official Example 1) has no operation to undo. The generic
  // phrasing told the candidate to "undo that operation on both sides" when there
  // was nothing on either side to undo — caught in the second pilot's review.
  const barePin = determining?.opKind === 'none'
  // A square is undone by a root, not by "the inverse operation on both sides",
  // and a product pair is not undone at all — it is searched. Both need their
  // own level-2 wording, or the generic phrasing describes a move that does not
  // exist in the item.
  const squarePinned = determining?.opKind === 'square'
  const productPinned = determining?.opKind === 'product'

  const level2 = lcmPinned
    ? 'Both divisions have to come out whole, so that letter is a multiple of each divisor. Find the smallest number that is a multiple of both, then check whether a second one even fits inside 1–20.'
    : opensWithSubstitution
    ? productPinned
      ? `Two of the equations mention the same pair of letters — one as a product, one as a difference. Neither settles a letter alone; list the factor pairs of the product and test them against the difference.`
      : `Substitute the other equations into ${firstEq}. Everything is defined in terms of ${first.name}.`
    : barePin
      ? 'One of the equations gives a letter its value outright, with nothing done to it. Start from that line and work outwards.'
      : squarePinned
        ? 'One equation multiplies a letter by itself. Recognise the square and take its root — only the positive root is inside 1–20, so there is no second case to consider.'
        : quotingWouldReveal
          ? `The equation you want is the one that ${OPERATION_WORD[determining?.opKind] ?? 'operates on'} ${asked} and nothing else. Find it, then undo that operation on both sides.`
          : `Look at ${firstEq}.`

  const level3 =
    askedIndex === 0
      ? opensWithSubstitution
        ? `Once the substitution leaves ${first.name} alone on one side, rearrange for it — that is the letter you are asked for.`
        : `Rearrange it for ${first.name}: undo the constant on the left, then the coefficient.`
      : `Solve for ${first.name} first, then substitute it into the equation that defines ${order[1]?.name ?? asked}, and keep going until you reach ${asked}.`

  return [
    { level: 1, text: level1 },
    { level: 2, text: level2 },
    { level: 3, text: level3 },
  ]
}

/* ---------------------------------------------------------------- assembly */

/**
 * Difficulty is reasoning depth, and nothing else.
 *
 * The Phase 3 audit found variable count was a perfect proxy for tier — low=2,
 * medium=3, high=4, in 45/45 items — and that all 15 low items asked for the
 * root letter, so the whole tier was one template. Letter count and depth are
 * now drawn independently: the generator builds a system, *measures* the depth
 * of every letter, and asks one whose depth matches the requested tier. A
 * four-letter system can be low if some letter falls out in one step, and a
 * two-letter system can be medium if its letter needs a substitution first.
 */
const DEPTH_TARGET = { low: [1, 1], medium: [2, 2], high: [3, 6] }

/** Letter counts each tier may draw from, weighted towards the middle. */
const VAR_CHOICES = {
  low: [2, 2, 3, 3, 4],
  medium: [2, 3, 3, 4, 4],
  high: [3, 3, 4, 4, 4],
}

/**
 * A generation plan may ask a slot to attempt a particular documented structure,
 * so coverage of the rarer official shapes is deliberate rather than left to the
 * draw. The Phase 5 pilot produced none of the bare pin, multi-term or
 * subset-spanning combining shapes across 15 items, and an untargeted batch hits
 * all three together only about one time in ten.
 *
 * A target only changes what is *attempted*. Every correctness, difficulty,
 * contract, diversity and note-accuracy gate is applied identically, and a target
 * that cannot be met validly fails the slot rather than lowering the bar.
 */
function planFor(rng, difficulty, target = null) {
  let varCount = pick(rng, VAR_CHOICES[difficulty])
  let determiningPool =
    varCount === 2 ? ['pin', 'pin', 'pair'] : ['pin', 'combine', 'combine', 'pair']
  let determining = pick(rng, determiningPool)
  let useMultiTerm = varCount >= 3 && rng() < 0.25
  let forceBare = false
  let forceSubsetCombine = false
  let multiTermBothCoefficients = false

  switch (target?.shape) {
    case 'pin-constant': // `B = 6` — official Example 1
      determining = 'pin'
      forceBare = true
      break
    case 'multi-term': // a sum of multiplicative terms — official Ex 3
      varCount = Math.max(varCount, 3)
      useMultiTerm = true
      break
    case 'multi-term-coefficients': // exactly `2 × A + 2 × C = B` — official Ex 3
      varCount = Math.max(varCount, 3)
      useMultiTerm = true
      multiTermBothCoefficients = true
      break
    case 'combining-subset': // `C + D − A = 1`, leaving B out — official Ex 6
      varCount = 4
      determining = 'combine'
      forceSubsetCombine = true
      break
    case 'square-pin': // `A × A = 169` — REVIEW, not official
      determining = 'square'
      break
    case 'product-pair': // `A × B = 72` with `A − B = 1` — REVIEW, not official
      varCount = Math.max(varCount, 3)
      determining = 'product'
      break
    // `D ÷ 3 = A` with `D ÷ 4 = B` — ALLOWED. Two documented division
    // definitions (official Ex 2) that only settle the root together, so the
    // way in is the lowest common multiple.
    case 'lcm-pin':
      varCount = Math.max(varCount, 3)
      determining = 'lcm'
      break
    default:
      break
  }

  return {
    varCount,
    topology: varCount <= 2 ? 'chain' : pick(rng, TOPOLOGIES),
    determining,
    useMultiTerm,
    forceBare,
    forceSubsetCombine,
    multiTermBothCoefficients,
  }
}

export function buildMathEquations(rng, difficulty, ctx = {}) {
  const preferMultiplicative = ctx.preferMultiplicative ?? rng() < 0.55
  // The default target is derived from the slot's own coordinates, here rather
  // than in `generateMathEquations`, so that EVERY replay path agrees. Injecting
  // it from the batch wrapper broke the reproducibility gate immediately: the
  // wrapper applied a target, a direct rebuild from the same stamped seed did
  // not, and the item came back different. `preferMultiplicative` is derived
  // from `ctx.index` for exactly the same reason.
  const target = ctx.target ?? defaultTargetFor(difficulty, ctx.index ?? 0)
  const plan = planFor(rng, difficulty, target)
  const system = buildSystem(rng, { ...plan, preferMultiplicative })
  if (!system) return null

  const { names, values, eqNodes, logicalOrder, determining } = system

  const order = solveOrder(eqNodes, names)
  if (!order) return null

  // Measure every letter's depth, then ask one that lands in the tier's band.
  const [minDepth, maxDepth] = DEPTH_TARGET[difficulty]
  const eligible = names.filter((name) => {
    const d = depthOf(order, name)
    if (d === null || d < minDepth || d > maxDepth) return false
    // Spec §3.2: a high item may not be answered by the first letter determined.
    if (difficulty === 'high' && order[0].name === name) return false
    return true
  })
  if (eligible.length === 0) return null
  const asked = pick(rng, eligible)
  const depth = depthOf(order, asked)

  // Never ask for a letter an equation states outright: `C = 14` with the question
  // "what is C?" prints the answer on the page. Official Example 1 uses the bare
  // pin the other way round — `B = 6` is *given* so that `A + 2 = B` can be solved
  // for A. Found in the second pilot's teaching-copy review.
  if (determining.shape === 'pin-constant' && asked === names[0]) return null

  const correct = values[asked]
  const equations = eqNodes.map(renderEquation)
  const distractors = buildDistractors(rng, names, values, asked, order, determining, equations)
  if (!distractors) return null

  const options = shuffle(rng, [
    { id: `opt-${correct}`, value: correct },
    ...distractors.map((d) => ({ id: `opt-${d.value}`, value: d.value })),
  ])
  if (new Set(options.map((o) => o.value)).size !== options.length) return null

  const distractorNotes = {}
  const distractorTypes = {}
  for (const d of distractors) {
    distractorNotes[`opt-${d.value}`] = d.note
    distractorTypes[`opt-${d.value}`] = d.family
  }

  const solutionSteps = logicalOrder.map((e) => e.step)
  solutionSteps.push(
    `Full solution: ${[...names].sort().map((n) => `${n} = ${values[n]}`).join(', ')}. The question asks for ${asked}, so the answer is ${correct}.`,
  )

  const hints = buildHints(order, asked, determining)
  // A hint must never contain the answer as a standalone number.
  const answerToken = new RegExp(`(^|[^0-9])${correct}([^0-9]|$)`)
  if (hints.some((h) => answerToken.test(h.text))) return null

  const opKinds = logicalOrder.map((e) => e.opKind)
  const multiplicativeCount = opKinds.filter((k) => k === '×' || k === '÷').length

  const shapes = [...new Set(logicalOrder.map((e) => e.shape).filter(Boolean))]
  const patternType = [
    plan.determining === 'combine' ? 'elimination' : 'direct-substitution',
    `${names.length}-variable-system`,
    `${plan.topology}-topology`,
    depth >= 3 ? 'multi-step-substitution' : depth === 2 ? 'two-step-substitution' : 'single-step',
    ...(multiplicativeCount >= 2 ? ['mixed-operations'] : []),
    ...shapes,
  ]

  return {
    kind: 'math-equations',
    section: 'mathematical-equations',
    difficulty,
    equations,
    variables: [...names].sort(),
    asked,
    options,
    correctOptionId: `opt-${correct}`,
    solution: values,
    solutionSteps,
    explanation: solutionSteps.join(' '),
    distractorNotes,
    hints,
    walkthrough: buildSolution(order, values, asked, determining, equations),
    meta: {
      patternType,
      skill:
        plan.determining === 'combine'
          ? 'substitution into a combining equation'
          : plan.determining === 'pair'
            ? 'collapsing a two-unknown constant equation'
            : `forward substitution along a ${plan.topology}`,
      // Placeholder only. `scripts/lib/batch.mjs` overwrites this and fills
      // `meta.provenance` by deriving both from the finished question. Asserting
      // it here is what made all 473 committed questions claim the exam
      // documents them, including 175 whose answer format it never states.
      dmatAlignment: 'officially_documented',
      reasoningDepth: depth,
      /**
       * The official ladder, recorded alongside ours and never instead of it.
       *
       * GAM PDF pp. 17–19 tiers Mathematical Equations strictly by size: the two
       * low exercises use 2 letters and 2 equations, the two medium 3 and 3, the
       * two high 4 and 4. This generator tiers by reasoning depth instead, on the
       * grounds that letter count was a perfect proxy for tier in the original
       * bank and made every low item one template. Both readings are defensible
       * and they disagree, so the structural figures are stamped here and
       * reported separately — a re-tiering decision needs the two side by side,
       * not one silently standing in for the other.
       */
      officialStructure: { letters: names.length, equations: equations.length },
      distractorTypes,
      generationNotes: `${names.length} letters, ${plan.topology} topology, depth ${depth}, ${multiplicativeCount} multiplicative operation(s), shapes: ${shapes.join('/')}`,
    },
  }
}

/**
 * Append-only batch entry point. Alternates the multiplicative preference by
 * slot index rather than by acceptance count, so the property survives a
 * change of batch size (spec §3.3: at least half of each tier leans × or ÷).
 */
export function generateMathEquations({ batchId, quotas, existing = [], verifiedAt, slotTargets = {} }) {
  return generateBatch({
    section: 'mathematical-equations',
    prefix: 'me',
    generatorName: GENERATOR_NAME,
    version: GENERATOR_VERSION,
    batchId,
    quotas,
    existing,
    verifiedAt,
    config: { depthTargets: DEPTH_TARGET, varChoices: VAR_CHOICES, topologies: TOPOLOGIES },
    slotTargets,
    build: (rng, difficulty, ctx) =>
      buildMathEquations(rng, difficulty, {
        preferMultiplicative: ctx.index % 2 === 0,
        index: ctx.index,
        target: ctx.target,
      }),
  })
}

/**
 * Which slots get a quadratic-type shape, decided by slot index rather than by
 * a draw.
 *
 * The first attempt put `square` and `product` into the random `determiningPool`
 * and it went badly in a way worth recording: both shapes succeed far more often
 * than `combine` does (`combineOver` returns null whenever its right-hand side
 * falls outside 1..18), so the retry loop selected for them. A 42-item batch came
 * back with 18 quadratic items and **one** combining equation — the officially
 * documented shape had been crowded out of the bank by an extrapolated one.
 *
 * Placing them by index fixes the proportion exactly — 1 in 5 medium slots, 2 in
 * 5 high slots — and keeps it reproducible, which a draw against a biased retry
 * loop never was. It also leaves `low` untouched: a square pin asked at its own
 * root is a one-step root lookup, and the brief rules out items that fall to one
 * simple equation.
 *
 * An explicit `slotTargets` entry from a generation plan always wins over this.
 *
 * **`combining-subset` is reserved here too, and that is not incidental.**
 * Taking two in five high slots for quadratic shapes halved how often the draw
 * reached a combining equation — measured, 6 combining items in a 42-item batch
 * before the change and 3 after, with the officially documented subset form
 * (`C + D − A = 1`, leaving B out — Ex 6) falling from 1 to 0. One was never a
 * margin worth trusting either. Reserving a slot for it makes the official shape
 * a guarantee rather than an accident, which is the stronger position of the two
 * regardless of what the quadratic shapes are doing.
 */
function defaultTargetFor(difficulty, index) {
  if (difficulty === 'medium' && index % 5 === 2) return { shape: 'square-pin' }
  if (difficulty === 'high') {
    if (index % 5 === 0) return { shape: 'combining-subset' }
    if (index % 5 === 1) return { shape: 'square-pin' }
    if (index % 5 === 3) return { shape: 'product-pair' }
  }
  return null
}
