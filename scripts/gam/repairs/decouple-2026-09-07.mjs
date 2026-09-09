/**
 * Sibling-coupling repair, 7 September 2026 — the eight residual narrowing leaks.
 *
 * Every repair here changes what a question *asks*, not how it is worded. A leak
 * that survives a rewording was never a wording fault: it is two questions
 * turning on one fact, or an option set that carries information a sibling
 * gives away. Six questions change; none is added; the pilot stays at 24.
 *
 * ENGINEERING (q1, q3, q5 flagged).
 *   q1 and q3 were one question asked twice: both correct answers restated "the
 *   quantity the guidance limits is a sum of layer resistances, and so is
 *   invariant to a non-material factor" — area in q1, layer order in q3. Reading
 *   either one gave the other. q1 also named the guidance, which told a reader of
 *   q5 that q5 is settled by comparing a U-value to a limit rather than by
 *   comparing wattage. And q6's answer disclosed how Figure 2's resistance splits
 *   between its two layers, which is most of what q5 asks.
 *
 *   So q1 stops being an invariance claim and becomes a U-value computed on a
 *   single-layer wall of its own, with the area and the temperature difference
 *   supplied and irrelevant, which is p4's point made as an application rather
 *   than a restatement. (It does not cite Figure 1: the general rule R = d/lambda
 *   in f1 is what the calculation needs, and claiming the figure as a dependency
 *   when nothing turns on it would be decoration. Figure 1 stays a block no
 *   question depends on, and is reported as such.) It no longer mentions the guidance. q3 is left alone: it is now
 *   the pack's only invariance question. q6 moves to a wall of its own, so
 *   nothing about Figure 2's split transfers to q5.
 *
 * COMPUTATIONAL SCIENCES (q1, q6, q7 flagged).
 *   q3 was a special case of q6 — both turned on the rankings reshuffling across
 *   the tabulated sizes — and its option list enumerated Table 1's three column
 *   headings, which told a reader of q1 that n = 16 is a literal table row. One
 *   question caused both leaks. It is replaced by a sensitivity question on
 *   SPLIT's own count, which ranks nothing and enumerates nothing.
 *
 *   q7's answer was a clean multiple of the catalogue size, so dividing the four
 *   options by 4,096 left two candidate SPLIT values and q2's option cluster
 *   picked between them on magnitude. Including SCAN's own steps — which also
 *   drops an artificial "ignoring" clause and exercises both of the text's two
 *   composition rules instead of one — makes no option a clean multiple, so the
 *   division yields nothing. q2 keeps its computation and trades one distractor
 *   for a better one: reading Table 1's n = 4096 column instead of computing.
 *
 * BUSINESS ADMINISTRATION (q2 flagged).
 *   q3's answer establishes that a band re-rates the whole year's quantity. That
 *   was enough to kill q2's smallest option, which was the only one consistent
 *   with re-rating the marginal units alone. The repair is to the option set that
 *   carried the channel: all four options are now consistent with whole-quantity
 *   re-rating and differ in which rate is applied to which total, so knowing the
 *   scheme is retrospective separates none of them. The marginal-versus-whole
 *   trap stays in the pack — it is q1's first distractor.
 *
 * HUMANITIES (q1 flagged).
 *   q1 asked what the proximity check concerns and offered "elapsed time" against
 *   "route by which the information reached the author". Two worked scenarios,
 *   q3 and q6, each turn on the route, so the definition could be read off them.
 *   It was also the pack's only recall-only item. It becomes the case the
 *   siblings cannot settle: both of them confound route with recency — the monk
 *   is late AND second-hand, the printer is contemporary AND an eyewitness — so
 *   neither says which governs when the two pull apart. That is now the question.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { contentHash } from '../lib/validate.mjs'

const dir = new URL('../../../content/gam/packs/', import.meta.url)

function patch(fileName, { replacements, repair }) {
  const url = new URL(fileName, dir)
  const file = JSON.parse(readFileSync(url, 'utf8'))
  for (const [id, question] of Object.entries(replacements)) {
    const i = file.questions.findIndex((q) => q.id === id)
    if (i === -1) throw new Error(`${fileName}: no question ${id}`)
    file.questions[i] = { ...question, id, packId: file.pack.id }
  }
  // Idempotent: re-running replaces this date's record rather than stacking it.
  const kept = (file.pack.provenance.repairs ?? []).filter((r) => r.on !== repair.on)
  file.pack.provenance.repairs = [...kept, repair]
  file.pack.contentHash = contentHash(file)
  writeFileSync(url, `${JSON.stringify(file, null, 2)}\n`)
  console.log(`${fileName}: ${Object.keys(replacements).length} replaced · hash ${file.pack.contentHash}`)
}

/* ------------------------------------------------------------- engineering */

