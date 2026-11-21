/**
 * How a question's claim to resemble the real exam is actually grounded.
 *
 * One `dmatAlignment` string was being asked to carry four different claims at
 * once, and because it was hardcoded to `officially_documented` in all three
 * generators it carried none of them truthfully. 473 of 473 questions asserted
 * that the exam documents them. The repository's own contract already said
 * otherwise in at least one place: ME_CONTRACT puts the four-option answer
 * format under `review`, noting that "the four-option single-choice format
 * comes from d-mat.de" and "the option count is not" documented.
 *
 * So the claim is split into the four things it was conflating, and derived
 * from the question rather than asserted over it:
 *
 *   format         what the candidate is shown
 *   answerFormat   how they are asked to respond
 *   mechanics      what the item actually tests
 *   originality    where the content came from
 *
 * The first two use the four-grade vocabulary CLAUDE.md already defines for
 * every dMAT fact — stated, demonstrated, inferred, unknown — because they are
 * claims about the official material, and that is how this repository grades
 * claims about the official material. `unknown` is never filled with a guess.
 */
import { FS_CONTRACT, ME_CONTRACT, LS_CONTRACT } from './contract.mjs'

/** Claims about the official material, strongest first. */
export const GRADES = ['stated', 'demonstrated', 'inferred', 'unknown']

/** Claims about the item's mechanics, strongest first. */
export const MECHANIC_GRADES = ['documented', 'extrapolated', 'unsupported']

/**
 * Format and answer format are properties of a subtest, not of an item, so they
 * are recorded once here with the source that establishes them. Every grade is
 * traceable to CLAUDE.md's verified-fact table or to the authoring spec.
 */
export const SECTION_PROVENANCE = {
  'figure-sequences': {
    answerOptionCount: {
      grade: 'demonstrated',
      why: 'Three response options per image, shown in every worked solution on GAM PDF pp. 13-16. Never stated as a number in words.',
    },
    format: {
      grade: 'demonstrated',
      why: 'Four matrices shown, the 5th and 6th predicted, three options each — shown throughout GAM PDF pp. 13-16 and in every worked solution. The 4×4 grid is never stated in words; it was read from the diagrams.',
    },
    answerFormat: {
      grade: 'stated',
      why: 'The material names "response options" for this subtest — one of the three task types for which it names an answer format at all — and GAM PDF pp. 13-16 show three options per image, with every worked solution reporting a choice for both images.',
    },
  },
  'mathematical-equations': {
    // THE one `unknown` in the bank, and it stays unknown.
    answerOptionCount: {
      grade: 'unknown',
      why: 'No official source states how many options a Mathematical Equations item offers. The preparatory material presents these exercises with no options at all — they are open-response with worked solutions. Our four-option form is inferred from d-mat.de and is recorded as `review` in ME_CONTRACT.review.fourOptionFormat. It must never be presented as documented.',
    },
    format: {
      grade: 'demonstrated',
      why: 'Equation systems with one integer solution per letter, GAM PDF p. 17 and Examples 1-2. Both question forms are demonstrated: Example 1 asks for one letter, Example 2 asks for two.',
    },
    answerFormat: {
      // Upgraded 14 November 2026 on new official evidence, and only this far.
      // The FAQ for Indian graduates now says, in a passage whose two preceding
      // sentences are about the Core Module and the General Academic Module,
      // "All questions are single-choice questions." Read in that scope it
      // covers Mathematical Equations, so the KIND of answer format is stated.
      //
      // It settles nothing about how many options there are, which is why
      // `answerOptionCount` above is still `unknown` and why every ME item still
      // rolls up to `reasonable_extrapolation`. The claim got more precise, not
      // stronger. Caution worth keeping: that sentence is a summary written for
      // candidates, and it sits on a page that still prints the superseded 2026
      // test cycle — weaker evidence than the preparatory PDF would be.
      grade: 'stated',
      why: 'd-mat.de/en/faq-graduate-students-india, read 14 November 2026: "All questions are single-choice questions." The sentence follows two describing the Core Module and the General Academic Module, so it covers this subtest. It fixes the kind of answer format and says nothing about the number of options.',
    },
  },
  'latin-squares': {
    answerOptionCount: {
      grade: 'demonstrated',
      why: 'GAM PDF p. 24 constrains the options — only letters appearing in the response row may be offered — and the worked exercises show the resulting set. The count follows from the response row rather than from a stated number.',
    },
    format: {
      grade: 'stated',
      why: '5×5, letters A-E, each exactly once per row and column, and only response-row letters may appear — GAM PDF p. 24.',
    },
    answerFormat: {
      grade: 'stated',
      why: 'The material names "response options" for this subtest, and GAM PDF p. 24 constrains them explicitly: only letters appearing in the response row may be offered. That is a stated rule about the answer format, not an inference from the examples.',
    },
  },
}

/** Everything in this bank is generated by us and verified by a solver. */
const ORIGINALITY = 'original-generated'

const worst = (scale, a, b) => (scale.indexOf(a) >= scale.indexOf(b) ? a : b)

/**
 * What the item tests, against its section's contract.
 *
 * `documented` — every mechanic is in `allowed`, at attested parameters.
 * `extrapolated` — uses something the contract files under `review`: composed
 *   from documented parts, or covered by a stated rule no exercise demonstrates.
 * `unsupported` — uses something `forbidden` or absent from `allowed`.
 */
