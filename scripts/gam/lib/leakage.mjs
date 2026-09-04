/**
 * Cross-question leakage, checked at SOURCE-PACK level (spec §5.9).
 *
 * Every other gate in this directory inspects one question at a time. That is
 * the wrong unit. A candidate is shown the source and *all* of its questions at
 * once, so each question is part of the visible context of every other one, and
 * a pack of individually sound questions can still give itself away.
 *
 * The first pilot did exactly that. An independent ablation round found none of
 * its 26 questions genuinely undeterminable without the source, and the cause
 * was sibling questions, not weak sources: a distractor equal to the product of
 * two table values and another equal to their sum, an option that stated the
 * neighbouring question's answer in words, and three stems that between them
 * restated every figure the pack existed to supply.
 *
 * Four classes are checked here, in the terms §5.9 sets out:
 *
 *   literal answer leakage      — an answer appears in a sibling's stem or options
 *   sibling-stem leakage        — a value a question must take from the pack is
 *   sibling-option leakage        instead handed over by a sibling's stem or options
 *   reconstructable numeric     — it is recoverable from sibling numbers by an
 *   leakage                       obvious derivation (sum, difference, product,
 *                                 quotient)
 *
 * Distractors are treated exactly like keys, because they leak exactly like
 * keys. A distractor is usually the right inputs under a wrong operation, which
 * is precisely what makes it a channel for those inputs.
 */
import { blockText } from './validate.mjs'
import { closeEnough, evaluate } from './arith.mjs'

/* ------------------------------------------------------------------ numbers */

/**
 * Exhibit references are labels, not quantities. "Figure 2" says nothing about
 * the wall; stripping them keeps the numeric channel free of noise.
 */
const EXHIBIT_REF = /\b(figure|table|line|exhibit|chart)\s+[a-z0-9]+/gi

const NUMBER = /-?\d[\d,]*(?:\.\d+)?/g

/** Every number written in a piece of prose, with thousands separators removed. */
export function numbersIn(text) {
  const cleaned = String(text ?? '').replace(EXHIBIT_REF, ' ')
  const out = []
  for (const m of cleaned.matchAll(NUMBER)) {
    const v = Number(m[0].replace(/,/g, ''))
    if (Number.isFinite(v)) out.push(v)
  }
  return out
}

/**
 * Small integers carry no information — a squaring exponent, a halving, the
 * "three checks" of a humanities text. Counting them as leaked values would
 * bury the real findings.
 */
const informative = (v) => !(Number.isInteger(v) && Math.abs(v) <= 3)

const has = (set, v) => [...set].some((x) => closeEnough(x, v))

/* ---------------------------------------------------------------- question views */

const optionText = (q) => q.options.map((o) => o.text)
const questionNumbers = (q) => [...numbersIn(q.stem), ...optionText(q).flatMap(numbersIn)]

/**
 * What a question's key puts in front of the candidate: the numbers written in
 * the correct option, and nothing else.
 *
 * A `computation.expected` that the option does not display is not visible and
 * so cannot leak — "It roughly quadruples" shows no 4 to anyone.
 */
function answerValues(q, labels) {
  const correct = q.options.find((o) => o.id === q.correctOptionId)
  const vals = correct ? numbersIn(correct.text) : []
  return [...new Set(vals)].filter(informative).filter((v) => !has(labels, v))
}

/**
 * The numbers that name where an exhibit's data sits rather than being data:
 * a table's column headings, a chart's axis and series labels.
 *
 * These enumerate the choice space and are on the page for everyone regardless,
 * so a question whose answer is one of them ("at n = 16 only") is not given away
 * by a sibling mentioning that size, and two of them combined are arithmetic on
 * coordinates rather than the recovery of a value.
 */
function labelValues(pack) {
  const out = new Set()
  for (const block of pack.blocks) {
    const texts = []
    if (block.kind === 'table') texts.push(...block.columns, ...block.rows.map((r) => r[0]))
    if (block.kind === 'figure') {
      const spec = block.spec ?? {}
      texts.push(spec.xLabel ?? '', spec.yLabel ?? '', ...(spec.series ?? []).map((x) => x.label))
    }
    for (const v of texts.flatMap(numbersIn)) out.add(v)
  }
  return out
}

