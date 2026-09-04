/**
 * Third repair pass, 4 September 2026 — the leakage the mechanical gate cannot
 * see.
 *
 * `leakage.mjs` reports zero errors on these packs, and that is true: no number
 * a question needs is written out or reconstructable elsewhere. An independent
 * adjudicator, reading each pack's questions side by side with no source at all,
 * found twelve questions still given away — by *concepts* and by *option-set
 * structure* rather than by arithmetic.
 *
 * That is a real limit of the gate and is recorded as such in the spec. What
 * follows fixes the cases that are concrete enough to fix.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { contentHash } from '../lib/validate.mjs'

const dir = new URL('../../../content/gam/packs/', import.meta.url)

function patch(fileName, replacements) {
  const url = new URL(fileName, dir)
  const file = JSON.parse(readFileSync(url, 'utf8'))
  for (const [id, question] of Object.entries(replacements)) {
    const i = file.questions.findIndex((q) => q.id === id)
    if (i === -1) throw new Error(`${fileName}: no question ${id}`)
    file.questions[i] = { ...question, id, packId: file.pack.id }
  }
  file.pack.contentHash = contentHash(file)
  writeFileSync(url, `${JSON.stringify(file, null, 2)}\n`)
  console.log(`${fileName}: ${Object.keys(replacements).length} replaced · hash ${file.pack.contentHash}`)
}

/* =========================================================== humanities
 *
 * "Q1's four options collectively spell out plain-language definitions of all
 * three named checks, which q2, q3 and q6 then apply."
 *
 * Exactly right, and the worst leak in the pilot after the arithmetic ones: two
 * of q1's distractors were correct definitions of the other two checks, so the
 * pack's whole framework sat in one question's option list. The distractors are
 * now wrong readings of proximity itself, and define nothing.
 *
 * q2 stops asking the candidate to *name* a check — which q1's options made
 * cheap — and asks what follows from the failure instead, which is the thing p2
 * actually adds.
 */
