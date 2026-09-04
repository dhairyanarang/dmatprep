/**
 * Pack 4, 4 September 2026 — the replacement for the retired break-even pack.
 *
 * The retirement's lesson (§5.10) is the whole of this pack's design. Break-even
 * failed because its governing relationship — q = F / (p − v) — is one every
 * candidate already holds, so the source contributed numerals and nothing else.
 *
 * This pack's governing scheme is invented, and four separate stipulations do the
 * work no candidate can bring with them:
 *
 *   1. the rebate is RETROSPECTIVE — it applies to every unit of the year, not
 *      only those above the band's floor, which is what produces the cliff at a
 *      threshold and is the opposite of the incremental reading most people
 *      assume;
 *   2. it is calculated on LIST value, whatever price was actually paid;
 *   3. a return is taken out of the year's total on the day it is made, and if it
 *      drops the buyer a band the rebate already credited is RECOVERED IN FULL;
 *   4. bands are set per CALENDAR YEAR and nothing carries over.
 *
 * Every question turns on at least one of them, so the contribution is
 * load-bearing rather than decoration — the defect still blocking the
 * computational-sciences pack.
 *
 * Leakage is minimised by construction: only one question offers numeric options.
 * The other four are qualitative applications, so there is almost no numeric
 * surface for a sibling to expose.
 */
import { writeFileSync } from 'node:fs'
import { contentHash } from '../lib/validate.mjs'

const pack = {
  id: 'gam-business-administration-step-rebate-001',
  domain: 'business-administration',
  title: 'A supplier’s step rebate scheme',
  defines: ['step rebate', 'band', 'list price', 'retrospective'],
  provenance: {
    originality: 'original',
    draftedBy: 'pilot-b2',
    reviewStatus: 'automated-pass',
    notes:
      'Replaces the retired break-even pack. The scheme, its four bands, its rates and its four stipulations ' +
      'are invented for this pack; nothing here is a textbook relationship a candidate could bring with them, ' +
      'which is what §5.10 requires and what the retired pack could not satisfy.',
  },
  blocks: [
    {
      kind: 'heading',
      id: 'h1',
      text: 'A supplier’s step rebate scheme',
    },
    {
      kind: 'paragraph',
      id: 'p1',
      text:
        'A wholesaler sells a single product at a list price of 60 euros per unit and operates what it calls a step rebate. At the end of each calendar year the wholesaler totals the units a buyer has bought, places that total in a band, and pays back a percentage of what the buyer spent. The scheme is not a discount at the point of sale: the buyer pays the list price on every order and receives the rebate afterwards.',
    },
    {
      kind: 'table',
      id: 't1',
      caption: 'The bands of the scheme, and the rate that applies to each.',
      columns: ['Units bought in the calendar year', 'Rate'],
      rows: [
        ['fewer than 400', 'no rebate'],
        ['400 to 899', '4 per cent'],
        ['900 to 1499', '7 per cent'],
        ['1500 or more', '11 per cent'],
      ],
    },
    {
      kind: 'formula',
      id: 'f1',
      latex: 'rebate = r * L * q',
      caption: 'The rebate due for a calendar year.',
      legend: [
        { symbol: 'q', meaning: 'units bought in the calendar year' },
        { symbol: 'L', meaning: 'the list price of one unit' },
        { symbol: 'r', meaning: 'the rate of the band that q falls in' },
      ],
    },
    {
      kind: 'list',
      id: 'l1',
      ordered: false,
      items: [
        'The rebate is retrospective: the band’s rate applies to every unit bought in the year, and not only to the units above the band’s lower limit.',
        'Every unit bought in the year counts towards the band, whatever price was actually paid for it.',
        'The rebate is calculated on the list price of the units, and never on a price that a separate discount has already reduced.',
        'Units returned are taken out of the year’s total on the day they are returned.',
        'A year’s purchases do not carry over. Each calendar year is banded on its own.',
      ],
    },
    {
      kind: 'paragraph',
      id: 'p2',
      text:
        'If a return takes the year’s total below the lower limit of a band that has already been credited, the whole of the rebate credited under that band is recovered from the buyer, and the rebate is worked out again at the band the reduced total now falls in. A return that leaves the total inside the same band changes the amount of the rebate but not the rate at which it is worked out.',
    },
    {
      kind: 'figure',
      id: 'fig1',
      caption:
        'Figure 1. The effective price of a unit, after the rebate has been paid back, against the number of units bought in the calendar year.',
      spec: {
        type: 'line-chart',
        xLabel: 'Units bought in the calendar year',
        yLabel: 'Effective price per unit, in euros',
        series: [
          {
            id: 'E',
            label: 'Effective price per unit',
            points: [
              [0, 60],
              [399, 60],
              [400, 57.6],
              [899, 57.6],
              [900, 55.8],
              [1499, 55.8],
              [1500, 53.4],
              [2000, 53.4],
            ],
          },
        ],
        annotations: [
          { at: [400, 57.6], label: 'The price of every unit falls when a band is reached' },
          { at: [1500, 53.4], label: 'The last step' },
        ],
      },
    },
  ],
}