export function classifyMechanics(q) {
  if (q.meta?.quarantined) return { grade: 'unsupported', notes: ['quarantined'] }
  const notes = []
  let grade = 'documented'
  const down = (g, note) => {
    grade = worst(MECHANIC_GRADES, grade, g)
    notes.push(note)
  }

  if (q.kind === 'figure-sequence') {
    const { allowed, review } = FS_CONTRACT
    const symbols = Object.keys(q.rules ?? {}).length
    if (symbols > allowed.maxSymbols) down('unsupported', `${symbols} symbols`)
    // Shape lives on the panels, not on the rule, so a rotating symbol's
    // carrier has to be looked up before it can be graded.
    const shapeOf = new Map((q.given?.[0]?.symbols ?? []).map((s) => [s.id, s.shape]))
    for (const [sym, r] of Object.entries(q.rules ?? {})) {
      if (r.rotation?.type === 'rotate') {
        const shape = shapeOf.get(sym)
        if (shape && review.rotationShapes.includes(shape)) {
          down('extrapolated', `${sym}: rotation on a ${shape}, which no official exercise rotates`)
        } else if (shape && !allowed.rotationShapes.includes(shape)) {
          down('unsupported', `${sym}: rotation on a ${shape}, where a quarter turn is not legible`)
        }
      }
      const m = r.movement ?? {}
      if (!allowed.movementTypes.includes(m.type)) {
        if (m.type === 'static' && review.staticRotatingSymbol) down('extrapolated', `${sym}: static rotating symbol`)
        else down('unsupported', `${sym}: movement type "${m.type}"`)
      }
      if (r.rotation?.type === 'rotate' && !allowed.rotationDegrees.includes(r.rotation.degrees)) {
        down('extrapolated', `${sym}: ${r.rotation.degrees}° rotation`)
      }
      if (r.colour?.type === 'cycle') {
        if (r.colour.accelerating) down('extrapolated', `${sym}: accelerating colour cycle`)
        if ((r.colour.colours ?? []).includes('white')) down('extrapolated', `${sym}: white in the colour cycle`)
      }
    }
  }

  if (q.kind === 'math-equations') {
    const text = (q.equations ?? []).join(' ')
    const consts = text.match(/\d+/g) ?? []
    if (consts.some((n) => Number(n) > ME_CONTRACT.review.constantsAbove)) {
      down('extrapolated', `constant above ${ME_CONTRACT.review.constantsAbove}`)
    }
    if (!ME_CONTRACT.allowed.variableCounts.includes((q.variables ?? []).length)) {
      down('unsupported', `${(q.variables ?? []).length} letters`)
    }
    // A letter multiplied by a letter. No official exercise does this; it is
    // permitted on first-hand testimony about the live exam alone, so an item
    // that uses it must never read as officially documented. Squares and
    // products are reported separately because they are different claims: a
    // square is a factor lookup, a product is a divisor-pair search.
    const square = /\b([A-Z])\s*×\s*\1\b/.test(text)
    const product = /\b([A-Z])\s*×\s*(?!\1\b)[A-Z]\b/.test(text)
    if (square) down('extrapolated', 'letter squared (A × A) — not in the official exercises')
    if (product) down('extrapolated', 'letter × letter — not in the official exercises')
  }

  if (q.kind === 'latin-square') {
    const { allowed, review } = LS_CONTRACT
    if (q.size !== allowed.size) down('unsupported', `${q.size}×${q.size} grid`)
    for (const step of q.solutionSteps ?? []) {
      if (step.technique && !allowed.techniques.includes(step.technique)) {
        down('unsupported', `technique "${step.technique}"`)
      }
    }
    const depth = q.forcedPlacementDepth ?? 0
    if (depth > allowed.maxDepth) down('unsupported', `deduction depth ${depth}`)
    else if (depth >= 6) down('extrapolated', review.deepChain)
    const filled = (q.grid ?? []).flat().filter((c) => c != null).length
    const cells = (q.size ?? 5) ** 2
    if (cells && filled / cells < 0.2) down('extrapolated', review.sparseGrid)
  }

  return { grade, notes }
}

/**
 * The single grade the rest of the pipeline still gates on, derived rather than
 * asserted. It is the most conservative of the four axes, so a question can
 * never claim more than its weakest ground.
 */
export function rollUp({ answerFormat, answerOptionCount, mechanics }) {
  if (mechanics === 'unsupported') return 'uncertain'
  if (mechanics === 'extrapolated') return 'reasonable_extrapolation'
  // Either half of the answer claim being unsettled is enough. Knowing an item
  // is single-choice while not knowing how many choices it offers does not make
  // our four-option form documented.
  for (const grade of [answerFormat, answerOptionCount]) {
    if (grade === 'unknown' || grade === 'inferred') return 'reasonable_extrapolation'
  }
  return 'officially_documented'
}

/** The complete provenance record for one question. */
export function classify(q) {
  const section = SECTION_PROVENANCE[q.section]
  if (!section) throw new Error(`no provenance defined for section "${q.section}"`)
  const mechanics = classifyMechanics(q)
  const provenance = {
    format: section.format.grade,
    answerFormat: section.answerFormat.grade,
    answerOptionCount: section.answerOptionCount.grade,
    mechanics: mechanics.grade,
    originality: ORIGINALITY,
  }
  if (mechanics.notes.length) provenance.mechanicNotes = mechanics.notes
  return {
    provenance,
    dmatAlignment: rollUp({
      answerFormat: provenance.answerFormat,
      answerOptionCount: provenance.answerOptionCount,
      mechanics: provenance.mechanics,
    }),
  }
}

/**
 * Apply the derived provenance to a question, in place, and return it.
 *
 * Every path that produces a question must go through this — the batch
 * pipeline and the seed-rebuild path both do — so that an item is identical
 * whichever way it was made. Provenance is a pure function of the question's
 * content, so this adds no non-determinism.
 */
export function stampProvenance(q) {
  const graded = classify(q)
  q.meta.dmatAlignment = graded.dmatAlignment
  q.meta.provenance = graded.provenance
  return q
}