patch('gam-humanities-source-checks-001.json', {
  'gam-hum-sc-001-q1': {
    stem: 'According to the text, what does the proximity check concern?',
    options: [
      { id: 'a', text: 'How soon after the events described the document was written down.' },
      { id: 'b', text: 'The route by which the information reached the author.' },
      { id: 'c', text: 'How much detail the author gives about what is described.' },
      { id: 'd', text: 'Whether the author reported honestly what he believed to be true.' },
    ],
    correctOptionId: 'b',
    reasoning: 'retrieve',
    dependsOn: ['p3'],
    supportSpans: [
      { blockId: 'p3', quote: 'Proximity concerns the route by which the information reached the author' },
    ],
    explanation:
      'The text defines proximity as how close the author stood to what is described, and spells out that this is a matter of the route the information took: seeing an event, being told of it by a participant, or compiling it generations later.',
    refutations: {
      a: {
        blockId: 'p3',
        family: 'plausible-but-unstated',
        reason:
          'Delay is suggestive but is not what the text measures. A witness writing forty years later still saw the event; a contemporary who only heard a rumour did not.',
      },
      c: {
        blockId: 'p3',
        family: 'plausible-but-unstated',
        reason:
          'The text says nothing about how much detail an account gives. Detail can be invented as easily as it can be remembered.',
      },
      d: {
        blockId: 'p3',
        family: 'contradicts-source',
        reason:
          'The text closes the paragraph by saying the opposite: proximity says nothing about whether the author is honest.',
      },
    },
    hints: [
      { level: 1, text: 'The paragraph on proximity ends by ruling one common answer out explicitly.' },
      { level: 2, text: 'It describes a chain: seeing something, being told of it, compiling it much later.' },
      { level: 3, text: 'What the check measures is how the information travelled, not when it arrived or how honest the teller was.' },
    ],
    difficulty: 'low',
    meta: { stepCount: 1, blockSpan: 1, transferDistance: 0, requiresExhibit: false },
  },

  'gam-hum-sc-001-q2': {
    stem:
      'A letter bears the signature of a city official and the date 1421. Analysis shows that the paper it is written on was not manufactured before 1500. According to the text, what follows?',
    options: [
      { id: 'a', text: 'The letter is worthless, and nothing in it can be used.' },
      { id: 'b', text: 'Whatever the letter says that rests on its being a 1421 document by that official must be set aside.' },
      { id: 'c', text: 'The person who signed it must have had something to gain from the deception.' },
      { id: 'd', text: 'The date was miscopied by a later hand, so the letter can stand as it is.' },
    ],
    correctOptionId: 'b',
    reasoning: 'classify-scenario',
    dependsOn: ['p2'],
    supportSpans: [
      { blockId: 'p2', quote: 'A document that fails it is not thereby worthless, but any statement whose force depends on the claimed origin must be set aside.' },
    ],
    explanation:
      'The paper settles the question of origin on physical evidence alone: the letter cannot be what it presents itself as being. The text is precise about the consequence — not that the document is discarded, but that whatever it says which draws its force from the claimed authorship and date no longer stands.',
    refutations: {
      a: {
        blockId: 'p2',
        family: 'contradicts-source',
        reason:
          'The text states directly that a document failing this check is not thereby worthless. What is lost is a class of statements, not the document.',
      },
      c: {
        blockId: 'p2',
        family: 'plausible-but-unstated',
        reason:
          'Motive is a separate matter, and the text keeps it separate. A false origin can be established without any finding about who benefited.',
      },
      d: {
        blockId: 'p2',
        family: 'contradicts-source',
        reason:
          'A miscopied date would not put the letter on paper that did not yet exist. The text treats physical evidence as able to settle this check on its own.',
      },
    },
    hints: [
      { level: 1, text: 'Decide first what the paper proves, and then read what the text says the consequence is.' },
      { level: 2, text: 'The paragraph on this check ends with a careful sentence about what is lost and what is not.' },
      { level: 3, text: 'The text distinguishes discarding a document from setting aside particular statements in it.' },
    ],
    difficulty: 'medium',
    meta: { stepCount: 2, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
  },
})

/* =========================================================== computational sciences
 *
 * Three couplings, two of them cheap to close.
 *
 *   q1's distractor 256 was 16 squared, which confirmed PAIR's quadratic growth
 *   — the thing q4 asks about. It is now a third table cell, which is the better
 *   distractor anyway.
 *
 *   q3 and q6 were both "which routine is fewest" questions, so q3's option set
 *   structurally denied one of q6's options: no option of q3 entertained SCAN
 *   winning everywhere, which ruled that out in q6 for free. q3 now compares two
 *   named routines, and q6's options no longer turn on the same claim.
 */
patch('gam-computational-sciences-operation-counts-001.json', {
  'gam-cs-oc-001-q1': {
    stem: 'According to Table 1, how many elementary steps does PAIR perform on a catalogue of 16 records?',
    options: [
      { id: 'a', text: '94' },
      { id: 'b', text: '128' },
      { id: 'c', text: '140' },
      { id: 'd', text: '32768' },
    ],
    correctOptionId: 'b',
    reasoning: 'read-exhibit',
    dependsOn: ['t1'],
    supportSpans: [{ blockId: 't1', quote: 'PAIR 128 32768 8388608' }],
    explanation:
      'Table 1 lists the operation counts of each routine at three catalogue sizes. Reading along the PAIR row to the n = 16 column gives 128 elementary steps.',
    refutations: {
      a: {
        blockId: 't1',
        family: 'swapped-quantities',
        reason: '94 is SCAN\'s count at n = 16 — the right column but the wrong row.',
      },
      c: {
        blockId: 't1',
        family: 'swapped-quantities',
        reason: '140 is SPLIT\'s count at n = 16 — again the right column and the wrong row.',
      },
      d: {
        blockId: 't1',
        family: 'swapped-quantities',
        reason: '32768 is PAIR\'s count at n = 256, one column too far to the right.',
      },
    },
    hints: [
      { level: 1, text: 'Everything you need is in the table; no calculation is required.' },
      { level: 2, text: 'Find the row for the routine named in the question, then the column for the catalogue size named in the question.' },
      { level: 3, text: 'Read across the PAIR row until you reach the column headed n = 16.' },
    ],
    difficulty: 'low',
    meta: { stepCount: 1, blockSpan: 1, transferDistance: 0, requiresExhibit: true },
  },

  'gam-cs-oc-001-q3': {
    stem: 'At which of the catalogue sizes listed in Table 1 does SPLIT perform more elementary steps than SCAN?',
    options: [
      { id: 'a', text: 'At n = 16 only' },
      { id: 'b', text: 'At n = 256 only' },
      { id: 'c', text: 'At n = 4096 only' },
      { id: 'd', text: 'At none of the three listed sizes' },
    ],
    correctOptionId: 'a',
    reasoning: 'comparative',
    dependsOn: ['t1'],
    supportSpans: [
      { blockId: 't1', quote: 'SCAN 94 1054 16414' },
      { blockId: 't1', quote: 'SPLIT 140 240 340' },
    ],
    explanation:
      'Comparing the two rows column by column: at the smallest size SPLIT takes more steps than SCAN, and at both larger sizes it takes far fewer. The routine that looks worse on a small catalogue is the one that wins on a large one.',
    refutations: {
      b: {
        blockId: 't1',
        family: 'swapped-quantities',
        reason: 'At this size SPLIT takes 240 steps against SCAN\'s 1054, so SPLIT performs fewer, not more.',
      },
      c: {
        blockId: 't1',
        family: 'swapped-quantities',
        reason: 'At the largest size the gap is wider still in SPLIT\'s favour, at 340 steps against 16414.',
      },
      d: {
        blockId: 't1',
        family: 'contradicts-source',
        reason: 'At the smallest listed size SPLIT does take more steps than SCAN, so there is one such size.',
      },
    },
    hints: [
      { level: 1, text: 'Only two of the three rows matter here.' },
      { level: 2, text: 'Compare those two rows one column at a time rather than looking for a pattern first.' },
      { level: 3, text: 'The comparison goes one way at the smallest size and the other way at both larger ones.' },
    ],
    difficulty: 'medium',
    meta: { stepCount: 3, blockSpan: 1, transferDistance: 0, requiresExhibit: true },
  },

  'gam-cs-oc-001-q6': {
    stem: 'Which statement holds across all three catalogue sizes listed in Table 1?',
    options: [
      { id: 'a', text: 'PAIR performs the most elementary steps at every listed size.' },
      { id: 'b', text: 'SCAN performs more elementary steps than PAIR at every listed size.' },
      { id: 'c', text: 'No single routine performs the fewest elementary steps at every listed size.' },
      { id: 'd', text: 'PAIR performs the fewest elementary steps at the smallest listed size.' },
    ],
    correctOptionId: 'c',
    reasoning: 'comparative',
    dependsOn: ['t1', 'p4'],
    supportSpans: [
      { blockId: 't1', quote: 'PAIR 128 32768 8388608' },
      { blockId: 'p4', quote: 'Below a certain size a routine whose count grows faster may still perform fewer steps than one whose count grows more slowly' },
    ],
    explanation:
      'The routine with the fewest steps changes as the catalogue grows: at the smallest size it is SCAN, and at both larger sizes it is SPLIT. That is the situation the text describes, where a faster-growing count can still be the smaller one below a certain size.',
    refutations: {
      a: {
        blockId: 't1',
        family: 'right-concept-wrong-scope',
        reason:
          'PAIR does take the most steps at the two larger sizes, but not at the smallest, where SPLIT\'s 140 exceeds its 128.',
      },
      b: {
        blockId: 't1',
        family: 'wrong-direction-of-effect',
        reason:
          'The comparison runs the other way at every listed size: SCAN takes fewer steps than PAIR at all three, not more.',
      },
      d: {
        blockId: 't1',
        family: 'contradicts-source',
        reason: 'At the smallest size SCAN takes 94 steps against PAIR\'s 128, so PAIR is not the fewest there.',
      },
    },
    hints: [
      { level: 1, text: 'Test each statement against all three columns; one column is enough to defeat a claim.' },
      { level: 2, text: 'The smallest catalogue size behaves differently from the other two.' },
      { level: 3, text: 'Ask which routine has the smallest entry in each column, and whether it is the same routine each time.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 4, blockSpan: 2, transferDistance: 1, requiresExhibit: true },
  },
})

/* =========================================================== engineering
 *
 * The strongest leak the adjudicator found: "only one of q2's four options for
 * the original flow rate, when halved for doubled insulation, lands inside q4's
 * option set." Two questions about the same wall in watts will always cross-check
 * like that, so q4 no longer answers in watts — it asks for the factor, which
 * settles nothing about the absolute rate. q3 stops competing with it by taking
 * which layer dominates as given and asking why.
 */
patch('gam-engineering-thermal-resistance-001.json', {
  'gam-eng-tr-001-q3': {
    stem:
      'In the wall shown in Figure 2 the brick layer is three times as thick as the insulation layer, and yet it contributes much the smaller share of the total thermal resistance. Why?',
    options: [
      { id: 'a', text: 'Because thermal resistance depends on the material alone, and not on how thick a layer is.' },
      { id: 'b', text: 'Because a layer\'s resistance is its thickness divided by its conductivity, and brick conducts far better.' },
      { id: 'c', text: 'Because the heat reaches the brick first, and each layer resists less than the one before it.' },
      { id: 'd', text: 'Because resistances are added, so the thicker of two layers always counts for proportionately less.' },
    ],
    correctOptionId: 'b',
    reasoning: 'qualitative-inference',
    dependsOn: ['f1', 'p2', 'fig2'],
    supportSpans: [
      { blockId: 'f1', quote: 'R = d / lambda' },
      { blockId: 'p2', quote: 'A layer of low conductivity contributes a large resistance even when it is thin, while a thick layer of high conductivity may contribute very little.' },
    ],
    explanation:
      'Resistance is thickness divided by conductivity, so thickness alone settles nothing. Brick conducts more than ten times as well as the insulation, and that divisor overwhelms its threefold advantage in thickness. The text states the general case: a thin layer of low conductivity can outweigh a thick one of high conductivity.',
    refutations: {
      a: {
        blockId: 'f1',
        family: 'contradicts-source',
        reason:
          'Thickness is in the formula, as the numerator. Doubling a layer\'s thickness doubles its resistance; it is simply outweighed here by the difference in conductivity.',
      },
      c: {
        blockId: 'p2',
        family: 'plausible-but-unstated',
        reason:
          'The text says the order of the layers does not change the total at all, so nothing about a layer\'s resistance follows from where it sits in the wall.',
      },
      d: {
        blockId: 'fig2',
        family: 'plausible-but-unstated',
        reason:
          'Nothing about being the thicker layer reduces a layer\'s share. A thick layer of the same material as a thin one contributes more, not less; what settles it here is the material.',
      },
    },
    hints: [
      { level: 1, text: 'Write down what a single layer\'s resistance is made of before comparing the two layers.' },
      { level: 2, text: 'One of the two quantities in that expression differs between the layers by far more than the other does.' },
      { level: 3, text: 'Compare the two conductivities given in the figure, and then the two thicknesses.' },
    ],
    difficulty: 'medium',
    meta: { stepCount: 2, blockSpan: 3, transferDistance: 1, requiresExhibit: true },
  },

  'gam-eng-tr-001-q4': {
    stem:
      'The insulation layer in Figure 2 is replaced by one of the same material but twice as thick. Everything else is unchanged. By what factor does the rate of heat flow through the wall change?',
    options: [
      { id: 'a', text: 'It falls to about four fifths of its former value.' },
      { id: 'b', text: 'It falls to about five ninths of its former value.' },
      { id: 'c', text: 'It falls to exactly one half of its former value.' },
      { id: 'd', text: 'It is unchanged, because the same heat must still cross the wall.' },
    ],
    correctOptionId: 'b',
    reasoning: 'sensitivity',
    dependsOn: ['f1', 'p3', 'fig2'],
    supportSpans: [
      { blockId: 'p3', quote: 'Doubling the thickness of one layer doubles that layer' + String.fromCharCode(39) + 's resistance' },
      { blockId: 'fig2', quote: 'thickness 0.08 m, conductivity 0.05 watts per metre kelvin' },
      { blockId: 'f1', quote: 'Q = A * dT / R_total' },
    ],
    explanation:
      'The two layers resist 0.4 and 1.6 units, a total of 2.0. Doubling the insulation\'s thickness doubles its resistance to 3.2, giving a new total of 3.6. The area and the temperature difference are unchanged, so the flow falls in inverse proportion to the total resistance: 2.0 divided by 3.6, or five ninths.',
    refutations: {
      a: {
        blockId: 'p3',
        family: 'arithmetic-slip',
        reason:
          'Four fifths would be the answer if the brick layer carried most of the resistance. It carries a fifth of it, and it is the insulation that has been doubled.',
      },
      c: {
        blockId: 'p3',
        family: 'right-concept-wrong-scope',
        reason:
          'Exactly one half assumes the insulation is the whole of the wall\'s resistance. The brick contributes too, and the text warns that doubling one layer does not double the total.',
      },
      d: {
        blockId: 'f1',
        family: 'contradicts-source',
        reason:
          'The same heat crossing every layer is a statement about the steady state, not about the rate being fixed. The rate is set by the total resistance, which has risen.',
      },
    },
    computation: {
      expression: '(0.24/0.60 + 0.08/0.05)/(0.24/0.60 + 0.16/0.05)',
      expected: 0.5555555555555556,
    },
    hints: [
      { level: 1, text: 'Work out the two layers\' resistances separately before changing anything.' },
      { level: 2, text: 'Only one of the two resistances changes, and the text says what happens to it.' },
      { level: 3, text: 'The flow is inversely proportional to the total, so compare the old total with the new one.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 4, blockSpan: 3, transferDistance: 2, requiresExhibit: true },
  },
})
