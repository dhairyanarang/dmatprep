/**
 * The preparation guides.
 *
 * WHY THESE FIVE, AND NOT TWENTY. Search research in November 2026 found the
 * head terms — "dMAT exam pattern", "dMAT syllabus", "dMAT registration" —
 * already held by consultancy hubs with fifteen interlinked pages each, and by
 * aggregators with a decade of domain authority. Competing there with a new
 * site and no backlinks would be writing for nobody.
 *
 * What those sites have NOT done is get the Core Module right or teach it
 * properly. Two of the largest publish a Latin Squares item count that
 * contradicts the official material; one contradicts itself inside a single
 * page; the method every one of them teaches is a single technique out of the
 * two the official solutions actually use. Subtest technique carries no
 * lead-generation value for a consultancy, so nobody has invested in it, and
 * it shows.
 *
 * So each guide below sits on something the incumbents have left either wrong
 * or unsaid, and each is written to be the best page on the internet for its
 * one question rather than a broad overview competing with better-resourced
 * broad overviews.
 *
 * TWO HARD RULES, both from the repository's own standing constraints.
 *
 *  · **Nothing is reproduced from official material.** g.a.s.t. reserves
 *    copyright over its site text and forbids reproducing test items. Every
 *    example below was invented for this article and solved by hand before it
 *    was written down. Facts about the examination are stated in our own words
 *    with the source named.
 *  · **Nothing comes from the question bank.** The bank is the product. These
 *    examples are smaller, simpler and written for teaching.
 */

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  /** A worked example: monospace lines plus the reasoning under them. */
  | { kind: 'example'; title: string; lines: string[]; note?: string }
  /** A pulled-out caution or clarification. */
  | { kind: 'callout'; title: string; text: string }
  /** An internal link to somewhere in the product. */
  | { kind: 'cta'; href: string; label: string; text: string }

export type Guide = {
  slug: string
  title: string
  /** The <title> tag — carries "Germany" because "dMAT" alone is ambiguous. */
  metaTitle: string
  description: string
  /** Shown on the index and at the top of the article. */
  summary: string
  published: string
  updated: string
  minutes: number
  topic: string
  blocks: Block[]
}

/* ------------------------------------------------------------------------ */