/**
 * The pack values a question must take from its source in order to be answered.
 *
 * Approximated by the operands of its declared computation, less anything its
 * own stem already supplies — a value the question states itself was never
 * secret. A question with no computation has no numeric requirement to leak.
 */
function requiredValues(q, packValues) {
  if (!q.computation?.expression) return []
  const own = new Set(numbersIn(q.stem))
  return [...new Set(numbersIn(q.computation.expression))]
    .filter(informative)
    .filter((v) => has(packValues, v))
    .filter((v) => !has(own, v))
}

/* -------------------------------------------------------------- derivations */

const OPS = [
  ['+', (a, b) => a + b],
  ['-', (a, b) => a - b],
  ['×', (a, b) => a * b],
  ['÷', (a, b) => (b === 0 ? NaN : a / b)],
]

/**
 * Is `target` reachable from two distinct values a candidate can already see?
 * One operation only: the claim is that the derivation is obvious, not that it
 * is possible. Operands equal to the target are excluded, since recovering a
 * number from itself is the literal case and is reported separately.
 */
function derivation(target, pool) {
  const values = [...new Set(pool)].filter((v) => informative(v) && !closeEnough(v, target))
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < values.length; j++) {
      if (i === j) continue
      for (const [sym, fn] of OPS) {
        const r = fn(values[i], values[j])
        if (Number.isFinite(r) && closeEnough(r, target)) return `${values[i]} ${sym} ${values[j]}`
      }
    }
  }
  return null
}

/**
 * Every value a declared computation passes through: its literals, the value of
 * each parenthesised group, and the result.
 *
 * This is what separates a real reconstruction from an arithmetic coincidence.
 * `240 + 1054` matching a question whose expression is `240+1054` means the
 * candidate can redo that question's own arithmetic from its siblings. `256 - 16`
 * happening to equal 240 means nothing, and treating the two alike would bury
 * the first under the second.
 */
export function intermediateValues(expression) {
  const out = new Set()
  const text = String(expression ?? '')
  for (const m of text.matchAll(NUMBER)) {
    const v = Number(m[0].replace(/,/g, ''))
    if (Number.isFinite(v)) out.add(v)
  }
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '(') continue
    let depth = 0
    for (let j = i; j < text.length; j++) {
      if (text[j] === '(') depth++
      else if (text[j] === ')') {
        depth--
        if (depth === 0) {
          try {
            const v = evaluate(text.slice(i + 1, j))
            if (Number.isFinite(v)) out.add(v)
          } catch {
            /* a group that does not stand alone tells us nothing */
          }
          break
        }
      }
    }
  }
  try {
    const v = evaluate(text)
    if (Number.isFinite(v)) out.add(v)
  } catch {
    /* the caller's own validation reports an unevaluable expression */
  }
  return out
}

/* ------------------------------------------------------------------ prose */

const STOP = new Set([
  'the', 'a', 'an', 'of', 'to', 'in', 'is', 'are', 'was', 'were', 'be', 'been',
  'and', 'or', 'not', 'that', 'this', 'these', 'those', 'it', 'its', 'as', 'at',
  'by', 'for', 'from', 'on', 'with', 'which', 'what', 'when', 'where', 'how',
  'than', 'then', 'so', 'if', 'but', 'each', 'every', 'all', 'any', 'both',
  'one', 'two', 'three', 'more', 'most', 'less', 'least', 'same', 'other',
  'according', 'following', 'question', 'text', 'statement', 'about', 'does',
  'do', 'has', 'have', 'can', 'may', 'must', 'would', 'will', 'their', 'they',
  'because', 'since', 'there', 'them', 'his', 'her', 'been', 'into', 'over',
])

const contentWords = (text) =>
  [...new Set(
    String(text ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w)),
  )]

/** Share of `needle`'s content words present in `haystack`. */
function containment(needle, haystack) {
  const n = contentWords(needle)
  // Below five content words an overlap cannot be told apart from two questions
  // simply being about the same thing, which every question in a pack is.
  if (n.length < 5) return 0
  const h = new Set(contentWords(haystack))
  return n.filter((w) => h.has(w)).length / n.length
}

/* ------------------------------------------------------------------- gate */

