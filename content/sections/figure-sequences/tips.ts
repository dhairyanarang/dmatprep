import type { TipsPage } from '@/lib/types/content'

export const tips: TipsPage = {
  intro:
    'Figure Sequences rewards a fixed routine more than cleverness. At roughly 75 seconds an item, the difference between a fast solver and a slow one is almost entirely about not re-deriving things you have already established.',
  blocks: [
    { type: 'heading', text: 'Every movement you can be shown' },
    {
      type: 'diagram',
      kind: 'fs-catalogue',
      description:
        'This is the complete rule set — each strip reads left to right, one panel at a time. Nothing outside these appears, which is what makes the subtest learnable rather than open-ended.',
    },
    { type: 'heading', text: 'What changes as difficulty rises' },
    { type: 'diagram', kind: 'fs-difficulty' },
  ],

  strategies: [
    {
      title: 'One symbol at a time, always',
      body: 'Multi-symbol items look daunting because the eye tries to take in the whole grid at once. It never gets easier that way. Fix on a single symbol — say, the yellow hexagon — and track only it across all four matrices. Each symbol carries its own independent rule, so a four-symbol item is four easy problems, not one hard one.',
    },
    {
      title: 'Read the options before deriving anything',
      body: 'The three options usually agree about most of the grid and differ in one or two symbols. Spot the difference first: it tells you which symbol actually decides the answer. Working out the rules for symbols all three options agree on earns you nothing.',
    },
    {
      title: 'Establish step size from the gaps, not the positions',
      body: 'Do not think "it was at row 2 and now it is at row 3". Think "it moved down one". Then check the next gap. Constant gaps mean a fixed step; growing gaps of one, two, three mean x + 1. Reading gaps rather than absolute positions makes acceleration obvious.',
    },
    {
      title: 'Treat a visible bounce as a gift',
      body: 'If a symbol reaches an edge and turns within the four shown matrices, its boundary behaviour is settled — you have seen it. That is the hardest part of the item already answered, and you can apply it confidently to matrices 5 and 6.',
    },
    {
      title: 'Check the cheapest property first',
      body: 'Colour is faster to read than position, and position is faster than rotation. If one option has a symbol in the wrong colour, you can eliminate it in a second without working out any movement at all.',
    },
    {
      title: 'Answer image 1 before you think about image 2',
      body: 'Matrix 6 is derived from matrix 5. Settle the fifth matrix, hold it in mind as the new starting point, then take one more step. Trying to jump two steps at once is where arithmetic slips creep in — especially with x + 1 movement, where the two steps are different sizes.',
    },
  ],
  mistakes: [
    {
      title: 'Treating a bounce as a reflection',
      body: 'The most costly single error. A diagonal symbol meeting the top edge does not carry on in a mirrored direction — it reverses and retraces its path. Reflection reasoning produces an answer that is usually on offer as a distractor, which is exactly why it is dangerous.',
    },
    {
      title: 'Missing acceleration because two panels looked consistent',
      body: 'One step then two steps can read as "it moved, then it moved again" if you are not counting. Always verify the step size across at least three transitions before committing.',
    },
    {
      title: 'Forgetting that symbols can never overlap',
      body: 'If a candidate answer puts two symbols on the same cell, it is wrong — no further checking needed. This eliminates options for free and people routinely miss it.',
    },
    {
      title: 'Overlooking rotation on a symbol that also moves',
      body: 'When a symbol is travelling across the grid, the eye follows the movement and stops registering orientation. If a shape has a clear "front" — an arrow, a triangle — check its facing separately and deliberately.',
    },
    {
      title: 'Assuming every symbol has an interesting rule',
      body: 'Some symbols simply move one field at a time in a straight line for the whole sequence. Do not invent complexity that is not there; confirm the simple reading fits all four matrices and move on.',
    },
    {
      title: 'Spending your time budget on one hard item',
      body: 'Twenty items in 25 minutes leaves no room to rescue a single stubborn one. An item you cannot crack in about 90 seconds is costing you two easier items elsewhere.',
    },
  ],
  dos: [
    'Count the symbols in matrix 1 first — that is how many rules you need.',
    'Compare the answer options before deriving, and work only on what separates them.',
    'Describe each rule to yourself in words: "moves down one, bounces, turns right 90°".',
    'Eliminate any option with two symbols on one cell immediately.',
    'Guess if you are stuck — the official instructions explicitly tell you to.',
    'Derive matrix 5 first, then step once more to matrix 6.',
  ],
  donts: [
    'Do not assume a symbol reflects off a boundary; it reverses along its own path.',
    'Do not try to hold all four symbols in mind at once.',
    'Do not skip checking rotation just because the symbol is clearly moving.',
    'Do not assume the step size is constant without checking three transitions.',
    'Do not leave an item blank — there is no evidence of a penalty for a wrong answer.',
    'Do not try to take notes or trace paths with a finger on the screen; you have neither paper nor permission.',
  ],
}
