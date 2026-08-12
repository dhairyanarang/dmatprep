import type { LearnPage } from '@/lib/types/content'

export const learn: LearnPage = {
  intro:
    'Each item gives you two to four equations in which letters stand for whole numbers. You work out what one of those letters must be — in your head, with no calculator and nothing to write on.',
  blocks: [
    {
      type: 'stats',
      items: [
        { value: '25', unit: 'min', label: 'For 20 systems — about 75 seconds each' },
        { value: '1–20', label: 'Every letter is a whole number in this range' },
        { value: '1', label: 'Solution per letter, always exactly one' },
      ],
    },

    { type: 'heading', text: 'The two constraints that do the work' },
    {
      type: 'diagram',
      kind: 'me-range',
      description:
        'These two official constraints narrow the subtest far more than it first appears, and both are worth committing to memory.',
    },
    {
      type: 'quote',
      text: 'There is always only one solution for each letter. Each letter can be an integer between 1 and 20.',
      sources: [{ id: 'gam-pdf', page: 17 }],
    },
    {
      type: 'cards',
      items: [
        { title: 'Operations', text: 'Addition, subtraction, multiplication and division — written with × and ÷ rather than · and /.' },
        { title: 'Divisibility is a filter', text: 'If B ÷ 3 = A, then B must be a multiple of 3 — twenty possibilities become six.' },
      ],
    },

    { type: 'heading', text: 'Every system is a chain' },
    {
      type: 'diagram',
      kind: 'me-chain',
      description:
        'One equation pins a single letter down, and the rest hang off it. The whole skill is finding the end of the chain and pulling.',
    },
    {
      type: 'steps',
      title: 'Substitution, in order',
      items: [
        'Scan for the equation with the fewest unknowns — often one has just a single letter.',
        'Solve it. Usually that is one operation: subtract the constant, or divide by the coefficient.',
        'Substitute the value into every other equation that mentions that letter.',
        'That leaves another equation with one unknown. Solve it the same way.',
        'Repeat until every letter has a value.',
        'Re-read the question and answer for the letter actually asked about — not the one you solved first.',
      ],
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'When no equation starts with a single unknown',
      text: 'Common in the harder items: one equation combines all the letters and the others each define a letter in terms of another. Substituting the definitions into the combining equation collapses it to a single unknown. From A − B + C − D = 2 with 10 × B = C, 5 × B = A and 11 + B = D, that gives 13B − 11 = 2, so B = 1 — and every other letter follows in one step each.',
    },

    { type: 'heading', text: 'The answer format' },
    {
      type: 'prose',
      text: 'The dMAT is single-choice throughout, so you pick a value from a list rather than typing a number. That is worth exploiting: checking a candidate against one equation is far cheaper than solving forward.',
      sources: [{ id: 'dmat-home' }],
    },
    {
      type: 'prose',
      text: 'The official materials do not say how many options an item offers, nor whether the exam asks for one letter or several. Practice here asks for a single letter and offers four options.',
      confidence: 'unconfirmed',
      note: 'The prep materials present these exercises without answer options at all, so the exam’s option count is not documented.',
      sources: [{ id: 'gam-pdf', page: 17 }],
    },

    { type: 'heading', text: 'Worked examples' },
    { type: 'example', questionId: 'me-low-001', caption: 'One equation has a single unknown — start there.' },
    { type: 'example', questionId: 'me-high-001', caption: 'Four letters: substitute the definitions into the combining equation.' },
  ],
}
