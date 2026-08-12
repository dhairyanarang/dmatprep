import type { SectionGuide } from '@/lib/types/content'

export const guide: SectionGuide = {
  intro:
    'Each item gives you a system of equations in which letters stand for whole numbers. The equations use a constrained set of values and operations, but solving them accurately under time pressure requires careful reasoning and arithmetic.',
  blocks: [
    {
      type: 'stats',
      items: [
        { value: '25', unit: 'min', label: 'For 20 systems — about 75 seconds each' },
        { value: '1–20', label: 'Every letter is a whole number in this range' },
        { value: '1', label: 'Solution per letter, always exactly one' },
      ],
    },

    { type: 'heading', text: 'What you can rely on' },
    {
      type: 'diagram',
      kind: 'me-range',
      description:
        'Two official constraints narrow this subtest far more than it first appears. The operations shown in the official examples are + − × ÷, written with × and ÷ rather than · and /.',
    },
    {
      type: 'quote',
      text: 'There is always only one solution for each letter. Each letter can be an integer between 1 and 20.',
      sources: [{ id: 'gam-pdf', page: 17 }],
    },

    { type: 'heading', text: 'The answer format' },
    {
      type: 'prose',
      text: 'The dMAT is single-choice throughout, so you pick a value from a list rather than typing a number. That is worth exploiting: checking a candidate against one equation is often cheaper than solving forward.',
      sources: [{ id: 'dmat-home' }],
    },
    {
      type: 'prose',
      text: 'The official materials do not say how many options an item offers, nor whether the exam asks for one letter or several. Practice here asks for a single letter and offers four options.',
      confidence: 'unconfirmed',
      note: 'The prep materials present these exercises without answer options at all, so the exam’s option count is not documented.',
      sources: [{ id: 'gam-pdf', page: 17 }],
    },

    { type: 'heading', text: 'How a system comes apart' },
    {
      type: 'diagram',
      kind: 'me-chain',
      description:
        'In many systems one equation pins a single letter down and the rest follow from it. Finding a relationship you can solve first is the core of the method.',
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
      text: 'Common in the harder items: one equation combines all the letters and the others each define a letter in terms of another. Substituting the definitions into the combining equation collapses it to one unknown. From A − B + C − D = 2 with 10 × B = C, 5 × B = A and 11 + B = D, that gives 13B − 11 = 2, so B = 1 — and every other letter follows in one step each.',
    },

    { type: 'heading', text: 'What changes as difficulty rises' },
    { type: 'diagram', kind: 'me-difficulty' },

    {
      type: 'tips',
      title: 'Solving faster',
      variant: 'strategy',
      items: [
        {
          title: 'Test the options instead of solving forward',
          body: 'One potentially useful time-saving strategy, available because the format is single-choice. Substitute an option into the equation that mentions the asked letter and see whether it holds. Checking a candidate is often one or two operations, where solving from scratch can be four or five.',
        },
        {
          title: 'Look for a simple starting relationship',
          body: 'Do not assume you have to start at the top of the list. A simple equation can provide a useful starting point, so scan the system for a relationship that can be solved or substituted efficiently.',
        },
        {
          title: 'Use divisibility as a filter',
          body: 'If an equation reads B ÷ 3 = A then B is a multiple of 3, cutting twenty possibilities to six. Multiplication works from the other side: if 4 × C appears and every letter is at most 20, then C is at most 5.',
        },
        {
          title: 'Rehearse the values you have fixed',
          body: 'Because notes are not permitted, keeping track of already-established values can be challenging under time pressure. Each time you pin a letter, say the full set so far — “A is six, B is twelve” — before moving on. The alternative is re-deriving a value you already had.',
        },
        {
          title: 'Verify against an equation you did not need',
          body: 'If a system has three equations and two were enough, the third is a free check. It costs seconds and catches the arithmetic slips that are otherwise invisible.',
        },
      ],
    },

    {
      type: 'tips',
      title: 'Common mistakes',
      variant: 'mistake',
      items: [
        {
          title: 'Answering with the wrong letter',
          body: 'A common mistake to watch for during practice, and a frustrating one because the reasoning was right. You solve the system, land on a value, and pick it — but the question asked about a different letter. Re-read the question immediately before answering.',
        },
        {
          title: 'Sign errors when unpacking a bracket',
          body: 'Substituting 11 + B into a subtraction gives −11 − B, not −11 + B. A slip here produces a value close to the correct one, which is easy to accept without noticing.',
        },
        {
          title: 'Multiplying where the equation divides',
          body: 'B ÷ 2 = A means B is the larger value. Reversing it produces a value that is double or half the correct one.',
        },
        {
          title: 'Carrying on past an impossible value',
          body: 'A 0, a negative or a fraction is not a hard question — it is proof you have made an error. Treat it as a stop signal and re-read the equation.',
        },
      ],
    },

    { type: 'heading', text: 'Worked examples' },
    { type: 'example', questionId: 'me-low-001', caption: 'One equation has a single unknown — start there.' },
    { type: 'example', questionId: 'me-high-001', caption: 'Four letters: substitute the definitions into the combining equation.' },
  ],
}
