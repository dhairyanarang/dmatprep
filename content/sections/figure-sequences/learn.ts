import type { LearnPage } from '@/lib/types/content'

export const learn: LearnPage = {
  intro:
    'Figure Sequences is the pattern-tracking subtest. You are shown a series of matrices in which one or more symbols change from panel to panel according to fixed rules, and you continue the series.',
  blocks: [
    { type: 'heading', text: 'What the task looks like' },
    {
      type: 'quote',
      text: 'In this task you will see a series of pictures (matrices). The figures in the matrices can change their position, colour, and/or orientation from one matrix to the next according to specific rules. It is your task to continue the series logically and to determine what the next two matrices look like.',
      sources: [{ id: 'gam-pdf', page: 7 }],
    },
    {
      type: 'prose',
      text: 'Each item shows four matrices, followed by two question marks. You choose what the fifth matrix looks like and, separately, what the sixth looks like — three options for each. Both have to be right, so a single item is really two linked decisions.',
      sources: [{ id: 'gam-pdf', page: 7 }],
    },
    {
      type: 'prose',
      text: 'The grid is 4×4. The official materials never state this in words, but every diagram in them shows a four-by-four matrix, the example refers to "the four middle fields", and the worked solutions refer to rows and columns only up to the fourth.',
      sources: [{ id: 'gam-pdf', page: 7 }],
      confidence: 'inferred',
      note: 'Read from the diagrams rather than stated in the text.',
    },
    {
      type: 'prose',
      text: 'You have 25 minutes for 20 series — about 75 seconds each. No notes, and nothing to write with.',
      sources: [{ id: 'gam-pdf', page: 8 }],
    },

    { type: 'heading', text: 'The rules symbols follow' },
    {
      type: 'prose',
      text: 'This is the complete official rule set. Every sequence you meet is built from these and nothing else, which is what makes the subtest learnable — the space of possible patterns is small and closed.',
      sources: [{ id: 'gam-pdf', page: 7 }],
    },
    {
      type: 'rules',
      items: [
        {
          text: 'A symbol can change colour from one matrix to the next.',
          sources: [{ id: 'gam-pdf', page: 7 }],
        },
        {
          text: 'A symbol can rotate around its own axis — typically 90° at a time, in either direction.',
          sources: [{ id: 'gam-pdf', page: 7 }],
        },
        {
          text: 'A symbol can move within the matrix. Vertical, horizontal and diagonal movements are all allowed.',
          sources: [{ id: 'gam-pdf', page: 7 }],
        },
        {
          text: 'A symbol moving diagonally cannot switch to another type of movement. Diagonal movers stay diagonal.',
          sources: [{ id: 'gam-pdf', page: 7 }],
        },
        {
          text: 'Movement, colour or orientation can accelerate by x + 1: one step from matrix 1 to 2, two steps from 2 to 3, three steps from 3 to 4, and so on.',
          sources: [{ id: 'gam-pdf', page: 8 }],
        },
        {
          text: 'Symbols cannot disappear and cannot overlap. Every symbol you see in the first matrix is present in all six, each on its own cell.',
          sources: [{ id: 'gam-pdf', page: 8 }],
        },
        {
          text: 'Symbols cannot leave the matrix. On meeting an outer boundary a symbol either bounces off it, or moves along it.',
          sources: [{ id: 'gam-pdf', page: 8 }],
        },
      ],
    },

    { type: 'heading', text: 'What "bouncing" actually means' },
    {
      type: 'prose',
      text: 'This is the single most important mechanic to get right, and the one most likely to be misread. Bouncing means the symbol reverses and retraces its path — it does not reflect off the wall like a billiard ball. A symbol travelling diagonally up-and-right that meets the top edge comes back down-and-left along the same diagonal.',
      sources: [{ id: 'gam-pdf', page: 14 }],
    },
    {
      type: 'quote',
      text: 'The symbol always moves one space diagonally upwards to the right from its starting position until it bounces off the upper boundary and returns to the starting position in the same way (diagonally downwards to the left).',
      sources: [{ id: 'gam-pdf', page: 14 }],
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'Reversal, not reflection',
      text: 'If you assume a diagonal mover reflects off the edge and carries on in a new direction, you will get a plausible-looking wrong answer on a large share of items. It reverses along the line it came in on.',
    },
    {
      type: 'prose',
      text: 'The alternative boundary behaviour — moving along the outer boundary — is a different rule, not a variation of bouncing. A symbol following it travels around the perimeter of the grid, clockwise or counter-clockwise, and simply keeps going round.',
      sources: [{ id: 'gam-pdf', page: 8 }],
    },

    { type: 'heading', text: 'How to read a sequence' },
    {
      type: 'steps',
      title: 'A reliable order of work',
      items: [
        'Count the symbols in matrix 1. That number never changes, so it tells you how many independent rules you are looking for.',
        'Take one symbol and follow it across all four matrices, ignoring every other symbol completely.',
        'For that symbol, settle three questions in turn: where does it move, does it rotate, does it change colour?',
        'Check whether the step size is constant or growing. Two panels are enough to guess; the third confirms it.',
        'Watch for a boundary in the shown panels — if the symbol has already bounced once, the mechanic is confirmed and you can trust it for panels 5 and 6.',
        'Repeat for each remaining symbol, then apply every rule twice to reach matrix 5 and then matrix 6.',
      ],
    },
    {
      type: 'callout',
      variant: 'note',
      title: 'The options are information',
      text: 'You do not always have to derive the answer in full. Compare the three options first: often they differ in only one symbol, which tells you exactly which rule you need to work out and lets you ignore the rest.',
    },

    { type: 'heading', text: 'Worked examples' },
    {
      type: 'example',
      questionId: 'fs-low-001',
      caption: 'A single symbol — establish the movement, then apply it twice.',
    },
    {
      type: 'example',
      questionId: 'fs-medium-001',
      caption: 'Several symbols, each with its own independent rule.',
    },
  ],
}
