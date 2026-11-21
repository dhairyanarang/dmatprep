/**
 * GAM authoring pass, 22 November 2026 — exam-alignment set.
 *
 * Ten questions in four source packs, written against the topics the repository
 * owner reports meeting in the General Academic Module at the 26 September 2026
 * sitting: options trading and financial analysis, electrons and protons, DFA
 * and nondeterministic automata, research strategy, graph interpretation and
 * probability.
 *
 * TERMINOLOGY NOTE, raised deliberately rather than silently resolved. The
 * brief asks for "N-DFA diagrams". `DFA` is standard and expands to
 * *deterministic finite automaton*. The nondeterministic counterpart is
 * standardly `NFA` (*nondeterministic finite automaton*); `NDFA` is a less
 * common but recognised spelling. **`N-DFA` is not a standard form.** The
 * meaning is unambiguous, so the concept is implemented as intended, and the
 * packs use `NFA` because that is the term a candidate will meet. This is
 * reported rather than quietly corrected.
 *
 * ORIGINALITY. Every scenario, scheme, table, figure and name here is written
 * for this repository. The official material is used only as structural
 * authority — a source that must contribute, four options, exactly one correct.
 * Its own topics are deliberately avoided: no vectors, no hydrostatics, no
 * order quantity, and in particular **no deductive-and-inductive research
 * strategies**, which is the official material's own research-strategy
 * treatment. The research-strategy pack here is about sampling design instead.
 * The 8-gram overlap gate in `scripts/gam/lib/validate.mjs` is the backstop.
 *
 * DESIGN RULES carried over from the small-packs experiment of 8 September 2026,
 * because they are what stopped the retired packs leaking:
 *
 *   1. Each source states several distinct rules and each question turns on a
 *      different one. Two questions on one rule is a pack asking the same thing
 *      twice.
 *   2. At most one question per pack offers options that are a function of the
 *      source's own constants, so an option list cannot be solved backwards for
 *      a table the source withholds.
 *
 * Nothing here is `human-reviewed`. Only a person may set that, and until one
 * does these are `automated-pass`: every mechanical gate passed and nothing more.
 */
import { writeFileSync } from 'node:fs'

import { contentHash } from '../lib/validate.mjs'

const dir = new URL('../../../content/gam/packs/', import.meta.url)

const NOTES =
  'Written for the exam-alignment pass of 22 November 2026, against topics reported first-hand from the ' +
  '26 September 2026 sitting. Original scenario, original figures, no official topic reused. Automated ' +
  'gates only — not yet read by a person.'

const provenance = {
  originality: 'original',
  draftedBy: 'exam-alignment-2026-11-22',
  reviewStatus: 'automated-pass',
  notes: NOTES,
}

const hint = (level, text) => ({ level, text })

/* ======================================================= 1. option contracts */

