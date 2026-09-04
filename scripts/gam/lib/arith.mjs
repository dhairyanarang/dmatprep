/**
 * A small, safe arithmetic evaluator for GAM `computation` fields.
 *
 * Spec §5.1: where a question's answer is computable, the item stores the
 * expression and its expected value, and validation re-evaluates it rather than
 * trusting the author. That restores Module-A-grade certainty for the
 * computable subset of an otherwise prose-based module.
 *
 * Deliberately not `eval` and deliberately tiny: numbers, + − * / ^, unary
 * minus, parentheses, and `sqrt(...)`. Anything else throws. A validator that
 * could execute arbitrary strings from a content file would be a worse problem
 * than the one it solves.
 */

const isDigit = (c) => c >= '0' && c <= '9'

function tokenize(input) {
  const tokens = []
  let i = 0
  while (i < input.length) {
    const c = input[i]
    if (c === ' ') {
      i++
      continue
    }
    if (isDigit(c) || (c === '.' && isDigit(input[i + 1]))) {
      let j = i
      while (j < input.length && (isDigit(input[j]) || input[j] === '.')) j++
      const text = input.slice(i, j)
      if ((text.match(/\./g) ?? []).length > 1) throw new Error(`malformed number "${text}"`)
      tokens.push({ t: 'num', v: Number(text) })
      i = j
      continue
    }
    if (/[a-z]/.test(c)) {
      let j = i
      while (j < input.length && /[a-z]/.test(input[j])) j++
      const name = input.slice(i, j)
      if (name !== 'sqrt') throw new Error(`unknown function "${name}"`)
      tokens.push({ t: 'fn', v: name })
      i = j
      continue
    }
    if ('+-*/^()'.includes(c)) {
      tokens.push({ t: c })
      i++
      continue
    }
    throw new Error(`unexpected character "${c}" at ${i}`)
  }
  return tokens
}

/** Recursive descent: expr → term → power → unary → atom. */
export function evaluate(expression) {
  if (typeof expression !== 'string' || expression.trim() === '') {
    throw new Error('empty expression')
  }
  const tokens = tokenize(expression)
  let pos = 0
  const peek = () => tokens[pos]
  const eat = (t) => {
    if (!peek() || peek().t !== t) throw new Error(`expected "${t}" in: ${expression}`)
    return tokens[pos++]
  }

  const atom = () => {
    const tok = peek()
    if (!tok) throw new Error(`unexpected end of: ${expression}`)
    if (tok.t === 'num') {
      pos++
      return tok.v
    }
    if (tok.t === 'fn') {
      pos++
      eat('(')
      const inner = expr()
      eat(')')
      if (inner < 0) throw new Error('sqrt of a negative number')
      return Math.sqrt(inner)
    }
    if (tok.t === '(') {
      pos++
      const inner = expr()
      eat(')')
      return inner
    }
    throw new Error(`unexpected token "${tok.t}" in: ${expression}`)
  }

  const unary = () => {
    if (peek()?.t === '-') {
      pos++
      return -unary()
    }
    if (peek()?.t === '+') {
      pos++
      return unary()
    }
    return atom()
  }

  // Right-associative, as exponentiation conventionally is.
  const power = () => {
    const base = unary()
    if (peek()?.t === '^') {
      pos++
      return base ** power()
    }
    return base
  }

  const term = () => {
    let value = power()
    while (peek()?.t === '*' || peek()?.t === '/') {
      const op = tokens[pos++].t
      const rhs = power()
      if (op === '/' && rhs === 0) throw new Error(`division by zero in: ${expression}`)
      value = op === '*' ? value * rhs : value / rhs
    }
    return value
  }

  function expr() {
    let value = term()
    while (peek()?.t === '+' || peek()?.t === '-') {
      const op = tokens[pos++].t
      const rhs = term()
      value = op === '+' ? value + rhs : value - rhs
    }
    return value
  }

  const result = expr()
  if (pos !== tokens.length) throw new Error(`trailing tokens in: ${expression}`)
  if (!Number.isFinite(result)) throw new Error(`non-finite result from: ${expression}`)
  return result
}

/** Content tolerance: values are compared to 6 significant figures. */
export function closeEnough(a, b) {
  if (a === b) return true
  const scale = Math.max(Math.abs(a), Math.abs(b), 1)
  return Math.abs(a - b) / scale < 1e-6
}
