/**
 * The landing page's copy.
 *
 * Content lives here rather than in the component, which is the rule the rest
 * of the repository follows. Two things about the writing that are deliberate:
 *
 *  · **Nothing here is reproduced from an official source.** g.a.s.t.'s imprint
 *    reserves copyright over the text on d-mat.de, and its terms forbid
 *    reproducing test items. Every sentence below is written for this site;
 *    facts about the examination are stated in our own words and traced on
 *    /exam/sources.
 *  · **No promises about outcomes.** No claim that practice raises a score, no
 *    success rate, no testimonial. The product is new and has no evidence for
 *    any of that, and an exam-prep site making those claims is exactly what a
 *    careful candidate distrusts.
 */

export const HERO = {
  eyebrow: 'Independent · free to start',
  title: 'Practice for the dMAT that actually behaves like the dMAT',
  body:
    'The Digital Master Assessment Test is new, and there is very little to practise on. dMAT Prep is a free question bank and mock exam built around the three Core subtests — with every question checked by a solver before it is published, and every claim about the exam traced back to the official source it came from.',
  primary: { href: '/prepare', label: 'Start practising — no account needed' },
  secondary: { href: '/exam', label: 'What is the dMAT?' },
} as const

/**
 * The figures on the hero. Each is either derived from the bank at build time
 * or a fact with a source on /exam/sources — nothing is rounded up for effect.
 */
export const PROOF_POINTS = [
  { label: 'practice questions', detail: 'written and solver-checked for this site' },
  { label: 'free, no account', detail: 'a 150-question sample across the three subtests' },
  { label: 'fixed mock exams', detail: 'the same test every time, so two attempts compare' },
] as const

export const HOW_IT_WORKS = [
  {
    title: 'Learn the rule before you drill it',
    body:
      'Each subtest opens with what an item looks like, the rules that govern it, the method that works under time pressure, and the mistakes that cost marks. Worked examples are drawn from state rather than pasted as pictures, so the diagram and the explanation can never disagree.',
  },
  {
    title: 'Practise with the answer out of reach',
    body:
      'Questions are served without their solutions. The answer, the full working and the three graded hints arrive only once you have committed — which is the difference between practising and reading.',
  },
  {
    title: 'Sit it under the clock',
    body:
      'Timed sets run a single subtest against its own clock. The fixed mocks run all three back to back and hold the same questions in the same order every time, so a second attempt is comparable with the first.',
  },
  {
    title: 'See what you actually get wrong',
    body:
      'Every attempt is recorded locally, and signing in carries it between devices. Accuracy, streaks and your weakest section are derived from those attempts — never stored as a figure that can drift away from the truth.',
  },
] as const

/** What honest differentiation looks like when the product is three weeks old. */
export const TRUST = [
  {
    title: 'Every question is machine-verified',
    body:
      'No question is published until a solver has proved it has exactly one valid answer. Equation systems are searched exhaustively over the permitted range; figure sequences are re-simulated and rejected if the four shown matrices allow more than one continuation; Latin squares are checked by exhaustive completion.',
  },
  {
    title: 'Facts are traced, not remembered',
    body:
      'Everything this site says about the examination comes from g.a.s.t. or APS India, and the sources page lists which page each claim came from and when it was read. Where the two official sources disagree — and on one point they do — both are shown rather than quietly reconciled.',
  },
  {
    title: 'No official material is reproduced',
    body:
      'Not one official question, diagram or passage appears anywhere here. Every practice item, explanation and figure is original work written for dMAT Prep, which is both a legal requirement and the reason the bank can be as large as it is.',
  },
  {
    title: 'What we do not know, we say',
    body:
      'Some details of the examination are not public. Where our question format is an informed inference rather than something the official material states, the question says so rather than presenting a guess as a fact.',
  },
] as const

export const GAM_SECTION = {
  title: 'General Academic Module',
  body:
    'The second half of the examination gives you an academic text — often with a table, chart or formula — and asks questions that depend on reading it carefully rather than on knowing the subject. dMAT Prep has a small pilot set of original source packs covering business, natural sciences, computing, mathematics, economics and the social sciences.',
  caveat:
    'This material is a pilot. It passes every automated check the Core bank does, but no human reviewer has signed it off yet, and it is a fraction of a full module in length. It is offered on that basis and labelled as such wherever it appears.',
  href: '/module-b',
  cta: 'Try a source pack',
} as const

export const PLANS = {
  free: {
    name: 'Free',
    price: 'No cost, no account',
    items: [
      'A 150-question sample — 50 from each Core subtest',
      'The full rules, method and worked examples for all three subtests',
      'Timed single-subtest practice',
      'The General Academic pilot packs',
      'Progress saved in your browser',
    ],
  },
  pro: {
    name: 'Pro',
    price: 'One payment, no subscription',
    items: [
      'The complete Core question bank',
      'All four fixed mock exams, plus the Core + General Academic sample sitting',
      'Full solutions and hints on every question',
      'Progress synced across your devices when signed in',
    ],
  },
} as const