/**
 * Check one pack for cross-question leakage.
 *
 * Returns `{ errors, warnings, findings }`. Findings carry the class, the
 * question that leaks, the question that gives it away, and the evidence — an
 * author cannot act on "something leaks".
 */
export function analyseLeakage(pack, questions, { proseThreshold = 0.75 } = {}) {
  const errors = []
  const warnings = []
  const findings = []

  const labels = labelValues(pack)
  const packValues = new Set(
    pack.blocks.flatMap((b) => numbersIn(blockText(b))).filter(informative).filter((v) => !has(labels, v)),
  )

  const record = (severity, finding) => {
    findings.push(finding)
    const line =
      `${finding.questionId}: ${finding.kind} — ${finding.detail} ` +
      `(exposed by ${finding.exposedBy})`
    ;(severity === 'error' ? errors : warnings).push(line)
  }

  for (const q of questions) {
    const siblings = questions.filter((s) => s.id !== q.id)

    /* --- literal answer leakage, and which sibling channel carried it ------ */
    for (const value of answerValues(q, labels)) {
      for (const s of siblings) {
        const inStem = has(new Set(numbersIn(s.stem)), value)
        const optionHit = s.options.find((o) => has(new Set(numbersIn(o.text)), value))
        if (!inStem && !optionHit) continue
        record('error', {
          kind: 'literal-answer-leakage',
          questionId: q.id,
          exposedBy: inStem ? `${s.id} stem` : `${s.id} option ${optionHit.id}`,
          detail: `its answer ${value} is written out in a sibling question`,
        })
      }
    }

    /* --- sibling-stem / sibling-option leakage of a required pack value ---- */
    for (const value of requiredValues(q, packValues)) {
      for (const s of siblings) {
        const inStem = has(new Set(numbersIn(s.stem)), value)
        const optionHit = s.options.find((o) => has(new Set(numbersIn(o.text)), value))
        if (!inStem && !optionHit) continue
        record('error', {
          kind: inStem ? 'sibling-stem-leakage' : 'sibling-option-leakage',
          questionId: q.id,
          exposedBy: inStem ? `${s.id} stem` : `${s.id} option ${optionHit.id}`,
          detail: `${value}, which it must take from the source, is supplied by a sibling`,
        })
      }
    }

    /* --- reconstructable numeric leakage ---------------------------------- */
    const pool = siblings.flatMap(questionNumbers).filter((v) => !has(labels, v))
    const steps = q.computation?.expression ? intermediateValues(q.computation.expression) : new Set()
    for (const value of answerValues(q, labels)) {
      const d = derivation(value, pool)
      if (!d) continue
      // An error when the derivation walks the question's own working; otherwise
      // a warning, because two unrelated numbers can always be made to meet.
      const reproducesWorking = d
        .split(/\s[+\-×÷]\s/)
        .every((operand) => has(steps, Number(operand)))
      record(reproducesWorking ? 'error' : 'warning', {
        kind: 'reconstructable-answer-leakage',
        questionId: q.id,
        exposedBy: 'sibling questions',
        detail:
          `its answer ${value} is reconstructable as ${d} from numbers visible elsewhere in the pack` +
          `${reproducesWorking ? ', which is the question\u2019s own working' : ' (operands are not its own working \u2014 may be coincidence)'}`,
      })
    }
    for (const value of requiredValues(q, packValues)) {
      const d = derivation(value, pool)
      if (d) {
        record('warning', {
          kind: 'reconstructable-input-leakage',
          questionId: q.id,
          exposedBy: 'sibling questions',
          detail: `${value}, which it must take from the source, is reconstructable as ${d}`,
        })
      }
    }

    /* --- prose leakage: a sibling restating this question's key ------------ */
    const correct = q.options.find((o) => o.id === q.correctOptionId)
    if (correct) {
      for (const s of siblings) {
        for (const text of [s.stem, ...optionText(s)]) {
          if (containment(correct.text, text) < proseThreshold) continue
          record('warning', {
            kind: 'prose-answer-leakage',
            questionId: q.id,
            exposedBy: s.id,
            detail: `a sibling restates its key ("${correct.text}") almost word for word`,
          })
        }
      }
    }
  }

  return { errors, warnings, findings }
}