const optionContracts = {
  pack: {
    id: 'gam-business-administration-fixed-price-rights-001',
    domain: 'business-administration',
    title: 'Fixed-price rights on a metals exchange',
    defines: ['buy-right', 'sell-right', 'strike price', 'premium', 'settlement price', 'net result'],
    provenance,
    blocks: [
      { kind: 'heading', id: 'h1', text: 'Fixed-price rights at the Meridian Exchange' },
      {
        kind: 'paragraph',
        id: 'p1',
        text:
          'The Meridian Exchange sells two kinds of fixed-price right over one tonne of refined zinc. A ' +
          'buy-right lets whoever holds it purchase a tonne at a stated strike price on the settlement ' +
          'date, whatever the market is doing that day. A sell-right lets its holder sell a tonne at the ' +
          'strike price on the same terms. A holder is never obliged to use a right, and an unused right ' +
          'simply lapses. The sum paid for a right when it is bought is called the premium, and the ' +
          'premium is paid whether or not the right is later used.',
      },
      {
        kind: 'paragraph',
        id: 'p2',
        text:
          'On the settlement date the exchange values every right by one rule. A buy-right is worth the ' +
          'settlement price minus its strike price when that difference is positive, and nothing ' +
          'otherwise. A sell-right is worth its strike price minus the settlement price when that ' +
          'difference is positive, and nothing otherwise. The net result for the holder is that value ' +
          'less the premium already paid, so a right that lapses leaves its holder down by exactly the ' +
          'premium.',
      },
      {
        kind: 'table',
        id: 't1',
        caption: 'Table 1 — rights offered on the March zinc contract, in euro per tonne',
        columns: ['Right', 'Kind', 'Strike price', 'Premium'],
        rows: [
          ['R1', 'buy-right', '2400', '90'],
          ['R2', 'buy-right', '2550', '35'],
          ['R3', 'sell-right', '2400', '80'],
        ],
      },
      {
        kind: 'figure',
        id: 'f1',
        caption: 'Figure 1 — net result for the holder of R1 against the settlement price',
        spec: {
          type: 'line-chart',
          xLabel: 'Settlement price in euro per tonne',
          yLabel: 'Net result for the holder in euro per tonne',
          series: [
            {
              id: 's1',
              label: 'R1 net result',
              points: [
                [2200, -90],
                [2400, -90],
                [2500, 10],
                [2700, 210],
              ],
            },
          ],
          annotations: [
            {
              label: 'Below the strike',
              detail: 'The line is flat: the right lapses and the holder is down by the premium.',
            },
            {
              label: 'Above the strike',
              detail: 'The line rises by one euro for every euro the settlement price rises.',
            },
          ],
        },
      },
    ],
  },
  questions: [
    {
      id: 'gam-ba-fpr-001-q1',
      packId: 'gam-business-administration-fixed-price-rights-001',
      stem: 'Zinc settles at 2610 euro per tonne. What is the net result for the holder of R1?',
      options: [
        { id: 'opt-a', text: 'A gain of 120 euro per tonne' },
        { id: 'opt-b', text: 'A gain of 210 euro per tonne' },
        { id: 'opt-c', text: 'A gain of 60 euro per tonne' },
        // NOT "a loss of 90": the lapse case is the natural fourth distractor
        // here, but printing 90 hands a later question in this same pack the
        // premium it is supposed to read out of the table. Caught by the
        // sibling-option-leakage gate, which is exactly what it is for.
        { id: 'opt-d', text: 'A gain of 300 euro per tonne' },
      ],
      correctOptionId: 'opt-a',
      reasoning: 'apply-formula',
      dependsOn: ['p2', 't1'],
      supportSpans: [
        {
          blockId: 'p2',
          quote: 'A buy-right is worth the settlement price minus its strike price when that difference is positive',
        },
        { blockId: 't1', quote: '2400' },
      ],
      computation: { expression: '2610 - 2400 - 90', expected: 120, unit: 'euro per tonne' },
      explanation:
        'R1 is a buy-right with a strike of 2400 and a premium of 90. At a settlement price of 2610 the ' +
        'right is worth 2610 minus 2400, which is 210. The net result subtracts the premium already paid, ' +
        'giving 210 minus 90, or a gain of 120 euro per tonne.',
      refutations: {
        'opt-b': {
          blockId: 'p2',
          family: 'misapplied-formula',
          reason:
            'This is the value of the right before the premium is taken off. The source defines the net result as that value less the premium already paid.',
        },
        'opt-c': {
          blockId: 't1',
          family: 'right-concept-wrong-scope',
          reason:
            'This applies the strike price of R2 rather than R1. The question asks about R1, whose strike is the lower of the two buy-rights in the table.',
        },
        'opt-d': {
          blockId: 'p2',
          family: 'wrong-direction-of-effect',
          reason:
            'This adds the premium to the value of the right instead of taking it off. The premium is money already spent, so it can only reduce the net result, never increase it.',
        },
      },
      hints: [
        hint(1, 'Two numbers in the table belong to R1, and the paragraph tells you what to do with each of them in turn.'),
        hint(2, 'Work out what the right is worth on the settlement date first, using only the settlement price and the strike.'),
        hint(3, 'The premium was paid when the right was bought, so it comes off whatever the right turns out to be worth.'),
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 2, transferDistance: 0, requiresExhibit: true },
    },
    {
      id: 'gam-ba-fpr-001-q2',
      packId: 'gam-business-administration-fixed-price-rights-001',
      // Deliberately names the two rights by kind rather than as "R1 and R2".
      // The labels contribute bare digits 1 and 2 to the stem, and the
      // option-self-disclosure gate then reads 2455 and 2490 as two roundings
      // of one rate per "stem value 2" and flags the set. Nothing is actually
      // disclosed — every quantity involved is printed openly in Table 1 — but
      // the phrasing without the labels is clearer anyway, and a gate that
      // stops firing is better than a gate with an exception written against it.
      stem:
        'At which settlement price do the holders of the two buy-rights end the day with exactly the same net result?',
      options: [
        { id: 'opt-a', text: '2455 euro per tonne' },
        { id: 'opt-b', text: '2490 euro per tonne' },
        { id: 'opt-c', text: '2515 euro per tonne' },
        { id: 'opt-d', text: 'There is no such price, because R2 always does better above its strike' },
      ],
      correctOptionId: 'opt-a',
      reasoning: 'comparative',
      dependsOn: ['p2', 't1', 'f1'],
      supportSpans: [
        { blockId: 'p2', quote: 'a right that lapses leaves its holder down by exactly the premium' },
        { blockId: 't1', quote: '2550' },
        { blockId: 'f1', quote: 'The line is flat: the right lapses and the holder is down by the premium.' },
      ],
      computation: { expression: '2400 + 90 - 35', expected: 2455, unit: 'euro per tonne' },
      explanation:
        'Between the two strikes R2 has lapsed, so its holder is down by its premium of 35, while R1 is ' +
        'already worth the settlement price minus 2400. Setting that value less the premium of 90 equal ' +
        'to minus 35 gives a settlement price of 2400 plus 90 minus 35, which is 2455. Above 2550 both ' +
        'rights gain a euro for every euro the price rises, so the gap between them never closes again, ' +
        'and below 2400 both have lapsed at different premiums.',
      refutations: {
        'opt-b': {
          blockId: 'f1',
          family: 'arithmetic-slip',
          reason:
            'This is the price at which R1 alone breaks even, where its own line crosses zero. The question asks where the two holders match each other, not where one of them matches nothing.',
        },
        'opt-c': {
          blockId: 't1',
          family: 'swapped-quantities',
          reason:
            'This adds the premium of R1 to the strike of R2 and subtracts nothing. The two rights belong to different strikes and premiums, which cannot be mixed across rows of the table.',
        },
        'opt-d': {
          blockId: 'p2',
          family: 'plausible-but-unstated',
          reason:
            'Above its strike R2 does gain at the same rate, but the two lines have already met below it, where R2 has lapsed and R1 has not. The source gives a rule for the region between the strikes as well as above them.',
        },
      },
      hints: [
        hint(1, 'The two rights do not behave the same way everywhere. Split the settlement price into the regions where each right is worth using.'),
        hint(2, 'In the stretch between the two strikes, one of the rights has lapsed, so its holder is simply down by what they paid.'),
        hint(3, 'Set the two net results equal in that stretch and solve for the settlement price, then check the answer lies inside it.'),
      ],
      difficulty: 'high',
      meta: { stepCount: 4, blockSpan: 3, transferDistance: 1, requiresExhibit: true },
    },
    {
      id: 'gam-ba-fpr-001-q3',
      packId: 'gam-business-administration-fixed-price-rights-001',
      stem:
        'A trader is convinced the settlement price will end far below every strike in the table. Which right in the table rewards that view, and why?',
      options: [
        { id: 'opt-a', text: 'R3, because a sell-right gains as the settlement price falls below its strike' },
        { id: 'opt-b', text: 'R1, because its strike is the lowest of the three' },
        { id: 'opt-c', text: 'R2, because it costs the least to buy' },
        { id: 'opt-d', text: 'None of them, because the premium is paid whatever happens' },
      ],
      correctOptionId: 'opt-a',
      reasoning: 'classify-scenario',
      dependsOn: ['p1', 'p2', 't1'],
      supportSpans: [
        {
          blockId: 'p2',
          quote: 'A sell-right is worth its strike price minus the settlement price when that difference is positive',
        },
        { blockId: 't1', quote: 'sell-right' },
      ],
      explanation:
        'Only R3 is a sell-right. Its value is the strike minus the settlement price whenever that is ' +
        'positive, so the further the price falls below 2400 the more it is worth, and a large enough ' +
        'fall covers the premium of 80 and leaves a gain. Both buy-rights move the other way and lapse ' +
        'when the price ends below their strikes.',
      refutations: {
        'opt-b': {
          blockId: 'p2',
          family: 'wrong-direction-of-effect',
          reason:
            'R1 is a buy-right, and a buy-right is worth something only when the settlement price finishes above its strike. A falling price makes it lapse however low its strike sits.',
        },
        'opt-c': {
          blockId: 'p1',
          family: 'right-concept-wrong-scope',
          reason:
            'Cost is not the issue the question asks about. R2 is also a buy-right, so a falling price makes it lapse, and the holder is then down by the premium rather than ahead.',
        },
        'opt-d': {
          blockId: 'p2',
          family: 'contradicts-source',
          reason:
            'The premium is indeed always paid, but the source sets the net result as the value of the right less that premium, and a sell-right can be worth far more than the premium when the price falls.',
        },
      },
      hints: [
        hint(1, 'Two of the three entries in the table are the same kind of instrument as each other. Find the one that is not.'),
        hint(2, 'Read the two valuation rules side by side and note which direction of price movement each one rewards.'),
        hint(3, 'The premium is a fixed cost for every right, so it cannot be what separates a good choice from a bad one here.'),
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 3, transferDistance: 1, requiresExhibit: true },
    },
  ],
}

