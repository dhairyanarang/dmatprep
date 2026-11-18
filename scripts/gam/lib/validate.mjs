/**
 * GAM pack validation.
 *
 * Implements the gates in DMAT_GAM_AUTHORING_SPEC.md §5. Everything here is
 * mechanical. The two gates that cannot be fully mechanised — adversarial blind
 * re-answer and human review — live in `ablation.mjs` and the review log
 * respectively, and this module deliberately does not pretend to cover them.
 *
 * The honest summary: these checks prove that a pack is *internally coherent and
 * traceable*. They do not prove the answer is right the way Module A's solver
 * does, and nothing here should be read as if they did.
 */
import { createHash } from 'node:crypto'
import { closeEnough, evaluate } from './arith.mjs'
import { overlaps } from './ngrams.mjs'

export const GAM_DOMAINS = [
  'mathematics', 'computational-sciences', 'natural-sciences', 'engineering',
  'business-administration', 'economics', 'social-sciences', 'humanities',
]

export const REASONING_TYPES = [
  'retrieve', 'read-exhibit', 'apply-formula', 'qualitative-inference',
  'comparative', 'sensitivity', 'generalisation', 'classify-scenario',
]

export const DISTRACTOR_FAMILIES = [
  'misapplied-formula', 'swapped-quantities', 'wrong-direction-of-effect',
  'right-concept-wrong-scope', 'plausible-but-unstated', 'contradicts-source',
  'arithmetic-slip',
]

export const REVIEW_STATUSES = ['draft', 'automated-pass', 'human-reviewed', 'rejected']

/**
 * Words a candidate may be expected to know without the pack defining them:
 * ordinary academic register, not subject facts. Deliberately short — anything
 * outside it is escalated for a human to look at, which is the point.
 */
const GENERAL_LEXICON = new Set([
  'figure', 'table', 'text', 'according', 'statement', 'following', 'question',
  'total', 'value', 'values', 'number', 'quantity', 'rate', 'period', 'level',
  'increase', 'decrease', 'change', 'compare', 'result', 'unit', 'units',
  'euros', 'metres', 'kelvin', 'watts', 'square', 'per', 'cost', 'costs',
  'price', 'output', 'record', 'records', 'size', 'sizes', 'line', 'lines',
  'layer', 'layers', 'wall', 'document', 'author', 'account', 'accounts',
  'evidence', 'historian', 'century', 'analysis', 'routine', 'routines',
  'program', 'catalogue', 'workshop', 'product', 'profit', 'loss', 'margin',
  'flow', 'heat', 'temperature', 'thickness', 'area', 'insulation', 'brick',
])

/* --------------------------------------------------------------- utilities */

/** All searchable prose of a block, so a support span can be checked against it. */
export function blockText(block) {
  switch (block.kind) {
    case 'heading':
    case 'paragraph':
      return block.text
    case 'list':
      return block.items.join(' ')
    case 'formula':
      return [block.latex, block.caption ?? '', ...(block.legend ?? []).flatMap((l) => [l.symbol, l.meaning])].join(' ')
    case 'table':
      return [block.caption, ...block.columns, ...block.rows.flat()].join(' ')
    case 'figure': {
      const s = block.spec ?? {}
      const parts = (s.parts ?? []).flatMap((p) => [p.label, p.detail ?? ''])
      const series = (s.series ?? []).map((x) => x.label)
      const notes = (s.annotations ?? []).flatMap((a) => [a.label ?? '', a.detail ?? ''])
      return [block.caption, s.xLabel ?? '', s.yLabel ?? '', ...parts, ...series, ...notes].join(' ')
    }
    default:
      return ''
  }
}

const packText = (pack) => pack.blocks.map(blockText).join(' ')
const questionText = (q) => [q.stem, ...q.options.map((o) => o.text)].join(' ')

/** Numbers as written, normalised so "1,024" and "1024" compare equal. */
const numbersIn = (text) =>
  [...String(text).matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => m[0].replace(/,/g, ''))

export function contentHash(file) {
  return createHash('sha256')
    .update(JSON.stringify({ pack: { ...file.pack, contentHash: undefined }, questions: file.questions }))
    .digest('hex')
    .slice(0, 32)
}

/* ------------------------------------------------------------------ checks */

