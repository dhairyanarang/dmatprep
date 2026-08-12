import type { LearnPage } from '@/lib/types/content'

export const learn: LearnPage = {
  intro:
    'You are shown a series of matrices in which one or more symbols change from panel to panel according to a small, fixed set of rules. Your job is to continue the series.',
  blocks: [
    {
      type: 'stats',
      items: [
        { value: '25', unit: 'min', label: 'For 20 items — about 75 seconds each' },
        { value: '4×4', label: 'Grid, with 4 matrices shown per item' },
        { value: '2', label: 'Matrices to predict, three options each' },
      ],
    },

    { type: 'heading', text: 'What one item looks like' },
    { type: 'diagram', kind: 'fs-anatomy' },
    {
      type: 'prose',
      text: 'The grid is 4×4. The official materials never state this in words, but every diagram shows a four-by-four matrix, the example refers to “the four middle fields”, and the worked solutions never mention a row or column past the fourth.',
      confidence: 'inferred',
      note: 'Read from the diagrams rather than stated in the text.',
      sources: [{ id: 'gam-pdf', page: 7 }],
    },
    {
      type: 'quote',
      text: 'The figures in the matrices can change their position, colour, and/or orientation from one matrix to the next according to specific rules. It is your task to continue the series logically and to determine what the next two matrices look like.',
      sources: [{ id: 'gam-pdf', page: 7 }],
    },

    { type: 'heading', text: 'How symbols move' },
    {
      type: 'diagram',
      kind: 'fs-movement',
      description:
        'Faded squares show where the symbol has been. Every sequence you meet is built from these and nothing else — which is what makes the subtest learnable.',
    },
    {
      type: 'cards',
      title: 'And three things that can change alongside movement',
      items: [
        { title: 'Colour', text: 'A symbol can change colour from one matrix to the next, cycling through a fixed order.' },
        { title: 'Rotation', text: 'A symbol can rotate about its own axis, typically 90° at a time, in either direction.' },
        { title: 'Acceleration', text: 'Movement, colour or rotation can step up by x + 1 — one, then two, then three.' },
        { title: 'Two hard limits', text: 'Symbols can never disappear, never overlap, and never leave the matrix.' },
      ],
    },

    { type: 'heading', text: 'What “bouncing” actually means' },
    {
      type: 'diagram',
      kind: 'fs-bounce',
      description:
        'This is the single most important mechanic to get right, and the one most often misread.',
    },
    {
      type: 'quote',
      text: 'The symbol always moves one space diagonally upwards to the right from its starting position until it bounces off the upper boundary and returns to the starting position in the same way (diagonally downwards to the left).',
      sources: [{ id: 'gam-pdf', page: 14 }],
    },
    {
      type: 'prose',
      text: 'The alternative boundary behaviour — travelling along the outer border — is a separate rule, not a variation of bouncing. A symbol following it simply keeps going round the perimeter.',
      sources: [{ id: 'gam-pdf', page: 8 }],
    },

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
      type: 'callout',
      variant: 'note',
      title: 'The options are information',
      text: 'You do not always have to derive the answer in full. Compare the three options first: they usually differ in only one symbol, which tells you exactly which rule you need and lets you ignore the rest.',
    },

    { type: 'heading', text: 'Worked examples' },
    { type: 'example', questionId: 'fs-low-001', caption: 'One symbol — establish the movement, then apply it twice.' },
    { type: 'example', questionId: 'fs-medium-001', caption: 'Several symbols, each with its own independent rule.' },
  ],
}