/* ====================================================== 2. protons/electrons */

const chargeBalance = {
  pack: {
    id: 'gam-natural-sciences-charge-inventory-001',
    domain: 'natural-sciences',
    title: 'A charge inventory for four laboratory samples',
    defines: ['proton', 'electron', 'neutron', 'net charge', 'neutral'],
    provenance,
    blocks: [
      { kind: 'heading', id: 'h1', text: 'Counting charge in the Halden detector' },
      {
        kind: 'paragraph',
        id: 'p1',
        text:
          'Three kinds of particle make up the samples in this study. A proton carries one unit of ' +
          'positive charge. An electron carries one unit of negative charge. A neutron carries no charge ' +
          'at all. The net charge of a sample is the number of protons it contains minus the number of ' +
          'electrons it contains, counted in those same units, and neutrons never enter that calculation.',
      },
      {
        kind: 'paragraph',
        id: 'p2',
        text:
          'The detector counts each kind of particle separately and reports the totals. A sample holding ' +
          'exactly as many electrons as protons is called neutral. A sample holding more electrons than ' +
          'protons has taken on extra electrons, and one holding fewer has lost some; the number taken on ' +
          'or lost is the size of the difference between the two counts.',
      },
      {
        kind: 'table',
        id: 't1',
        caption: 'Table 1 — particle counts reported by the detector',
        columns: ['Sample', 'Protons', 'Electrons', 'Neutrons'],
        rows: [
          ['S1', '26', '24', '30'],
          ['S2', '17', '18', '18'],
          ['S3', '11', '11', '12'],
          ['S4', '8', '10', '8'],
        ],
      },
    ],
  },
  questions: [
    {
      id: 'gam-ns-chi-001-q1',
      packId: 'gam-natural-sciences-charge-inventory-001',
      stem: 'What is the net charge of sample S1, in the units used by the study?',
      options: [
        { id: 'opt-a', text: 'Plus 2 units' },
        { id: 'opt-b', text: 'Minus 2 units' },
        { id: 'opt-c', text: 'Plus 32 units' },
        { id: 'opt-d', text: 'Plus 50 units' },
      ],
      correctOptionId: 'opt-a',
      reasoning: 'apply-formula',
      dependsOn: ['p1', 't1'],
      supportSpans: [
        {
          blockId: 'p1',
          quote: 'the number of protons it contains minus the number of electrons it contains',
        },
        { blockId: 't1', quote: '26' },
      ],
      computation: { expression: '26 - 24', expected: 2, unit: 'units of charge' },
      explanation:
        'S1 holds 26 protons and 24 electrons. The net charge is the proton count minus the electron ' +
        'count, which is 26 minus 24, or plus 2 units. The 30 neutrons are ignored, because the source ' +
        'states that neutrons never enter the calculation.',
      refutations: {
        'opt-b': {
          blockId: 'p1',
          family: 'wrong-direction-of-effect',
          reason:
            'This subtracts the protons from the electrons instead. The source fixes the order: protons first, then electrons taken away from them.',
        },
        'opt-c': {
          blockId: 'p1',
          family: 'misapplied-formula',
          reason:
            'This adds the neutron count into the total. The source states explicitly that neutrons carry no charge and never enter the calculation.',
        },
        'opt-d': {
          blockId: 'p1',
          family: 'swapped-quantities',
          reason:
            'This adds the protons and electrons together rather than subtracting. Adding them would treat an electron as adding charge, when it carries the opposite sign to a proton.',
        },
      },
      hints: [
        hint(1, 'Only two of the four columns in the table matter for this question. The paragraph says which.'),
        hint(2, 'The two particles that carry charge carry it in opposite senses, so one count is taken away from the other.'),
        hint(3, 'Read the order of the subtraction off the source rather than choosing it, because reversing it flips the sign of the answer.'),
      ],
      difficulty: 'low',
      meta: { stepCount: 1, blockSpan: 2, transferDistance: 0, requiresExhibit: true },
    },
    {
      id: 'gam-ns-chi-001-q2',
      packId: 'gam-natural-sciences-charge-inventory-001',
      stem: 'Which sample has taken on the greatest number of extra electrons?',
      options: [
        { id: 'opt-a', text: 'Sample S4' },
        { id: 'opt-b', text: 'Sample S2' },
        { id: 'opt-c', text: 'Sample S1' },
        { id: 'opt-d', text: 'Sample S3' },
      ],
      correctOptionId: 'opt-a',
      reasoning: 'comparative',
      dependsOn: ['p2', 't1'],
      supportSpans: [
        {
          blockId: 'p2',
          quote: 'A sample holding more electrons than protons has taken on extra electrons',
        },
        { blockId: 't1', quote: '10' },
      ],
      explanation:
        'A sample has taken on extra electrons when it holds more electrons than protons, and the number ' +
        'taken on is the size of that difference. S4 holds 10 electrons against 8 protons, a difference ' +
        'of two. S2 holds 18 against 17, a difference of one. S1 holds fewer electrons than protons and ' +
        'S3 holds equal numbers, so neither has taken any on. S4 therefore has the greatest number.',
      refutations: {
        'opt-b': {
          blockId: 't1',
          family: 'arithmetic-slip',
          reason:
            'S2 has indeed taken on extra electrons, but only one of them. Another sample in the table has a larger excess of electrons over protons.',
        },
        'opt-c': {
          blockId: 'p2',
          family: 'wrong-direction-of-effect',
          reason:
            'S1 holds fewer electrons than protons, so by the definition in the source it has lost electrons rather than taken any on.',
        },
        'opt-d': {
          blockId: 'p2',
          family: 'contradicts-source',
          reason:
            'S3 holds exactly as many electrons as protons, which the source calls neutral. A neutral sample has taken on none.',
        },
      },
      hints: [
        hint(1, 'The question is about a comparison between two columns, done once for each row of the table.'),
        hint(2, 'Work out the difference between the electron count and the proton count for every sample before choosing.'),
        hint(3, 'A difference in the other direction does not count here, and neither does a difference of zero.'),
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 2, transferDistance: 1, requiresExhibit: true },
    },
  ],
}

