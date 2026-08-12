import type { SectionGuide } from '@/lib/types/content'

export const guide: SectionGuide = {
  intro:
    'You are shown four matrices in which one or more symbols move, turn and change colour by fixed rules. You choose what the fifth and sixth look like. The rules are few and clearly defined, which is what makes this subtest something you can practise rather than an open-ended puzzle.',
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
        'The rules the official materials set out — each strip reads left to right, one panel at a time. Symbols can also never disappear, never overlap, and never leave the matrix.',
    },

    { type: 'heading', text: 'What happens at a boundary' },
    {
      type: 'diagram',
      kind: 'fs-bounce',
      description: 'A useful boundary rule to understand clearly.',
    },
    {
      type: 'prose',
      text: 'When a figure reaches an outer boundary, the sequence may specify that it bounces off the boundary or moves along the outer boundary. Treat the observed boundary behaviour as part of the rule you need to identify.',
      sources: [{ id: 'gam-pdf', page: 8 }],
    },

    { type: 'heading', text: 'What changes as difficulty rises' },
    { type: 'diagram', kind: 'fs-difficulty' },

    { type: 'heading', text: 'How to read a sequence' },
    {
      type: 'steps',
      items: [
        'Count the symbols in matrix 1. Figures cannot disappear, so that number tells you how many symbols you have to account for.',
        'Take one symbol and follow it across all four matrices, ignoring every other symbol completely.',
        'For that symbol, settle three questions in turn: where does it move, does it rotate, does it change colour?',
        'Check whether the step size is constant or growing — two panels suggest it, the third confirms it.',
        'Watch for a boundary in the shown panels. If a symbol reaches an edge, the sequence is showing you its boundary behaviour directly.',
        'Repeat for each symbol, then apply every rule twice: once to reach matrix 5, once more for matrix 6.',
      ],
    },

    {
      type: 'tips',
      title: 'Strategy',
      variant: 'strategy',
      items: [
        {
          title: 'One symbol at a time',
          body: 'Multi-symbol items look daunting because the eye tries to take in the whole grid at once. Tracking one symbol at a time can make a multi-symbol sequence easier to analyse. Once its movement, orientation and colour behaviour are clear, repeat the process for the remaining symbols.',
        },
        {
          title: 'Read the options before deriving anything',
          body: 'Compare the answer options before doing all the work. If they differ in only a few places, those differences can help you identify which rule matters most for the answer.',
        },
        {
          title: 'Establish step size from the gaps, not the positions',
          body: 'Do not think “it was at row 2 and now it is at row 3”. Think “it moved down one”. Constant gaps indicate a fixed step; a progression such as one step, then two, then three can indicate an x + 1 pattern.',
        },
        {
          title: 'Use a visible boundary event as evidence',
          body: 'If a symbol reaches an edge within the four shown matrices, the sequence is showing you what happens there rather than leaving you to assume it. Use that observation as evidence for the boundary rule.',
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
          title: 'Assuming boundary behaviour instead of checking it',
          body: 'Do not assume boundary behaviour from intuition. Check how the figure behaves when it reaches the edge in the sequence.',
        },
        {
          title: 'Missing acceleration because two panels looked consistent',
          body: 'One step then two steps reads as “it moved, then it moved again” if you are not counting. Verify the step size across at least three transitions before committing.',
        },
        {
          title: 'Forgetting that symbols can never overlap',
          body: 'If a candidate answer puts two symbols in the same cell, it conflicts with the stated rule that figures cannot overlap. That rules the option out with no further checking needed.',
        },
        {
          title: 'Overlooking rotation on a symbol that also moves',
          body: 'When a symbol travels across the grid the eye follows the movement and stops registering orientation. If a shape has a clear front, check its facing separately and deliberately.',
        },
      ],
    },

    { type: 'heading', text: 'Worked examples' },
    { type: 'example', questionId: 'fs-low-001', caption: 'One symbol — establish the movement, then apply it twice.' },
    { type: 'example', questionId: 'fs-medium-001', caption: 'Several symbols — settle one, then repeat the process for the rest.' },
  ],
}
