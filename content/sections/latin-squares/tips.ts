import type { TipsPage } from '@/lib/types/content'

export const tips: TipsPage = {
  intro:
    'Latin Squares is the most mechanical of the three subtests, which makes it the most improvable. There is a single correct procedure, no ambiguity, and no need for insight — speed comes almost entirely from scanning efficiently and not filling in cells you did not need.',
  blocks: [
    { type: 'heading', text: 'What changes as difficulty rises' },
    { type: 'diagram', kind: 'ls-difficulty' },
  ],

  strategies: [
    {
      title: 'Always start at the marked cell, never at the grid',
      body: 'The instinct is to start completing the square. Resist it. You are asked about one cell, so begin by reading its own row and column — in a large share of items that alone settles it, and you are done in fifteen seconds without touching anything else.',
    },
    {
      title: 'Count letters, do not name them',
      body: 'You need to know whether four distinct letters are ruled out, not which four. Sweep the row and column keeping a count of distinct letters seen. When the count hits four, the answer is whichever letter you have not encountered — a single fact to hold rather than a list.',
    },
    {
      title: 'When stuck, look only along the row and column you care about',
      body: 'If the marked cell is not immediately determined, the cell you need to fill in first is almost always in the same row or the same column as it. A placement somewhere else in the grid usually cannot affect the marked cell at all, so filling it in is wasted effort.',
    },
    {
      title: 'Prefer the fuller line',
      body: 'When you do need a prerequisite placement, scan the row or column that already has the most letters. A line with four letters filled gives you a placement immediately; a line with two will not.',
    },
    {
      title: 'Use the letter you are missing as the target',
      body: 'Rather than asking "what goes here?", ask "where must the missing letter go?". If a row has A, C, D and E but no B, and only two cells are empty, checking which of those two columns already contains a B often places it instantly.',
    },
    {
      title: 'Bank the easy ones fast',
      body: 'Difficulty in this subtest is genuinely bimodal: an item is either settled straight from the given grid or needs a chain of placements. Recognise which one you are in within about ten seconds, and give the chain items the time you saved on the direct ones.',
    },
  ],
  mistakes: [
    {
      title: 'Trying to complete the whole square',
      body: 'The most expensive habit, because it feels like progress. Filling in the full grid takes several minutes; the question needs one cell. Every cell you place that is not in the marked cell’s row or column is time you will not get back.',
    },
    {
      title: 'Reading the wrong row or column',
      body: 'On a 5×5 grid with a highlighted cell, it is surprisingly easy to scan the row above or the column beside. Before committing, re-confirm that the line you scanned actually passes through the marked cell.',
    },
    {
      title: 'Double-counting a letter',
      body: 'A letter that appears in both the row and the column has still only ruled out one letter, not two. If you are counting how many are excluded, count distinct letters — not sightings.',
    },
    {
      title: 'Importing Sudoku habits',
      body: 'There are no 3×3 boxes and no sub-regions here. Ruling a letter out because it appears in a nearby block is a rule this puzzle does not have, and it produces confident wrong answers.',
    },
    {
      title: 'Placing a prerequisite cell that was not actually forced',
      body: 'If a cell has two possible letters and you pick one to see where it leads, you have started guessing — and a wrong guess quietly corrupts everything after it. Only ever place a cell when four letters are genuinely excluded.',
    },
  ],
  dos: [
    'Start by reading the marked cell’s own row and column.',
    'Count distinct letters excluded; stop as soon as you reach four.',
    'When a prerequisite is needed, look in the marked cell’s row or column first.',
    'Target the fullest line — it yields a forced placement soonest.',
    'Re-confirm you scanned the right row and column before answering.',
    'Guess if time runs short; the instructions explicitly recommend it.',
  ],
  donts: [
    'Do not attempt to complete the whole grid.',
    'Do not apply Sudoku box logic — only rows and columns constrain a cell.',
    'Do not place a cell unless it is genuinely forced.',
    'Do not count the same letter twice when it appears in both the row and the column.',
    'Do not assume letters beyond the five response options can appear.',
    'Do not try to write anything down; no notes are permitted at any point.',
  ],
}