const examPattern: Guide = {
  slug: 'dmat-exam-pattern',
  title: 'The dMAT exam pattern, with every number checked',
  metaTitle: 'dMAT Exam Pattern (Germany): Modules, Timings and Scoring',
  description:
    'The structure of the Digital Master Assessment Test: two modules, three Core subtests of 25 minutes and 20 items each, and a General Academic Module of roughly 60 questions — with the sources for each figure and the two points where official sources disagree.',
  summary:
    'What the examination is actually made of, where each figure comes from, and the two places the official sources contradict each other.',
  published: '2026-11-22',
  updated: '2026-11-22',
  minutes: 7,
  topic: 'Format',
  blocks: [
    {
      kind: 'p',
      text: 'The dMAT is short enough to describe in a paragraph and new enough that a good deal of what is written about it online is wrong. This page sets out the structure, says where each number comes from, and flags the two points where the official sources themselves do not agree.',
    },
    { kind: 'h2', text: 'Two modules' },
    {
      kind: 'p',
      text: 'The examination has a Core Module and a subject module. The Core Module is the same for everyone. The subject module depends on the programme you are applying to; most candidates in the APS process sit the General Academic Module.',
    },
    { kind: 'h3', text: 'The Core Module' },
    {
      kind: 'p',
      text: 'Three subtests, each running for 25 minutes and holding 20 items. That is 75 minutes and 60 items in total. The three are Figure Sequences, Mathematical Equations and Latin Squares, and they are taken in a fixed order.',
    },
    {
      kind: 'callout',
      title: 'A number to be careful with',
      text: 'Several widely-read preparation sites state that Latin Squares holds 16 items, or runs for 20 minutes, or both. The preparatory material published by g.a.s.t. gives 20 items and 25 minutes for each of the three subtests. One of those sites contradicts itself inside a single page — a table saying 20 and a FAQ saying 16. Work from the official figure.',
    },
    { kind: 'h3', text: 'The General Academic Module' },
    {
      kind: 'p',
      text: 'Ninety minutes. The number of questions is given by g.a.s.t. as approximately 60, with the explicit caveat that this is an average and the actual number may be higher or lower on the day. Each question is attached to an academic source — a passage, often with a table, a chart or a formula — and tests whether you can work with what the source tells you rather than what you already know.',
    },
    { kind: 'h2', text: 'How long the whole thing takes' },
    {
      kind: 'p',
      text: 'This is the first place the official sources disagree, and it is worth knowing rather than picking one.',
    },
    {
      kind: 'ul',
      items: [
        'The dMAT website describes the examination as three and a half hours with a break between the modules.',
        'The preparatory material describes it as about three hours with a break of thirty minutes.',
      ],
    },
    {
      kind: 'p',
      text: 'Adding up the parts that are individually documented gives a third figure: 75 minutes of Core, a 30-minute break and 90 minutes of subject module comes to 195 minutes, or three hours and a quarter. Plan for the longest of the three and you cannot be caught out.',
    },
    { kind: 'h2', text: 'Answering and scoring' },
    {
      kind: 'p',
      text: 'Every question is single-choice — you select one option. Each module is reported on a scale from 0 to 200 with a mean of 100, alongside a percentile rank, and g.a.s.t. states that the overall result is the sum of the two module scores.',
    },
    {
      kind: 'p',
      text: 'The dMAT preparation page states that no points are deducted for wrong answers, and the preparatory material tells candidates to guess when they do not know. The practical consequence is simple: an unanswered question and a wrong one are worth the same, so never leave one blank.',
    },
    {
      kind: 'callout',
      title: 'What nobody can tell you yet',
      text: 'There is no published cut-off score, and no university has stated one. The examination has been sat once. Any site telling you what counts as a good dMAT score is giving you its own guess — including the common claim that anything above 100 is strong, which is simply a restatement of the fact that 100 is the mean.',
    },
    { kind: 'h2', text: 'What you may take in' },
    {
      kind: 'p',
      text: 'Very little, and this matters more than it sounds. g.a.s.t. states that no written notes may be taken during the examination. Its terms list phones, tablets, watches including smartwatches, calculators and in-ear headphones among the items that are not permitted, and state that only your identity document may be on the desk.',
    },
    {
      kind: 'p',
      text: 'Every method you practise therefore has to survive without paper. That is not a detail to note and move on from — it changes how all three Core subtests should be approached, and most published preparation advice ignores it entirely.',
    },
    { kind: 'h2', text: 'Who has to sit it' },
    {
      kind: 'p',
      text: 'This is the second place the sources disagree, and the stakes are higher. The dMAT website lists three groups of degree subjects for the introductory phase: engineering and technology; commerce, accounting, finance and economics; and business administration and management. The APS India page, updated more recently, lists those three plus tourism, travel and hospitality, and adds guidance on integrated and dual-degree programmes.',
    },
    {
      kind: 'p',
      text: 'Neither page acknowledges the other. Since the official FAQ says APS India determines eligibility, the APS list is the one to work from — and you should read both before drawing a conclusion about your own degree. Most third-party pages still carry only the older three-group list, including at least one that calls it the complete official list.',
    },
    {
      kind: 'cta',
      href: '/exam/sources',
      label: 'See every source',
      text: 'Every figure on this page is traced to the official page it came from, with the date it was read, on our sources page.',
    },
  ],
}

/* ------------------------------------------------------------------------ */

