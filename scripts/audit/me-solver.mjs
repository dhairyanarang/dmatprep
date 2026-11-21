/**
 * An independent solver for Mathematical Equations.
 *
 * It reads ONLY the equations, the variable list and the asked letter. It
 * never looks at `solution`, `correctOptionId` or the explanation, so the
 * value it returns is derived from the question rather than confirmed against
 * the answer — which is the whole point of an audit.
 *
 * The documented rules it enforces (CLAUDE.md, GAM PDF p. 17): every letter is
 * an integer from 1 to 20, and there is exactly one solution per letter.
 * Division must come out exact; a rule the generator obeys but that nothing
 * was checking from the outside.
 */

const MIN = 1
const MAX = 20

/**
 * Parses one side of an equation into terms.
 *
 * The grammar across the whole bank is small: a left side is terms joined by
 * `+` or `−`, and a term is `N × V`, `V ÷ N`, `N` or `V`. Anything outside
 * that is returned as an error rather than guessed at, because a solver that
 * quietly mis-parses would report confident nonsense.
 */
function parseSide(text) {
  const tokens = text.trim().split(/\s+/)
  const terms = []
  let sign = 1
  let i = 0

  while (i < tokens.length) {
    const factors = []
    const ops = []
    // Read a term: operand, then any run of × ÷ operand.
    factors.push(tokens[i++])
    while (i < tokens.length && (tokens[i] === '×' || tokens[i] === '÷')) {
      ops.push(tokens[i++])
      if (i >= tokens.length) return { error: `dangling operator in "${text}"` }
      factors.push(tokens[i++])
    }
    terms.push({ sign, factors, ops })

    if (i >= tokens.length) break
    const joiner = tokens[i++]
    if (joiner === '+') sign = 1
    else if (joiner === '−' || joiner === '-') sign = -1
    else return { error: `unexpected "${joiner}" in "${text}"` }
  }

  return { terms }
}

/** Evaluates a parsed side, or null when a division is not exact. */
function evaluate(parsed, values) {
  let total = 0
  for (const { sign, factors, ops } of parsed.terms) {
    let value = resolve(factors[0], values)
    if (value === null) return null
    for (let k = 0; k < ops.length; k++) {
      const next = resolve(factors[k + 1], values)
      if (next === null) return null
      if (ops[k] === '×') value *= next
      else {
        // Integers only: a non-exact division makes the equation false rather
        // than approximately true.
        if (next === 0 || value % next !== 0) return null
        value /= next
      }
    }
    total += sign * value
  }
  return total
}

function resolve(token, values) {
  if (/^-?\d+$/.test(token)) return Number(token)
  const value = values[token]
  return value === undefined ? null : value
}

/**
 * Every assignment of 1..20 to the variables that satisfies every equation.
 *
 * Termination is by DISTINCT VALUES OF THE ASKED LETTER, not by a count of
 * solutions. Stopping after N solutions was the first version and it was
 * wrong: variables are enumerated in order, so when the asked letter comes
 * first every early solution shares its value, and a genuinely ambiguous
 * question would have been reported as unique. A planted under-determined
 * system is what exposed it.
 *
 * Two distinct values is all it takes to answer the only question that
 * matters, so the search stops there.
 */
export function solve(question, limit = 3) {
  /**
   * The asked letter is enumerated FIRST.
   *
   * With it innermost, every early solution shares its value and a cap on the
   * number of solutions stops the search before a second value is ever tried
   * — which is exactly how an under-determined system looked unique. Outermost,
   * a second value appears as soon as one exists.
   */
  const vars = [question.asked, ...question.variables.filter((v) => v !== question.asked)]
  const parsed = []
  for (const equation of question.equations) {
    const [lhs, rhs] = equation.split('=')
    if (rhs === undefined) return { error: `no "=" in "${equation}"` }
    const left = parseSide(lhs)
    const right = parseSide(rhs)
    if (left.error) return { error: left.error }
    if (right.error) return { error: right.error }
    parsed.push({ left, right, source: equation })
  }

  const solutions = []
  const askedValues = new Set()
  const values = {}
  // Only distinct asked values terminate the search. `limit` caps how many
  // full assignments are KEPT, never how far the search looks. `visits` is a
  // safety valve so a pathological question cannot run forever.
  let visits = 0
  const enough = () => askedValues.size > 1 || visits > 5_000_000

  const assign = (index) => {
    if (enough()) return
    visits++
    if (index === vars.length) {
      for (const { left, right } of parsed) {
        const a = evaluate(left, values)
        const b = evaluate(right, values)
        if (a === null || b === null || a !== b) return
      }
      if (solutions.length < limit) solutions.push({ ...values })
      askedValues.add(values[question.asked])
      return
    }
    const name = vars[index]
    for (let v = MIN; v <= MAX; v++) {
      values[name] = v
      // Check every equation whose variables are now all known. Pruning here
      // is what keeps four-variable questions fast.
      let ok = true
      for (const { left, right } of parsed) {
        const a = evaluate(left, values)
        const b = evaluate(right, values)
        if (a === null || b === null) continue
        if (a !== b) {
          ok = false
          break
        }
      }
      if (ok) assign(index + 1)
      if (enough()) break
    }
    delete values[name]
  }

  assign(0)
  return { solutions, askedValues: [...askedValues] }
}
