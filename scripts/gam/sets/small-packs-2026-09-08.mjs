/**
 * Authoring experiment, 8 September 2026 — do smaller source packs leak less?
 *
 * THE HYPOTHESIS, which this pass exists to test and not to confirm:
 *
 *   Fewer questions per source pack reduce sibling-information leakage while
 *   allowing each question to remain genuinely source-dependent.
 *
 * Four packs of four questions, in the four domains the active pilot does not
 * cover. They are written into content/gam/experiments/, not content/gam/packs/,
 * so they are gated by exactly the same checks without joining the deployed
 * pilot or being reachable by the app.
 *
 * THE DESIGN RULE THE OLD PILOT TAUGHT. The operation-counts pack was retired
 * because six of its seven questions were decisively coupled, and the mechanism
 * was arithmetic rather than editorial: every numeric option was a closed-form
 * function of a tabulated constant, so seven option lists became seven equations
 * and over-determined the table. The step-rebate pack failed the same way in
 * miniature — every option was a unit count times a band rate.
 *
 * So each pack here is built to two rules:
 *
 *   1. EACH SOURCE STATES FOUR DISTINCT RULES, AND EACH QUESTION TARGETS A
 *      DIFFERENT ONE. Two questions turning on one rule is how a pack asks the
 *      same thing twice, which is what coupling is.
 *   2. AT MOST ONE QUESTION PER PACK OFFERS OPTIONS THAT ARE A FUNCTION OF THE
 *      SOURCE'S OWN CONSTANTS. Where a second numeric question is wanted, its
 *      data comes from its own stem, so its option list says nothing about the
 *      source. Where a numeric question is unavoidable, its distractors are
 *      chosen so that no source constant can be read back out of them.
 *
 * Four and five are an authoring range for this experiment. They are not a dMAT
 * rule, the official material states no per-exercise question count (its own
 * exercises carry 8, 6, 7 and 5), and nothing here encodes them as a gate.
 *
 * ORIGINALITY. Every scheme, convention, figure and scenario is written for this
 * repository. The official material is used as structural authority only — four
 * options, one correct, a source that must contribute — and none of its topics
 * is reused: no vectors, no hydrostatics, no order quantity, and no deductive
 * and inductive research strategies.
 */
import { writeFileSync } from 'node:fs'
import { contentHash } from '../lib/validate.mjs'

const dir = new URL('../../../content/gam/experiments/small-packs-2026-09-08/packs/', import.meta.url)

const NOTES =
  'Written for the smaller-pack authoring experiment of 8 September 2026. The source states four distinct ' +
  'rules and each question targets a different one, and at most one question offers options that are a ' +
  'function of the source’s own constants — the two design rules the retired operation-counts pack ' +
  'produced. The scheme and every figure in it are invented for this pack.'

function emit(pack, questions) {
  const file = {
    pack: {
      ...pack,
      provenance: {
        originality: 'original',
        draftedBy: 'experiment-small-packs-2026-09-08',
        reviewStatus: 'automated-pass',
        notes: NOTES,
        ...pack.provenance,
      },
    },
    questions: questions.map((q, i) => ({ ...q, id: `${pack.idStem}-q${i + 1}`, packId: pack.id })),
  }
  delete file.pack.idStem
  file.pack.contentHash = contentHash(file)
  writeFileSync(new URL(`${pack.id}.json`, dir), `${JSON.stringify(file, null, 2)}\n`)
  console.log(`${pack.id}: ${questions.length} questions · hash ${file.pack.contentHash}`)
}

/* ------------------------------------------------------------- mathematics */
// Four rules: uncertainties add for sums AND differences; relative uncertainties
// add for products; an uncertainty is quoted to one figure and fixes the value's
// last place; the convention assumes independent measurements.
//
// No source constant exists to leak: the convention is a set of rules, and every
// numeric question takes its data from its own stem. The table is read by one
// question and by nothing else.