const latinSquares: Guide = {
  slug: 'latin-squares-solving-techniques',
  title: 'Latin Squares: the two techniques that actually solve them',
  metaTitle: 'dMAT Latin Squares (Germany): Rules and Solving Techniques',
  description:
    'How Latin Squares work in the dMAT Core Module, the two deduction techniques the official solutions use, and how to carry a 5×5 grid in your head when no notes are allowed.',
  summary:
    'Most guides teach one technique. The official worked solutions lead with a second one more often than the first, and it is the faster of the two.',
  published: '2026-11-22',
  updated: '2026-11-22',
  minutes: 9,
  topic: 'Latin Squares',
  blocks: [
    {
      kind: 'p',
      text: 'Of the three Core subtests, Latin Squares is the one most candidates find approachable and the one most published guides teach badly. The usual advice is a single technique. The official worked solutions lead with a different one in four of their six exercises, and it is quicker.',
    },
    { kind: 'h2', text: 'The rules' },
    {
      kind: 'p',
      text: 'You are given a five-by-five grid partly filled with the letters A to E. Each letter appears exactly once in every row and exactly once in every column. One cell is marked, and your task is to work out which letter belongs in it.',
    },
    {
      kind: 'p',
      text: 'One constraint is easy to miss and useful: the answer options only ever contain letters that appear somewhere in the marked cell’s own row. That alone can shorten the search before you have deduced anything.',
    },
    { kind: 'h2', text: 'Technique one: the naked single' },
    {
      kind: 'p',
      text: 'Look at the row and the column that cross at a cell. If four different letters already appear between them, the fifth is the only one left and the cell is settled.',
    },
    {
      kind: 'example',
      title: 'A naked single',
      lines: [
        'row 3    B  .  E  .  A',
        'column 2 holds C and D elsewhere',
        '',
        'cell (row 3, column 2):',
        '  row 3 rules out B, E, A',
        '  column 2 rules out C, D',
        '  → nothing is left for any letter but the one not yet used',
      ],
      note: 'Between the row and the column, four of the five letters are accounted for. The remaining one goes in the cell, with no further work.',
    },
    {
      kind: 'p',
      text: 'This is the technique every guide teaches. It is correct, and on its own it will not get you through a hard item quickly.',
    },
    { kind: 'h2', text: 'Technique two: pair elimination on a line' },
    {
      kind: 'p',
      text: 'When a row or a column is missing exactly two letters, you do not need four exclusions. You need one. Take the two missing letters and ask where each can legally go. If one of them is blocked from one of the two empty cells — because it already appears in that cell’s column — then it must take the other, and its partner takes the first.',
    },
    {
      kind: 'example',
      title: 'Pair elimination',
      lines: [
        'row 1    A  .  C  .  E        missing: B and D',
        '         ↑     ↑',
        '      column 2 already contains B',
        '',
        'B cannot sit at (1, 2), so B takes (1, 4).',
        'D therefore takes (1, 2).',
        '',
        'Two cells resolved from one observation.',
      ],
      note: 'Invented for this article. One exclusion settled two cells; the naked single would have needed four exclusions to settle one.',
    },
    {
      kind: 'callout',
      title: 'An honest qualification',
      text: 'Pair elimination is a faster search, not a more powerful one. On a line missing exactly two letters it is logically the same deduction as a naked single at the partner cell, so no item strictly requires it. It is worth learning because it reaches the answer in fewer glances, which is the whole constraint in a 25-minute subtest — not because anything is unsolvable without it.',
    },
    { kind: 'h2', text: 'Working without paper' },
    {
      kind: 'p',
      text: 'You cannot write anything down. A 5×5 grid is twenty-five cells and you will not hold all of them, so do not try. Three habits make it manageable.',
    },
    {
      kind: 'ol',
      items: [
        'Work backwards from the marked cell rather than filling the grid in. Most of the grid is irrelevant to the answer; only the chain of placements that constrains the marked cell matters.',
        'Scan for the fullest lines first. A row or column missing one or two letters is where deductions are cheap, and a cheap deduction often unlocks the marked cell directly.',
        'Hold letters, not positions. "Column 4 still needs B and E" is one fact to carry; a mental picture of the whole grid is twenty-five.',
      ],
    },
    { kind: 'h2', text: 'What makes a hard item hard' },
    {
      kind: 'p',
      text: 'Not the number of blanks. What makes an item hard is how many placements have to be made before the marked cell is forced — the depth of the chain. An item with a sparse grid can fall in one step if the marked cell happens to sit on a nearly-complete line, and a dense grid can take six placements if it does not.',
    },
    {
      kind: 'p',
      text: 'That is worth internalising because it tells you where to look. Count how close the marked cell’s row and column are to being full before you start anywhere else.',
    },
    {
      kind: 'cta',
      href: '/module-a/latin-squares/practice',
      label: 'Practise Latin Squares',
      text: 'Our Latin Squares items are graded by measured deduction depth rather than by eye, and every one has been checked by exhaustive completion to confirm exactly one letter fits the marked cell.',
    },
  ],
}

/* ------------------------------------------------------------------------ */

