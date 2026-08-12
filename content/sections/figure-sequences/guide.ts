import type { SectionGuide } from '@/lib/types/content'

export const guide: SectionGuide = {
  intro:
    'You are shown four matrices in which one or more symbols move, turn and change colour by fixed rules. You choose what the fifth and sixth look like. The rule set is small and closed, which is what makes this subtest learnable rather than open-ended.',
  blocks: [
    {
      type: 'stats',
      items: [
        { value: '25', unit: 'min', label: 'For 20 items — about 75 seconds each' },
        { value: '4×4', label: 'Grid, with four matrices shown per item' },
        { value: '2', label: 'Matrices to predict, three options each' },
      ],
    },

    { type: 'heading', text: 'What one item looks like' },
    { type: 'diagram', kind: 'fs-anatomy' },
    {
      type: 'quote',
      text: 'The figures in the matrices can change their position, colour, and/or orientation from one matrix to the next according to specific rules. It is your task to continue the series logically and to determine what the next two matrices look like.',
      sources: [{ id: 'gam-pdf', page: 7 }],
    },
    {
      type: 'prose',
      text: 'The grid is 4×4. The official materials never state this in words, but every diagram shows a four-by-four matrix, the example refers to “the four middle fields”, and the worked solutions never mention a row or column past the fourth.',
      confidence: 'inferred',
      note: 'Read from the diagrams rather than stated in the text.',
      sources: [{ id: 'gam-pdf', page: 7 }],
    },

    { type: 'heading', text: 'Every movement you can be shown' },
    {
      type: 'diagram',
      kind: 'fs-catalogue',
      description:
        'The complete rule set — each strip reads left to right, one panel at a time. Symbols can also never disappear, never overlap, and never leave the matrix.',
    },

    { type: 'heading', text: 'What “bouncing” actually means' },
    {
      type: 'diagram',
      kind: 'fs-bounce',
      description:
        'The single most important mechanic to get right, and the one most often misread.',
    },
    {
      type: 'prose',
      text: 'Travelling along the outer border is a separate rule, not a variation of bouncing. A symbol following it simply keeps going round the perimeter, turning at the corners.',
      sources: [{ id: 'gam-pdf', page: 8 }],
    },

    { type: 'heading', text: 'What changes as difficulty rises' },
    { type: 'diagram', kind: 'fs-difficulty' },

    { type: 'heading', text: 'How to read a sequence' },
    {
      type: 'steps',
      items: [
        'Count the symbols in matrix 1. That number never changes, so it tells you how many independent rules you are looking for.',
        'Take one symbol and follow it across all four matrices, ignoring every other symbol completely.',
        'For that symbol, settle three questions in turn: where does it move, does it rotate, does it change colour?',
        'Check whether the step size is constant or growing — two panels suggest it, the third confirms it.',
        'Watch for a boundary in the shown panels. A visible bounce settles the hardest part of the item.',
        'Repeat for each symbol, then apply every rule twice: once to reach matrix 5, once more for matrix 6.',
      ],
    },

    {
      type: 'tips',
      title: 'Strategy',
      variant: 'strategy',
      items: [
        {
          title: 'One symbol at a time, always',
          body: 'Multi-symbol items look daunting because the eye tries to take in the whole grid at once. Fix on a single symbol and track only it across all four matrices. Each carries its own independent rule, so a four-symbol item is four easy problems, not one hard one.',
        },
        {
          title: 'Read the options before deriving anything',
          body: 'The three options usually agree about most of the grid and differ in one or two symbols. Spot the difference first: it tells you which symbol actually decides the answer, and colour is faster to check than position, which is faster than rotation.',
        },
        {
          title: 'Establish step size from the gaps, not the positions',
          body: 'Do not think “it was at row 2 and now it is at row 3”. Think “it moved down one”. Constant gaps mean a fixed step; gaps of one, two, three mean x + 1.',
        },
        {
          title: 'Treat a visible bounce as a gift',
          body: 'If a symbol reaches an edge and turns within the four shown matrices, its boundary behaviour is settled — you have seen it. That is the hardest part of the item already answered.',
        },
        {
          title: 'Answer image 1 before you think about image 2',
          body: 'Matrix 6 is derived from matrix 5. Settle the fifth, hold it as the new starting point, then take one more step. Jumping two steps at once is where slips creep in — especially with x + 1, where the two steps differ.',
        },
      ],
    },

    {
      type: 'tips',
      title: 'Common mistakes',
      variant: 'mistake',
      items: [
        {
          title: 'Treating a bounce as a reflection',
          body: 'The most costly single error. A diagonal symbol meeting the top edge reverses and retraces its path rather than carrying on mirrored. Reflection reasoning produces an answer that is usually on offer as a distractor.',
        },
        {
          title: 'Missing acceleration because two panels looked consistent',
          body: 'One step then two steps reads as “it moved, then it moved again” if you are not counting. Verify the step size across at least three transitions before committing.',
        },
        {
          title: 'Forgetting that symbols can never overlap',
          body: 'If a candidate answer puts two symbols on the same cell it is wrong, with no further checking needed. This eliminates options for free and is routinely missed.',
        },
        {
          title: 'Overlooking rotation on a symbol that also moves',
          body: 'When a symbol travels across the grid the eye follows the movement and stops registering orientation. If a shape has a clear front, check its facing separately and deliberately.',
        },
      ],
    },

    { type: 'heading', text: 'Worked examples' },
    { type: 'example', questionId: 'fs-low-001', caption: 'One symbol — establish the movement, then apply it twice.' },
    { type: 'example', questionId: 'fs-medium-001', caption: 'Several symbols, each with its own independent rule.' },
  ],
}