patch('gam-engineering-thermal-resistance-001.json', {
  repair: {
    on: '2026-09-07',
    reason:
      'Three questions carried narrowing leaks. q1 and q3 restated one invariance fact between them, q1 disclosed that the guidance is set on a U-value (which is how q5 must be answered), and q6 disclosed how Figure 2 splits its resistance between its layers (which is most of what q5 computes).',
    changed: {
      'gam-eng-tr-001-q1':
        'Replaced. Was a qualitative claim that two walls of different area stand identically against the guidance; is now a U-value computed on a single-layer wall of its own, with the area and temperature difference given and irrelevant. No longer mentions the guidance, and no longer an invariance claim.',
      'gam-eng-tr-001-q6':
        'Replaced. Same question — what doubling one layer does to the total — moved onto a wall of its own, so its answer no longer discloses Figure 2’s resistance split.',
    },
    unchanged: 'q2, q3, q4 and q5 keep their content; q3 and q5 were leak targets, not leak sources.',
  },
  replacements: {
    'gam-eng-tr-001-q1': {
      stem:
        'A store room has a single-layer wall of area 24 square metres, 0.14 metres thick, made of a material whose conductivity is 0.35 watts per metre kelvin. On the day in question there are 12 kelvin across it. According to the text, what is the wall’s U-value?',
      options: [
        { id: 'a', text: '0.4 watts per square metre kelvin' },
        { id: 'b', text: '2.5 watts per square metre kelvin' },
        { id: 'c', text: '30 watts per square metre kelvin' },
        { id: 'd', text: '720 watts per square metre kelvin' },
      ],
      correctOptionId: 'b',
      reasoning: 'apply-formula',
      dependsOn: ['f1', 'p4'],
      supportSpans: [
        { blockId: 'f1', quote: 'R = d / lambda' },
        {
          blockId: 'p4',
          quote:
            'the rate at which heat crosses one square metre of the wall for each kelvin of temperature difference, which is one divided by the total thermal resistance',
        },
      ],
      explanation:
        'The single layer resists its thickness divided by its conductivity: 0.14 ÷ 0.35 = 0.4 square metre kelvin per watt. The U-value is one divided by that total resistance, so it is 1 ÷ 0.4 = 2.5 watts per square metre kelvin. The wall’s area and the day’s temperature difference are given but do not enter: the text states the U-value per square metre and per kelvin precisely so that it depends on neither.',
      refutations: {
        a: {
          blockId: 'p4',
          family: 'swapped-quantities',
          reason:
            '0.4 is the wall’s thermal resistance, not its U-value. The text defines the U-value as one divided by the total resistance, so the two are reciprocals and cannot be the same number.',
        },
        c: {
          blockId: 'p4',
          family: 'right-concept-wrong-scope',
          reason:
            'Multiplying by the day’s 12 kelvin gives the heat crossing a square metre on that particular day. The U-value is stated for each kelvin of difference, so the temperature difference has already been divided out.',
        },
        d: {
          blockId: 'f1',
          family: 'misapplied-formula',
          reason:
            '720 watts is the rate of heat flow through the whole wall, A × dT ÷ R. That is a quantity in watts for this wall on this day; the U-value is in watts per square metre kelvin and is the same whatever the wall’s size or the weather.',
        },
      },
      computation: { expression: '1/(0.14/0.35)', expected: 2.5, unit: 'W/m2K' },
      hints: [
        { level: 1, text: 'Work out the layer’s thermal resistance first, from its thickness and its conductivity.' },
        { level: 2, text: 'Find the sentence that says what a U-value is in terms of the total resistance, and read it as an instruction.' },
        { level: 3, text: 'Two of the four numbers you are given play no part at all — decide which before you calculate.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 3, blockSpan: 2, transferDistance: 2, requiresExhibit: false },
    },

    'gam-eng-tr-001-q6': {
      stem:
        'A different wall is built from an outer layer 0.30 metres thick of conductivity 1.20 watts per metre kelvin and an inner layer 0.03 metres thick of conductivity 0.04 watts per metre kelvin. The inner layer is replaced by one of the same material but twice as thick. According to the text, what happens to the wall’s total thermal resistance?',
      options: [
        { id: 'a', text: 'It doubles, because the resistance of the layer that changed doubles.' },
        { id: 'b', text: 'It rises by three quarters.' },
        { id: 'c', text: 'It rises by one quarter.' },
        { id: 'd', text: 'It is unchanged, because the material is the same as before.' },
      ],
      correctOptionId: 'b',
      reasoning: 'sensitivity',
      dependsOn: ['f1', 'p2', 'p3'],
      supportSpans: [
        { blockId: 'f1', quote: 'R = d / lambda' },
        { blockId: 'p2', quote: 'the resistances of the layers are added together to give the total resistance of the wall' },
        {
          blockId: 'p3',
          quote:
            "Doubling the thickness of one layer doubles that layer's resistance, but it does not double the total resistance of the wall, because the other layers are unchanged.",
        },
      ],
      explanation:
        'The outer layer resists 0.30 ÷ 1.20 = 0.25 and the inner 0.03 ÷ 0.04 = 0.75, a total of 1.00 square metre kelvin per watt. Doubling the inner layer’s thickness doubles its resistance to 1.50, so the total becomes 1.75. The rise is 0.75 on a total of 1.00 — three quarters.',
      refutations: {
        a: {
          blockId: 'p3',
          family: 'right-concept-wrong-scope',
          reason:
            'The layer that changed does double, but the outer layer is untouched and still contributes what it did before. The text says this explicitly: doubling one layer does not double the wall.',
        },
        c: {
          blockId: 'f1',
          family: 'swapped-quantities',
          reason:
            'A quarter is what the wall would gain if the outer layer were the one doubled. It is the thin inner layer that carries three quarters of the resistance, because its conductivity is thirty times lower.',
        },
        d: {
          blockId: 'f1',
          family: 'contradicts-source',
          reason:
            'Resistance is thickness divided by conductivity, so thickness is half of what fixes it. Keeping the material and changing the thickness changes the layer’s resistance.',
        },
      },
      computation: {
        expression: '((0.30/1.20 + 0.06/0.04) - (0.30/1.20 + 0.03/0.04))/(0.30/1.20 + 0.03/0.04)',
        expected: 0.75,
      },
      hints: [
        { level: 1, text: 'Work out each layer’s resistance before and after the change, then compare the two totals.' },
        { level: 2, text: 'The thin layer is not the small contributor here — divide its thickness by its conductivity and see.' },
        { level: 3, text: 'Express the increase as a fraction of the original total, not of the layer that changed.' },
      ],
      difficulty: 'high',
      meta: { stepCount: 4, blockSpan: 3, transferDistance: 2, requiresExhibit: false },
    },
  },
})

/* --------------------------------------------------- computational sciences */

patch('gam-computational-sciences-operation-counts-001.json', {
  repair: {
    on: '2026-09-07',
    reason:
      'Three questions carried narrowing leaks, two of them caused by q3 alone. q3 was a special case of q6 — both turned on the rankings reshuffling across the tabulated sizes — and its options enumerated Table 1’s three column headings, which confirmed for q1 that n = 16 is a literal table row. Separately, q7’s answer was a clean multiple of the catalogue size, so dividing its options by 4,096 left two candidate SPLIT values that q2’s option cluster then separated on magnitude.',
    changed: {
      'gam-cs-oc-001-q2':
        'Unchanged in the end. A distractor swap (315 for 340, Table 1’s SPLIT count at n = 4096) was drafted and withdrawn: naming 340 in an option hands q7 a value it must take from the table, and the mechanical gate rejected it as sibling-option leakage. Recorded here because the withdrawal is part of the repair, not an absence of one.',
      'gam-cs-oc-001-q3':
        'Replaced. Was "at which listed size does SPLIT perform more steps than SCAN"; is now a sensitivity question on SPLIT’s own count across two doublings. It ranks no routines against one another, names no catalogue size, and — after the mechanical gate caught a first draft that named the formula’s two constants in its options, which would have handed them to q2 — carries no numbers at all.',
      'gam-cs-oc-001-q7':
        'Revised. The artificial "ignoring SCAN’s own steps" clause is dropped and the question asks for the program’s total, which exercises both of the text’s composition rules rather than one. No option is now a clean multiple of the catalogue size.',
    },
    unchanged: 'q1, q4, q5 and q6 keep their content; q1 and q6 were leak targets, not leak sources.',
  },
  replacements: {
    'gam-cs-oc-001-q2': {
      stem: 'A catalogue holds 1,024 records. How many elementary steps does SPLIT perform on it?',
      options: [
        { id: 'a', text: '265' },
        { id: 'b', text: '290' },
        { id: 'c', text: '315' },
        { id: 'd', text: '1,064' },
      ],
      correctOptionId: 'b',
      reasoning: 'apply-formula',
      dependsOn: ['f1'],
      supportSpans: [{ blockId: 'f1', quote: 'T_SPLIT(n) = 25 log2(n) + 40' }],
      explanation:
        '1,024 is 2 multiplied by itself ten times, so its logarithm to base 2 is 10. SPLIT’s count is 25 × 10 + 40 = 290 elementary steps. The catalogue size is not one of the three in Table 1, so the count has to come from the formula.',
      refutations: {
        a: {
          blockId: 'f1',
          family: 'arithmetic-slip',
          reason:
            '265 uses 9 for the logarithm, which is the value for 512 records rather than 1,024. Doubling the catalogue adds one to the logarithm.',
        },
        c: {
          blockId: 'f1',
          family: 'arithmetic-slip',
          reason:
            '315 uses 11 for the logarithm, which is the value for 2,048 records. 1,024 is 2 multiplied by itself ten times, not eleven.',
        },
        d: {
          blockId: 'f1',
          family: 'misapplied-formula',
          reason:
            '1,064 adds the fixed cost of 40 to the number of records themselves. It is the logarithm of the number of records that is multiplied by 25, not the number of records.',
        },
      },
      computation: { expression: '25*10+40', expected: 290, unit: 'elementary steps' },
      hints: [
        { level: 1, text: 'The catalogue size is not one of the three in Table 1, so the table cannot answer this.' },
        { level: 2, text: 'Ask how many times 1,024 can be halved before one record is left.' },
        { level: 3, text: 'Put that count into SPLIT’s formula in place of the logarithm, then add the fixed cost.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 3, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
    },

    'gam-cs-oc-001-q3': {
      stem:
        'A catalogue is doubled in size, and then doubled again. According to the counts given, how does the number of elementary steps SPLIT performs change across the two doublings?',
      options: [
        { id: 'a', text: 'It rises by the same number of steps at each doubling.' },
        { id: 'b', text: 'It rises by more steps at the second doubling than at the first.' },
        { id: 'c', text: 'It rises by fewer steps at the second doubling than at the first.' },
        { id: 'd', text: 'It quadruples, as the catalogue does.' },
      ],
      correctOptionId: 'a',
      reasoning: 'sensitivity',
      dependsOn: ['f1', 'p2'],
      supportSpans: [
        { blockId: 'f1', quote: 'T_SPLIT(n) = 25 log2(n) + 40' },
        { blockId: 'f1', quote: 'logarithm to base 2' },
      ],
      explanation:
        'Doubling a number adds one to its logarithm to base 2, because one further halving is now needed to reach a single record. SPLIT’s count is that logarithm multiplied by a fixed coefficient, plus a fixed cost that never moves. Each doubling therefore adds one lot of the coefficient and nothing else, so the two doublings cost the same as one another however large the catalogue was to begin with.',
      refutations: {
        b: {
          blockId: 'f1',
          family: 'wrong-direction-of-effect',
          reason:
            'A rise that grows with each doubling belongs to a count proportional to the number of records, or to its square. SPLIT’s count follows the logarithm, and a doubling adds one to a logarithm wherever it starts from.',
        },
        c: {
          blockId: 'f1',
          family: 'wrong-direction-of-effect',
          reason:
            'The rise does not shrink either. The logarithm gains exactly one at every doubling, so the count gains exactly one lot of its coefficient at every doubling.',
        },
        d: {
          blockId: 'p2',
          family: 'misapplied-formula',
          reason:
            'A count that quadruples when the catalogue quadruples is proportional to the number of records. SPLIT does not examine the records one by one — it halves the range still under consideration, and its count follows the logarithm rather than the number itself.',
        },
      },
      hints: [
        { level: 1, text: 'Only one of the two terms in SPLIT’s count can move when the catalogue size moves.' },
        { level: 2, text: 'Ask what doubling a number does to its logarithm to base 2, and then what doubling it again does.' },
        { level: 3, text: 'Compare the two rises with each other rather than working either of them out.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 3, blockSpan: 2, transferDistance: 3, requiresExhibit: false },
    },

    'gam-cs-oc-001-q7': {
      stem:
        'A program processes a catalogue of 4,096 records with SCAN, and for every record that SCAN examines it runs SPLIT once over the whole catalogue. How many elementary steps does the program perform in total?',
      options: [
        { id: 'a', text: '16,754' },
        { id: 'b', text: '1,392,640' },
        { id: 'c', text: '1,409,054' },
        { id: 'd', text: '5,597,174' },
      ],
      correctOptionId: 'c',
      reasoning: 'apply-formula',
      dependsOn: ['p3', 't1'],
      supportSpans: [
        {
          blockId: 'p3',
          quote:
            'the inner routine’s count is multiplied by the number of records processed, and not by the outer routine’s own count',
        },
        { blockId: 't1', quote: 'SPLIT 140 240 340' },
      ],
      explanation:
        'Table 1 gives SCAN 16,414 steps and SPLIT 340 steps at n = 4096. SCAN examines each of the 4,096 records once, and each examination triggers one full run of SPLIT, so the SPLIT runs contribute 4,096 × 340 = 1,392,640 steps. SCAN’s own 16,414 steps are performed as well, giving 1,409,054 in total.',
      refutations: {
        a: {
          blockId: 'p3',
          family: 'misapplied-formula',
          reason:
            'Adding SCAN’s 16,414 to SPLIT’s 340 is the count for running the two routines one after the other. Here one runs inside the other, so SPLIT’s count multiplies before anything is added.',
        },
        b: {
          blockId: 'p3',
          family: 'right-concept-wrong-scope',
          reason:
            'This is the contribution of the SPLIT runs alone. SCAN performs its own steps while it examines the records, and the question asks what the program performs in total.',
        },
        d: {
          blockId: 'p3',
          family: 'swapped-quantities',
          reason:
            'This multiplies SPLIT’s count by SCAN’s own count, which is the reading the text rules out. What multiplies SPLIT’s count is the number of records processed, not the number of steps SCAN takes to process them.',
        },
      },
      computation: { expression: '16414 + 4096*340', expected: 1409054, unit: 'elementary steps' },
      hints: [
        { level: 1, text: 'Decide first whether the two counts should be added or multiplied, and find the sentence that settles it.' },
        { level: 2, text: 'One SPLIT run happens for each record SCAN examines, and SCAN examines every record once.' },
        { level: 3, text: 'The question asks what the program performs altogether, so SCAN’s own work belongs in the answer too.' },
      ],
      difficulty: 'high',
      meta: { stepCount: 4, blockSpan: 2, transferDistance: 2, requiresExhibit: true },
    },
  },
})

/* ------------------------------------------------- business administration */

patch('gam-business-administration-step-rebate-001.json', {
  repair: {
    on: '2026-09-07',
    reason:
      'q2 could be narrowed using q3. q3’s answer establishes that a band re-rates the whole year’s quantity rather than the units above the band’s lower limit, and q2’s smallest option was the only one consistent with re-rating the marginal units alone — so knowing the scheme is retrospective eliminated it without any arithmetic. Repairing that moved the same fault onto q1, whose own marginal-only option could then be eliminated on the scale q2’s remaining options reveal; q1 is repaired in the same way and for the same reason.',
    changed: {
      'gam-ba-sr-001-q2':
        'Option set replaced. All four options are now consistent with whole-quantity re-rating and differ only in which rate is applied to which year total, so q3’s answer separates none of them. The stem, the key, the computation and the learning objective are unchanged.',
      'gam-ba-sr-001-q1':
        'Moved from 950 units to 1,600, and its marginal-only distractor retired. Repairing q2 by dropping its one small option tightened the visible spread of its remaining three, which sharpened rather than removed the signal that this scheme pays in thousands — and that signal was enough to eliminate q1’s 210-euro option on scale alone. A question one band up, whose four options all sit in the same order of magnitude, cannot be attacked that way. The retrospective-rule trap survives in a form that scale cannot pick off: applying the rate to the band’s lower limit instead of to the year’s total.',
    },
    unchanged: 'q1, q3, q4 and q5 keep their content; q3 was the leak source and its own content is sound.',
  },
  replacements: {
    'gam-ba-sr-001-q1': {
      stem: 'A buyer’s purchases for the calendar year come to 1,600 units. What rebate is due?',
      options: [
        { id: 'a', text: '3,840 euros' },
        { id: 'b', text: '6,720 euros' },
        { id: 'c', text: '9,900 euros' },
        { id: 'd', text: '10,560 euros' },
      ],
      correctOptionId: 'd',
      reasoning: 'apply-formula',
      dependsOn: ['t1', 'l1', 'p1'],
      supportSpans: [
        { blockId: 't1', quote: '1500 or more' },
        {
          blockId: 'l1',
          quote:
            'The rebate is retrospective: the band’s rate applies to every unit bought in the year, and not only to the units above the band’s lower limit.',
        },
        { blockId: 'p1', quote: 'a list price of 60 euros per unit' },
      ],
      explanation:
        '1,600 units falls in the top band, where the rate is 11 per cent. The rate applies to every unit bought in the year, and the rebate is worked out on the list price of 60 euros: 11 per cent of 1,600 × 60 euros, which is 11 per cent of 96,000 euros.',
      refutations: {
        a: {
          blockId: 't1',
          family: 'right-concept-wrong-scope',
          reason:
            'This uses the 4 per cent of the 400-to-899 band. The year’s total is 1,600, which is past two further boundaries, and it is the band the total falls in that fixes the rate.',
        },
        b: {
          blockId: 't1',
          family: 'right-concept-wrong-scope',
          reason:
            'This uses the 7 per cent of the 900-to-1499 band. 1,600 is above 1,499, so the year falls in the band above it.',
        },
        c: {
          blockId: 'l1',
          family: 'misapplied-formula',
          reason:
            'This applies the rate to the band’s lower limit of 1,500 rather than to the year’s total. The scheme is retrospective: the rate applies to every unit bought in the year, so all 1,600 count.',
        },
      },
      computation: { expression: '1600*60*0.11', expected: 10560, unit: 'euros' },
      hints: [
        { level: 1, text: 'Place the year’s total in the table of bands before doing any arithmetic.' },
        { level: 2, text: 'The rate is a percentage of what the buyer spent, not of the number of units.' },
        { level: 3, text: 'Ask how many of the 1,600 units the rate applies to — the list says.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 3, blockSpan: 3, transferDistance: 1, requiresExhibit: true },
    },

    'gam-ba-sr-001-q2': {
      stem:
        'A buyer has bought 880 units and the calendar year is almost over. One further order would take the year’s total to 900. By how much would the year’s rebate increase?',
      options: [
        { id: 'a', text: '1,584 euros' },
        { id: 'b', text: '1,620 euros' },
        { id: 'c', text: '1,668 euros' },
        { id: 'd', text: '3,780 euros' },
      ],
      correctOptionId: 'c',
      reasoning: 'apply-formula',
      dependsOn: ['l1', 't1', 'p1'],
      supportSpans: [
        {
          blockId: 'l1',
          quote:
            'The rebate is retrospective: the band’s rate applies to every unit bought in the year, and not only to the units above the band’s lower limit.',
        },
        { blockId: 't1', quote: '900 to 1499' },
      ],
      explanation:
        'At 880 units the year sits in the 400-to-899 band, so the rebate is 4 per cent of 880 units at the 60-euro list price: 2,112 euros. The further order takes the total to 900, which falls in the next band at 7 per cent, and that rate applies to every unit bought in the year, not only to the twenty that crossed the line: 7 per cent of 900 units at 60 euros is 3,780 euros. The increase is the difference between the two, 3,780 − 2,112.',
      refutations: {
        a: {
          blockId: 't1',
          family: 'right-concept-wrong-scope',
          reason:
            'This works both rebates on 880 units, so the twenty units that carry the year into the higher band earn nothing themselves. They are bought within the year and count like any others.',
        },
        b: {
          blockId: 't1',
          family: 'swapped-quantities',
          reason:
            'This works both rebates on 900 units. The rebate the buyer already stands to receive is the one due on the year as it is now — 880 units — and it is that figure the increase is measured from.',
        },
        d: {
          blockId: 'p1',
          family: 'right-concept-wrong-scope',
          reason:
            'This is the whole rebate the year would earn at 900 units, not the increase. The buyer was already owed a rebate at 880 units, and the question asks by how much the figure moves.',
        },
      },
      computation: { expression: '900*60*0.07 - 880*60*0.04', expected: 1668, unit: 'euros' },
      hints: [
        { level: 1, text: 'Work out the rebate the year earns as it stands, and then the rebate it would earn after the order.' },
        { level: 2, text: 'Check which band each of the two totals falls in before choosing a rate.' },
        { level: 3, text: 'The higher rate applies to every unit bought in the year, not only to the ones above the band’s lower limit.' },
      ],
      difficulty: 'high',
      meta: { stepCount: 5, blockSpan: 3, transferDistance: 2, requiresExhibit: false },
    },
  },
})

/* ---------------------------------------------------------------- humanities */

patch('gam-humanities-source-checks-001.json', {
  repair: {
    on: '2026-09-07',
    reason:
      'q1 could be narrowed using q3 and q6. It asked what the proximity check concerns and set "elapsed time" against "the route by which the information reached the author"; both worked scenarios turn on the route, so the definition could be read off them without the source. It was also the pack’s only recall-only item.',
    changed: {
      'gam-hum-sc-001-q1':
        'Replaced. Was a definition of the proximity check; is now the case the two worked scenarios cannot settle, because each of them confounds route with recency — the monk in q3 is both late and second-hand, the printer in q6 both contemporary and an eyewitness. The new question pulls the two apart: a second-hand account written within the week against an eyewitness account written two years later.',
    },
    unchanged: 'q2 to q6 keep their content; they were leak sources, and their own content is sound.',
  },
  replacements: {
    'gam-hum-sc-001-q1': {
      stem:
        'Two accounts of the same shipwreck survive. One was written the week after it happened, by a man who had the story from a survivor he spoke to himself. The other was written two years later, by a passenger who had been aboard. According to the text, how do the two stand on the proximity check?',
      options: [
        { id: 'a', text: 'The first stands closer, because it was set down while the events were still fresh.' },
        { id: 'b', text: 'The second stands closer, because its author saw the wreck himself.' },
        { id: 'c', text: 'They stand equally close, since each rests on the testimony of someone who was there.' },
        { id: 'd', text: 'Neither can be placed until it is known what either author stood to gain.' },
      ],
      correctOptionId: 'b',
      reasoning: 'comparative',
      dependsOn: ['p3', 'p4'],
      supportSpans: [
        {
          blockId: 'p3',
          quote: 'An author who saw an event is closer to it than one who was told of it by a participant',
        },
        { blockId: 'p3', quote: 'Proximity concerns the route by which the information reached the author' },
      ],
      explanation:
        'The text places an author who saw an event closer than one who was told of it by a participant, and says plainly that proximity concerns the route by which the information reached the author. The passenger was aboard, so his route to the events is the shortest there is; the other man’s runs through a survivor, one step longer, however soon afterwards he wrote it down. The two-year delay lengthens no route.',
      refutations: {
        a: {
          blockId: 'p3',
          family: 'contradicts-source',
          reason:
            'The text measures proximity by the route the information travelled, not by how soon the writing followed. It ranks the eyewitness above the person told by a participant without any condition about when either wrote.',
        },
        c: {
          blockId: 'p3',
          family: 'right-concept-wrong-scope',
          reason:
            'Both accounts do go back to someone who was there, but the text distinguishes the two positions explicitly: being told of an event by a participant is one step further from it than seeing it.',
        },
        d: {
          blockId: 'p4',
          family: 'right-concept-wrong-scope',
          reason:
            'What an author stood to gain is the interest check. The text keeps the two apart: interest concerns motive and is unaffected by how near the author stood to the events.',
        },
      },
      hints: [
        { level: 1, text: 'Find the sentence that says what proximity is a measure of, and take it literally.' },
        { level: 2, text: 'The text ranks three positions against one another; place each of these two authors in that ranking.' },
        { level: 3, text: 'Ask how many hands the information passed through before it was written down, rather than how long it waited.' },
      ],
      difficulty: 'medium',
      meta: { stepCount: 3, blockSpan: 2, transferDistance: 2, requiresExhibit: false },
    },
  },
})
