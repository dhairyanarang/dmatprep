import type { LearnPage } from '@/lib/types/content'

export const learn: LearnPage = {
  intro:
    'Latin Squares is a constraint-elimination subtest. You get a partly filled 5×5 grid of letters and work out which letter belongs in one marked cell.',
  blocks: [
    { type: 'heading', text: 'What the task looks like' },
    {
      type: 'quote',
      text: 'In this task you will see a 5x5 grid (a square containing 5 rows and 5 columns). Some fields of the grid contain letters. Each letter can only appear once in each row and each column. Only the letters that are shown as response options (the row next to the grid) can appear in the grid.',
      sources: [{ id: 'gam-pdf', page: 24 }],
    },
    {
      type: 'prose',
      text: 'One cell is marked with a question mark. Your job is only ever to identify that one cell — you are never asked to complete the grid.',
      sources: [{ id: 'gam-pdf', page: 24 }],
    },
    {
      type: 'prose',
      text: 'You have 25 minutes for 20 tasks — about 75 seconds each, with no notes and nothing to write with.',
      sources: [{ id: 'gam-pdf', page: 25 }],
    },

    { type: 'heading', text: 'The rules' },
    {
      type: 'rules',
      items: [
        {
          text: 'The grid is 5 rows by 5 columns.',
          sources: [{ id: 'gam-pdf', page: 24 }],
        },
        {
          text: 'Each letter appears exactly once in every row and exactly once in every column.',
          sources: [{ id: 'gam-pdf', page: 24 }],
        },
        {
          text: 'Only the five letters offered as response options can appear anywhere in the grid — there are no others hiding in the empty cells.',
          sources: [{ id: 'gam-pdf', page: 24 }],
        },
        {
          text: 'Sometimes you must work out other cells before the marked one can be determined.',
          sources: [{ id: 'gam-pdf', page: 24 }],
        },
      ],
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'Only the row and the column matter',
      text: 'Unlike Sudoku, there are no boxes or sub-regions. A cell is constrained by exactly two things: its row and its column. That is nine other cells in total, and nothing else on the grid can rule anything out.',
    },

    { type: 'heading', text: 'The method' },
    {
      type: 'prose',
      text: 'The official solutions solve purely by elimination: a cell must contain letter X when the other four letters all already appear in its row or its column. Nothing more sophisticated is needed, and no guessing is ever required.',
      sources: [{ id: 'gam-pdf', page: 25 }],
    },
    {
      type: 'steps',
      title: 'Solving the marked cell',
      items: [
        'Read across the marked cell’s row and note which letters are already there.',
        'Read down its column and note which letters are already there.',
        'Combine the two lists. If four distinct letters appear, the fifth is your answer — done.',
        'If fewer than four appear, you need to fill in a cell first. Look for an empty cell in the same row or column as the marked one whose own row and column already show four letters.',
        'Fill that cell in mentally, then go back to step 1. The letter you just placed now counts towards the marked cell’s row or column.',
        'Repeat until the marked cell has four letters ruled out.',
      ],
    },
    {
      type: 'quote',
      text: 'In the second example, you first need to fill in “B“ in the first row of the last column. “B” is the only letter, which does not already appear in this row and column. Then you can replace the question mark with “D”, because it is the only letter that does not appear in the last column.',
      sources: [{ id: 'gam-pdf', page: 25 }],
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'How difficulty is measured here',
      text: 'Every practice item in this hub records how many forced placements its solution actually depends on. One means the marked cell is settled straight from the grid as given; four or more means a longer chain. Difficulty is computed from that number rather than assigned by feel, so "high" always means genuinely more steps.',
    },

    { type: 'heading', text: 'Worked examples' },
    {
      type: 'example',
      questionId: 'ls-low-001',
      caption: 'Settled directly: four letters already visible from the row and column.',
    },
    {
      type: 'example',
      questionId: 'ls-high-001',
      caption: 'A chain: other cells have to be placed before the marked one opens up.',
    },
  ],
}
