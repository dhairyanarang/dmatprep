/**
 * A description per subtest, for search results.
 *
 * Each one names the examination and says what the subtest actually asks,
 * because "dMAT" on its own is ambiguous — Google corrects it toward "demat
 * account" — and a description that only repeats the title tells a searcher
 * nothing about whether the page answers their question.
 */
export const SUBTEST_META: Record<string, { landing: string; overview: string }> = {
  'figure-sequences': {
    landing:
      'Practise dMAT Figure Sequences: four matrices are shown and you predict the fifth and sixth, with symbols that move, rotate and change colour at once.',
    overview:
      'How dMAT Figure Sequences work: the transformations that can appear, how boundaries and acceleration behave, the method that works without notes, and worked examples.',
  },
  'mathematical-equations': {
    landing:
      'Practise dMAT Mathematical Equations: small systems where every letter is a whole number from 1 to 20 and exactly one solution fits, solved without a calculator.',
    overview:
      'How dMAT Mathematical Equations work: the rules of the task, how to find the line that settles a letter, using divisibility to narrow the search, and worked examples.',
  },
  'latin-squares': {
    landing:
      'Practise dMAT Latin Squares: a five-by-five grid where each letter appears once per row and column, and one marked cell has to be deduced.',
    overview:
      'How dMAT Latin Squares work: the rules, the two deduction techniques the official solutions use, how to hold a grid in your head, and worked examples.',
  },
}
