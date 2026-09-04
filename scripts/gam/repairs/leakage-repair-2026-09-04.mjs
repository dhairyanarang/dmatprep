/**
 * Pilot repair, 4 September 2026 — cross-question leakage and the four content
 * defects the first independent adjudication round raised.
 *
 * Kept as a script rather than applied by hand so the change to each question is
 * inspectable next to the reason for it, and so re-running it is a no-op.
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
  console.log(`${fileName}: ${Object.keys(replacements).length} question(s) replaced · hash ${file.pack.contentHash}`)
}

/* =========================================================== computational sciences
 *
 * The leak: q1 published SPLIT\'s row of the table as its option set, and q5 and
 * q7 both needed cells from that row. q7 additionally carried q1's answer (240)
 * and q5's answer (1,294) among its own distractors.
 *
 * The repair separates the cells the questions consume. q1 now reads the PAIR
 * row, whose values nothing else needs; q7 moves to n = 4096, so it needs
 * SPLIT\'s 340 rather than the 240 that q5 needs.
 */
patch('gam-computational-sciences-operation-counts-001.json', {
  'gam-cs-oc-001-q1': {
    stem: 'According to Table 1, how many elementary steps does PAIR perform on a catalogue of 16 records?',
    options: [
      { id: 'a', text: '94' },
      { id: 'b', text: '128' },
      { id: 'c', text: '256' },
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
        blockId: 'f1',
        family: 'misapplied-formula',
        reason:
          '256 is 16 squared. PAIR\'s count is n squared divided by two, and the halving has been dropped.',
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

  'gam-cs-oc-001-q7': {
    stem:
      'A program processes a catalogue of 4,096 records with SCAN, and for every record that SCAN examines it runs SPLIT once over the whole catalogue. Ignoring SCAN\'s own steps, how many elementary steps do the SPLIT runs contribute in total?',
    options: [
      { id: 'a', text: '16,754' },
      { id: 'b', text: '1,392,640' },
      { id: 'c', text: '5,580,760' },
      { id: 'd', text: '67,231,744' },
    ],
    correctOptionId: 'b',
    reasoning: 'apply-formula',
    dependsOn: ['p3', 't1'],
    supportSpans: [
      { blockId: 'p3', quote: 'When one routine is run once for every record that another routine processes, the counts are multiplied instead.' },
      { blockId: 't1', quote: 'SPLIT 140 240 340' },
    ],
    explanation:
      'SCAN examines each of the 4,096 records once, and each examination triggers one full run of SPLIT. Table 1 gives SPLIT 340 elementary steps at n = 4096, so the SPLIT runs contribute 4,096 × 340 = 1,392,640 elementary steps.',
    refutations: {
      a: {
        blockId: 'p3',
        family: 'misapplied-formula',
        reason:
          '16,754 adds SCAN\'s 16,414 steps to SPLIT\'s 340. The text reserves addition for routines run one after the other; here one runs inside the other, so the counts multiply.',
      },
      c: {
        blockId: 'p3',
        family: 'swapped-quantities',
        reason:
          '5,580,760 multiplies the two routines\' counts together. What multiplies SPLIT\'s count is the number of records SCAN examines, not the number of steps SCAN takes to examine them.',
      },
      d: {
        blockId: 't1',
        family: 'swapped-quantities',
        reason:
          '67,231,744 multiplies the 4,096 records by SCAN\'s own count. It is SPLIT that runs inside the loop, so it is SPLIT\'s count that is multiplied.',
      },
    },
    computation: { expression: '4096*340', expected: 1392640, unit: 'elementary steps' },
    hints: [
      { level: 1, text: 'Decide first whether the two counts should be added or multiplied, and find the sentence that settles it.' },
      { level: 2, text: 'One SPLIT run happens for each record SCAN examines, and SCAN examines every record once.' },
      { level: 3, text: 'Read SPLIT\'s count at the catalogue size given, then multiply it by the number of records.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 3, blockSpan: 2, transferDistance: 2, requiresExhibit: true },
  },
})

/* =========================================================== engineering
 *
 * The leak: q1 asked for the brick layer\'s thickness and offered the four
 * parameters of Figure 2 as its options — the exact set q2 needs. Every numeric
 * read of that figure has the same problem, because q2 consumes all of it, so
 * the repair moves q1 off the numbers entirely and onto the steady-state
 * statement in p1, which nothing else in the pack asks about.
 */
patch('gam-engineering-thermal-resistance-001.json', {
  'gam-eng-tr-001-q1': {
    stem:
      'According to Figure 1 and the text, in the steady state how does the quantity of heat entering the warm face of a wall each second compare with the quantity leaving its cool face?',
    options: [
      { id: 'a', text: 'More enters than leaves, because part of it is stored in the wall.' },
      { id: 'b', text: 'Less enters than leaves, because the wall gives up heat it stored earlier.' },
      { id: 'c', text: 'The two are equal, because the same heat passes through every layer each second.' },
      { id: 'd', text: 'Which is greater depends on how thick the wall is.' },
    ],
    correctOptionId: 'c',
    reasoning: 'retrieve',
    dependsOn: ['p1', 'fig1'],
    supportSpans: [
      { blockId: 'p1', quote: 'the same quantity of heat passes through every layer of the wall each second' },
      { blockId: 'fig1', quote: 'Heat passes from the warm side to the cool side at a steady rate' },
    ],
    explanation:
      'The text defines the steady state as the condition in which the rate of flow no longer changes with time, and states that the same quantity of heat then passes through every layer of the wall each second. The two faces are the outer boundaries of that chain, so as much heat leaves the cool face as enters the warm one.',
    refutations: {
      a: {
        blockId: 'p1',
        family: 'contradicts-source',
        reason:
          'Heat accumulating in the wall is exactly what the steady state excludes: the text says the rate of flow no longer changes with time.',
      },
      b: {
        blockId: 'p1',
        family: 'contradicts-source',
        reason:
          'A wall giving up stored heat is a wall whose flow is still changing, which is the condition before the steady state is reached, not in it.',
      },
      d: {
        blockId: 'p1',
        family: 'right-concept-wrong-scope',
        reason:
          'Thickness affects how much heat flows, through the resistance, but not whether as much leaves as enters. The equality holds whatever the wall is made of.',
      },
    },
    hints: [
      { level: 1, text: 'Find where the text says what "steady state" means, and read what it rules out.' },
      { level: 2, text: 'The text describes the layers of a wall as a chain that the same heat passes along.' },
      { level: 3, text: 'If more went in than came out each second, heat would be piling up inside — and the rate of flow would still be changing.' },
    ],
    difficulty: 'low',
    meta: { stepCount: 1, blockSpan: 2, transferDistance: 0, requiresExhibit: true },
  },
})

/* =========================================================== business administration
 *
 * Three faults, one repair each.
 *
 *   LEAK  q3's and q6's stems both restated the pack\'s 90,000 euros of fixed
 *         costs, and q5's options spelled out the 40 and the 25. Between them
 *         they handed over every figure q2 exists to make the candidate find.
 *   LEAK  q3's and q6's options each stated q2's answer of 6,000 units in words.
 *   DEFECT q6 was q2's calculation a second time with different numbers, which
 *         the independent round called redundant.
 *
 * q3 becomes proportional and carries no figures at all — a better question, and
 * one that cannot leak. q5 moves to a workshop of its own whose figures it
 * states itself. q6 inverts the formula to a target profit instead of repeating
 * it.
 */
patch('gam-business-administration-break-even-001.json', {
  'gam-ba-be-001-q3': {
    stem:
      'The workshop\'s fixed costs for the period rise by one third, while the selling price and the variable cost per unit stay as given. What happens to the break-even quantity?',
    options: [
      { id: 'a', text: 'It falls by one third.' },
      { id: 'b', text: 'It is unchanged.' },
      { id: 'c', text: 'It rises by one third.' },
      { id: 'd', text: 'It more than doubles.' },
    ],
    correctOptionId: 'c',
    reasoning: 'sensitivity',
    dependsOn: ['f1', 'p2'],
    supportSpans: [
      { blockId: 'f1', quote: 'c = p - v;   q_BE = F / c' },
      { blockId: 'p2', quote: 'The difference between the selling price of one unit and the variable cost of producing that unit is the contribution margin.' },
    ],
    explanation:
      'The break-even quantity is the fixed costs divided by the contribution margin. Neither the price nor the variable cost changes, so the contribution margin is unchanged and the quantity is simply proportional to the fixed costs: raising them by one third raises the break-even quantity by one third.',
    refutations: {
      a: {
        blockId: 'f1',
        family: 'wrong-direction-of-effect',
        reason:
          'The fixed costs are the numerator. Raising them cannot lower the quantity needed to cover them.',
      },
      b: {
        blockId: 'f1',
        family: 'right-concept-wrong-scope',
        reason:
          'The contribution margin is indeed unchanged, but it is only the divisor. The quantity still moves with the fixed costs above it.',
      },
      d: {
        blockId: 'f1',
        family: 'arithmetic-slip',
        reason:
          'A rise of one third in the numerator is a rise of one third in the quotient, not a doubling; the increase is not being added on top of the original quantity a second time.',
      },
    },
    hints: [
      { level: 1, text: 'Write down what the break-even quantity is divided by, and ask whether that divisor has moved.' },
      { level: 2, text: 'Only one of the three quantities in the formula has changed.' },
      { level: 3, text: 'When only the numerator of a quotient changes, the quotient changes in the same proportion.' },
    ],
    difficulty: 'medium',
    meta: { stepCount: 2, blockSpan: 2, transferDistance: 1, requiresExhibit: false },
  },

  'gam-ba-be-001-q5': {
    stem:
      'A different workshop sells each unit for 32 euros and incurs a variable cost of 20 euros per unit. It sells one unit more than its break-even quantity. By how much does its profit for the period change, and why?',
    options: [
      { id: 'a', text: 'By 32 euros, because that is the revenue the extra unit brings in.' },
      { id: 'b', text: 'By 12 euros, which is what one unit is left with once the fixed costs are already covered.' },
      { id: 'c', text: 'By 20 euros, because that is the variable cost incurred on the extra unit.' },
      { id: 'd', text: 'It does not change, because the fixed costs have already been covered.' },
    ],
    correctOptionId: 'b',
    reasoning: 'apply-formula',
    dependsOn: ['p2', 'f1'],
    supportSpans: [
      { blockId: 'p2', quote: 'every further unit adds its contribution margin to profit' },
      { blockId: 'f1', quote: 'c = p - v' },
    ],
    explanation:
      'The contribution margin is the selling price less the variable cost, here 32 − 20 = 12 euros. At the break-even quantity the fixed costs are exactly covered, so the contribution of every unit sold beyond that point is added to profit.',
    refutations: {
      a: {
        blockId: 'p2',
        family: 'right-concept-wrong-scope',
        reason:
          'The extra unit does bring in 32 euros of revenue, but producing it also costs 20 euros. Only the difference reaches profit.',
      },
      c: {
        blockId: 'p2',
        family: 'swapped-quantities',
        reason:
          'The variable cost is incurred, not saved, and it is subtracted from the price to give the contribution margin rather than being the answer itself.',
      },
      d: {
        blockId: 'p2',
        family: 'contradicts-source',
        reason:
          'The text says the opposite: once the fixed costs are covered, every further unit adds its contribution margin to profit rather than nothing.',
      },
    },
    computation: { expression: '32-20', expected: 12, unit: 'euros' },
    hints: [
      { level: 1, text: 'The fixed costs are already paid for at this point, so ask what is left of the price of one more unit.' },
      { level: 2, text: 'Find the quantity the text says each unit contributes towards the fixed costs.' },
      { level: 3, text: 'Take the variable cost away from the selling price for a single unit.' },
    ],
    difficulty: 'medium',
    meta: { stepCount: 2, blockSpan: 2, transferDistance: 1, requiresExhibit: false },
  },

  'gam-ba-be-001-q6': {
    stem:
      'The workshop wants to end the period with a profit of 30,000 euros. Selling at the price and variable cost given for it, how many units must it sell?',
    options: [
      { id: 'a', text: '2,000 units' },
      { id: 'b', text: '3,000 units' },
      { id: 'c', text: '4,800 units' },
      { id: 'd', text: '8,000 units' },
    ],
    correctOptionId: 'd',
    reasoning: 'generalisation',
    dependsOn: ['p2', 'p3', 'f1'],
    supportSpans: [
      { blockId: 'p2', quote: 'Once enough units have been sold for the accumulated contributions to equal the fixed costs, every further unit adds its contribution margin to profit.' },
      { blockId: 'p3', quote: 'sells each unit for 40 euros and incurs a variable cost of 25 euros per unit' },
      { blockId: 'f1', quote: 'q_BE = F / c' },
    ],
    explanation:
      'The formula in the source covers break-even only, but the text says what happens beyond it: each further unit adds its contribution margin to profit. Contributions must therefore cover the fixed costs and the wanted profit together. With a contribution margin of 15 euros, the workshop needs (90,000 + 30,000) ÷ 15 = 8,000 units.',
    refutations: {
      a: {
        blockId: 'p2',
        family: 'right-concept-wrong-scope',
        reason:
          '2,000 units covers the wanted profit alone. The contributions have to pay off the fixed costs first, and only what accumulates after that becomes profit.',
      },
      b: {
        blockId: 'f1',
        family: 'misapplied-formula',
        reason:
          '3,000 divides the total to be covered by the selling price rather than by the contribution margin, which ignores the variable cost incurred on every unit.',
      },
      c: {
        blockId: 'f1',
        family: 'swapped-quantities',
        reason:
          '4,800 divides by the variable cost instead of by the difference between the price and the variable cost.',
      },
    },
    computation: { expression: '(90000+30000)/(40-25)', expected: 8000, unit: 'units' },
    hints: [
      { level: 1, text: 'The formula given covers break-even only. Ask what the sentence after it says happens once break-even is passed.' },
      { level: 2, text: 'Contributions have two jobs here: covering the fixed costs, and then building the wanted profit.' },
      { level: 3, text: 'Add the wanted profit to the fixed costs, and divide the total by the contribution margin per unit.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 4, blockSpan: 3, transferDistance: 2, requiresExhibit: false },
  },
})

/* =========================================================== humanities
 *
 * No leakage here — the pack carries no figures to leak. What the independent
 * round found instead was three questions that did not need their source:
 *
 *   q4  restated p6's worked example (a charter forged after its claimed date)
 *       almost point for point, so it tested recognition rather than transfer.
 *   q5  asked what agreement between texts descending from one lost original
 *       establishes — which is a standard principle of source criticism, and the
 *       blind adjudicator answered it without material help from the pack.
 *   q6  asked which statement about the three checks follows, and the key
 *       paraphrased a single sentence of p1.
 *
 * All three are rebuilt as applications to cases the source does not work
 * through, in which the general principle alone gives the wrong answer.
 */
patch('gam-humanities-source-checks-001.json', {
  'gam-hum-sc-001-q4': {
    stem:
      'A set of household accounts is attributed to a well-known abbey steward, but was in fact drawn up by an assistant whose name is nowhere recorded. A historian is studying how households of this kind managed their supplies. According to the text, how should the accounts be treated?',
    options: [
      { id: 'a', text: 'As worthless, because a document that fails a check cannot serve as evidence.' },
      { id: 'b', text: 'As evidence for the steward\'s own practice, since an assistant would have worked to his instructions.' },
      { id: 'c', text: 'As sound evidence for this historian\'s question, which does not turn on who wrote the accounts.' },
      { id: 'd', text: 'As usable only once a second set of accounts from another household shows the same practice.' },
    ],
    correctOptionId: 'c',
    reasoning: 'classify-scenario',
    dependsOn: ['p6', 'p2'],
    supportSpans: [
      { blockId: 'p6', quote: 'A document that fails one of the checks may still be valuable, provided the historian' },
      { blockId: 'p2', quote: 'any statement whose force depends on the claimed origin must be set aside' },
    ],
    explanation:
      'The accounts fail the attribution check: they are not by the person named in them. The text does not make that fatal. It makes the failed check fatal only to statements whose force depends on the claimed origin. How supplies were managed is recorded by the accounts whoever held the pen, so the historian\'s question is untouched by the failure.',
    refutations: {
      a: {
        blockId: 'p6',
        family: 'contradicts-source',
        reason:
          'The text says explicitly that a document failing one of the checks may still be valuable. Failing a check narrows what a document can be used for; it does not discard it.',
      },
      b: {
        blockId: 'p2',
        family: 'plausible-but-unstated',
        reason:
          'This is the one use the failed check does rule out. Any statement about the steward himself depends on the claimed authorship, which is exactly what has been shown to be false.',
      },
      d: {
        blockId: 'p6',
        family: 'right-concept-wrong-scope',
        reason:
          'Corroboration is what the text asks for after a failed interest check, where motive is in doubt. Here the historian\'s question does not depend on the check that failed, so no second document is needed to license it.',
      },
    },
    hints: [
      { level: 1, text: 'Work out which of the three checks these accounts fail before deciding what follows from it.' },
      { level: 2, text: 'The text says a failed check rules out a particular kind of statement, not the document.' },
      { level: 3, text: 'Ask whether what this historian wants to know depends on who wrote the accounts.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 3, blockSpan: 2, transferDistance: 3, requiresExhibit: false },
  },

  'gam-hum-sc-001-q5': {
    stem:
      'Two chronicles describe the same famine. The earlier was written by a monk who lived through it. The later was copied from the earlier a century afterwards, and adds one detail the earlier does not contain: the name of the official who organised relief. A historian asks how well that detail is attested. According to the text, what follows?',
    options: [
      { id: 'a', text: 'It is well attested, because two surviving accounts record the famine.' },
      { id: 'b', text: 'It rests on the later chronicle alone, which is derived from the earlier and cannot confirm it.' },
      { id: 'c', text: 'It is well attested, because the later chronicler worked from an account written by a witness.' },
      { id: 'd', text: 'It must be invented, because a detail absent from the earlier account cannot be genuine.' },
    ],
    correctOptionId: 'b',
    reasoning: 'classify-scenario',
    dependsOn: ['p5', 'p3'],
    supportSpans: [
      { blockId: 'p5', quote: 'Two accounts confirm one another only when they are independent, meaning that neither is derived from the other' },
    ],
    explanation:
      'The later chronicle is copied from the earlier, so the two are not independent and their agreement about the famine confirms nothing. The disputed detail is a further problem: it appears in the derivative text alone, so there is only ever one account of it, and that account is the more distant of the two.',
    refutations: {
      a: {
        blockId: 'p5',
        family: 'contradicts-source',
        reason:
          'Counting surviving accounts is precisely what the text rules out. Confirmation requires independence, and the number of copies makes no difference to it.',
      },
      c: {
        blockId: 'p3',
        family: 'right-concept-wrong-scope',
        reason:
          'Having a witness\'s account to hand improves what the later chronicler could copy accurately. It cannot vouch for a detail that the witness\'s account does not contain.',
      },
      d: {
        blockId: 'p5',
        family: 'plausible-but-unstated',
        reason:
          'The text draws no such conclusion. A detail resting on one late account is weakly attested, which is not the same as shown to be false.',
      },
    },
    hints: [
      { level: 1, text: 'Ask first whether these two chronicles count as two accounts at all, in the sense the text requires.' },
      { level: 2, text: 'The text sets a condition that two accounts must meet before either can confirm the other.' },
      { level: 3, text: 'Then notice which of the two chronicles the disputed detail actually appears in.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 3, blockSpan: 2, transferDistance: 3, requiresExhibit: false },
  },

  'gam-hum-sc-001-q6': {
    stem:
      'A pamphlet carries the name of a printer whose workshop is known to have been operating in the year the pamphlet bears, and it describes a riot the printer says he watched from his own window. The printer was in the pay of the city council, which the pamphlet praises for restoring order. According to the text, how do the three checks stand?',
    options: [
      { id: 'a', text: 'All three pass, since the pamphlet is genuinely the printer\'s and he was present.' },
      { id: 'b', text: 'Attribution and proximity pass; interest does not, since the printer stood to gain from the council\'s favour.' },
      { id: 'c', text: 'Attribution passes; proximity and interest both fail, since a paid author cannot count as a witness.' },
      { id: 'd', text: 'All three fail, because payment by an interested party discredits the pamphlet as a whole.' },
    ],
    correctOptionId: 'b',
    reasoning: 'classify-scenario',
    dependsOn: ['p1', 'p2', 'p3', 'p4', 'p6'],
    supportSpans: [
      { blockId: 'p1', quote: 'They are independent of one another: a document may pass one and fail another' },
      { blockId: 'p2', quote: 'The attribution check asks whether the document is what it presents itself as being' },
      { blockId: 'p4', quote: 'The interest check asks what the author stood to gain or lose if the account were believed.' },
    ],
    explanation:
      'The workshop dates confirm the pamphlet is what it presents itself as being, so attribution passes. The printer describes what he saw himself, which is the closest position the text recognises, so proximity passes. He was paid by the party the pamphlet praises, and stood to gain if his account of the council\'s conduct were believed, so the interest check is the one that fails.',
    refutations: {
      a: {
        blockId: 'p4',
        family: 'right-concept-wrong-scope',
        reason:
          'Being present and being genuinely the author settle two of the checks and say nothing about the third. The text keeps motive separate from both.',
      },
      c: {
        blockId: 'p3',
        family: 'right-concept-wrong-scope',
        reason:
          'The text states that interest concerns motive and is unaffected by how near the author stood to the events. A paid witness is still a witness, so proximity is not what fails here.',
      },
      d: {
        blockId: 'p6',
        family: 'contradicts-source',
        reason:
          'A failed check does not condemn a document outright. The text says it may still be valuable, and it certainly does not carry the other two checks down with it.',
      },
    },
    hints: [
      { level: 1, text: 'Take the three checks one at a time rather than forming a single impression of the pamphlet.' },
      { level: 2, text: 'Two of the details in the description settle two different checks favourably.' },
      { level: 3, text: 'The last detail concerns what the author stood to gain, which the text treats separately from where he stood.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 4, blockSpan: 4, transferDistance: 3, requiresExhibit: false },
  },
})