const questions = [
  {
    id: 'gam-ba-sr-001-q1',
    packId: pack.id,
    stem: 'A buyer’s purchases for the calendar year come to 950 units. What rebate is due?',
    options: [
      { id: 'a', text: '210 euros' },
      { id: 'b', text: '2,280 euros' },
      { id: 'c', text: '3,990 euros' },
      { id: 'd', text: '6,270 euros' },
    ],
    correctOptionId: 'c',
    reasoning: 'apply-formula',
    dependsOn: ['t1', 'l1', 'p1'],
    supportSpans: [
      { blockId: 'l1', quote: 'the band’s rate applies to every unit bought in the year, and not only to the units above the band’s lower limit' },
      { blockId: 't1', quote: '900 to 1499 7 per cent' },
      { blockId: 'p1', quote: 'a list price of 60 euros per unit' },
    ],
    explanation:
      '950 units falls in the band from 900 to 1499, which carries 7 per cent. The scheme is retrospective, so that rate applies to all 950 units and not only to the 50 above the band’s lower limit: 950 × 60 × 0.07 = 3,990 euros.',
    refutations: {
      a: {
        blockId: 'l1',
        family: 'misapplied-formula',
        reason:
          '210 euros is 7 per cent of the 50 units above the band’s lower limit. That is the incremental reading the scheme explicitly rules out: the rate applies to every unit bought in the year.',
      },
      b: {
        blockId: 't1',
        family: 'swapped-quantities',
        reason:
          '2,280 euros applies 4 per cent, which is the rate of the band below. 950 units is past 900 and so falls in the next band up.',
      },
      d: {
        blockId: 't1',
        family: 'swapped-quantities',
        reason:
          '6,270 euros applies 11 per cent, the rate of the top band. That band begins at 1500 units, which this buyer has not reached.',
      },
    },
    computation: { expression: '950*60*0.07', expected: 3990, unit: 'euros' },
    hints: [
      { level: 1, text: 'Find the band the year’s total falls in before doing any arithmetic.' },
      { level: 2, text: 'Then check how many of the year’s units the band’s rate applies to; the scheme is explicit about this.' },
      { level: 3, text: 'Multiply the units by the list price and then by the rate for the band.' },
    ],
    difficulty: 'medium',
    meta: { stepCount: 3, blockSpan: 3, transferDistance: 1, requiresExhibit: true },
  },

  {
    id: 'gam-ba-sr-001-q2',
    packId: pack.id,
    stem:
      'A buyer has bought 880 units and the calendar year is almost over. The buyer is considering one further order that would take the year’s total to 900. What happens to the amount the buyer is out of pocket for the year?',
    options: [
      { id: 'a', text: 'It rises, by the list value of the extra units.' },
      { id: 'b', text: 'It rises, because the improved rate applies only to the units above the new band’s lower limit.' },
      { id: 'c', text: 'It falls, because the improved rate applies to everything bought in the year.' },
      { id: 'd', text: 'It is unchanged, because the extra rebate exactly offsets the cost of the extra units.' },
    ],
    correctOptionId: 'c',
    reasoning: 'generalisation',
    dependsOn: ['l1', 't1', 'fig1'],
    supportSpans: [
      { blockId: 'l1', quote: 'The rebate is retrospective' },
      { blockId: 't1', quote: '400 to 899 4 per cent' },
      { blockId: 'fig1', quote: 'The price of every unit falls when a band is reached' },
    ],
    explanation:
      'At 880 units the buyer is in the 4 per cent band and the rebate is 2,112 euros. Reaching 900 moves the whole year into the 7 per cent band, and because the scheme is retrospective the better rate is applied to all 900 units, giving 3,780 euros. The rebate improves by 1,668 euros while the extra goods cost 1,200, so the buyer ends the year 468 euros better off and holds twenty more units.',
    refutations: {
      a: {
        blockId: 'l1',
        family: 'plausible-but-unstated',
        reason:
          'This would be so under a scheme with no bands, or one whose rate did not change. Here the extra order changes the rate that applies to the whole year.',
      },
      b: {
        blockId: 'l1',
        family: 'misapplied-formula',
        reason:
          'The incremental reading is the one the scheme rules out. Under it the better rate would earn only a few euros on the extra units and the bill would indeed rise; that is not this scheme.',
      },
      d: {
        blockId: 't1',
        family: 'arithmetic-slip',
        reason:
          'The two do not offset. The gain in rebate is larger than the cost of the extra units, which is why the position improves rather than holding level.',
      },
    },
    hints: [
      { level: 1, text: 'Work out which band the buyer is in now, and which band the further order would reach.' },
      { level: 2, text: 'The scheme says how much of the year the new rate would apply to. That is the whole of this question.' },
      { level: 3, text: 'Compare the rebate on 880 units at the lower rate with the rebate on 900 at the higher one, and set the difference against what the extra units cost.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 5, blockSpan: 3, transferDistance: 3, requiresExhibit: true },
  },

  {
    id: 'gam-ba-sr-001-q3',
    packId: pack.id,
    stem:
      'Two buyers have each been credited with a rebate, one on a year’s total of 1,520 units and the other on 1,700. Before the year ends each of them returns 40 units. According to the scheme, how do the two returns differ in their effect?',
    options: [
      { id: 'a', text: 'Neither rebate is withdrawn, because the band was fixed when the total passed its lower limit.' },
      { id: 'b', text: 'Both rebates are withdrawn and settled again.' },
      { id: 'c', text: 'The first buyer’s rebate is withdrawn and settled again; the second’s is not withdrawn.' },
      { id: 'd', text: 'The second buyer’s rebate is withdrawn and settled again; the first’s is not.' },
    ],
    correctOptionId: 'c',
    reasoning: 'classify-scenario',
    dependsOn: ['p2', 'l1', 't1'],
    supportSpans: [
      { blockId: 'p2', quote: 'the whole of the rebate credited under that band is recovered from the buyer, and the rebate is worked out again at the band the reduced total now falls in' },
      { blockId: 'l1', quote: 'Units returned are taken out of the year’s total on the day they are returned.' },
      { blockId: 't1', quote: '1500 or more 11 per cent' },
    ],
    explanation:
      'Both returns come out of the year’s total. The first buyer drops to 1,480, which is below the lower limit of the band already credited, so that rebate is recovered in full and worked out again one band down. The second drops to 1,660, which is still inside the same band, so only the amount changes and not the rate.',
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
          'Withdrawal is not triggered by any return, only by one that takes the total below the lower limit of the band already credited. The second return leaves the total inside that band.',
      },
      d: {
        blockId: 't1',
        family: 'swapped-quantities',
        reason:
          'This has the two buyers the wrong way round. It is the smaller total that falls below the lower limit of the band it was credited under; the larger one stays comfortably inside it.',
      },
    },
    hints: [
      { level: 1, text: 'Work out each buyer’s total after the return before looking at what the scheme does about it.' },
      { level: 2, text: 'Then ask, for each, whether the reduced total is still inside the band that was credited.' },
      { level: 3, text: 'The scheme treats a return that crosses a band’s lower limit differently from one that does not.' },
    ],
    difficulty: 'high',
    meta: { stepCount: 4, blockSpan: 3, transferDistance: 3, requiresExhibit: false },
  },

  {
    id: 'gam-ba-sr-001-q4',
    packId: pack.id,
    stem:
      'A buyer negotiates a one-off discount off the list price on an order of 200 units, and ends the calendar year with 620 units in total. According to the scheme, does the discounted order count towards the band, and what is its rebate worked out on?',
    options: [
      { id: 'a', text: 'It counts towards the band, and its rebate is worked out on the price the buyer actually paid.' },
      { id: 'b', text: 'It counts towards the band, and its rebate is worked out on the list price.' },
      { id: 'c', text: 'It does not count towards the band, and earns no rebate.' },
      { id: 'd', text: 'It counts towards the band, but earns no rebate, since a reduction has already been given on it.' },
    ],
    correctOptionId: 'b',
    reasoning: 'classify-scenario',
    dependsOn: ['l1'],
    supportSpans: [
      { blockId: 'l1', quote: 'Every unit bought in the year counts towards the band, whatever price was actually paid for it.' },
      { blockId: 'l1', quote: 'never on a price that a separate discount has already reduced' },
    ],
    explanation:
      'The scheme separates the two questions and answers them differently. What counts towards the band is units, whatever they cost, so all 200 count. What the rebate is worked out on is the list price, never a price a separate discount has already reduced — so the negotiated reduction lowers what the buyer pays and leaves the rebate untouched.',
    refutations: {
      a: {
        blockId: 'l1',
        family: 'contradicts-source',
        reason:
          'The scheme rules this out in terms: the rebate is never worked out on a price a separate discount has already reduced.',
      },
      c: {
        blockId: 'l1',
        family: 'contradicts-source',
        reason:
          'Every unit bought in the year counts towards the band whatever was paid for it, so a discounted order is not outside the scheme.',
      },
      d: {
        blockId: 'l1',
        family: 'plausible-but-unstated',
        reason:
          'Nothing in the scheme withholds the rebate from discounted units. It fixes the value the rebate is worked out on, which is a different matter from withholding it.',
      },
    },
    hints: [
      { level: 1, text: 'There are two separate questions here; the scheme answers them in two separate places.' },
      { level: 2, text: 'One of the conditions says what counts towards the band. Another says what the rebate is worked out on.' },
      { level: 3, text: 'They do not give the same answer, and that is the point of the question.' },
    ],
    difficulty: 'medium',
    meta: { stepCount: 3, blockSpan: 1, transferDistance: 2, requiresExhibit: false },
  },

  {
    id: 'gam-ba-sr-001-q5',
    packId: pack.id,
    stem:
      'A buyer expects to need 1,800 units over the next fourteen months and can place the orders whenever it suits. According to the scheme, which arrangement earns the larger rebate?',
    options: [
      { id: 'a', text: 'Placing all of the orders within one calendar year.' },
      { id: 'b', text: 'Splitting the orders evenly between the two calendar years.' },
      { id: 'c', text: 'Either; the rebate turns on how many units are bought, not on when.' },
      { id: 'd', text: 'Splitting them, so that each calendar year’s total clears the scheme’s lowest threshold.' },
    ],
    correctOptionId: 'a',
    reasoning: 'generalisation',
    dependsOn: ['l1', 't1'],
    supportSpans: [
      { blockId: 'l1', quote: 'A year’s purchases do not carry over. Each calendar year is banded on its own.' },
      { blockId: 't1', quote: '1500 or more 11 per cent' },
    ],
    explanation:
      'Because each calendar year is banded on its own, splitting the orders would put roughly half the units in each year and land both halves in a middling band. Keeping them together reaches the top band, and the retrospective rule then applies its rate to all 1,800 units. Concentration is worth more than spreading under a scheme banded this way.',
    refutations: {
      b: {
        blockId: 'l1',
        family: 'wrong-direction-of-effect',
        reason:
          'Each year would earn its own rebate, but at a lower rate on half the units apiece. Two middling bands are worth less than one top band applied to everything.',
      },
      c: {
        blockId: 'l1',
        family: 'contradicts-source',
        reason:
          'When the units are bought is exactly what the scheme turns on, because a year’s purchases do not carry over and each year is banded on its own.',
      },
      d: {
        blockId: 't1',
        family: 'right-concept-wrong-scope',
        reason:
          'Clearing the lowest threshold is not the object. Both arrangements clear it, and the one that reaches the highest band is worth far more than two that merely qualify.',
      },
    },
    hints: [
      { level: 1, text: 'Find the condition that says what a band is measured over.' },
      { level: 2, text: 'Then work out which band each arrangement would reach.' },
      { level: 3, text: 'Remember which units the rate is then applied to.' },
    ],
    difficulty: 'medium',
    meta: { stepCount: 4, blockSpan: 2, transferDistance: 3, requiresExhibit: false },
  },
]

const file = { pack, questions }
file.pack.contentHash = contentHash(file)
const url = new URL('../../../content/gam/packs/gam-business-administration-step-rebate-001.json', import.meta.url)
writeFileSync(url, `${JSON.stringify(file, null, 2)}\n`)
console.log(`pack 4 written · ${questions.length} questions · hash ${file.pack.contentHash}`)
