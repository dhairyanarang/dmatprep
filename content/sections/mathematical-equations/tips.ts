import type { TipsPage } from '@/lib/types/content'

export const tips: TipsPage = {
  intro:
    'The mathematics here is easy — it is arithmetic on numbers under 20. What makes this subtest hard is doing it entirely in your head, at about 75 seconds an item, without slipping. Almost every technique below is really a technique for not making mistakes.',
  strategies: [
    {
      title: 'Test the options instead of solving forward',
      body: 'This is the single biggest time-saver, and it is available because the format is single-choice. Rather than deriving the answer, take an option, substitute it into the equation that mentions the asked letter, and see whether everything holds. Checking a candidate is one or two operations; solving from scratch is four or five. With four options you will usually confirm one within two tries.',
    },
    {
      title: 'Find the shortest equation first',
      body: 'Never start at the top of the list. Scan all the equations and start with whichever has the fewest letters. Systems in this subtest are chains, and one end of the chain is always short — often a single letter with a constant.',
    },
    {
      title: 'Use divisibility as a filter',
      body: 'If an equation reads B ÷ 3 = A, then B must be a multiple of 3, which immediately cuts the possibilities from twenty to six. Multiplication does the same from the other direction: if 4 × C is part of the system and every letter is at most 20, then C is at most 5.',
    },
    {
      title: 'Say values aloud in your head as you fix them',
      body: 'With no paper, working memory is the bottleneck. Each time you pin a letter, rehearse the full set so far — "A is six, B is twelve" — before moving on. The cost is a second; the alternative is re-deriving a value you already had.',
    },
    {
      title: 'Sanity-check against 1–20 at every step',
      body: 'Because every letter is a whole number from 1 to 20, an intermediate result of 0, a negative, or a fraction is a guaranteed sign of an error. Treat it as a stop signal and re-read the equation rather than carrying on.',
    },
    {
      title: 'Verify against an equation you have not used yet',
      body: 'If a system has three equations and you only needed two, the third is a free check. Substitute your values in. It costs a few seconds and catches the arithmetic slips that are otherwise invisible.',
    },
  ],
  mistakes: [
    {
      title: 'Answering with the wrong letter',
      body: 'By far the most common error, and a painful one because the reasoning was right. You solve the chain, land on a value, and pick it — but the question asked about a different letter. Re-read the question immediately before you answer, every time.',
    },
    {
      title: 'Using only some of the equations',
      body: 'A value that satisfies two equations out of three is not the answer. The task is explicitly to satisfy all of them at once. If you found a value early, check it against the lines you skipped.',
    },
    {
      title: 'Sign errors when unpacking a bracket',
      body: 'Substituting a definition like 11 + B into a subtraction gives − (11 + B), which is −11 − B, not −11 + B. This one error accounts for a large share of near-miss answers, and near-misses are exactly what the wrong options are built from.',
    },
    {
      title: 'Multiplying where the equation divides',
      body: 'B ÷ 2 = A means B is the larger value. Read the direction carefully; reversing it produces a value that is double or half the correct one — again, a value likely to be sitting right there among the options.',
    },
    {
      title: 'Grinding on a system that has not opened up',
      body: 'If you cannot find the short end of the chain within about twenty seconds, switch to testing the options instead. Do not keep pushing on the forward derivation because you have already started it.',
    },
  ],
  dos: [
    'Scan every equation before starting; begin with the one with fewest unknowns.',
    'Substitute an answer option when the forward path is not obvious.',
    'Rehearse the values you have fixed so far before moving on.',
    'Use divisibility and the 1–20 bound to cut the candidates down.',
    'Re-read which letter is being asked about before you commit.',
    'Check your values against any equation you did not need.',
  ],
  donts: [
    'Do not start with the first equation just because it is first.',
    'Do not accept a value that satisfies only some of the equations.',
    'Do not carry on past a fraction, a zero or a negative — that is an error signal.',
    'Do not drop the sign when substituting an expression into a subtraction.',
    'Do not try to write or trace anything; no paper or notes are permitted at any point.',
    'Do not leave it blank — the instructions tell you to guess if you do not know.',
  ],
}