const figureSequences: Guide = {
  slug: 'figure-sequences-without-paper',
  title: 'Figure Sequences without pen and paper',
  metaTitle: 'dMAT Figure Sequences (Germany): How to Read the Pattern',
  description:
    'How Figure Sequences work in the dMAT Core Module: the transformations that can appear, how to track several symbols at once in your head, and the mistakes that cost marks.',
  summary:
    'Four matrices are shown and you predict the fifth and sixth. The difficulty is rarely the rule — it is tracking three or four symbols at once with nothing to write on.',
  published: '2026-11-22',
  updated: '2026-11-22',
  minutes: 8,
  topic: 'Figure Sequences',
  blocks: [
    {
      kind: 'p',
      text: 'Figure Sequences shows you four grids in order. Symbols inside them move, turn and change colour from one to the next, and your job is to work out what the fifth and sixth grids look like. Both are answered separately, with three options each.',
    },
    { kind: 'h2', text: 'What can change' },
    {
      kind: 'p',
      text: 'The preparatory material published by g.a.s.t. describes a closed set of transformations. A symbol can change colour, rotate about its own axis, and move vertically, horizontally or diagonally. Movement can accelerate, taking one more field at each step than it did at the last. A symbol that reaches the edge of the grid either bounces off it and comes back the way it came, or travels along it.',
    },
    {
      kind: 'p',
      text: 'Two constraints are as useful as the rules themselves: symbols never vanish, and they never overlap. If a continuation you are considering would put two symbols in one cell or lose one off the edge, it is wrong, and you can discard it without checking anything else.',
    },
    { kind: 'h2', text: 'Read one symbol at a time' },
    {
      kind: 'p',
      text: 'The instinct is to compare whole grids. Do not. With three or four symbols moving independently, comparing grids means tracking a dozen changes at once and you will lose one. Pick a single symbol, follow it across all four matrices, and settle its rule completely before you look at the next.',
    },
    {
      kind: 'example',
      title: 'Following one symbol',
      lines: [
        'panel 1   triangle at row 1, col 3   pointing up',
        'panel 2   triangle at row 2, col 2   pointing right',
        'panel 3   triangle at row 3, col 1   pointing down',
        'panel 4   triangle at row 2, col 2   pointing left',
        '',
        'movement  down-left, one field each step',
        '          then a bounce off the left edge',
        'rotation  a quarter turn clockwise each step',
      ],
      note: 'Invented for this article. Position and facing are two independent facts about the same symbol; settle both before moving on. Panel 4 reverses direction because panel 3 put the symbol against the left edge.',
    },
    { kind: 'h2', text: 'Where candidates go wrong' },
    {
      kind: 'h3', text: 'Reading a bounce as a billiard' },
    {
      kind: 'p',
      text: 'When a diagonal mover meets a wall, it reverses and returns the way it came — both components of the diagonal flip. It does not reflect like a billiard ball off a cushion, keeping one component and flipping the other. This is the single most common wrong option offered in a diagonal item, and it looks entirely reasonable until you check it against an earlier bounce in the same sequence.',
    },
    { kind: 'h3', text: 'Checking the step size on one transition' },
    {
      kind: 'p',
      text: 'A symbol that moves one field, then two, then three is accelerating. A symbol that moves one field each time is not. You cannot tell those apart from a single transition, and the first two panels of an accelerating sequence look exactly like a constant one. Always check a step size across three transitions, never one.',
    },
    { kind: 'h3', text: 'Letting colour ride on position' },
    {
      kind: 'p',
      text: 'Colour runs on its own clock. A symbol can cycle through three colours while moving on a completely unrelated schedule, and the cycle continues through a bounce as if nothing happened. Track colour as a separate fact about the symbol, not as something that changes when it moves.',
    },
    { kind: 'h2', text: 'A working order' },
    {
      kind: 'ol',
      items: [
        'Count the symbols in panel 1 and confirm the same number is in panel 4. That is your checklist.',
        'Take the symbol with the most obvious movement first. Settling an easy one reduces what you are holding.',
        'For each symbol, fix three things in order: where it moves, whether it turns, whether it changes colour.',
        'Project to panel 5, then check your projection does not overlap another symbol or leave the grid.',
        'Only then look at the options — and eliminate rather than match. A wrong option usually differs in exactly one symbol.',
      ],
    },
    {
      kind: 'callout',
      title: 'On the real examination being harder than the samples',
      text: 'Candidates who sat the first examination in September 2026 reported more symbols on screen, several of them similar enough to be hard to tell apart at a glance, with different symbols turning in different directions at once. The official FAQ itself notes that sample difficulty may differ from the real test. Practise at the top of the range rather than the middle.',
    },
    {
      kind: 'cta',
      href: '/module-a/figure-sequences/practice',
      label: 'Practise Figure Sequences',
      text: 'Our figure items are re-simulated against the documented rule space and rejected unless the four shown matrices allow exactly one continuation, so an item is never ambiguous.',
    },
  ],
}