export function validatePack(file, { corpus } = {}) {
  const errors = []
  const warnings = []
  const { pack, questions } = file
  const E = (m) => errors.push(m)
  const W = (m) => warnings.push(m)

  /* -- pack structure -- */
  if (!pack?.id) E('pack has no id')
  if (!GAM_DOMAINS.includes(pack?.domain)) E(`unknown domain "${pack?.domain}"`)
  if (!pack?.title) E('pack has no title')
  if (!Array.isArray(pack?.blocks) || pack.blocks.length === 0) E('pack has no blocks')
  if (pack?.provenance?.originality !== 'original') E('pack is not declared original')
  if (!REVIEW_STATUSES.includes(pack?.provenance?.reviewStatus)) {
    E(`unknown reviewStatus "${pack?.provenance?.reviewStatus}"`)
  }

  const blocks = new Map()
  for (const b of pack?.blocks ?? []) {
    if (!b.id) E('a block has no id')
    else if (blocks.has(b.id)) E(`duplicate block id "${b.id}"`)
    else blocks.set(b.id, b)
  }

  if (!Array.isArray(questions) || questions.length === 0) E('pack has no questions')

  const packProse = packText(pack ?? { blocks: [] })
  const packNumbers = new Set(numbersIn(packProse))

  /* -- originality (spec §5.7) -- */
  if (corpus) {
    const all = [packProse, ...(questions ?? []).map(questionText)].join(' ')
    const hits = overlaps(all, corpus)
    for (const hit of hits.slice(0, 5)) {
      E(`originality: 8-gram matches the official material — "${hit.gram}"`)
    }
    if (hits.length > 5) E(`originality: ${hits.length} overlapping 8-grams in total`)
  }

  const seenQuestionIds = new Set()

  for (const q of questions ?? []) {
    const at = (m) => `${q.id ?? '(no id)'}: ${m}`

    if (!q.id) E('a question has no id')
    else if (seenQuestionIds.has(q.id)) E(`duplicate question id "${q.id}"`)
    else seenQuestionIds.add(q.id)
    if (q.packId !== pack?.id) E(at(`packId "${q.packId}" does not match the pack`))
    if (!q.stem || q.stem.length < 15) E(at('stem is missing or trivial'))

    /* -- exactly four options, exactly one correct (OFFICIAL, GAM PDF p. 34) -- */
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      E(at(`${q.options?.length ?? 0} options; the official format is exactly 4`))
    } else {
      const ids = q.options.map((o) => o.id)
      if (new Set(ids).size !== 4) E(at('duplicate option ids'))
      const texts = q.options.map((o) => o.text.trim().toLowerCase())
      if (new Set(texts).size !== 4) E(at('two options have the same text'))
      for (const o of q.options) if (!o.text?.trim()) E(at(`option ${o.id} is empty`))
    }
    const correct = q.options?.find((o) => o.id === q.correctOptionId)
    if (!correct) E(at(`correctOptionId "${q.correctOptionId}" is not one of the options`))

    if (!REASONING_TYPES.includes(q.reasoning)) E(at(`unknown reasoning type "${q.reasoning}"`))
    if (!['low', 'medium', 'high'].includes(q.difficulty)) E(at(`bad difficulty "${q.difficulty}"`))

    /* -- support spans resolve and quote verbatim (spec §5.1) -- */
    if (!Array.isArray(q.supportSpans) || q.supportSpans.length === 0) {
      E(at('no support spans — the answer is not traced to the source'))
    }
    for (const span of q.supportSpans ?? []) {
      const block = blocks.get(span.blockId)
      if (!block) {
        E(at(`support span cites unknown block "${span.blockId}"`))
        continue
      }
      if (!blockText(block).includes(span.quote)) {
        E(at(`support quote is not present verbatim in block "${span.blockId}": "${span.quote.slice(0, 60)}"`))
      }
    }

    /* -- dependency bookkeeping (spec §5.5) -- */
    if (!Array.isArray(q.dependsOn) || q.dependsOn.length === 0) E(at('dependsOn is empty'))
    for (const id of q.dependsOn ?? []) {
      if (!blocks.has(id)) E(at(`dependsOn cites unknown block "${id}"`))
    }
    const spanBlocks = new Set((q.supportSpans ?? []).map((s) => s.blockId))
    for (const id of spanBlocks) {
      if (!(q.dependsOn ?? []).includes(id)) {
        E(at(`block "${id}" is quoted in support but missing from dependsOn`))
      }
    }
    const refBlocks = new Set(Object.values(q.refutations ?? {}).map((r) => r.blockId))
    for (const id of q.dependsOn ?? []) {
      if (!spanBlocks.has(id) && !refBlocks.has(id)) {
        E(at(`dependsOn lists "${id}" but nothing quotes or cites it — phantom dependency`))
      }
    }

    /* -- refutations, one per wrong option (spec §5.4) -- */
    const wrongIds = (q.options ?? []).filter((o) => o.id !== q.correctOptionId).map((o) => o.id)
    for (const id of wrongIds) {
      const r = q.refutations?.[id]
      if (!r) {
        E(at(`option ${id} has no refutation`))
        continue
      }
      if (!blocks.has(r.blockId)) E(at(`refutation for ${id} cites unknown block "${r.blockId}"`))
      if (!DISTRACTOR_FAMILIES.includes(r.family)) {
        E(at(`refutation for ${id} has unknown family "${r.family}"`))
      }
      if (!r.reason || r.reason.length < 20) E(at(`refutation for ${id} gives no substantive reason`))
    }
    for (const id of Object.keys(q.refutations ?? {})) {
      if (id === q.correctOptionId) E(at('the correct option has a refutation'))
      else if (!wrongIds.includes(id)) E(at(`refutation for unknown option "${id}"`))
    }

    /* -- computation re-check (spec §5.1) -- */
    if (q.computation) {
      let value
      try {
        value = evaluate(q.computation.expression)
      } catch (e) {
        E(at(`computation does not evaluate: ${e.message}`))
      }
      if (value !== undefined) {
        if (!closeEnough(value, q.computation.expected)) {
          E(at(`computation gives ${value}, but expected is ${q.computation.expected}`))
        }
        const optionNumbers = numbersIn(correct?.text ?? '').map(Number)
        if (optionNumbers.length && !optionNumbers.some((n) => closeEnough(n, q.computation.expected))) {
          E(at(`computed ${q.computation.expected} does not appear in the correct option "${correct.text}"`))
        }
      }
    }

    /* -- explanation and hints (spec §4.5) -- */
    if (!q.explanation || q.explanation.length < 40) E(at('explanation is missing or trivial'))
    if (!Array.isArray(q.hints) || q.hints.length !== 3) E(at('expected exactly 3 hints'))
    else {
      if (q.hints.map((h) => h.level).join(',') !== '1,2,3') E(at('hint levels are not 1,2,3'))
      for (const h of q.hints) if (!h.text || h.text.length < 20) E(at(`hint ${h.level} is too thin`))
      const hintText = q.hints.map((h) => h.text).join(' ').toLowerCase()
      if (correct && hintText.includes(correct.text.trim().toLowerCase()) && correct.text.length > 6) {
        E(at('a hint repeats the correct option verbatim'))
      }
      if (q.computation) {
        const answer = String(q.computation.expected)
        if (new RegExp(`(^|[^0-9.])${answer}([^0-9.]|$)`).test(hintText)) {
          E(at(`a hint contains the computed answer ${answer}`))
        }
      }
    }

    /* -- outside knowledge (spec §5.2) — escalates, never certifies -- */
    // A number in the STEM is an input the candidate is given, so it must come
    // from the pack or be introduced by the question itself; anything else is a
    // value the candidate would have to know already. Numbers in the OPTIONS are
    // candidate answers, and are expected to be new whenever the item states the
    // computation that produces them.
    // "Table 1" and "Figure 2" name exhibits; they are not quantities the
    // candidate has to be given.
    const stemWithoutExhibitRefs = q.stem.replace(/\b(?:table|figure)\s+\d+/gi, ' ')
    const stemNumbers = numbersIn(stemWithoutExhibitRefs)
    const computationNumbers = new Set(numbersIn(q.computation?.expression ?? ''))
    for (const n of stemNumbers) {
      if (packNumbers.has(n) || computationNumbers.has(n)) continue
      W(at(`stem introduces the number "${n}", which is not in the pack — confirm it is given by the question, not assumed knowledge`))
    }
    // Named concepts. A capitalised term appearing mid-sentence in a question is
    // usually a named law, theorem, unit or model. If the pack never mentions it,
    // the question is leaning on knowledge the candidate must already hold, which
    // GAM PDF p. 6 rules out ("not memorized factual knowledge").
    // The stem and each option start their own sentence, so they are scanned
    // separately — an option beginning "None of the three lines" must not have
    // its first word treated as a mid-sentence capital.
    for (const text of [q.stem, ...(q.options ?? []).map((o) => o.text)]) {
      for (const sentence of String(text).split(/(?<=[.?!:])\s+/)) {
        const tokens = sentence.trim().split(/\s+/)
        for (const [i, raw] of tokens.entries()) {
          if (i === 0) continue
          // Drop possessives so "PAIR's" is recognised as the pack's own "PAIR".
          const word = raw.replace(/[^A-Za-z'\u2019]/g, '').replace(/['\u2019]s$/i, '')
          if (word.length < 4 || !/^[A-Z]/.test(word)) continue
          if (word === word.toUpperCase()) continue // acronyms and pack-defined names
          const lower = word.toLowerCase()
          if (GENERAL_LEXICON.has(lower)) continue
          // The token has had its punctuation stripped, so the pack must be
          // compared the same way — otherwise a term the pack defines with a
          // hyphen ("U-value") reads as one it never mentions.
          if (packProse.toLowerCase().includes(lower)) continue
          if (packProse.toLowerCase().replace(/[^a-z0-9\s]/g, '').includes(lower)) continue
          W(at(`names "${word}", which the pack never mentions — confirm it is not assumed knowledge`))
        }
      }
    }

    if (!q.computation) {
      const stemSet = new Set(stemNumbers)
      for (const o of q.options ?? []) {
        for (const n of numbersIn(o.text)) {
          if (packNumbers.has(n) || stemSet.has(n)) continue
          W(at(`option ${o.id} uses the number "${n}", which appears nowhere in the pack or stem and the item records no computation`))
        }
      }
    }
    /* -- surface-cue proxy: the key must not be guessable from shape alone -- */
    if (q.options?.length === 4 && correct) {
      const lengths = q.options.map((o) => o.text.length)
      const longest = Math.max(...lengths)
      const others = lengths.filter((l) => l !== longest)
      if (
        correct.text.length === longest &&
        longest > 1.6 * Math.max(...others, 1) &&
        lengths.filter((l) => l === longest).length === 1
      ) {
        W(at('the correct option is much longer than every other — a shape cue'))
      }
    }
  }

  /* ---- option sets must not reconstruct a quantity the source withholds ----
   *
   * Found twice by ablation and invisible to every other gate, because it is
   * not cross-question leakage — the question gives itself away on its own.
   *
   * gam-econ-pt-001-q1 offers 200, 480, 481.60 and 484 against a stem tonnage
   * of 120.4. Three of those are one rate under three roundings — 120 x 4,
   * 120.4 x 4, 121 x 4 — and 481.60 / 120.4 is exactly 4.00. The per-tonne rate
   * the item exists to test is recoverable from the options alone, leaving only
   * the rounding rule to be read.
   *
   * Two shapes are checked. RATE CLUSTER: two or more options divide a number
   * in the stem to the same round quotient. COMPOSITION: one option is the
   * product of two others over a stem number, which is how a two-stage rate
   * pair leaks (5,000 items with options 6, 60, 400, 750 gives 60 = 400 x 750
   * / 5,000, exposing 8% and 15%).
   *
   * A warning, not an error: it is a design smell a reviewer should weigh, and
   * both known instances are on committed items that are otherwise sound.
   */
  for (const q of questions) {
    const values = (q.options ?? [])
      .map((o) => Number(String(o.text).replace(/[^0-9.]/g, '')))
      .filter((n) => Number.isFinite(n) && n > 0)
    if (values.length < 3) continue

    const stemNumbers = [...String(q.stem ?? '').matchAll(/\d[\d,]*\.?\d*/g)]
      .map((m) => Number(m[0].replace(/,/g, '')))
      .filter((n) => Number.isFinite(n) && n > 1)
    if (!stemNumbers.length) continue

    // An EXACT round quotient is the tell: 481.60 / 120.4 is 4.0000 on the
    // nose, which does not happen by accident in a distractor set. One exact
    // hit plus any other option within 2% of the same quotient means two or
    // more options are the same rate under different roundings.
    const exactlyRound = (x) => x > 0 && Math.abs(x - Number(x.toFixed(2))) < 1e-9

    for (const s of stemNumbers) {
      const quotients = values.map((v) => ({ value: v, q: v / s }))
      for (const anchor of quotients.filter((x) => exactlyRound(x.q))) {
        const near = quotients.filter((x) => Math.abs(x.q - anchor.q) <= 0.02 * anchor.q)
        if (near.length >= 2) {
          W(
            `${q.id}: ${near.length} of its options (${near.map((x) => x.value).join(', ')}) are the ` +
              `same rate of ${anchor.q} per unit of the stem value ${s}, under different roundings — ` +
              `the option set discloses a quantity the source is meant to supply`,
          )
          break
        }
      }

      // One option being the product of two others over a stem number exposes a
      // two-stage rate pair. Ordered pairs only, so a x b is not also b x a.
      const seen = new Set()
      for (const target of values) {
        for (let i = 0; i < values.length; i++) {
          for (let j = i + 1; j < values.length; j++) {
            const [a, b] = [values[i], values[j]]
            if (a === target || b === target) continue
            if (Math.abs((a * b) / s - target) < 0.005 * target && !seen.has(target)) {
              seen.add(target)
              W(
                `${q.id}: option ${target} is ${a} x ${b} / ${s} — the option set composes a ` +
                  `two-stage rate pair the source is meant to supply`,
              )
            }
          }
        }
      }
    }
  }

  /* -- declared vocabulary really is defined in the pack -- */
  for (const term of pack?.defines ?? []) {
    if (!packProse.toLowerCase().includes(term.toLowerCase())) {
      E(`pack declares it defines "${term}" but that term does not appear in its blocks`)
    }
  }

  /* -- content integrity (spec §5.7) -- */
  const expectedHash = contentHash(file)
  if (pack?.contentHash && pack.contentHash !== expectedHash) {
    E(`contentHash is ${pack.contentHash} but the content hashes to ${expectedHash}`)
  }

  return { errors, warnings, contentHash: expectedHash }
}
