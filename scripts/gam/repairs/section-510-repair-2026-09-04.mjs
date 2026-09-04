/**
 * §5.10 pass, 4 September 2026 — engineering repaired, business administration
 * retired.
 *
 * The independent round found six questions a candidate would answer identically
 * with no pack at all, three in each of the two packs built on textbook formulas.
 * Each was a direct read of a sentence stating something universally known:
 * resistances in series add; a sum exceeds any of its terms; break-even is fixed
 * costs over contribution margin; if price equals variable cost there is no
 * break-even.
 *
 * ENGINEERING is repairable because its subject naturally carries a non-generic
 * element. Real building physics quotes performance as a U-value against a
 * stipulated limit, and that limit is a convention no candidate can derive. The
 * new p4 supplies it, and the three failing questions are retargeted onto it.
 *
 * The general laws are not discarded — they move to where §5.10 says generic
 * knowledge belongs. Order-independence and area-independence now each refute an
 * option in q6 instead of being an answer.
 *
 * q2's distractors are rebuilt at the same time to close the residual sibling
 * leak: 90 and 144 were exactly one half and four fifths of the key, and q4's
 * options named those two fractions.
 *
 * BUSINESS ADMINISTRATION is not repairable on the same terms; see the second
 * half of this file.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { contentHash } from '../lib/validate.mjs'

const dir = new URL('../../../content/gam/packs/', import.meta.url)

function edit(fileName, mutate) {
  const url = new URL(fileName, dir)
  const file = JSON.parse(readFileSync(url, 'utf8'))
  mutate(file, (id, question) => {
    const i = file.questions.findIndex((q) => q.id === id)
    if (i === -1) throw new Error(`${fileName}: no question ${id}`)
    file.questions[i] = { ...question, id, packId: file.pack.id }
  })
  file.pack.contentHash = contentHash(file)
  writeFileSync(url, `${JSON.stringify(file, null, 2)}\n`)
  console.log(`${fileName} · hash ${file.pack.contentHash}`)
}

edit('gam-engineering-thermal-resistance-001.json', (file, put) => {
  /* --- the source now contributes a stipulated limit -------------------- */
  if (!file.pack.blocks.some((b) => b.id === 'p4')) {
    file.pack.blocks.push({
      kind: 'paragraph',
      id: 'p4',
      text:
        'Performance is usually quoted not as a resistance but as a U-value: the rate at which heat crosses one square metre of the wall for each kelvin of temperature difference, which is one divided by the total thermal resistance. Because it is stated per square metre and per kelvin, a wall’s U-value does not depend on how large the wall is or on how cold the day is. The guidance this text follows treats an external wall as adequate when its U-value does not exceed 0.28 watts per square metre kelvin.',
    })
  }

  /* --- q1: was the R / R_total notation convention, which is standard --- */
  put('gam-eng-tr-001-q1', {
    stem:
      'Two external walls are built from the same two layers in the same thicknesses, but one is twice the area of the other. According to the text, how do they stand against the guidance?',
    options: [
      { id: 'a', text: 'The smaller wall is the more likely to be adequate, since less heat crosses it.' },
      { id: 'b', text: 'The larger wall is the more likely to be adequate, since its heat flow is spread over more area.' },
      { id: 'c', text: 'They stand identically, because the quantity the guidance limits does not depend on the wall’s area.' },
      { id: 'd', text: 'Neither can be judged until the temperature difference on the day is known.' },
    ],
    correctOptionId: 'c',
    reasoning: 'generalisation',
    dependsOn: ['p4'],
    supportSpans: [
      { blockId: 'p4', quote: 'a wall’s U-value does not depend on how large the wall is or on how cold the day is' },
    ],
    explanation:
      'The guidance is written against the U-value, and a U-value is stated per square metre of wall and per kelvin of temperature difference. Both of those are divided out, so two walls of the same construction have the same U-value whatever their size. More heat does cross the larger wall, but that is not the quantity being judged.',
    refutations: {
      a: {
        blockId: 'p4',
        family: 'right-concept-wrong-scope',
        reason:
          'Less heat does cross the smaller wall. The guidance does not limit the heat crossing a wall; it limits a rate stated per square metre, which is the same for both.',
      },
      b: {
        blockId: 'p4',
        family: 'wrong-direction-of-effect',
        reason:
          'The heat is not spread over more area in any sense that helps: the flow rises in proportion with the area, so the rate per square metre is unchanged.',
      },
      d: {
        blockId: 'p4',
        family: 'plausible-but-unstated',
        reason:
          'The temperature difference is divided out of a U-value as well, which is why the same limit applies whatever the weather.',
      },
    },
    hints: [
      { level: 1, text: 'Find which quantity the guidance actually sets a limit on, rather than assuming it limits the heat flow.' },
      { level: 2, text: 'The text says what that quantity is stated per, and that turns out to matter.' },
      { level: 3, text: 'If a quantity is stated per square metre, doubling the square metres cannot change it.' },
    ],
    difficulty: 'medium',
    meta: { stepCount: 2, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
  })

  /* --- q2: same question, distractors rebuilt to stop leaking to q4 ----- */
  put('gam-eng-tr-001-q2', {
    stem: 'What is the rate of heat flow through the wall shown in Figure 2?',
    options: [
      { id: 'a', text: '180 W' },
      { id: 'b', text: '225 W' },
      { id: 'c', text: '900 W' },
      { id: 'd', text: '1125 W' },
    ],
    correctOptionId: 'a',
    reasoning: 'apply-formula',
    dependsOn: ['f1', 'fig2', 'p2'],
    supportSpans: [
      { blockId: 'f1', quote: 'R = d / lambda;   Q = A * dT / R_total' },
      { blockId: 'fig2', quote: 'thickness 0.24 m, conductivity 0.60 watts per metre kelvin' },
      { blockId: 'p2', quote: 'the resistances of the layers are added together to give the total resistance of the wall' },
    ],
    explanation:
      'Each layer resists in proportion to its thickness and in inverse proportion to its conductivity: the brick gives 0.24 ÷ 0.60 = 0.4 and the insulation 0.08 ÷ 0.05 = 1.6, a total of 2.0. The wall is 18 square metres with 20 kelvin across it, so the flow is 18 × 20 ÷ 2.0 = 180 watts.',
    refutations: {
      b: {
        blockId: 'p2',
        family: 'right-concept-wrong-scope',
        reason:
          '225 watts uses the insulation layer’s resistance alone. The brick resists as well, and the text says the layers’ resistances are added.',
      },
      c: {
        blockId: 'p2',
        family: 'right-concept-wrong-scope',
        reason:
          '900 watts uses the brick layer’s resistance alone, which leaves out the layer carrying most of the resistance.',
      },
      d: {
        blockId: 'f1',
        family: 'misapplied-formula',
        reason:
          '1125 watts divides by the two thicknesses added together. It is the resistances that are added, and a resistance is a thickness divided by a conductivity.',
      },
    },
    computation: { expression: '18*20/(0.24/0.60 + 0.08/0.05)', expected: 180, unit: 'W' },
    hints: [
      { level: 1, text: 'Work out each layer’s resistance before you go near the heat flow.' },
      { level: 2, text: 'The text says how the two resistances combine into one figure for the wall.' },
      { level: 3, text: 'Then multiply the area by the temperature difference and divide by that figure.' },
    ],
    difficulty: 'medium',
    meta: { stepCount: 4, blockSpan: 3, transferDistance: 1, requiresExhibit: true },
  })

  /* --- q4: moved to the brick, so it no longer shares a scenario with q6 - */
  put('gam-eng-tr-001-q4', {
    stem:
      'The brick layer in Figure 2 is replaced by one of the same material but twice as thick. Everything else is unchanged. By what factor does the rate of heat flow through the wall change?',
    options: [
      { id: 'a', text: 'It is unchanged, since the insulation carries the resistance.' },
      { id: 'b', text: 'It falls to about five sixths of its former value.' },
      { id: 'c', text: 'It falls to about one half of its former value.' },
      { id: 'd', text: 'It roughly doubles.' },
    ],
    correctOptionId: 'b',
    reasoning: 'sensitivity',
    dependsOn: ['f1', 'p3', 'fig2'],
    supportSpans: [
      { blockId: 'p3', quote: 'Doubling the thickness of one layer doubles that layer' + String.fromCharCode(39) + 's resistance' },
      { blockId: 'f1', quote: 'Q = A * dT / R_total' },
      { blockId: 'fig2', quote: 'thickness 0.24 m, conductivity 0.60 watts per metre kelvin' },
    ],
    explanation:
      'The brick resists 0.4 and the insulation 1.6, a total of 2.0. Doubling the brick’s thickness doubles its resistance to 0.8 and brings the total to 2.4. The area and temperature difference are unchanged, so the flow falls in inverse proportion to the total: 2.0 divided by 2.4, or five sixths.',
    refutations: {
      a: {
        blockId: 'p3',
        family: 'right-concept-wrong-scope',
        reason:
          'The insulation does carry most of the resistance, but not all of it. The brick’s share is a fifth, and doubling it moves the total.',
      },
      c: {
        blockId: 'p3',
        family: 'arithmetic-slip',
        reason:
          'Halving would follow if the doubled layer were the whole of the wall’s resistance. The text warns that doubling one layer does not double the total.',
      },
      d: {
        blockId: 'f1',
        family: 'wrong-direction-of-effect',
        reason:
          'Adding resistance cannot raise the flow. The total resistance is the divisor, so a larger total gives a smaller flow.',
      },
    },
    computation: {
      expression: '(0.24/0.60 + 0.08/0.05)/(0.48/0.60 + 0.08/0.05)',
      expected: 0.8333333333333334,
    },
    hints: [
      { level: 1, text: 'Work out the two layers’ resistances separately before changing anything.' },
      { level: 2, text: 'Only one of the two changes, and the text says what happens to it.' },
      { level: 3, text: 'The flow is inversely proportional to the total, so compare the old total with the new one.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 4, blockSpan: 3, transferDistance: 2, requiresExhibit: true },
  })

  /* --- q5: was order-independence, which is generic --------------------- */
  put('gam-eng-tr-001-q5', {
    stem: 'Does the wall shown in Figure 2 meet the guidance the text sets?',
    options: [
      { id: 'a', text: 'Yes, comfortably.' },
      { id: 'b', text: 'Yes, though with very little to spare.' },
      { id: 'c', text: 'No; its U-value is nearly twice the greatest the guidance allows.' },
      { id: 'd', text: 'No; its U-value is more than ten times the greatest the guidance allows.' },
    ],
    correctOptionId: 'c',
    reasoning: 'apply-formula',
    dependsOn: ['f1', 'fig2', 'p2', 'p4'],
    supportSpans: [
      { blockId: 'p4', quote: 'treats an external wall as adequate when its U-value does not exceed 0.28 watts per square metre kelvin' },
      { blockId: 'f1', quote: 'R = d / lambda' },
      { blockId: 'fig2', quote: 'thickness 0.08 m, conductivity 0.05 watts per metre kelvin' },
    ],
    explanation:
      'The two layers resist 0.4 and 1.6, so the wall’s total resistance is 2.0 and its U-value is one divided by that, or 0.5 watts per square metre kelvin. The guidance allows no more than 0.28, and 0.5 is close to twice that. The wall does not meet it.',
    refutations: {
      a: {
        blockId: 'p2',
        family: 'wrong-direction-of-effect',
        reason:
          'A comfortable pass would need a total resistance well above 3.5. This wall reaches 2.0, and a larger U-value is a worse wall, not a better one.',
      },
      b: {
        blockId: 'p4',
        family: 'wrong-direction-of-effect',
        reason:
          'The wall is not marginal in either direction. Its U-value misses the limit by roughly the limit again, which is not a near miss.',
      },
      d: {
        blockId: 'fig2',
        family: 'arithmetic-slip',
        reason:
          'Ten times the limit would be a U-value of nearly 3, which is a total resistance of about a third. The insulation layer alone resists more than that.',
      },
    },
    computation: {
      expression: '(1/(0.24/0.60 + 0.08/0.05))/0.28',
      expected: 1.7857142857142858,
    },
    hints: [
      { level: 1, text: 'The guidance is written against a quantity the text defines from the total resistance; find it first.' },
      { level: 2, text: 'Work out the wall’s total resistance, then turn it into that quantity.' },
      { level: 3, text: 'Compare what you get with the greatest value the guidance allows, and by how much.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 5, blockSpan: 4, transferDistance: 2, requiresExhibit: true },
  })

  /* --- q6: was "a sum exceeds its parts", which is arithmetic ------------ */
  put('gam-eng-tr-001-q6', {
    stem:
      'The wall in Figure 2 is to be brought within the guidance. Which of the following changes would do it?',
    options: [
      { id: 'a', text: 'Reversing the order of the two layers, so the insulation lies on the warm side.' },
      { id: 'b', text: 'Halving the area of the wall.' },
      { id: 'c', text: 'Adding a second insulation layer identical to the first.' },
      { id: 'd', text: 'Adding a second brick layer identical to the first.' },
    ],
    correctOptionId: 'c',
    reasoning: 'classify-scenario',
    dependsOn: ['f1', 'fig2', 'p2', 'p4'],
    supportSpans: [
      { blockId: 'p4', quote: 'treats an external wall as adequate when its U-value does not exceed 0.28 watts per square metre kelvin' },
      { blockId: 'p2', quote: 'Because the resistances are added, the order in which the layers are arranged does not change the total.' },
      { blockId: 'fig2', quote: 'thickness 0.08 m, conductivity 0.05 watts per metre kelvin' },
      { blockId: 'f1', quote: 'R = d / lambda' },
    ],
    explanation:
      'A second insulation layer adds 1.6 to the wall’s 2.0, giving 3.6 and a U-value of about 0.278 — just inside the limit of 0.28. None of the others reaches it: a second brick layer adds only 0.4, and the remaining two changes do not alter the U-value at all.',
    refutations: {
      a: {
        blockId: 'p2',
        family: 'contradicts-source',
        reason:
          'The text says the order of the layers does not change the total, because the resistances are added. Rearranging them changes nothing to be judged.',
      },
      b: {
        blockId: 'p4',
        family: 'right-concept-wrong-scope',
        reason:
          'A U-value is stated per square metre, so it does not move with the size of the wall. Half the wall would have half the heat flow and exactly the same U-value.',
      },
      d: {
        blockId: 'fig2',
        family: 'arithmetic-slip',
        reason:
          'A second brick layer adds only 0.4 to the total, taking it to 2.4 and the U-value to about 0.42 — still well above the limit. The brick is the layer that resists least.',
      },
    },
    computation: {
      expression: '1/(0.24/0.60 + 0.08/0.05 + 0.08/0.05)',
      expected: 0.2777777777777778,
    },
    hints: [
      { level: 1, text: 'Two of the four changes can be dismissed without any arithmetic; find the sentences that dismiss them.' },
      { level: 2, text: 'For the other two, work out what each adds to the wall’s total resistance.' },
      { level: 3, text: 'Turn each new total into the quantity the guidance limits, and compare.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 5, blockSpan: 4, transferDistance: 3, requiresExhibit: true },
  })
})

/* ===================================================== business administration
 *
 * RETIRED, not repaired.
 *
 * The same move that rescued the engineering pack does not work here, and the
 * difference is not a matter of effort.
 *
 * Engineering was half working already: q2, q3 and q4 turn on this wall's
 * particular conductivity ratio of twelve to one against a thickness ratio of
 * three to one, which is a fact about the pack and not about physics. Only the
 * three law-based questions failed, and the subject naturally carries a
 * stipulated limit to retarget them onto. That is repair.
 *
 * Break-even has no such half. Its three surviving questions — q2, q5, q6 — are
 * substitutions into q = F / (p - v), a formula the candidate brings with them;
 * the pack contributes the numerals and nothing else. Every block is textbook:
 * the assumption list is the standard cost-volume-profit assumption list, the
 * formula is the standard formula, and the degenerate case where price equals
 * variable cost is the standard degenerate case. To make its questions require
 * the source, a governing rule would have to be added that the subject does not
 * naturally carry — an acceptance threshold, a costing convention — and §5.10 is
 * explicit that bolting a rule onto a textbook source is replacement dressed as
 * repair.
 *
 * So it is replaced. The pack stays in the repository as the evidence for
 * §5.10 rather than being deleted, marked rejected, and it counts for nothing.
 */
edit('gam-business-administration-break-even-001.json', (file) => {
  file.pack.provenance.reviewStatus = 'rejected'
  file.pack.provenance.retiredOn = '2026-09-04'
  file.pack.provenance.retiredBecause =
    'Fails spec §5.10. The independent round of 4 September 2026 judged 3 of its 7 questions answerable ' +
    'with no pack at all, and the remaining questions substitute the pack’s numerals into ' +
    'q = F / (p - v), a relationship the candidate already holds. Every block is textbook ' +
    'cost-volume-profit: the assumption list, the formula and the no-break-even case are all standard. ' +
    'There is no non-generic element in the subject to retarget the failing questions onto, and adding ' +
    'one would be replacement dressed as repair. Kept as the evidence for §5.10; counts for nothing. ' +
    'A replacement should keep the text-plus-assumptions-plus-formula-plus-figure shape and the ' +
    'business-administration or economics domain, and be built on a scheme the source defines itself — ' +
    'a stated costing or allocation rule with its own conventions — rather than on a formula the ' +
    'candidate can be assumed to know.'
})