/* ------------------------------------------------------------------------ */

const mathematicalEquations: Guide = {
  slug: 'mathematical-equations-mental-method',
  title: 'Mathematical Equations: solving systems in your head',
  metaTitle: 'dMAT Mathematical Equations (Germany): Method and Practice',
  description:
    'How the Mathematical Equations subtest works: letters are whole numbers from 1 to 20, each system has exactly one solution, and no notes are allowed. The method that survives those constraints.',
  summary:
    'Twenty systems in twenty-five minutes with nothing to write on. The trick is knowing which line to start from, and letting divisibility do the work.',
  published: '2026-11-22',
  updated: '2026-11-22',
  minutes: 8,
  topic: 'Mathematical Equations',
  blocks: [
    {
      kind: 'p',
      text: 'You are given a small system of equations in letters and asked what one of the letters is worth. The arithmetic is never hard. The constraints are: every letter is a whole number from 1 to 20, there is exactly one solution, and you cannot write anything down.',
    },
    { kind: 'h2', text: 'Start where one unknown is' },
    {
      kind: 'p',
      text: 'The single most useful habit is to scan every line before solving anything, looking for the one with only one unknown in it. That line settles a letter outright, and everything else follows from it. Candidates lose time by starting at the top of the list and working down, which is almost never the right order.',
    },
    {
      kind: 'example',
      title: 'Scan for the line that settles a letter',
      lines: [
        '2 \u00d7 A + 1 = C',
        'B \u2212 4 = A',
        'B = 9',
        '',
        'The third line settles B outright \u2014 start there,',
        'not at the top.',
        '',
        'B = 9  \u2192  A = 9 \u2212 4 = 5  \u2192  C = 2 \u00d7 5 + 1 = 11',
      ],
      note: 'Invented for this article. Read every line before computing anything: here the third one is the way in, and starting from the first would mean carrying two unknowns for no reason.',
    },
    {
      kind: 'callout',
      title: 'A fraction is a stop sign',
      text: 'Every letter is a whole number between 1 and 20. If a substitution leaves you with something like 4B = 10, you have misread a line \u2014 the system cannot have a fractional answer. Stop and re-read rather than pressing on; it is faster than finishing a calculation that was always going to be wrong.',
    },
    { kind: 'h2', text: 'Let divisibility narrow it' },
    {
      kind: 'p',
      text: 'Because every letter is a whole number between 1 and 20, a division tells you a great deal before you solve anything. If a line says a letter divided by seven gives another letter, the first letter is 7, 14 — and that is the end of the list, because 21 is out of range. Two candidates, from one glance.',
    },
    {
      kind: 'example',
      title: 'Two divisions pin a letter',
      lines: [
        'D ÷ 3 = A',
        'D ÷ 4 = B',
        '',
        'D divides cleanly by 3 and by 4,',
        'so D is a multiple of 12.',
        'Inside 1–20 there is exactly one: D = 12.',
        'Hence A = 4 and B = 3.',
      ],
      note: 'Invented for this article. Neither line settles D on its own; together they do, because the next common multiple — 24 — is outside the permitted range. Recognising that is faster than any substitution.',
    },
    { kind: 'h2', text: 'When nothing has a single unknown' },
    {
      kind: 'p',
      text: 'Some systems open with no solvable line at all. In that case one equation usually ties several letters together while the others define letters individually. Push the definitions into the tying equation and it collapses to a single unknown. That move is the one worth rehearsing, because it is where a system goes from looking impossible to taking fifteen seconds.',
    },
    { kind: 'h2', text: 'Answer the question that was asked' },
    {
      kind: 'p',
      text: 'A surprising share of lost marks are not arithmetic errors. You solve the chain, reach a value, and pick it — but the value you reached was the letter you solved on the way, not the letter the question asked for. Wrong options are built from exactly that mistake. Read the final line again before you choose.',
    },
    {
      kind: 'callout',
      title: 'What candidates reported in September 2026',
      text: 'The first sitting was widely described as harder than the published samples in this subtest, with more involved multiplication and division, squared values and systems of several steps. Those are candidate accounts rather than official statements, but they point the same way: prepare above the level of the samples, not at it.',
    },
    {
      kind: 'cta',
      href: '/module-a/mathematical-equations/practice',
      label: 'Practise Mathematical Equations',
      text: 'Every system in our bank is searched exhaustively across 1 to 20 and published only if exactly one solution exists — and difficulty is measured by how many substitutions the asked letter is from the start, not by how many letters there are.',
    },
  ],
}

