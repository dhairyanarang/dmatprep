/**
 * Sibling-coupling repair, 5 September 2026.
 *
 * ENGINEERING. Three questions turned on one fact — which layer carries the
 * resistance. q3 asked it outright; q4 (doubling the minor layer) and q6 (which
 * change brings the wall within the guidance) were both settled by the answer.
 * Rewording could not fix that: the fault was that the pack asked the same
 * question three times. So q3 stops asking about dominance and applies the
 * order-independence rule instead; q4 moves to a wall of its own, with its own
 * figures, so nothing about Figure 2 transfers to it; and q6 asks what doubling
 * a layer does to the total, where the two live options differ in magnitude
 * rather than in which layer they touch.
 *
 * q3's new content is the question the *old* §5.10 wrongly killed in the first
 * place — applying a stated rule to a specific case. Under the corrected rule it
 * is exactly what the official exercises do.
 *
 * BUSINESS ADMINISTRATION. q3's statement of the return rule implied that the
 * rebate is settled across the whole year, which is what q2 asked. q2 becomes a
 * computation rather than a judgement about direction: knowing the method no
 * longer gives the number. q3 moves to the scheme's lowest boundary, so it no
 * longer sits on the same band edge q2 crosses.
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

patch('gam-engineering-thermal-resistance-001.json', {
  'gam-eng-tr-001-q3': {
    stem:
      'A builder proposes moving the insulation layer of the wall in Figure 2 from the cool side to the warm side, keeping both layers otherwise identical. According to the text, what effect does this have on the wall’s U-value?',
    options: [
      { id: 'a', text: 'It falls, because insulation is more effective on the warm side.' },
      { id: 'b', text: 'It rises, because the brick can then hold more heat.' },
      { id: 'c', text: 'It is unchanged, because resistances are added and a sum ignores the order of its terms.' },
      { id: 'd', text: 'It cannot be judged without knowing which side is the warmer on the day in question.' },
    ],
    correctOptionId: 'c',
    reasoning: 'qualitative-inference',
    dependsOn: ['p2', 'p4'],
    supportSpans: [
      { blockId: 'p2', quote: 'Because the resistances are added, the order in which the layers are arranged does not change the total.' },
    ],
    explanation:
      'The wall behaves like a chain: the same heat passes through each layer in turn and the layers’ resistances are added. Addition does not depend on the order of what is added, so the total resistance is exactly what it was, and the U-value with it.',
    refutations: {
      a: {
        blockId: 'p2',
        family: 'plausible-but-unstated',
        reason:
          'The text gives insulation no special relationship to either face. A layer’s resistance is its thickness divided by its conductivity wherever it sits in the wall.',
      },
      b: {
        blockId: 'p2',
        family: 'plausible-but-unstated',
        reason:
          'Storage plays no part in the steady state, where the rate of flow no longer changes with time and the same heat passes through every layer.',
      },
      d: {
        blockId: 'p4',
        family: 'right-concept-wrong-scope',
        reason:
          'A U-value is stated per kelvin of temperature difference, so it does not move with the weather. That is why the guidance can set one limit for all conditions.',
      },
    },
    hints: [
      { level: 1, text: 'Find the sentence that says what the wall’s total resistance is made of.' },
      { level: 2, text: 'The operation that combines the layers has a property worth naming.' },
      { level: 3, text: 'Ask whether the order of the terms in a sum can change the sum.' },
    ],
    difficulty: 'medium',
    meta: { stepCount: 2, blockSpan: 2, transferDistance: 1, requiresExhibit: false },
  },

  'gam-eng-tr-001-q4': {
    stem:
      'A different wall has an area of 15 square metres with 16 kelvin across it. It is built from an outer layer 0.32 m thick of conductivity 0.80 watts per metre kelvin, and an inner layer 0.12 m thick of conductivity 0.15 watts per metre kelvin. What is the rate of heat flow through it?',
    options: [
      { id: 'a', text: '200 W' },
      { id: 'b', text: '288 W' },
      { id: 'c', text: '300 W' },
      { id: 'd', text: '600 W' },
    ],
    correctOptionId: 'a',
    reasoning: 'apply-formula',
    dependsOn: ['f1', 'p2'],
    supportSpans: [
      { blockId: 'f1', quote: 'R = d / lambda;   Q = A * dT / R_total' },
      { blockId: 'p2', quote: 'the resistances of the layers are added together to give the total resistance of the wall' },
    ],
    explanation:
      'Each layer resists its thickness divided by its conductivity: the outer layer 0.32 ÷ 0.80 = 0.4, the inner 0.12 ÷ 0.15 = 0.8, a total of 1.2. The wall is 15 square metres with 16 kelvin across it, so the flow is 15 × 16 ÷ 1.2 = 200 watts.',
    refutations: {
      b: {
        blockId: 'f1',
        family: 'misapplied-formula',
        reason:
          '288 watts multiplies by the total resistance instead of dividing by it. Resistance opposes the flow, so it belongs under the line.',
      },
      c: {
        blockId: 'p2',
        family: 'right-concept-wrong-scope',
        reason:
          '300 watts uses the inner layer’s resistance alone. The outer layer resists as well, and the text says the layers’ resistances are added.',
      },
      d: {
        blockId: 'p2',
        family: 'right-concept-wrong-scope',
        reason:
          '600 watts uses the outer layer’s resistance alone, which leaves out the layer carrying most of the resistance.',
      },
    },
    computation: { expression: '15*16/(0.32/0.80 + 0.12/0.15)', expected: 200, unit: 'W' },
    hints: [
      { level: 1, text: 'Work out each layer’s resistance before you go near the heat flow.' },
      { level: 2, text: 'The text says how two resistances combine into one figure for the wall.' },
      { level: 3, text: 'Then multiply the area by the temperature difference and divide by that figure.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 4, blockSpan: 2, transferDistance: 2, requiresExhibit: false },
  },

  'gam-eng-tr-001-q6': {
    stem:
      'The insulation layer of the wall in Figure 2 is replaced by one of the same material but twice as thick. According to the text, what happens to the wall’s total thermal resistance?',
    options: [
      { id: 'a', text: 'It doubles, because the resistance of the layer that changed doubles.' },
      { id: 'b', text: 'It rises by four fifths.' },
      { id: 'c', text: 'It rises by two fifths.' },
      { id: 'd', text: 'It is unchanged, because the material is the same as before.' },
    ],
    correctOptionId: 'b',
    reasoning: 'sensitivity',
    dependsOn: ['p3', 'fig2', 'f1'],
    supportSpans: [
      { blockId: 'p3', quote: 'Doubling the thickness of one layer doubles that layer' + String.fromCharCode(39) + 's resistance, but it does not double the total resistance of the wall, because the other layers are unchanged.' },
      { blockId: 'fig2', quote: 'thickness 0.08 m, conductivity 0.05 watts per metre kelvin' },
      { blockId: 'f1', quote: 'R = d / lambda' },
    ],
    explanation:
      'The two layers resist 0.4 and 1.6, a total of 2.0. Doubling the insulation’s thickness doubles its own resistance to 3.2, giving a new total of 3.6. That is a rise of 1.6 on 2.0 — four fifths, not double, because the brick layer is unchanged.',
    refutations: {
      a: {
        blockId: 'p3',
        family: 'contradicts-source',
        reason:
          'The text warns against exactly this: doubling one layer doubles that layer’s resistance, not the wall’s, because the other layer does not change.',
      },
      c: {
        blockId: 'fig2',
        family: 'arithmetic-slip',
        reason:
          'Two fifths would be the rise if the layer that doubled were the smaller of the two. It is the larger: it carries 1.6 of the wall’s 2.0.',
      },
      d: {
        blockId: 'f1',
        family: 'contradicts-source',
        reason:
          'Resistance is thickness divided by conductivity, so thickness moves it even when the material is unchanged.',
      },
    },
    computation: {
      expression: '((0.24/0.60 + 0.16/0.05) - (0.24/0.60 + 0.08/0.05))/(0.24/0.60 + 0.08/0.05)',
      expected: 0.8,
    },
    hints: [
      { level: 1, text: 'Work out the two layers’ resistances separately before changing anything.' },
      { level: 2, text: 'Only one of the two changes, and the text says what happens to it.' },
      { level: 3, text: 'Set the increase against the total the wall started with, not against the layer that moved.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 4, blockSpan: 3, transferDistance: 2, requiresExhibit: true },
  },
})

patch('gam-business-administration-step-rebate-001.json', {
  'gam-ba-sr-001-q2': {
    stem:
      'A buyer has bought 880 units and the calendar year is almost over. One further order would take the year’s total to 900. By how much would the year’s rebate increase?',
    options: [
      { id: 'a', text: '84 euros' },
      { id: 'b', text: '1,620 euros' },
      { id: 'c', text: '1,668 euros' },
      { id: 'd', text: '3,780 euros' },
    ],
    correctOptionId: 'c',
    reasoning: 'apply-formula',
    dependsOn: ['l1', 't1', 'p1'],
    supportSpans: [
      { blockId: 'l1', quote: 'The rebate is retrospective' },
      { blockId: 't1', quote: '400 to 899 4 per cent' },
      { blockId: 'p1', quote: 'a list price of 60 euros per unit' },
    ],
    explanation:
      'At 880 units the year sits in the 4 per cent band, so the rebate is 880 × 60 × 0.04 = 2,112 euros. Reaching 900 moves the year into the 7 per cent band, and because the rate applies to everything bought in the year the rebate becomes 900 × 60 × 0.07 = 3,780. The increase is 3,780 − 2,112 = 1,668 euros.',
    refutations: {
      a: {
        blockId: 'l1',
        family: 'misapplied-formula',
        reason:
          '84 euros is 7 per cent of the twenty extra units alone. That is the incremental reading the scheme rules out: the band’s rate applies to every unit bought in the year.',
      },
      b: {
        blockId: 't1',
        family: 'arithmetic-slip',
        reason:
          '1,620 euros applies the three-point gap between the rates to all 900 units. The rebate the buyer already had was earned on 880, not 900, so the difference is not a clean three per cent of one quantity.',
      },
      d: {
        blockId: 'l1',
        family: 'right-concept-wrong-scope',
        reason:
          '3,780 euros is the whole of the new rebate, not the increase. The buyer was already due 2,112 before the extra order.',
      },
    },
    computation: { expression: '900*60*0.07 - 880*60*0.04', expected: 1668, unit: 'euros' },
    hints: [
      { level: 1, text: 'Work out which band the year sits in now, and which band the further order would reach.' },
      { level: 2, text: 'The scheme says how much of the year each band’s rate applies to.' },
      { level: 3, text: 'Work out the rebate before and the rebate after, then take one from the other.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 5, blockSpan: 3, transferDistance: 2, requiresExhibit: true },
  },

  'gam-ba-sr-001-q3': {
    stem:
      'Two buyers have each been credited with a rebate, one on a year’s total of 420 units and the other on 600. Before the year ends each of them returns 40 units. According to the scheme, how do the two returns differ in their effect?',
    options: [
      { id: 'a', text: 'Neither rebate is withdrawn, because the band was fixed when the total passed its lower limit.' },
      { id: 'b', text: 'Both rebates are withdrawn, and neither buyer is due anything.' },
      { id: 'c', text: 'The first buyer’s rebate is withdrawn and nothing is due in its place; the second’s is not withdrawn.' },
      { id: 'd', text: 'The second buyer’s rebate is withdrawn and nothing is due in its place; the first’s is not.' },
    ],
    correctOptionId: 'c',
    reasoning: 'classify-scenario',
    dependsOn: ['p2', 'l1', 't1'],
    supportSpans: [
      { blockId: 'l1', quote: 'Units returned are taken out of the year’s total on the day they are returned.' },
      { blockId: 't1', quote: 'fewer than 400 no rebate' },
      { blockId: 'p2', quote: 'the whole of the rebate credited under that band is recovered from the buyer' },
    ],
    explanation:
      'Both returns come out of the year’s total. The first buyer falls to 380, below the lowest threshold the scheme sets, so the rebate credited is withdrawn and the reduced total earns none at all. The second falls to 560, still inside the band that was credited, so that rebate stands and only its amount changes.',
    refutations: {
      a: {
        blockId: 'l1',
        family: 'contradicts-source',
        reason:
          'The scheme says the opposite: returned units come out of the year’s total on the day they are returned, so a band once reached is not held.',
      },
      b: {
        blockId: 'p2',
        family: 'right-concept-wrong-scope',
        reason:
          'Withdrawal follows only from a return that takes the total below the lower limit of the band already credited. The second buyer stays well inside it.',
      },
      d: {
        blockId: 't1',
        family: 'swapped-quantities',
        reason:
          'This has the two buyers the wrong way round. It is the smaller total that falls through the scheme’s lowest threshold; the larger one has room to spare.',
      },
    },
    hints: [
      { level: 1, text: 'Work out each buyer’s total after the return before looking at what the scheme does about it.' },
      { level: 2, text: 'Then ask, for each, whether the reduced total still reaches the band it was credited under.' },
      { level: 3, text: 'One of the two falls below the point at which the scheme pays anything at all.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 4, blockSpan: 3, transferDistance: 3, requiresExhibit: true },
  },
})
