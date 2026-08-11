/**
 * Expression model, renderer and exhaustive solver for Mathematical Equations.
 *
 * The official constraints are narrow and load-bearing (GAM PDF p. 17):
 * "There is always only one solution for each letter" and "Each letter can be
 * an integer between 1 and 20." Uniqueness is therefore proven by exhaustive
 * search over that exact domain, not assumed from how the item was built.
 */

export const MIN_VALUE = 1
export const MAX_VALUE = 20

export const num = (value) => ({ t: 'num', value })
export const variable = (name) => ({ t: 'var', name })
export const op = (o, left, right) => ({ t: 'op', o, left, right })

const PRECEDENCE = { '+': 1, '−': 1, '×': 2, '÷': 2 }

export function evaluate(node, env) {
  switch (node.t) {
    case 'num':
      return node.value
    case 'var':
      return env[node.name]
    case 'op': {
      const a = evaluate(node.left, env)
      const b = evaluate(node.right, env)
      if (a === undefined || b === undefined) return undefined
      switch (node.o) {
        case '+':
          return a + b
        case '−':
          return a - b
        case '×':
          return a * b
        case '÷':
          return b === 0 ? undefined : a / b
      }
    }
  }
  return undefined
}

export function render(node, parentPrecedence = 0) {
  switch (node.t) {
    case 'num':
      return String(node.value)
    case 'var':
      return node.name
    case 'op': {
      const p = PRECEDENCE[node.o]
      const text = `${render(node.left, p)} ${node.o} ${render(node.right, p + 1)}`
      return p < parentPrecedence ? `(${text})` : text
    }
  }
  return ''
}

export const renderEquation = (eq) => `${render(eq.lhs)} = ${render(eq.rhs)}`

export function satisfies(equations, env) {
  for (const eq of equations) {
    const a = evaluate(eq.lhs, env)
    const b = evaluate(eq.rhs, env)
    if (a === undefined || b === undefined) return false
    if (Math.abs(a - b) > 1e-9) return false
  }
  return true
}

/**
 * Every assignment over 1..20 that satisfies the system. Stops early once a
 * second solution appears, since that alone disqualifies the item.
 */
export function solveAll(equations, variables, limit = 2) {
  const solutions = []
  const env = {}

  const recurse = (i) => {
    if (solutions.length >= limit) return
    if (i === variables.length) {
      if (satisfies(equations, env)) solutions.push({ ...env })
      return
    }
    const name = variables[i]
    for (let v = MIN_VALUE; v <= MAX_VALUE; v++) {
      env[name] = v
      // Prune as soon as a fully-determined equation is already violated.
      if (i === variables.length - 1 || !violatesEarly(equations, env, variables, i)) {
        recurse(i + 1)
      }
      if (solutions.length >= limit) break
    }
    delete env[name]
  }

  recurse(0)
  return solutions
}

/** True when some equation is fully assigned and already false. */
function violatesEarly(equations, env, variables, assignedIndex) {
  const assigned = new Set(variables.slice(0, assignedIndex + 1))
  for (const eq of equations) {
    if (!fullyAssigned(eq.lhs, assigned) || !fullyAssigned(eq.rhs, assigned)) continue
    const a = evaluate(eq.lhs, env)
    const b = evaluate(eq.rhs, env)
    if (a === undefined || b === undefined) return true
    if (Math.abs(a - b) > 1e-9) return true
  }
  return false
}

function fullyAssigned(node, assigned) {
  if (node.t === 'num') return true
  if (node.t === 'var') return assigned.has(node.name)
  return fullyAssigned(node.left, assigned) && fullyAssigned(node.right, assigned)
}

export function hasUniqueSolution(equations, variables) {
  return solveAll(equations, variables, 2).length === 1
}

/**
 * Parse a rendered equation back into the AST.
 *
 * verify-bank re-derives every item from the strings actually committed to
 * questions.json, so a rendering bug can't slip through behind a correct
 * in-memory AST.
 */
export function parseEquation(text) {
  // Strict tokenizer: anything unrecognised throws rather than being skipped.
  // A lenient character class previously dropped ASCII "-" from negative
  // constants, silently turning "= -1" into "= 1".
  const tokens = []
  for (let pos = 0; pos < text.length; ) {
    const rest = text.slice(pos)
    const match = /^(\s+)|^(\d+)|^([A-Z])|^([+−×÷=()])/.exec(rest)
    if (!match) throw new Error(`unexpected character "${text[pos]}" at ${pos} in: ${text}`)
    if (!match[1]) tokens.push(match[0])
    pos += match[0].length
  }
  if (tokens.length === 0) throw new Error(`unparseable equation: ${text}`)
  let i = 0

  const peek = () => tokens[i]
  const eat = (tok) => {
    if (tokens[i] !== tok) throw new Error(`expected ${tok} in: ${text}`)
    i++
  }

  const parseFactor = () => {
    const tok = peek()
    if (tok === '(') {
      i++
      const inner = parseExpr()
      eat(')')
      return inner
    }
    i++
    if (/^\d+$/.test(tok)) return num(Number(tok))
    if (/^[A-Z]$/.test(tok)) return variable(tok)
    throw new Error(`unexpected token "${tok}" in: ${text}`)
  }

  const parseTerm = () => {
    let node = parseFactor()
    while (peek() === '×' || peek() === '÷') {
      const o = tokens[i++]
      node = op(o, node, parseFactor())
    }
    return node
  }

  function parseExpr() {
    let node = parseTerm()
    while (peek() === '+' || peek() === '−') {
      const o = tokens[i++]
      node = op(o, node, parseTerm())
    }
    return node
  }

  const lhs = parseExpr()
  eat('=')
  const rhs = parseExpr()
  if (i !== tokens.length) throw new Error(`trailing tokens in: ${text}`)
  return { lhs, rhs }
}