/* ------------------------------------------------------------------------ */

const howToPrepare: Guide = {
  slug: 'how-to-prepare-for-the-dmat',
  title: 'How to prepare for the dMAT when there is almost nothing to practise on',
  metaTitle: 'How to Prepare for the dMAT Exam (Germany): A Realistic Plan',
  description:
    'A preparation approach for the Digital Master Assessment Test: what to read first, how to build speed under a no-notes rule, and how to spend the last week.',
  summary:
    'The exam is new, official material is thin, and most advice online is recycled. Here is what is actually worth doing.',
  published: '2026-11-22',
  updated: '2026-11-22',
  minutes: 7,
  topic: 'Preparation',
  blocks: [
    {
      kind: 'p',
      text: 'The dMAT has been sat once. There is no bank of past papers, no published cut-off and no settled wisdom, and a good deal of the preparation advice online is the same handful of facts rewritten. What follows is what the constraints of the examination actually imply.',
    },
    { kind: 'h2', text: 'Read the official material first' },
    {
      kind: 'p',
      text: 'g.a.s.t. publishes preparatory material with sample tasks and worked solutions. It is the only source that shows you the real task formats, and an hour with it before you practise anything is the highest-value hour of your preparation. Every third-party description, this one included, is a summary of it.',
    },
    { kind: 'h2', text: 'Treat speed as the skill' },
    {
      kind: 'p',
      text: 'Each Core subtest gives you 25 minutes for 20 items — about 75 seconds each. For most candidates the limit is not whether an item can be solved but whether it can be solved that fast, in your head, and then let go of.',
    },
    {
      kind: 'p',
      text: 'The practical consequence is to start timing yourself early. Untimed practice teaches you the rules; it does not teach you to abandon an item at sixty seconds, which is the skill that protects your score. Candidates who sat the first examination frequently reported not finishing.',
    },
    { kind: 'h2', text: 'Build the no-notes habit deliberately' },
    {
      kind: 'p',
      text: 'Nothing may be written down. If you practise with a pencil you are rehearsing a method you will not be allowed to use, and the gap shows up on the day as a sudden collapse in speed. Practise the way you will sit it from the beginning, however uncomfortable it is for the first week.',
    },
    { kind: 'h2', text: 'A shape for the weeks before' },
    {
      kind: 'ol',
      items: [
        'Week one — learn the rules of all three Core subtests properly and do untimed items until you stop misreading the task. This is faster than it sounds; the formats are simple.',
        'Weeks two and three — timed single subtests, every session, with attention on the one you are worst at rather than the one you enjoy. The three are scored together.',
        'Final week — full-length timed mocks, including the break, so that three hours of concentration is not a new experience on the day. Review every wrong answer and name the specific mistake rather than noting that you got it wrong.',
      ],
    },
    { kind: 'h2', text: 'Do not neglect the second module' },
    {
      kind: 'p',
      text: 'The General Academic Module is 90 minutes and roughly 60 questions — a larger share of your total score than any single Core subtest, and the part candidates most often leave until last. It rewards careful reading of an unfamiliar source rather than subject knowledge, which means it can be practised: work on extracting exactly what a passage, table or chart states, and on resisting answers that are plausible but unsupported by it.',
    },
    { kind: 'h2', text: 'Three things not to do' },
    {
      kind: 'ul',
      items: [
        'Do not trust an item count or a timing you read on a preparation site without checking it against the official material. Several of the largest sites currently publish figures for the Core Module that contradict it.',
        'Do not chase a target score. None has been published by anyone, and a site that tells you what to aim for is guessing.',
        'Do not look for leaked questions. Reproducing examination items is prohibited by the terms you agree to when you register, and anything presented to you as a real dMAT question is either invented or a problem you do not want.',
      ],
    },
    {
      kind: 'cta',
      href: '/prepare',
      label: 'Start practising',
      text: 'A 150-question sample across the three Core subtests is free and needs no account, with full worked solutions on every item.',
    },
  ],
}

/* ------------------------------------------------------------------------ */

export const GUIDES: Guide[] = [
  examPattern,
  howToPrepare,
  latinSquares,
  figureSequences,
  mathematicalEquations,
]

export const guideBySlug = (slug: string): Guide | undefined =>
  GUIDES.find((g) => g.slug === slug)