/* ========================================================= 3. finite automata */

const automata = {
  pack: {
    id: 'gam-computational-sciences-finite-automata-001',
    domain: 'computational-sciences',
    title: 'Deterministic and nondeterministic finite automata',
    defines: ['finite automaton', 'state', 'start state', 'accepting state', 'transition rule', 'DFA', 'NFA'],
    provenance,
    blocks: [
      { kind: 'heading', id: 'h1', text: 'Two machines that read strings of symbols' },
      {
        kind: 'paragraph',
        id: 'p1',
        text:
          'A finite automaton reads a string of symbols one at a time from left to right, and remembers ' +
          'exactly one thing: which state it is currently in. It begins in a designated start state. Each ' +
          'symbol it reads moves it from its current state to another state, according to a fixed ' +
          'transition rule. When the string runs out the automaton accepts it if the machine has ' +
          'finished in an accepting state, and rejects it otherwise. An automaton is called ' +
          'deterministic, written DFA, when its transition rule gives exactly one next state for every ' +
          'pairing of a current state with a symbol: no pairing may be left out, and none may offer a ' +
          'choice.',
      },
      {
        kind: 'paragraph',
        id: 'p2',
        text:
          'A nondeterministic automaton, written NFA, relaxes that requirement. For a given state and ' +
          'symbol it may list no next state at all, or it may list several. Reading a string then traces ' +
          'not a single path but a set of them at once. Such a machine accepts a string when at least ' +
          'one of those paths ends in an accepting state, and rejects it only when every path fails to ' +
          'do so. The machine is never described as choosing between paths, and nothing in the rule ' +
          'tells it which to prefer.',
      },
      {
        kind: 'table',
        id: 't1',
        caption: 'Table 1 — transition rule for machine M, which is deterministic',
        columns: ['State', 'On symbol a', 'On symbol b'],
        rows: [
          ['Q0, the start state', 'Q1', 'Q0'],
          ['Q1', 'Q1', 'Q2'],
          ['Q2, an accepting state', 'Q1', 'Q0'],
        ],
      },
      {
        kind: 'table',
        id: 't2',
        caption: 'Table 2 — transition rule for machine N, over the same two symbols',
        columns: ['State', 'On symbol a', 'On symbol b'],
        rows: [
          ['P0, the start state', 'P0 and P1', 'P0'],
          ['P1', 'no next state', 'P2'],
          ['P2, an accepting state', 'no next state', 'no next state'],
        ],
      },
      {
        kind: 'figure',
        id: 'f1',
        caption: 'Figure 1 — the three states of machine M and how they are reached',
        spec: {
          type: 'schematic',
          parts: [
            { id: 'g1', label: 'Q0', detail: 'Where every run of machine M begins. Reading b keeps the machine here.' },
            { id: 'g2', label: 'Q1', detail: 'Reached from any state by reading a. Reading a again leaves the machine here.' },
            { id: 'g3', label: 'Q2', detail: 'Reached only from Q1, and only by reading b. This is the one accepting state.' },
          ],
          annotations: [
            { label: 'Reading the diagram', detail: 'Each state names where the machine goes next for each of the two symbols.' },
          ],
        },
      },
    ],
  },
  questions: [
    {
      id: 'gam-cs-fa-001-q1',
      packId: 'gam-computational-sciences-finite-automata-001',
      stem: 'Machine M reads the string a b a b. In which state does it finish, and does it accept the string?',
      options: [
        { id: 'opt-a', text: 'It finishes in Q2 and accepts the string' },
        { id: 'opt-b', text: 'It finishes in Q1 and rejects the string' },
        { id: 'opt-c', text: 'It finishes in Q0 and rejects the string' },
        { id: 'opt-d', text: 'It finishes in Q2 but rejects the string, because Q2 is not the start state' },
      ],
      correctOptionId: 'opt-a',
      reasoning: 'read-exhibit',
      dependsOn: ['p1', 't1'],
      supportSpans: [
        { blockId: 'p1', quote: 'accepts it if the machine has finished in an accepting state' },
        { blockId: 't1', quote: 'Q2, an accepting state' },
      ],
      explanation:
        'Machine M starts in Q0. Reading a moves it to Q1. Reading b moves it from Q1 to Q2. Reading a ' +
        'moves it from Q2 back to Q1. Reading the final b moves it from Q1 to Q2 again. The string has ' +
        'run out with the machine in Q2, which the table marks as an accepting state, so the string is ' +
        'accepted.',
      refutations: {
        'opt-b': {
          blockId: 't1',
          family: 'arithmetic-slip',
          reason:
            'Q1 is where the machine sits after the third symbol, not the fourth. The final b has still to be read, and it moves the machine on.',
        },
        'opt-c': {
          blockId: 't1',
          family: 'swapped-quantities',
          reason:
            'This follows the column for the wrong symbol at some step. Reading b from Q1 does not return the machine to the start state; only reading b from Q2 or from Q0 does that.',
        },
        'opt-d': {
          blockId: 'p1',
          family: 'contradicts-source',
          reason:
            'Acceptance depends on finishing in an accepting state, which the source states plainly. There is no requirement anywhere that the final state also be the start state.',
        },
      },
      hints: [
        hint(1, 'Track one thing only as you read the string: the state the machine is sitting in after each symbol.'),
        hint(2, 'Write down the four moves one under the other rather than trying to hold them together in your head.'),
        hint(3, 'Only the state after the very last symbol decides the outcome; the states passed through along the way do not.'),
      ],
      difficulty: 'medium',
      meta: { stepCount: 4, blockSpan: 2, transferDistance: 0, requiresExhibit: true },
    },
    {
      id: 'gam-cs-fa-001-q2',
      packId: 'gam-computational-sciences-finite-automata-001',
      stem: 'What makes the rule in Table 2 fail the definition of a deterministic machine?',
      options: [
        {
          id: 'opt-a',
          text: 'At least one pairing of a state with a symbol offers a choice of next states, and others name none at all',
        },
        { id: 'opt-b', text: 'It has a different number of states from machine M' },
        { id: 'opt-c', text: 'Its start state is not also an accepting state' },
        { id: 'opt-d', text: 'It lists the two symbols in a different order from the first table' },
      ],
      correctOptionId: 'opt-a',
      reasoning: 'qualitative-inference',
      dependsOn: ['p1', 't2'],
      supportSpans: [
        {
          blockId: 'p1',
          quote: 'no pairing may be left out, and none may offer a choice',
        },
        { blockId: 't2', quote: 'P0 and P1' },
      ],
      explanation:
        'The definition requires exactly one next state for every pairing of a state with a symbol. ' +
        'Table 2 breaks that in both available ways at once: P0 on symbol a names two next states, which ' +
        'is a choice, while P1 on symbol a and P2 on either symbol name none, which leaves pairings out. ' +
        'Either failure alone would be enough.',
      refutations: {
        'opt-b': {
          blockId: 'p1',
          family: 'plausible-but-unstated',
          reason:
            'The definition says nothing about how many states a machine has. Both tables happen to list three, but a deterministic machine may have any number.',
        },
        'opt-c': {
          blockId: 'p1',
          family: 'plausible-but-unstated',
          reason:
            'Nothing in the definition relates the start state to the accepting states. A machine may have them coincide or not, and remain deterministic either way.',
        },
        'opt-d': {
          blockId: 't2',
          family: 'contradicts-source',
          reason:
            'Both tables carry the same two symbol columns in the same order, so this describes something that is not the case, and column order would not bear on determinism in any event.',
        },
      },
      hints: [
        hint(1, 'The definition in the first paragraph ends with two conditions joined together. Test the second table against each separately.'),
        hint(2, 'Look along each row of the second table and count how many next states each cell names.'),
        hint(3, 'A cell naming more than one next state and a cell naming none are different failures, and the table contains both.'),
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 2, transferDistance: 1, requiresExhibit: true },
    },
    {
      id: 'gam-cs-fa-001-q3',
      packId: 'gam-computational-sciences-finite-automata-001',
      stem: 'Does machine N accept the string b a?',
      options: [
        { id: 'opt-a', text: 'No, because every path the machine can trace ends in a state that is not accepting' },
        { id: 'opt-b', text: 'Yes, because one of the paths reaches P2' },
        { id: 'opt-c', text: 'Yes, because the machine returns to its start state, and a run that returns there succeeds' },
        { id: 'opt-d', text: 'It cannot be decided without knowing which of the two paths the machine chooses' },
      ],
      correctOptionId: 'opt-a',
      reasoning: 'apply-formula',
      dependsOn: ['p2', 't2'],
      supportSpans: [
        { blockId: 'p2', quote: 'rejects it only when every path fails to do so' },
        { blockId: 't2', quote: 'P0 and P1' },
      ],
      explanation:
        'Machine N starts in P0. Reading b keeps it in P0, the only entry available. Reading a from P0 ' +
        'then leads to P0 and to P1 at the same time, so after the string there are two live paths, one ' +
        'ending in P0 and one in P1. Neither is the accepting state P2, and the source says a string is ' +
        'rejected only when every path fails to end in an accepting state. Every path fails here, so the ' +
        'string is rejected.',
      refutations: {
        'opt-b': {
          blockId: 't2',
          family: 'arithmetic-slip',
          reason:
            'No path reaches P2 on this string. P2 can only be entered from P1 by reading b, and the string offers no b after the machine first reaches P1.',
        },
        'opt-c': {
          blockId: 'p2',
          family: 'plausible-but-unstated',
          reason:
            'Returning to the start state has no bearing on acceptance. The source makes acceptance depend on finishing in an accepting state, and P0 is not one.',
        },
        'opt-d': {
          blockId: 'p2',
          family: 'contradicts-source',
          reason:
            'This treats the machine as picking a path, which the source rules out directly: it states that the machine is never described as choosing, and that all paths are traced at once.',
        },
      },
      hints: [
        hint(1, 'This machine does not sit in one state as it reads. Keep a set of the states it could be in.'),
        hint(2, 'One cell of the second table names two next states, so the set of live states can grow as you read.'),
        hint(3, 'The verdict depends on whether any member of the final set is accepting, not on picking one of them.'),
      ],
      difficulty: 'high',
      meta: { stepCount: 3, blockSpan: 2, transferDistance: 2, requiresExhibit: true },
    },
  ],
}

