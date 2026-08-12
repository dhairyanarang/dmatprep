import type { LearnPage } from '@/lib/types/content'

export const learn: LearnPage = {
  intro:
    'You get a partly filled 5×5 grid of letters with one cell marked. Work out which letter belongs in that cell — and only that cell.',
  blocks: [
    {
      type: 'stats',
      items: [
        { value: '25', unit: 'min', label: 'For 20 tasks — about 75 seconds each' },
        { value: '5×5', label: 'Grid, using the five letters in the response row' },
        { value: '1', label: 'Cell to identify — never the whole grid' },
      ],
    },

    { type: 'heading', text: 'The constraint, in full' },
    { type: 'diagram', kind: 'ls-constraint' },
    {
      type: 'quote',
      text: 'Each letter can only appear once in each row and each column. Only the letters that are shown as response options can appear in the grid.',
      sources: [{ id: 'gam-pdf', page: 24 }],
    },
    {
      type: 'cards',
      items: [
        {
          title: 'Solve by exclusion only',
          text: 'A cell must contain letter X when the other four already appear in its row or column. No guessing is ever required, and none is ever correct.',
        },
        {
          title: 'Sometimes you fill in first',
          text: 'If fewer than four letters are excluded, another cell has to be placed before the marked one opens up — almost always one in the same row or column.',
        },
      ],
    },

    { type: 'heading', text: 'How to solve the marked cell' },
    {
      type: 'steps',
      items: [
        'Read across the marked cell’s row and note which letters are already there.',
        'Read down its column and note which letters are already there.',
        'Combine the two lists. If four distinct letters appear, the fifth is your answer — done.',
        'If fewer than four appear, look for an empty cell in the same row or column whose own row and column already show four letters.',
        'Fill that cell in mentally. The letter you just placed now counts towards the marked cell’s row or column.',
        'Repeat until the marked cell has four letters ruled out.',
      ],
    },
    {
      type: 'quote',
      text: 'In the second example, you first need to fill in “B“ in the first row of the last column. Then you can replace the question mark with “D”, because it is the only letter that does not appear in the last column.',
      sources: [{ id: 'gam-pdf', page: 25 }],
    },

    { type: 'heading', text: 'How difficulty is measured here' },
    {
      type: 'cards',
      items: [
        { title: 'Low — 1 step', text: 'The marked cell is settled straight from the given grid. Four letters are already visible from its own row and column.' },
        { title: 'Medium — 2 to 3 steps', text: 'One or two other cells must be placed first before the marked cell is forced.' },
        { title: 'High — 4+ steps', text: 'A longer chain of forced placements, each one unlocking the next.' },
        { title: 'Measured, not assigned', text: 'Every item records how many forced placements its solution actually depends on, computed by the solver — so “high” always means genuinely more work.' },
      ],
    },

    { type: 'heading', text: 'Worked examples' },
    { type: 'example', questionId: 'ls-low-001', caption: 'Settled directly: four letters already visible from the row and column.' },
    { type: 'example', questionId: 'ls-high-001', caption: 'A chain: other cells have to be placed before the marked one opens up.' },
  ],
}
