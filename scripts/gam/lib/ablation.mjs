/**
 * Source-dependency checking (spec §5.6).
 *
 * Two ablations, with very different strength, and it matters not to conflate
 * them:
 *
 *   TARGETED ablation is fully mechanical and decisive. Remove the blocks a
 *   question declares it depends on; if the evidence backing the answer is still
 *   available from the remaining blocks, `dependsOn` is wrong.
 *
 *   FULL ablation asks whether the question is answerable from general knowledge
 *   with no pack at all. That question cannot be settled by string processing.
 *   What this module does is (a) compute proxies that catch the obvious failures
 *   and (b) emit the exact blind view an independent answerer must be given, so
 *   the judgement is made on evidence rather than on the author's say-so.
 *
 * The author of a question is the worst possible judge of whether it can be
 * answered without the source, because they already know the answer. The
 * artefacts exist so that judgement can be delegated.
 */
import { blockText } from './validate.mjs'

const STOP = new Set([
  'the', 'a', 'an', 'of', 'to', 'in', 'is', 'are', 'was', 'were', 'be', 'been',
  'and', 'or', 'not', 'that', 'this', 'these', 'those', 'it', 'its', 'as', 'at',
  'by', 'for', 'from', 'on', 'with', 'which', 'what', 'when', 'where', 'how',
  'than', 'then', 'so', 'if', 'but', 'each', 'every', 'all', 'any', 'both',
  'one', 'two', 'three', 'more', 'most', 'less', 'least', 'same', 'other',
  'according', 'following', 'question', 'text', 'statement', 'about', 'does',
  'do', 'has', 'have', 'can', 'may', 'must', 'would', 'will', 'their', 'they',
])

const words = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))

/** What a blind answerer sees under full ablation: the question, and nothing else. */
export function blindView(question) {
  return {
    questionId: question.id,
    stem: question.stem,
    options: question.options.map((o) => ({ id: o.id, text: o.text })),
  }
}

/** What they see under targeted ablation: the pack minus the declared dependencies. */
export function targetedView(pack, question) {
  return {
    questionId: question.id,
    remainingBlocks: pack.blocks
      .filter((b) => !question.dependsOn.includes(b.id))
      .map((b) => ({ id: b.id, text: blockText(b) })),
    stem: question.stem,
    options: question.options.map((o) => ({ id: o.id, text: o.text })),
  }
}

/**
 * Mechanical checks. Errors here are decisive; signals are inputs to a human
 * judgement, not verdicts.
 */
export function analyse(pack, question) {
  const errors = []
  const signals = []

  /* -- targeted ablation: is the evidence really gone once dependsOn is removed? -- */
  const remaining = pack.blocks.filter((b) => !question.dependsOn.includes(b.id))
  for (const span of question.supportSpans) {
    const elsewhere = remaining.find((b) => blockText(b).includes(span.quote))
    if (elsewhere) {
      errors.push(
        `targeted ablation: support quote from "${span.blockId}" is still available in "${elsewhere.id}", ` +
          'so dependsOn does not capture what the answer actually needs',
      )
    }
  }

  /* -- does the cited evidence add anything the question does not already say? -- */
  const questionWords = new Set(words([question.stem, ...question.options.map((o) => o.text)].join(' ')))
  const supportWords = words(question.supportSpans.map((s) => s.quote).join(' '))
  const novel = supportWords.filter((w) => !questionWords.has(w))
  const novelShare = supportWords.length ? novel.length / supportWords.length : 0
  // A `retrieve` question legitimately restates the source — that is the task —
  // so the overlap only carries information for the other reasoning types.
  // Retrieval and exhibit reads legitimately restate the source — that is the
  // task. Formulas tokenise into almost nothing, so the ratio is meaningless
  // for them too. The signal is only informative for the reasoning types where
  // the correct option ought to say something the source does not already say.
  const allSupportFromFormulas = question.supportSpans.every(
    (s) => pack.blocks.find((b) => b.id === s.blockId)?.kind === 'formula',
  )
  const exempt =
    question.reasoning === 'retrieve' ||
    question.reasoning === 'read-exhibit' ||
    allSupportFromFormulas
  if (supportWords.length && novelShare < 0.2 && !exempt) {
    signals.push(
      `full ablation: the correct option restates its supporting evidence closely ` +
        `(${Math.round(novelShare * 100)}% novel wording) — confirm the option cannot be matched to the ` +
        'source by wording alone',
    )
  }

  /* -- computational questions: are all the inputs in the stem? -- */
  if (question.computation) {
    const stemNumbers = new Set(
      [...question.stem.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((m) => m[0].replace(/,/g, '')),
    )
    const used = [...question.computation.expression.matchAll(/\d+(?:\.\d+)?/g)].map((m) => m[0])
    const fromPack = used.filter((n) => !stemNumbers.has(n))
    if (fromPack.length === 0) {
      signals.push(
        'full ablation: every number in the computation appears in the stem, so only the rule comes from ' +
          'the pack — confirm the rule is not common knowledge',
      )
    }
  }

  /* -- a question depending on no rule-bearing block is a retrieval-only item -- */
  const kinds = new Set(
    question.dependsOn.map((id) => pack.blocks.find((b) => b.id === id)?.kind).filter(Boolean),
  )
  if (question.reasoning !== 'retrieve' && question.reasoning !== 'read-exhibit' && kinds.size === 0) {
    errors.push('dependsOn resolves to no blocks at all')
  }

  return { errors, signals, novelShare }
}

/** Everything an independent adjudicator needs, per pack. */
export function buildArtifacts(file) {
  const { pack, questions } = file
  return {
    packId: pack.id,
    domain: pack.domain,
    generatedFor: 'independent blind re-answer and full-ablation adjudication (spec §5.3, §5.6)',
    instructions:
      'For each question below: (1) FULL ABLATION — using only the stem and options, with no access to ' +
      'the source pack, decide whether the answer can be determined. If it can, the question fails. ' +
      '(2) BLIND RE-ANSWER — read the pack, then choose an option without seeing the answer key. ' +
      'Disagreement with the key, or a defensible case for a second option, rejects the item.',
    questions: questions.map((q) => ({
      ...blindView(q),
      withPack: {
        blocks: pack.blocks.map((b) => ({ id: b.id, kind: b.kind, text: blockText(b) })),
      },
    })),
  }
}
