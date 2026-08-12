import type { SectionGuide } from '@/lib/types/content'

export const guide: SectionGuide = {
  intro:
    'You get a partly filled 5×5 grid of letters with one cell marked, and work out which letter belongs there — only that cell, never the whole grid. It is the most mechanical of the three subtests, which makes it the most improvable.',
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

    { type: 'heading', text: 'How to solve the marked cell' },
    {
      type: 'steps',
      items: [
        'Read across the marked cell’s row and note which letters are already there.',
        'Read down its column and note which letters are already there.',
        'Combine the two lists. If four distinct letters appear, the fifth is your answer — done.',
        'If fewer than four appear, find an empty cell in the same row or column whose own row and column already show four letters.',
        'Fill that cell in mentally. The letter you just placed now counts towards the marked cell’s row or column.',
        'Repeat until the marked cell has four letters ruled out.',
      ],
    },
    {
      type: 'quote',
      text: 'In the second example, you first need to fill in “B“ in the first row of the last column. Then you can replace the question mark with “D”, because it is the only letter that does not appear in the last column.',
      sources: [{ id: 'gam-pdf', page: 25 }],
    },

    { type: 'heading', text: 'What changes as difficulty rises' },
    { type: 'diagram', kind: 'ls-difficulty' },

    {
      type: 'tips',
      title: 'Strategy',
      variant: 'strategy',
      items: [
        {
          title: 'Always start at the marked cell, never at the grid',
          body: 'The instinct is to start completing the square. Resist it. In a large share of items the marked cell’s own row and column settle it in fifteen seconds, without touching anything else.',
        },
        {
          title: 'Count letters, do not name them',
          body: 'You need to know whether four distinct letters are ruled out, not which four. Sweep the row and column keeping a count. When it hits four, the answer is whichever letter you have not seen — one fact to hold rather than a list.',
        },
        {
          title: 'When stuck, stay in the marked row and column',
          body: 'The cell you need to fill first is almost always in the same row or column as the marked one. A placement elsewhere usually cannot affect it at all, so filling it in is wasted effort.',
        },
        {
          title: 'Prefer the fuller line',
          body: 'When a prerequisite placement is needed, scan the row or column that already has the most letters. A line with four filled gives you a placement immediately; a line with two will not.',
        },
        {
          title: 'Recognise which kind of item you are in',
          body: 'Difficulty here is genuinely bimodal: an item is either settled straight from the givens or needs a chain. Work out which within about ten seconds, and give the chain items the time you saved on the direct ones.',
        },
      ],
    },

    {
      type: 'tips',
      title: 'Common mistakes',
      variant: 'mistake',
      items: [
        {
          title: 'Trying to complete the whole square',
          body: 'The most expensive habit, because it feels like progress. Filling the full grid takes minutes; the question needs one cell. Every placement outside the marked row and column is time you will not get back.',
        },
        {
          title: 'Importing Sudoku habits',
          body: 'There are no boxes or sub-regions here. Ruling a letter out because it appears in a nearby block is a rule this puzzle does not have, and it produces confident wrong answers.',
        },
        {
          title: 'Double-counting a letter',
          body: 'A letter appearing in both the row and the column has still only ruled out one letter, not two. Count distinct letters, not sightings.',
        },
        {
          title: 'Placing a cell that was not actually forced',
          body: 'If a cell has two possible letters and you pick one to see where it leads, you have started guessing — and a wrong guess quietly corrupts everything after it. Only place a cell when four letters are genuinely excluded.',
        },
      ],
    },

    { type: 'heading', text: 'Worked examples' },
    { type: 'example', questionId: 'ls-low-001', caption: 'Settled directly: four letters already visible from the row and column.' },
    { type: 'example', questionId: 'ls-high-001', caption: 'A chain: other cells have to be placed before the marked one opens up.' },
  ],
}
