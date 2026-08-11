import type { LearnPage } from '@/lib/types/content'

export const learn: LearnPage = {
  intro:
    'Mathematical Equations is a small systems-of-equations subtest. Each item gives you two to four equations in which letters stand for whole numbers, and you work out what one of those letters must be.',
  blocks: [
    { type: 'heading', text: 'What the task looks like' },
    {
      type: 'quote',
      text: 'In this task, you are supposed to solve systems of equations in such a way that all requirements are met. One system of equations always consists of several single equations. Your task is to find out which numbers must be used for the unknowns (letters) in the equations so that all equations are correct.',
      sources: [{ id: 'gam-pdf', page: 17 }],
    },
    {
      type: 'prose',
      text: 'You have 25 minutes for 20 systems — about 75 seconds each. No calculator, no notes, nothing to write with. All the arithmetic happens in your head.',
      sources: [
        { id: 'gam-pdf', page: 18 },
        { id: 'dmat-terms' },
      ],
    },

    { type: 'heading', text: 'The two constraints that do the work' },
    {
      type: 'prose',
      text: 'Two official constraints narrow this subtest far more than it first appears, and both are worth committing to memory.',
      sources: [{ id: 'gam-pdf', page: 17 }],
    },
    {
      type: 'rules',
      items: [
        {
          text: 'There is always exactly one solution for each letter. If you find two sets of values that both work, you have misread something.',
          sources: [{ id: 'gam-pdf', page: 17 }],
        },
        {
          text: 'Each letter is a whole number between 1 and 20 — inclusive, never zero, never negative, never a fraction.',
          sources: [{ id: 'gam-pdf', page: 17 }],
        },
      ],
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'Why the 1–20 bound matters',
      text: 'It means every intermediate result is small, every division comes out exact, and any candidate value outside 1–20 is wrong by definition. If a line of reasoning gives you 0, a negative, or 3.5, the error is yours — back up rather than pressing on.',
    },
    {
      type: 'prose',
      text: 'The operations used are addition, subtraction, multiplication and division, written with × and ÷ rather than · and /.',
      sources: [{ id: 'gam-pdf', page: 17 }],
    },

    { type: 'heading', text: 'The answer format' },
    {
      type: 'prose',
      text: 'The dMAT is single-choice throughout, so you pick a value from a list rather than typing a number.',
      sources: [{ id: 'dmat-home' }],
    },
    {
      type: 'prose',
      text: 'The official materials do not say how many options a Mathematical Equations item offers, nor whether the exam asks for one letter or several. Practice here asks for a single letter and offers four options, matching the Subject Module’s four-option format.',
      sources: [{ id: 'gam-pdf', page: 17 }],
      confidence: 'unconfirmed',
      note: 'The prep materials present these exercises without answer options, so the exam’s option count is not documented.',
    },

    { type: 'heading', text: 'The method' },
    {
      type: 'prose',
      text: 'Every system in this subtest is a chain. One equation pins a single letter down, and the rest hang off it. The whole skill is finding the end of the chain and pulling.',
      sources: [{ id: 'gam-pdf', page: 21 }],
    },
    {
      type: 'steps',
      title: 'Substitution, in order',
      items: [
        'Scan for the equation with the fewest unknowns. Often one equation has only a single letter in it — that is your starting point.',
        'Solve that equation for its letter. Usually it is one operation: subtract the constant, or divide by the coefficient.',
        'Substitute the value you now know into every other equation that mentions that letter.',
        'That will leave another equation with only one unknown. Solve it the same way.',
        'Repeat until every letter has a value.',
        'Read the question again and answer for the letter actually asked about — not the one you solved first.',
      ],
    },
    {
      type: 'prose',
      text: 'When no equation starts with a single unknown — common in the harder items — one equation combines all the letters, and the others each define a letter in terms of one other. Substitute the definitions into the combining equation and it collapses to a single unknown.',
      sources: [{ id: 'gam-pdf', page: 22 }],
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'The official worked example of that pattern',
      text: 'From A − B + C − D = 2 with 10 × B = C, 5 × B = A and 11 + B = D, substituting gives 5B − B + 10B − (11 + B) = 2, which reduces to 13B − 11 = 2, so B = 1 — and every other letter follows in one step each.',
    },

    { type: 'heading', text: 'Worked examples' },
    {
      type: 'example',
      questionId: 'me-low-001',
      caption: 'One equation has a single unknown — start there.',
    },
    {
      type: 'example',
      questionId: 'me-high-001',
      caption: 'Four letters: substitute the definitions into the combining equation.',
    },
  ],
}