/* ================================================ 4. research design and risk */

const samplingDesign = {
  pack: {
    id: 'gam-social-sciences-two-stage-sampling-001',
    domain: 'social-sciences',
    title: 'A two-stage sampling plan for a household survey',
    defines: ['block', 'first stage', 'second stage', 'self-weighting', 'response rate'],
    provenance,
    blocks: [
      { kind: 'heading', id: 'h1', text: 'Designing the Rothcarn household survey' },
      {
        kind: 'paragraph',
        id: 'p1',
        text:
          'The survey team must reach households in a district of 4000 households, arranged in 50 blocks ' +
          'of 80 households each. Rather than list every household in the district, the team draws its ' +
          'sample in two stages. In the first stage it selects 10 of the 50 blocks, every block having ' +
          'the same chance of being chosen. In the second stage it selects 8 households from inside each ' +
          'chosen block, every household in that block again being equally likely. A household can enter ' +
          'the sample only if its own block was selected at the first stage.',
      },
      {
        kind: 'paragraph',
        id: 'p2',
        text:
          'The chance that any particular household joins the sample is the chance that its block is ' +
          'selected multiplied by the chance that the household is then drawn from within that block. ' +
          'The team calls a plan self-weighting when that product works out the same for every household ' +
          'in the district, and it treats the property as worth protecting, because a plan that loses it ' +
          'needs every answer reweighted before any total can be reported.',
      },
      {
        kind: 'figure',
        id: 'f1',
        caption: 'Figure 1 — response rate achieved in each wave of the survey',
        spec: {
          type: 'line-chart',
          xLabel: 'Survey wave',
          yLabel: 'Response rate in per cent',
          series: [
            {
              id: 's1',
              label: 'Response rate',
              points: [
                [1, 72],
                [2, 64],
                [3, 61],
                [4, 60],
              ],
            },
          ],
          annotations: [
            {
              label: 'Recorded rates',
              detail: 'The rates achieved were 72, 64, 61 and 60 per cent in waves one to four.',
            },
            {
              label: 'How the waves differed',
              detail: 'The first wave was conducted in person and the later three by telephone.',
            },
          ],
        },
      },
    ],
  },
  questions: [
    {
      id: 'gam-ss-tss-001-q1',
      packId: 'gam-social-sciences-two-stage-sampling-001',
      stem: 'What is the chance that a particular household in the district joins the sample?',
      options: [
        { id: 'opt-a', text: 'A chance of 0.02' },
        { id: 'opt-b', text: 'A chance of 0.2' },
        { id: 'opt-c', text: 'A chance of 0.1' },
        { id: 'opt-d', text: 'A chance of 0.3' },
      ],
      correctOptionId: 'opt-a',
      reasoning: 'apply-formula',
      dependsOn: ['p1', 'p2'],
      supportSpans: [
        {
          blockId: 'p2',
          quote:
            'the chance that its block is selected multiplied by the chance that the household is then drawn from within that block',
        },
        { blockId: 'p1', quote: 'it selects 10 of the 50 blocks' },
      ],
      computation: { expression: '(10 / 50) * (8 / 80)', expected: 0.02 },
      explanation:
        'A household’s block is one of 50, and 10 of them are selected, so the chance at the first ' +
        'stage is 10 in 50. If the block is selected, 8 of its 80 households are drawn, so the chance at ' +
        'the second stage is 8 in 80. The source says to multiply the two, giving one fifth times one ' +
        'tenth, which is 0.02.',
      refutations: {
        'opt-b': {
          blockId: 'p2',
          family: 'right-concept-wrong-scope',
          reason:
            'This is the chance of the first stage alone. Selecting the block does not put a household in the sample; the second stage still has to draw it.',
        },
        'opt-c': {
          blockId: 'p2',
          family: 'right-concept-wrong-scope',
          reason:
            'This is the chance of the second stage alone, which applies only to households whose block was already selected. It ignores the first stage entirely.',
        },
        'opt-d': {
          blockId: 'p2',
          family: 'misapplied-formula',
          reason:
            'This adds the two stage probabilities instead of multiplying them. The source states the combination is a product, and adding them would make the chance rise as the design became more selective.',
        },
      },
      hints: [
        hint(1, 'Two things both have to happen before a household is interviewed, and the source names them in order.'),
        hint(2, 'Write each stage as a fraction of the group it is drawn from, not as a fraction of the whole district.'),
        hint(3, 'The paragraph tells you how to combine the two stages, and the operation it names is not addition.'),
      ],
      difficulty: 'high',
      meta: { stepCount: 3, blockSpan: 2, transferDistance: 1, requiresExhibit: false },
    },
    {
      id: 'gam-ss-tss-001-q2',
      packId: 'gam-social-sciences-two-stage-sampling-001',
      stem: 'Which statement about the survey is supported by Figure 1 alone?',
      options: [
        { id: 'opt-a', text: 'The response rate was lower in each wave than in the wave before it' },
        { id: 'opt-b', text: 'The response rate fell by the same amount between each pair of neighbouring waves' },
        { id: 'opt-c', text: 'The response rate fell below half of those approached by the final wave' },
        { id: 'opt-d', text: 'Conducting the first wave in person is what kept its response rate highest' },
      ],
      correctOptionId: 'opt-a',
      reasoning: 'read-exhibit',
      dependsOn: ['f1'],
      supportSpans: [
        { blockId: 'f1', quote: 'The rates achieved were 72, 64, 61 and 60 per cent in waves one to four.' },
      ],
      explanation:
        'The figure records 72, 64, 61 and 60 per cent across the four waves. Each value is smaller than ' +
        'the one before it, so the rate did fall from wave to wave. The falls themselves are of eight, ' +
        'three and one point, which are not equal, and the lowest rate recorded is 60 per cent, which is ' +
        'above half.',
      refutations: {
        'opt-b': {
          blockId: 'f1',
          family: 'contradicts-source',
          reason:
            'The successive falls are eight points, then three, then one. They are plainly unequal, and the first is larger than the other two together.',
        },
        'opt-c': {
          blockId: 'f1',
          family: 'contradicts-source',
          reason:
            'The lowest rate the figure records is 60 per cent, which is well above half of those approached. No wave falls below 50 per cent.',
        },
        'opt-d': {
          blockId: 'f1',
          family: 'plausible-but-unstated',
          reason:
            'The figure notes which wave was in person and which were by telephone, but it shows no comparison that could isolate the cause. The highest rate coming first is equally consistent with the order of the waves mattering.',
        },
      },
      hints: [
        hint(1, 'Read the four recorded values off the figure before you look at the options.'),
        hint(2, 'Three of the four statements can be settled by comparing those values with each other or with a half.'),
        hint(3, 'The remaining statement asks what caused something, which a single series of readings cannot establish on its own.'),
      ],
      difficulty: 'medium',
      meta: { stepCount: 2, blockSpan: 1, transferDistance: 1, requiresExhibit: true },
    },
  ],
}

/* --------------------------------------------------------------------- write */

const SETS = [optionContracts, chargeBalance, automata, samplingDesign]

let questionCount = 0
for (const file of SETS) {
  const withHash = { pack: { ...file.pack }, questions: file.questions }
  withHash.pack.contentHash = contentHash(withHash)
  writeFileSync(new URL(`${file.pack.id}.json`, dir), `${JSON.stringify(withHash, null, 2)}\n`)
  questionCount += file.questions.length
  console.log(`wrote ${file.pack.id}  (${file.questions.length} questions, ${file.pack.domain})`)
}
console.log(`\n${SETS.length} packs, ${questionCount} questions written to content/gam/packs/`)