emit(
  {
    id: 'gam-mathematics-uncertainty-convention-001',
    idStem: 'gam-math-uc-001',
    domain: 'mathematics',
    title: 'Stating and combining measurement uncertainty',
    defines: ['absolute uncertainty', 'relative uncertainty', 'worst-case convention'],
    blocks: [
      { kind: 'heading', id: 'h1', text: 'Stating and combining measurement uncertainty' },
      {
        kind: 'paragraph',
        id: 'p1',
        text:
          'Every measurement in this laboratory is reported with an uncertainty, written as a value followed by a plus-or-minus figure in the same unit. A length written as 50.0 ± 0.5 centimetres means the true length is taken to lie between 49.5 and 50.5 centimetres. The plus-or-minus figure is called the absolute uncertainty. The same uncertainty expressed as a fraction of the measured value is called the relative uncertainty, and is written as a percentage.',
      },
      {
        kind: 'paragraph',
        id: 'p2',
        text:
          'This laboratory follows a worst-case convention. When two measured quantities are added or subtracted, their absolute uncertainties are added. When two measured quantities are multiplied or divided, their relative uncertainties are added. The convention is deliberately cautious: it assumes the two errors fall the same way rather than partly cancelling, so the figure it gives is never smaller than the true combined uncertainty. Note that a difference is treated exactly as a sum is — subtracting one measurement from another cannot make the result more certain than either of them.',
      },
      {
        kind: 'paragraph',
        id: 'p3',
        text:
          'An uncertainty is quoted to one significant figure, and the measured value is then written to the same decimal place as its uncertainty. Digits beyond that place are not reported at all, because the uncertainty shows that they carry no information.',
      },
      {
        kind: 'table',
        id: 't1',
        caption: 'Four rods, as measured.',
        columns: ['Rod', 'Measured length', 'Absolute uncertainty'],
        rows: [
          ['Rod A', '250 mm', '5 mm'],
          ['Rod B', '40 mm', '1 mm'],
          ['Rod C', '8.0 mm', '0.3 mm'],
          ['Rod D', '1200 mm', '30 mm'],
        ],
      },
      {
        kind: 'paragraph',
        id: 'p4',
        text:
          'The convention holds only for measurements made independently of one another. Where two quantities are read from the same instrument at one setting, an error in that setting shifts both the same way, and combining them in the ordinary manner understates the uncertainty of the result.',
      },
    ],
  },
  [
    {
      stem:
        'One rod measures 24.0 ± 0.3 centimetres and another 15.0 ± 0.2 centimetres. According to the convention, what is the difference between their lengths?',
      options: [
        { id: 'a', text: '9.0 ± 0.1 cm' },
        { id: 'b', text: '9.0 ± 0.25 cm' },
        { id: 'c', text: '9.0 ± 0.36 cm' },
        { id: 'd', text: '9.0 ± 0.5 cm' },
      ],
      correctOptionId: 'd',
      reasoning: 'apply-formula',
      dependsOn: ['p2', 'p1'],
      supportSpans: [
        { blockId: 'p2', quote: 'When two measured quantities are added or subtracted, their absolute uncertainties are added.' },
        { blockId: 'p2', quote: 'subtracting one measurement from another cannot make the result more certain than either of them' },
        { blockId: 'p1', quote: 'The plus-or-minus figure is called the absolute uncertainty.' },
      ],
      explanation:
        'The lengths subtract to give 24.0 − 15.0 = 9.0 centimetres. The uncertainties do not. The convention treats a difference exactly as it treats a sum, so the two absolute uncertainties are added: 0.3 + 0.2. The text says why in as many words — a subtraction cannot leave the answer more certain than either measurement that went into it.',
      refutations: {
        a: {
          blockId: 'p2',
          family: 'wrong-direction-of-effect',
          reason:
            'This subtracts the uncertainties along with the lengths, which would make the difference of two rough measurements more certain than either. The text rules that out explicitly.',
        },
        b: {
          blockId: 'p2',
          family: 'misapplied-formula',
          reason:
            'This averages the two figures. The convention adds them; averaging would give a result smaller than the larger of the two uncertainties on its own.',
        },
        c: {
          blockId: 'p2',
          family: 'plausible-but-unstated',
          reason:
            'This combines the two in quadrature, which is a real convention but not the one this text sets out. Quadrature assumes the errors partly cancel; this laboratory assumes they do not.',
        },
      },
      computation: { expression: '0.3 + 0.2', expected: 0.5, unit: 'cm' },
      hints: [
        { level: 1, text: 'Work out the difference in the lengths first, then deal with the two plus-or-minus figures separately.' },
        { level: 2, text: 'Find the sentence that says how this laboratory treats a difference, as against how you might expect it to.' },
        { level: 3, text: 'The convention assumes the two errors fall the same way, so ask what that does to the figures.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 2, transferDistance: 2, requiresExhibit: false },
    },

    {
      stem:
        'The two sides of a rectangle are each measured to within 1 per cent. According to the convention, what can be said about the uncertainty in its area?',
      options: [
        { id: 'a', text: 'About half a per cent.' },
        { id: 'b', text: 'About 1 per cent, since that is how well each side is known.' },
        { id: 'c', text: 'About 2 per cent.' },
        { id: 'd', text: 'It cannot be given as a percentage until the two lengths themselves are known.' },
      ],
      correctOptionId: 'c',
      reasoning: 'sensitivity',
      dependsOn: ['p2', 'p1'],
      supportSpans: [
        { blockId: 'p2', quote: 'When two measured quantities are multiplied or divided, their relative uncertainties are added.' },
        { blockId: 'p1', quote: 'The same uncertainty expressed as a fraction of the measured value is called the relative uncertainty' },
      ],
      explanation:
        'An area is the product of two lengths, and for a product the convention adds the relative uncertainties rather than the absolute ones. Each side is known to within 1 per cent, and 1 per cent added to 1 per cent gives the figure for the area. Nothing in the calculation needs the lengths themselves, because a relative uncertainty is already a fraction of whatever was measured.',
      refutations: {
        a: {
          blockId: 'p2',
          family: 'misapplied-formula',
          reason:
            'This halves the two figures instead of adding them. Nothing in the convention ever reduces an uncertainty when two quantities are combined; the whole of it is cautious in the other direction.',
        },
        b: {
          blockId: 'p2',
          family: 'right-concept-wrong-scope',
          reason:
            'How well one side is known is not how well the area is known. The area depends on both sides, and an error in either carries through to it.',
        },
        d: {
          blockId: 'p1',
          family: 'plausible-but-unstated',
          reason:
            'A relative uncertainty is a fraction of the measurement, so it can be combined without knowing what the measurement was. The lengths would be needed only to turn the answer back into millimetres.',
        },
      },
      computation: { expression: '1 + 1', expected: 2, unit: 'per cent' },
      hints: [
        { level: 1, text: 'An area is made by multiplying, so find the rule the text gives for a product rather than for a sum.' },
        { level: 2, text: 'The figures you are given are fractions of a measurement, not lengths in their own right.' },
        { level: 3, text: 'Combine the two percentages the way the text says relative uncertainties combine, and ask whether the lengths are needed at all.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 2, transferDistance: 3, requiresExhibit: false },
    },

    {
      stem:
        'A calculation gives a length of 7.4863 metres with an uncertainty of 0.12 metres. According to the convention, how should the result be written?',
      options: [
        { id: 'a', text: 'With the uncertainty rounded to one significant figure and the length left as calculated.' },
        { id: 'b', text: 'With the uncertainty as calculated and the length rounded to two decimal places to match it.' },
        { id: 'c', text: 'With the uncertainty rounded to one significant figure and the length rounded to the same decimal place.' },
        { id: 'd', text: 'With both figures exactly as calculated, since rounding either of them discards information.' },
      ],
      correctOptionId: 'c',
      reasoning: 'classify-scenario',
      dependsOn: ['p3'],
      supportSpans: [
        { blockId: 'p3', quote: 'An uncertainty is quoted to one significant figure, and the measured value is then written to the same decimal place as its uncertainty.' },
      ],
      explanation:
        'The convention does two things at once, and both have to be applied. The uncertainty is first cut to a single significant figure. The value is then written to whatever decimal place that leaves — not to more, because the text says the digits beyond it carry no information, and not to fewer, because that would throw away a place the uncertainty still supports.',
      refutations: {
        a: {
          blockId: 'p3',
          family: 'right-concept-wrong-scope',
          reason:
            'This applies the first half of the rule and stops. Leaving the length at four decimal places keeps three digits the rounded uncertainty says nothing can be known about.',
        },
        b: {
          blockId: 'p3',
          family: 'right-concept-wrong-scope',
          reason:
            'This rounds the value but keeps two significant figures in the uncertainty. The convention asks for one, and it is the uncertainty that fixes where the value stops, not the other way round.',
        },
        d: {
          blockId: 'p3',
          family: 'contradicts-source',
          reason:
            'The text takes the opposite view: digits past the uncertainty are not information to be preserved, which is why it says they are not reported at all.',
        },
      },
      hints: [
        { level: 1, text: 'The rule has two parts, and they are applied in a particular order.' },
        { level: 2, text: 'Decide what happens to the plus-or-minus figure before deciding anything about the length.' },
        { level: 3, text: 'Once the uncertainty is cut down, ask which decimal place it leaves the length able to reach.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
    },

    {
      stem: 'Which of the rods in Table 1 was measured with the largest relative uncertainty?',
      options: [
        { id: 'a', text: 'Rod A' },
        { id: 'b', text: 'Rod B' },
        { id: 'c', text: 'Rod C' },
        { id: 'd', text: 'Rod D' },
      ],
      correctOptionId: 'c',
      reasoning: 'read-exhibit',
      dependsOn: ['t1', 'p1'],
      supportSpans: [
        { blockId: 't1', quote: '0.3 mm' },
        { blockId: 'p1', quote: 'The same uncertainty expressed as a fraction of the measured value is called the relative uncertainty' },
      ],
      explanation:
        'Relative uncertainty is the plus-or-minus figure divided by the measurement it belongs to, so each rod has to be judged against its own length rather than against the others. Rod C is the shortest rod in the table and carries the smallest uncertainty in millimetres, and it is nonetheless the least precisely measured of the four: three tenths of a millimetre is a larger share of eight millimetres than any other rod’s figure is of its own length.',
      refutations: {
        a: {
          blockId: 't1',
          family: 'swapped-quantities',
          reason:
            'Rod A’s five millimetres is larger than Rod C’s figure in millimetres, but it belongs to a rod of 250 millimetres. As a fraction of what was measured it is one of the smaller uncertainties here.',
        },
        b: {
          blockId: 't1',
          family: 'arithmetic-slip',
          reason:
            'Rod B is one millimetre in forty, which is indeed worse than Rod A and Rod D. It is still a smaller share of its own length than three tenths of a millimetre is of eight.',
        },
        d: {
          blockId: 't1',
          family: 'swapped-quantities',
          reason:
            'Rod D carries the largest uncertainty in the table in millimetres, which is what makes it tempting. Spread over 1200 millimetres it is among the smallest relative uncertainties of the four.',
        },
      },
      hints: [
        { level: 1, text: 'The largest plus-or-minus figure in millimetres is not what the question asks for.' },
        { level: 2, text: 'Each rod has to be compared with its own measured length, not with the other rods.' },
        { level: 3, text: 'Turn each rod’s uncertainty into a fraction of its own length before putting the four side by side.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 3, blockSpan: 2, transferDistance: 1, requiresExhibit: true },
    },
  ],
)

/* -------------------------------------------------------- natural sciences */
// Four rules: solubility depends on the pair and the temperature and not on
// stirring; a solution below/at/above the figure is unsaturated/saturated/
// supersaturated; cooling a saturated solution crystallises out the difference;
// the table holds only for pure water.
//
// Only q1 touches the table, and its distractors are built from wrong ROWS and
// wrong COLUMNS rather than from the tabulated values themselves, so no cell can
// be read back out of the option list.

emit(
  {
    id: 'gam-natural-sciences-solubility-001',
    idStem: 'gam-ns-sol-001',
    domain: 'natural-sciences',
    title: 'How much solute a solution will hold',
    defines: ['solubility', 'saturated', 'supersaturated'],
    blocks: [
      { kind: 'heading', id: 'h1', text: 'How much solute a solution will hold' },
      {
        kind: 'paragraph',
        id: 'p1',
        text:
          'The solubility of a salt is the greatest mass of it that will dissolve in a fixed mass of water at a stated temperature, and it is given here as grams of salt per 100 grams of water. Solubility is a property of the pair of substances and of the temperature. It does not depend on how vigorously the mixture is stirred or on how long it is left standing; stirring changes how quickly the salt goes into solution, and nothing about how much of it will.',
      },
      {
        kind: 'table',
        id: 't1',
        caption: 'Solubility of two salts, in grams per 100 grams of water.',
        columns: ['Temperature', 'Salt P', 'Salt Q'],
        rows: [
          ['20 degrees', '32', '88'],
          ['40 degrees', '44', '92'],
          ['60 degrees', '58', '96'],
          ['80 degrees', '74', '100'],
        ],
      },
      {
        kind: 'paragraph',
        id: 'p2',
        text:
          'A solution holding less salt than the figure for its temperature is unsaturated; one holding exactly that figure is saturated. A solution can be brought to hold more than the figure by dissolving the salt hot and then cooling it slowly and without disturbance. Such a solution is supersaturated, and it is unstable: a single crystal dropped into it, or a knock, will bring the excess out of solution at once.',
      },
      {
        kind: 'paragraph',
        id: 'p3',
        text:
          'When a saturated solution is cooled it can no longer hold what it held at the higher temperature. The excess crystallises out, and its mass is the difference between the solubility at the two temperatures, scaled to the mass of water actually present.',
      },
      {
        kind: 'paragraph',
        id: 'p4',
        text:
          'The figures in the table are for pure water. Where some other substance is already dissolved, the water is no longer pure, the tabulated figure cannot be relied on, and a separate measurement has to be made for the mixture itself.',
      },
    ],
  },
  [
    {
      stem:
        'A saturated solution of Salt P in 200 grams of water at 60 degrees is cooled to 20 degrees. What mass of salt crystallises out?',
      options: [
        { id: 'a', text: '16 g' },
        { id: 'b', text: '26 g' },
        { id: 'c', text: '28 g' },
        { id: 'd', text: '52 g' },
      ],
      correctOptionId: 'd',
      reasoning: 'apply-formula',
      dependsOn: ['t1', 'p3'],
      supportSpans: [
        { blockId: 'p3', quote: 'its mass is the difference between the solubility at the two temperatures, scaled to the mass of water actually present' },
        { blockId: 't1', quote: 'Salt P' },
      ],
      explanation:
        'Two things have to be got right. The first is which pair of figures to subtract: Salt P’s column, at the two temperatures named, and not Salt Q’s and not some other pair of rows. The second is that the table is quoted per 100 grams of water while the flask holds twice that, so the difference has to be doubled before it is reported.',
      refutations: {
        a: {
          blockId: 't1',
          family: 'swapped-quantities',
          reason:
            'This works down Salt Q’s column instead of Salt P’s. Salt Q barely changes across this range, which is why it gives so small an answer, and it is not the salt in the flask.',
        },
        b: {
          blockId: 'p3',
          family: 'right-concept-wrong-scope',
          reason:
            'This is the difference the table gives directly, which is the figure for 100 grams of water. The flask holds 200, and the text says the difference is scaled to the water actually present.',
        },
        c: {
          blockId: 't1',
          family: 'arithmetic-slip',
          reason:
            'This cools only as far as the middle of the range instead of to the temperature named in the question. The row that matters is the one the solution actually reaches.',
        },
      },
      computation: { expression: '(58 - 32) * 200 / 100', expected: 52, unit: 'g' },
      hints: [
        { level: 1, text: 'Find the two figures the question actually asks you to compare before doing any arithmetic.' },
        { level: 2, text: 'The table is quoted for a fixed mass of water; check whether the flask holds that mass.' },
        { level: 3, text: 'Take the difference down the correct column, then scale it to the water the flask really contains.' },
      ],
      difficulty: 'high',
      meta: { stepCount: 3, blockSpan: 2, transferDistance: 2, requiresExhibit: true },
    },

    {
      stem:
        'A flask is prepared by dissolving Salt P in hot water and cooling it slowly without disturbance. It is now holding more salt than the figure for its temperature allows. According to the text, what is this solution, and what should be expected of it?',
      options: [
        { id: 'a', text: 'Unsaturated, and it will take up more salt if any is added.' },
        { id: 'b', text: 'Saturated, and it is holding exactly what it can at this temperature.' },
        { id: 'c', text: 'Supersaturated, and a knock or a stray crystal will bring the surplus down.' },
        { id: 'd', text: 'Impossible, because a solution cannot hold more than the figure at any temperature.' },
      ],
      correctOptionId: 'c',
      reasoning: 'classify-scenario',
      dependsOn: ['p2'],
      supportSpans: [
        { blockId: 'p2', quote: 'Such a solution is supersaturated, and it is unstable' },
        { blockId: 'p2', quote: 'dissolving the salt hot and then cooling it slowly and without disturbance' },
      ],
      explanation:
        'The flask has been made in exactly the way the text describes — dissolved hot, cooled slowly, left undisturbed — and it is holding more than its temperature allows. That is the supersaturated state. The text is equally clear about what follows: the condition is unstable, and a crystal or a knock brings the excess out at once.',
      refutations: {
        a: {
          blockId: 'p2',
          family: 'wrong-direction-of-effect',
          reason:
            'Unsaturated means holding less than the figure, not more. A solution already past its figure will not take up more salt; it is waiting to give some back.',
        },
        b: {
          blockId: 'p2',
          family: 'right-concept-wrong-scope',
          reason:
            'Saturated is holding exactly the figure. The question says the flask is past it, which the text treats as a different state with a different name.',
        },
        d: {
          blockId: 'p2',
          family: 'contradicts-source',
          reason:
            'The text says the opposite in as many words: a solution can be brought to hold more than the figure, and it describes the method for doing it.',
        },
      },
      hints: [
        { level: 1, text: 'The text names three states, and each is fixed by how the solution stands against the figure for its temperature.' },
        { level: 2, text: 'The method described in the question is described in the text as well — find where.' },
        { level: 3, text: 'Having named the state, read on: the text says what such a solution does when it is disturbed.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 1, transferDistance: 1, requiresExhibit: false },
    },

    {
      stem:
        'A technician wants to know how much Salt P a tank of seawater will hold at 40 degrees, and reads the figure from the table. According to the text, is that sound?',
      options: [
        { id: 'a', text: 'Yes, since solubility is a property of the pair of substances and of the temperature.' },
        { id: 'b', text: 'Yes, provided the tank is stirred long enough to reach the tabulated figure.' },
        { id: 'c', text: 'No, and the figure should be halved to allow for what is already dissolved.' },
        { id: 'd', text: 'No, because the table is for pure water and the mixture has to be measured separately.' },
      ],
      correctOptionId: 'd',
      reasoning: 'qualitative-inference',
      dependsOn: ['p4', 'p1'],
      supportSpans: [
        { blockId: 'p4', quote: 'the water is no longer pure, the tabulated figure cannot be relied on, and a separate measurement has to be made for the mixture itself' },
        { blockId: 'p1', quote: 'Solubility is a property of the pair of substances and of the temperature.' },
      ],
      explanation:
        'Seawater already has something dissolved in it, so the water is not the pure water the table is quoted for. The text does not say the figure will be higher or lower — it says it cannot be relied on, and that the mixture has to be measured in its own right. That is a statement about not knowing, and none of the alternatives is that.',
      refutations: {
        a: {
          blockId: 'p1',
          family: 'right-concept-wrong-scope',
          reason:
            'The quoted phrase is in the text, but it fixes what solubility depends on for a given pair of substances. Here the solvent is not the one the table was drawn up for, so the pair is not the same pair.',
        },
        b: {
          blockId: 'p1',
          family: 'plausible-but-unstated',
          reason:
            'Stirring is dealt with in the text and it changes only how fast the salt dissolves. No amount of it makes a figure for pure water apply to a mixture.',
        },
        c: {
          blockId: 'p4',
          family: 'plausible-but-unstated',
          reason:
            'The direction and size of the change are exactly what the text declines to state. Halving is a number invented for the occasion, and the text asks for a measurement instead.',
        },
      },
      hints: [
        { level: 1, text: 'Ask what the table was drawn up for, and whether the tank matches that description.' },
        { level: 2, text: 'The text says what to do when the solvent is not pure — it is a short instruction near the end.' },
        { level: 3, text: 'Two options say the reading is unsound; separate them by asking whether the text predicts how far it would be out.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 2, transferDistance: 2, requiresExhibit: false },
    },

    {
      stem:
        'A student finds that no more Salt P will dissolve in a beaker of water, and stirs it for a further hour at the same temperature. According to the text, what happens?',
      options: [
        { id: 'a', text: 'More dissolves, because stirring brings fresh water to the crystals.' },
        { id: 'b', text: 'Nothing further dissolves, because stirring does not change how much the water will hold.' },
        { id: 'c', text: 'Some dissolves and then comes back out, leaving the beaker as it was.' },
        { id: 'd', text: 'It cannot be said without knowing how much salt was put in at the start.' },
      ],
      correctOptionId: 'b',
      reasoning: 'qualitative-inference',
      dependsOn: ['p1'],
      supportSpans: [
        { blockId: 'p1', quote: 'It does not depend on how vigorously the mixture is stirred or on how long it is left standing' },
        { blockId: 'p1', quote: 'stirring changes how quickly the salt goes into solution, and nothing about how much of it will' },
      ],
      explanation:
        'The beaker has already reached the figure for its temperature, and the text separates two things that are easy to run together: how fast a salt dissolves, which stirring does affect, and how much will dissolve at all, which it does not. Stirring for another hour acts on the first and leaves the second exactly where it was.',
      refutations: {
        a: {
          blockId: 'p1',
          family: 'contradicts-source',
          reason:
            'This is the intuition the text is written against. Bringing fresh water to the crystals is a statement about rate, and the text says rate is the only thing stirring touches.',
        },
        c: {
          blockId: 'p1',
          family: 'plausible-but-unstated',
          reason:
            'Nothing in the text describes salt going into solution and coming back out at a fixed temperature. The figure is a limit on how much dissolves, not a cycle.',
        },
        d: {
          blockId: 'p1',
          family: 'plausible-but-unstated',
          reason:
            'The starting quantity decides how much undissolved salt is left sitting at the bottom, not how much the water will take. The limit is fixed by the pair of substances and the temperature, both of which the question gives.',
        },
      },
      hints: [
        { level: 1, text: 'The beaker has already reached its limit, so ask what stirring is capable of changing.' },
        { level: 2, text: 'The text draws a distinction between two things stirring might be thought to affect.' },
        { level: 3, text: 'One of the two is about speed and the other about quantity; decide which the question is asking about.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
    },
  ],
)

/* ---------------------------------------------------------------- economics */
// Four rules: a rate of change is the difference over the EARLIER figure; a
// smaller rate is still a rise; a revision breaks like-for-like comparison; a
// fixed basket overstates the cost of living for a substituting household.
//
// The figure carries the readings in its annotation, so they are part of the
// pack's text rather than buried in chart geometry. One question reads it.

emit(
  {
    id: 'gam-economics-price-index-001',
    idStem: 'gam-econ-pi-001',
    domain: 'economics',
    title: 'Measuring the change in the general price level',
    defines: ['price index', 'base year', 'fixed basket'],
    blocks: [
      { kind: 'heading', id: 'h1', text: 'Measuring the change in the general price level' },
      {
        kind: 'paragraph',
        id: 'p1',
        text:
          'A price index tracks what one fixed basket of goods and services costs from one period to the next. The basket is chosen to represent a typical household’s spending and is then held fixed, so that a movement in the index reflects a change in prices rather than a change in what is being bought. The index is set to 100 in a chosen base year, and every later figure is expressed against it.',
      },
      {
        kind: 'figure',
        id: 'fig1',
        caption: 'Figure 1. The price index in each of five successive years.',
        spec: {
          type: 'line-chart',
          xLabel: 'Year',
          yLabel: 'Price index',
          series: [
            {
              id: 'idx',
              label: 'Price index',
              points: [[1, 100], [2, 104], [3, 110], [4, 121], [5, 127]],
            },
          ],
          annotations: [
            { label: 'The first year is the base year', detail: 'set to 100' },
            {
              label: 'Readings by year',
              detail: '100 in the first year, then 104, 110, 121 and 127',
            },
          ],
        },
      },
      {
        kind: 'paragraph',
        id: 'p2',
        text:
          'The index is a level, not a rate. The rate of change between two years is the difference between their index figures divided by the earlier of the two, written as a percentage. A rate that is smaller this year than last still means that prices rose; it means only that they rose more slowly than before.',
      },
      {
        kind: 'paragraph',
        id: 'p3',
        text:
          'When the basket is revised, because households have changed what they buy, the new series is linked to the old at the year of the revision and the earlier figures are not recomputed. A comparison that spans a revision is therefore not a like-for-like comparison of one basket.',
      },
      {
        kind: 'paragraph',
        id: 'p4',
        text:
          'Because the basket is held fixed, the index does not follow a household that answers a price rise by buying a cheaper substitute instead. For such a household the index overstates the increase in the cost of living, and it does so by more the more readily the household substitutes.',
      },
    ],
  },
  [
    {
      stem: 'By what percentage did the index rise between the third year and the fourth?',
      options: [
        { id: 'a', text: '9.1 per cent' },
        { id: 'b', text: '10 per cent' },
        { id: 'c', text: '11 per cent' },
        { id: 'd', text: '21 per cent' },
      ],
      correctOptionId: 'b',
      reasoning: 'apply-formula',
      dependsOn: ['fig1', 'p2'],
      supportSpans: [
        { blockId: 'fig1', quote: '100 in the first year, then 104, 110, 121 and 127' },
        { blockId: 'p2', quote: 'The rate of change between two years is the difference between their index figures divided by the earlier of the two' },
      ],
      explanation:
        'The two readings the question names are the third and fourth in the series. Their difference is eleven index points, and the text is specific about what that difference is then divided by: the earlier of the two figures, not the later one and not the base year. Dividing accordingly and writing the result as a percentage gives the answer.',
      refutations: {
        a: {
          blockId: 'p2',
          family: 'swapped-quantities',
          reason:
            'This divides by the later figure instead of the earlier one. The text names which of the two goes underneath, and swapping them makes every rise look smaller than it was.',
        },
        c: {
          blockId: 'p2',
          family: 'right-concept-wrong-scope',
          reason:
            'This reports the movement in index points and calls it a percentage. Points and per cent coincide only when the earlier figure happens to be 100, which is true of the base year alone.',
        },
        d: {
          blockId: 'p2',
          family: 'right-concept-wrong-scope',
          reason:
            'This measures from the base year rather than between the two years the question names. It is a real quantity — the rise since the base — but it answers a different question.',
        },
      },
      computation: { expression: '(121 - 110) / 110 * 100', expected: 10, unit: 'per cent' },
      hints: [
        { level: 1, text: 'The question asks for a rate of change, and the text says exactly what a rate of change is made from.' },
        { level: 2, text: 'Two readings are needed, and the text is specific about which of them goes underneath.' },
        { level: 3, text: 'A movement in index points is not yet a percentage; ask what it has to be divided by first.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 3, blockSpan: 2, transferDistance: 1, requiresExhibit: true },
    },

    {
      stem:
        'A newspaper reports that the index rose by less this year than it did last year, and concludes that prices have come down. According to the text, is that conclusion right?',
      options: [
        { id: 'a', text: 'Yes; a smaller figure this year means the level is lower than it was.' },
        { id: 'b', text: 'No; the level went on climbing, just less steeply than it had.' },
        { id: 'c', text: 'Yes, but only if the base year has not been changed in the meantime.' },
        { id: 'd', text: 'It cannot be judged without knowing which basket the index was built on.' },
      ],
      correctOptionId: 'b',
      reasoning: 'qualitative-inference',
      dependsOn: ['p2'],
      supportSpans: [
        { blockId: 'p2', quote: 'A rate that is smaller this year than last still means that prices rose; it means only that they rose more slowly than before.' },
        { blockId: 'p2', quote: 'The index is a level, not a rate.' },
      ],
      explanation:
        'Two different quantities are being confused. The level is what the index reports; the rate is how fast that level is moving. A rate that falls from one year to the next is a level still climbing, just less steeply. For prices to have come down the level itself would have to be lower, and a smaller positive rate is not that.',
      refutations: {
        a: {
          blockId: 'p2',
          family: 'contradicts-source',
          reason:
            'This is the confusion the text is written to head off, and it says so directly: a smaller rate still means prices rose.',
        },
        c: {
          blockId: 'p1',
          family: 'plausible-but-unstated',
          reason:
            'The base year fixes what the index is measured against, not whether a rise is a rise. Changing it would renumber the series without turning an increase into a decrease.',
        },
        d: {
          blockId: 'p1',
          family: 'right-concept-wrong-scope',
          reason:
            'Which basket was used matters for what the index measures and for comparisons across a revision. It is not needed to say whether a positive but smaller rate is a fall.',
        },
      },
      hints: [
        { level: 1, text: 'The text opens this passage by separating two things that are easily run together.' },
        { level: 2, text: 'Ask what would have to be true of the index itself for prices to have come down.' },
        { level: 3, text: 'A figure that grows more slowly is still growing; decide what that leaves the newspaper claiming.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
    },

    {
      stem:
        'A researcher compares the first year shown in Figure 1 with a figure published several years later, after the basket had been revised. According to the text, what should be said about that comparison?',
      options: [
        { id: 'a', text: 'It is sound, because the new series is linked to the old at the year of the revision.' },
        { id: 'b', text: 'It is sound once the earlier figures have been recomputed on the new basket.' },
        { id: 'c', text: 'The two ends of it price different baskets, so they do not measure the same thing.' },
        { id: 'd', text: 'It cannot be made at all, because a revision starts the series again from its base value.' },
      ],
      correctOptionId: 'c',
      reasoning: 'classify-scenario',
      dependsOn: ['p3'],
      supportSpans: [
        { blockId: 'p3', quote: 'A comparison that spans a revision is therefore not a like-for-like comparison of one basket.' },
        { blockId: 'p3', quote: 'the earlier figures are not recomputed' },
      ],
      explanation:
        'Linking is what makes the series continuous to look at; it is not what would make the two ends measure the same thing. The text says the earlier figures are left as they were, so the first year describes the cost of the old basket and the later figure the cost of the new one. The comparison can be made, and it is not like for like.',
      refutations: {
        a: {
          blockId: 'p3',
          family: 'right-concept-wrong-scope',
          reason:
            'The linking is real and the text describes it. It joins the two series at the revision so the line does not jump; it does not make the baskets at either end the same basket.',
        },
        b: {
          blockId: 'p3',
          family: 'contradicts-source',
          reason:
            'The text states that the earlier figures are not recomputed. The condition offered here is one the procedure never satisfies.',
        },
        d: {
          blockId: 'p1',
          family: 'plausible-but-unstated',
          reason:
            'Nothing in the text restarts the series at a revision; the base value belongs to the chosen base year and stays there. The comparison is possible, and the objection to it is about what it means rather than whether it can be done.',
        },
      },
      hints: [
        { level: 1, text: 'Find what the text says actually happens to the old figures when a revision takes place.' },
        { level: 2, text: 'Linking and recomputing are two different operations, and only one of them is performed.' },
        { level: 3, text: 'Ask whether the objection is that the comparison is impossible or that it does not mean what it appears to.' },
      ],
      difficulty: 'high',
      meta: { stepCount: 2, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
    },

    {
      stem:
        'A household answers a rise in the price of beef by buying chicken instead. According to the text, how does the index stand in relation to that household?',
      options: [
        { id: 'a', text: 'It follows the switch, because the basket is chosen to represent typical spending.' },
        { id: 'b', text: 'It shows a larger increase than the household has actually met, because it goes on pricing what was given up.' },
        { id: 'c', text: 'It understates the rise, because the substitute costs less than what it replaced.' },
        { id: 'd', text: 'It treats the household as no longer belonging to the group the basket represents.' },
      ],
      correctOptionId: 'b',
      reasoning: 'qualitative-inference',
      dependsOn: ['p4', 'p1'],
      supportSpans: [
        { blockId: 'p4', quote: 'the index does not follow a household that answers a price rise by buying a cheaper substitute instead' },
        { blockId: 'p1', quote: 'is then held fixed' },
      ],
      explanation:
        'The basket does not change when a household changes what it buys, so the index goes on pricing the beef the household has stopped buying. The household has found a cheaper way through the same rise than the index allows for, and the index therefore shows a larger increase in its cost of living than it has actually met.',
      refutations: {
        a: {
          blockId: 'p1',
          family: 'contradicts-source',
          reason:
            'The basket is chosen to be typical and then held fixed, which is the whole of the difficulty. Being representative when it was drawn up is not the same as moving with a household afterwards.',
        },
        c: {
          blockId: 'p4',
          family: 'wrong-direction-of-effect',
          reason:
            'The substitute being cheaper is exactly why the index runs high rather than low: the household escapes part of the rise and the fixed basket does not.',
        },
        d: {
          blockId: 'p1',
          family: 'plausible-but-unstated',
          reason:
            'Nothing in the text removes a household from the population when its spending changes. The index simply goes on pricing the basket it was given.',
        },
      },
      hints: [
        { level: 1, text: 'Ask what the basket does when a household changes what it buys.' },
        { level: 2, text: 'The household has found a cheaper way through the same price rise than the basket allows for.' },
        { level: 3, text: 'Decide whether that makes the published figure too large or too small for this particular household.' },
      ],
      difficulty: 'high',
      meta: { stepCount: 2, blockSpan: 2, transferDistance: 3, requiresExhibit: false },
    },
  ],
)

/* ---------------------------------------------------------- social sciences */
// Four rules: a frame that omits part of the population gives coverage error,
// which care in sampling cannot remove; a low response rate is a warning and not
// a finding; weighting corrects what the weighting variable captures and nothing
// further; enlarging a sample narrows spread and leaves bias alone.
//
// Deliberately NOT the official Exercise 4 subject. One question reads the table
// and its options name groups rather than figures, so nothing numeric is exposed.

emit(
  {
    id: 'gam-social-sciences-survey-reach-001',
    idStem: 'gam-ss-sr-001',
    domain: 'social-sciences',
    title: 'Who a survey actually reaches',
    defines: ['target population', 'sampling frame', 'coverage error', 'non-response'],
    blocks: [
      { kind: 'heading', id: 'h1', text: 'Who a survey actually reaches' },
      {
        kind: 'paragraph',
        id: 'p1',
        text:
          'A survey is designed for a target population, meaning the whole group it sets out to describe. In practice the researcher draws names from a sampling frame, which is whatever list happens to be available. Where the frame leaves out part of the population, the survey carries coverage error, and however carefully the names are then drawn from that frame the omission stays exactly where it was.',
      },
      {
        kind: 'paragraph',
        id: 'p2',
        text:
          'Of those approached, some do not answer, and this is non-response. Its effect on the result turns on whether the people who did not answer differ from those who did on the very thing being measured, and not on how many of them there were. A low response rate is a warning rather than a finding: a survey with few replies can be accurate, and one with many can be badly wrong.',
      },
      {
        kind: 'paragraph',
        id: 'p3',
        text:
          'Replies are often weighted so that the groups in the achieved sample appear in the same proportions as they do in the population. Weighting corrects the difference that the weighting variable captures, and nothing beyond it. Where those who did not answer differ in some further respect the weighting variable does not track, the weighted result is wrong in that respect still.',
      },
      {
        kind: 'table',
        id: 't1',
        caption: 'Replies to a survey of one town, by age group.',
        columns: ['Age group', 'Approached', 'Replied', 'Share of the town'],
        rows: [
          ['18 to 34', '600', '120', '30 per cent'],
          ['35 to 54', '600', '240', '34 per cent'],
          ['55 to 74', '600', '300', '24 per cent'],
          ['75 and over', '600', '180', '12 per cent'],
        ],
      },
      {
        kind: 'paragraph',
        id: 'p4',
        text:
          'Enlarging a sample narrows the range within which repeated surveys of the same design would fall. It does not touch coverage error or non-response bias, either of which survives at any size, because both come from who is missing rather than from how many were asked.',
      },
    ],
  },
  [
    {
      stem:
        'A survey sets out to describe everyone living in a town, and draws its names from the register of library members. According to the text, what does this introduce, and can more careful sampling remove it?',
      options: [
        { id: 'a', text: 'Non-response, which a higher rate of reply would remove.' },
        { id: 'b', text: 'Coverage error; the fault lies in the list, not in how names are taken from it.' },
        { id: 'c', text: 'Coverage error, which weighting the replies by age would remove.' },
        { id: 'd', text: 'Nothing, so long as the names are drawn from the register at random.' },
      ],
      correctOptionId: 'b',
      reasoning: 'classify-scenario',
      dependsOn: ['p1'],
      supportSpans: [
        { blockId: 'p1', quote: 'Where the frame leaves out part of the population, the survey carries coverage error' },
        { blockId: 'p1', quote: 'however carefully the names are then drawn from that frame the omission stays exactly where it was' },
      ],
      explanation:
        'The register of library members is the sampling frame, and it is not the town. Everyone in the town who is not a member is outside the list before any name is drawn, which is what the text calls coverage error. The point the text presses is that the defect is upstream of the sampling: drawing better from an incomplete list does not reach the people the list never contained.',
      refutations: {
        a: {
          blockId: 'p2',
          family: 'right-concept-wrong-scope',
          reason:
            'Non-response is about people who were approached and did not reply. The people missing here were never on the list to be approached at all.',
        },
        c: {
          blockId: 'p3',
          family: 'plausible-but-unstated',
          reason:
            'The error is named correctly and the remedy is not. Weighting adjusts the replies the survey did obtain; it cannot represent a part of the town the frame never covered.',
        },
        d: {
          blockId: 'p1',
          family: 'contradicts-source',
          reason:
            'Random drawing is exactly the care the text says is beside the point. It makes the sample a fair picture of the register, which is not the group the survey means to describe.',
        },
      },
      hints: [
        { level: 1, text: 'Separate the list the names came from and the group the survey is meant to describe.' },
        { level: 2, text: 'Ask at which stage the people who are missing went missing.' },
        { level: 3, text: 'Three options offer a remedy; check each against what the text says a better draw can achieve.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
    },

    {
      stem:
        'A survey achieves a low rate of reply. According to the text, what follows about the accuracy of its result?',
      options: [
        { id: 'a', text: 'It is unreliable; a rate that low cannot support a finding.' },
        { id: 'b', text: 'Nothing on its own; what matters is whether those who did not reply differ on what is being measured.' },
        { id: 'c', text: 'It is reliable, provided a large enough number was approached to begin with.' },
        { id: 'd', text: 'It is unreliable unless the replies are weighted to the population.' },
      ],
      correctOptionId: 'b',
      reasoning: 'qualitative-inference',
      dependsOn: ['p2'],
      supportSpans: [
        { blockId: 'p2', quote: 'A low response rate is a warning rather than a finding' },
        { blockId: 'p2', quote: 'turns on whether the people who did not answer differ from those who did on the very thing being measured, and not on how many of them there were' },
      ],
      explanation:
        'The text refuses to read accuracy off the rate of reply in either direction, and says so twice: a survey with few replies can be accurate and one with many can be badly wrong. What decides the matter is whether the people who stayed silent are different, on the thing being measured, from the people who answered. The rate is a reason to ask that question, not an answer to it.',
      refutations: {
        a: {
          blockId: 'p2',
          family: 'contradicts-source',
          reason:
            'This treats the warning as the finding, which is the distinction the text draws in as many words. Few replies can still be accurate ones.',
        },
        c: {
          blockId: 'p4',
          family: 'right-concept-wrong-scope',
          reason:
            'Approaching more people narrows the spread of repeated surveys and leaves bias untouched. It cannot make a low rate of reply safe.',
        },
        d: {
          blockId: 'p3',
          family: 'plausible-but-unstated',
          reason:
            'Weighting corrects only what its variable captures, so it is neither necessary nor sufficient here. The text makes accuracy turn on how the silent differ, not on whether an adjustment was applied.',
        },
      },
      hints: [
        { level: 1, text: 'The text says plainly what a low rate of reply is, and what it is not.' },
        { level: 2, text: 'Ask what would have to be true of the people who did not answer for the result to be wrong.' },
        { level: 3, text: 'Notice that the text allows a survey with few replies to be accurate, and rules out reading the rate on its own.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
    },

    {
      stem:
        'A researcher weights the replies so that each age group appears in the same proportion as it does in the town, and states that this has removed the non-response bias. According to the text, is that right?',
      options: [
        { id: 'a', text: 'Yes; weighting to known population proportions removes non-response bias.' },
        { id: 'b', text: 'Yes, provided every group returned at least some replies.' },
        { id: 'c', text: 'No; it corrects what age captures and leaves any further difference untouched.' },
        { id: 'd', text: 'No; weighting applies to coverage error and cannot be used on non-response at all.' },
      ],
      correctOptionId: 'c',
      reasoning: 'classify-scenario',
      dependsOn: ['p3'],
      supportSpans: [
        { blockId: 'p3', quote: 'Weighting corrects the difference that the weighting variable captures, and nothing beyond it.' },
        { blockId: 'p3', quote: 'the weighted result is wrong in that respect still' },
      ],
      explanation:
        'Weighting by age puts the age groups back into their right proportions, and that is the whole of what it does. If those who stayed silent also differ in some way age does not track — in how far they travel to work, say, or in what they think of the subject being asked about — the weighted figure is still wrong on that count, because nothing in the procedure knew about it.',
      refutations: {
        a: {
          blockId: 'p3',
          family: 'contradicts-source',
          reason:
            'The text sets a limit on weighting in the same sentence that describes it. Correcting the difference one variable captures is not the same as removing the bias.',
        },
        b: {
          blockId: 'p3',
          family: 'plausible-but-unstated',
          reason:
            'Having some replies in every group is what makes the arithmetic possible, not what makes the answer right. The limit the text names is about which differences are captured, not about how many replies each group returned.',
        },
        d: {
          blockId: 'p3',
          family: 'right-concept-wrong-scope',
          reason:
            'The text describes weighting as an adjustment to replies that were obtained, which is a treatment for non-response. The objection to the researcher is that it is partial, not that it is inapplicable.',
        },
      },
      hints: [
        { level: 1, text: 'The sentence that describes weighting also limits it; read to the end of it.' },
        { level: 2, text: 'Ask what happens if the silent differ in some way that age does not track.' },
        { level: 3, text: 'Two options reject the claim; separate them by asking whether the objection is that weighting is wrong here or only partial.' },
      ],
      difficulty: 'high',
      meta: { stepCount: 2, blockSpan: 1, transferDistance: 3, requiresExhibit: false },
    },

    {
      stem:
        'Judged against its share of the town, which age group in Table 1 is the most under-represented among those who replied?',
      options: [
        { id: 'a', text: '18 to 34' },
        { id: 'b', text: '35 to 54' },
        { id: 'c', text: '55 to 74' },
        { id: 'd', text: '75 and over' },
      ],
      correctOptionId: 'a',
      reasoning: 'read-exhibit',
      dependsOn: ['t1', 'p2'],
      supportSpans: [
        { blockId: 't1', quote: 'Share of the town' },
        { blockId: 't1', quote: '18 to 34' },
        { blockId: 'p2', quote: 'Of those approached, some do not answer, and this is non-response.' },
      ],
      explanation:
        'The same number of people was approached in every group, so the number of replies is what decides each group’s share of the achieved sample. Set each group’s share of the replies beside its share of the town: the youngest group supplied much the smallest number of replies while accounting for nearly a third of the town, and no other group falls anything like as far short.',
      refutations: {
        b: {
          blockId: 't1',
          family: 'arithmetic-slip',
          reason:
            'This group is under-represented as well, and by the largest margin after the youngest. Its shortfall is a few points; the youngest group’s is more than half of what its share of the town would require.',
        },
        c: {
          blockId: 't1',
          family: 'wrong-direction-of-effect',
          reason:
            'This group returned the most replies of the four while making up under a quarter of the town, so it is over-represented among those who answered, not under.',
        },
        d: {
          blockId: 't1',
          family: 'wrong-direction-of-effect',
          reason:
            'The oldest group is the smallest part of the town and returned more replies than the youngest did, so it too is over-represented rather than under.',
        },
      },
      hints: [
        { level: 1, text: 'The number approached is the same in every row, which makes the replies directly comparable.' },
        { level: 2, text: 'Work out what share of all the replies each group supplied before looking at the town at all.' },
        { level: 3, text: 'Set each group’s share of the replies beside its share of the town and look for the largest shortfall.' },
      ],
      difficulty: 'high',
      meta: { stepCount: 3, blockSpan: 2, transferDistance: 2, requiresExhibit: true },
    },
  ],
)
