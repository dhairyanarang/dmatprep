/**
 * The FAQ, as content.
 *
 * TWO RULES GOVERN EVERY ANSWER HERE.
 *
 * 1. **Nothing is reproduced.** g.a.s.t.'s imprint reserves copyright over the
 *    text on d-mat.de and its terms forbid reproducing test material, so every
 *    answer below is written from scratch. Where a figure or a rule comes from
 *    an official page, the answer says which one and the claim is summarised,
 *    never quoted at length.
 * 2. **Nothing is stated more confidently than the evidence allows.** Where the
 *    two official sources disagree, both are given. Where a detail is not
 *    public, the answer says so instead of guessing — a prep site that invents
 *    an answer about an exam is worse than one that admits a gap.
 *
 * `source` is shown to the reader. It is the page the claim came from, so an
 * answer that goes stale can be traced and re-checked rather than quietly
 * rotting. Answers about dMAT Prep itself carry no source — they are about us.
 */

export type FaqItem = {
  id: string
  q: string
  /** Paragraphs. Kept as an array so the renderer never splits on newlines. */
  a: string[]
  source?: string
}

export type FaqCategory = {
  id: string
  title: string
  blurb: string
  items: FaqItem[]
}

export const FAQ: FaqCategory[] = [
  {
    id: 'the-exam',
    title: 'The examination',
    blurb: 'What the dMAT is, who sits it, and how it is put together.',
    items: [
      {
        id: 'what-is-dmat',
        q: 'What is the dMAT?',
        a: [
          'The Digital Master Assessment Test is an admissions test used in the application process for some German master’s programmes. It is run by g.a.s.t. (Gesellschaft für Akademische Studienvorbereitung und Testentwicklung e. V.), the organisation behind TestDaF, and in India it sits inside the APS documentation process.',
          'It is a reasoning and comprehension test rather than a subject examination. Nothing in it asks you to recall course material: the Core Module measures pattern reasoning, arithmetic reasoning and logical deduction, and the General Academic Module measures how well you can read an unfamiliar academic text and work with what it tells you.',
          'The first sitting took place on 26 September 2026, which makes it a very new test. That is worth remembering whenever you read anything about it, including this page.',
        ],
        source: 'd-mat.de',
      },
      {
        id: 'who-has-to-take-it',
        q: 'Do I have to take the dMAT?',
        a: [
          'It depends on your degree subject and on when you started the APS process. APS India requires the dMAT from applicants in several broad groups — engineering and technology, commerce, accounting, finance and economics, business administration and management, and tourism, travel and hospitality — who are applying for a graduate programme in Germany.',
          'Important caveat: the two official sources do not match on this point. d-mat.de lists three groups; the APS India page lists those plus tourism, travel and hospitality, and adds guidance on integrated and dual-degree programmes. APS India determines eligibility, so treat its list as the operative one, and read both before concluding anything about your own case.',
          'There are exemptions — bachelor’s applicants, PhD applicants, exchange and double-degree participants, and people who were already in the APS process before the cut-off. You can also sit it voluntarily even if you are not required to.',
        ],
        source: 'aps-india.de and d-mat.de',
      },
      {
        id: 'structure',
        q: 'How is the exam structured?',
        a: [
          'There are two modules. The Core Module has three subtests — Figure Sequences, Mathematical Equations and Latin Squares — and each runs for 25 minutes and holds 20 items, so the Core Module is 75 minutes and 60 items in total.',
          'The second module is a subject module. Most candidates sit the General Academic Module, which runs for 90 minutes and holds roughly 60 questions; g.a.s.t. describes that number as an average that may be higher or lower on the day. Some programmes use a specialised subject module instead.',
          'Every question is single-choice: you pick one option.',
        ],
        source: 'g.a.s.t. preparatory material and the d-mat.de FAQ',
      },
      {
        id: 'how-long',
        q: 'How long does the whole thing take?',
        a: [
          'The official sources give two different answers, and we are not going to pick one for you. d-mat.de describes the examination as three and a half hours with a break between the modules. The preparatory material describes it as about three hours with a break of thirty minutes.',
          'Adding up the parts that are individually documented — 75 minutes of Core, a 30-minute break, 90 minutes of subject module — gives 195 minutes, or three hours fifteen. Plan for the longer figure and arrive expecting the day to run long.',
        ],
        source: 'd-mat.de and the g.a.s.t. preparatory material',
      },
      {
        id: 'universities',
        q: 'Which universities use the dMAT?',
        a: [
          'As of our last check, d-mat.de named RWTH Aachen University, the University of Göttingen and LMU Munich as using the dMAT as a selection criterion, alongside the General Academic Module used in the APS process.',
          'This list is short because the test is new, and it is the kind of fact that changes without announcement. Check the official site for the programme you are applying to rather than relying on any third-party page, including this one.',
        ],
        source: 'd-mat.de',
      },
    ],
  },
  {
    id: 'dates-and-cost',
    title: 'Dates, cost and registration',
    blurb: 'When you can sit it, what it costs, and how booking works.',
    items: [
      {
        id: 'dates',
        q: 'When is the next dMAT?',
        a: [
          'Two sittings are announced for 2027: 16 January, with applications closing on 4 January and results released on 8 February; and 13 March, with applications closing on 1 March and results on 5 April. Registration opened on 28 October 2026.',
          'One thing to watch: the FAQ on d-mat.de still showed the superseded 2026 cycle when we last read it, while the India page carried the 2027 dates. Trust the India page, and confirm in the booking portal before you plan around a date.',
        ],
        source: 'd-mat.de/en/dmat-in-india',
      },
      {
        id: 'fee',
        q: 'What does it cost?',
        a: [
          'APS India states a test fee of €150, charged by g.a.s.t. and payable during registration.',
          'Payment is taken by card (Mastercard or Visa with 3D Secure) or PayPal. Debit cards are not accepted, which is worth knowing before you sit down to book.',
        ],
        source: 'aps-india.de/dmat and d-mat.de',
      },
      {
        id: 'retake',
        q: 'Can I retake it?',
        a: [
          'Yes. g.a.s.t. states that you may take the dMAT as many times as you wish. Each attempt is booked and paid for separately.',
          'The certificate itself is generally valid indefinitely, so a result does not expire the way a language test might.',
        ],
        source: 'd-mat.de FAQ',
      },
      {
        id: 'cancel',
        q: 'What if I need to cancel?',
        a: [
          'Cancellation is handled through the g.a.s.t. portal and is possible up to the registration deadline, with an administrative fee of up to 15% deducted from the refund. After the deadline there is no refund.',
          'If you need particular arrangements because of a disability or chronic illness, g.a.s.t. asks that you register at least ten weeks before the test date.',
        ],
        source: 'd-mat.de terms and conditions',
      },
    ],
  },
  {
    id: 'scoring',
    title: 'Scoring and results',
    blurb: 'How the test is marked and what the number means.',
    items: [
      {
        id: 'how-scored',
        q: 'How is the dMAT scored?',
        a: [
          'Each module is reported on a scale from 0 to 200 with a mean of 100, alongside a percentile rank showing what proportion of other candidates scored the same or lower. g.a.s.t. states that the overall result is the sum of the two module scores.',
          'The score is a conversion of the number of correct answers, so it is a measure of how much you got right relative to everyone else — not a percentage.',
        ],
        source: 'd-mat.de/en/dmat-in-india and the d-mat.de FAQ',
      },
      {
        id: 'negative-marking',
        q: 'Is there negative marking?',
        a: [
          'The preparation page on d-mat.de states that no points are deducted for wrong answers, and the preparatory material advises guessing when you do not know. Taken together that means a blank answer and a wrong answer are worth the same, so there is no reason to leave anything unanswered.',
          'Practical consequence: watch the clock and make sure every question has something selected before time runs out, even if some of them are guesses.',
        ],
        source: 'd-mat.de/en/preparation',
      },
      {
        id: 'good-score',
        q: 'What counts as a good score?',
        a: [
          'Nobody can answer this yet, and you should be sceptical of anyone who says otherwise. The test has been sat once, no cut-off scores have been published, and universities decide for themselves how to use the result.',
          'What the scale does tell you is that 100 is the mean, so a score above it is above average among the people who sat the same test.',
        ],
      },
    ],
  },
  {
    id: 'exam-day',
    title: 'On the day',
    blurb: 'Rules in the test room, and what you may bring.',
    items: [
      {
        id: 'notes',
        q: 'Can I use rough paper or a calculator?',
        a: [
          'No. g.a.s.t. states that no written notes may be taken during the examination, and its terms list phones, tablets, watches including smartwatches, calculators and in-ear headphones among the items that are not allowed.',
          'Only your identity document may be on the desk, and drinks must be in transparent, unlabelled bottles. This is the single biggest thing to build into your preparation: every method you practise has to work in your head.',
        ],
        source: 'd-mat.de preparation page and terms and conditions',
      },
      {
        id: 'id',
        q: 'What identification do I need?',
        a: [
          'For candidates in the APS process, g.a.s.t.’s terms require a valid original passport and state that no other form of identification will be accepted.',
          'The terms also say you may not leave the building for the duration of the examination, so plan the break accordingly.',
        ],
        source: 'd-mat.de terms and conditions',
      },
    ],
  },
  {
    id: 'preparing',
    title: 'Preparing',
    blurb: 'How to approach a test with very little published material.',
    items: [
      {
        id: 'how-to-prepare',
        q: 'How should I prepare for the dMAT?',
        a: [
          'Start with the official preparatory material from g.a.s.t., which is the only source that shows you the real task formats. Read it before you practise anything, so you know what the items actually look like.',
          'Then build speed. The Core subtests give you 75 seconds a question with nothing to write on, so the constraint is rarely whether you can solve an item — it is whether you can solve it quickly enough, in your head, and then let go of it. Practise under a clock early rather than leaving timed work to the end.',
          'Finally, work on your weakest subtest rather than the one you enjoy. The three are scored together, and most candidates have one that drags.',
        ],
      },
      {
        id: 'how-long-prepare',
        q: 'How long do I need?',
        a: [
          'There is no published guidance and no evidence base to draw on, so anyone quoting you a number is guessing. What can be said is that the task formats are quick to understand and slow to get fast at: an afternoon is enough to learn the rules of all three Core subtests, and the remaining work is speed and accuracy under pressure.',
          'A sensible shape is a few weeks of short, regular sessions rather than a fortnight of long ones, finishing with full timed mocks so the three-hour length is not a surprise.',
        ],
      },
      {
        id: 'official-material',
        q: 'Where do I find the official sample questions?',
        a: [
          'g.a.s.t. publishes preparatory material with sample tasks and worked solutions, linked from the dMAT website. Use it — it is the authoritative description of each task type.',
          'We do not reproduce any of it here. Its terms protect the material, and copying it would be both a legal problem and a poor substitute for original practice. Everything on dMAT Prep is written independently.',
        ],
        source: 'd-mat.de/en/preparation',
      },
    ],
  },
  {
    id: 'dmat-prep',
    title: 'About dMAT Prep',
    blurb: 'What this site is, what it costs, and how it works.',
    items: [
      {
        id: 'who-made-this',
        q: 'Who made dMAT Prep, and is it official?',
        a: [
          'It is independent. dMAT Prep is not affiliated with, endorsed by or approved by g.a.s.t., the TestDaF-Institut or APS India, and nothing here is official material. It was built by a candidate preparing for the same examination, because almost nothing existed to practise on.',
          'dMAT is a registered word mark belonging to g.a.s.t. We use the name only to say which examination this tool is for.',
        ],
      },
      {
        id: 'are-these-real-questions',
        q: 'Are these real exam questions?',
        a: [
          'No, and they could not be. Reproducing examination items is prohibited by g.a.s.t.’s terms, and anyone offering you real dMAT questions is either mistaken or breaking those terms.',
          'Every question here was generated and verified for this site, following the task formats described in the official preparatory material. The formats are the same; the content is ours.',
        ],
      },
      {
        id: 'how-are-they-checked',
        q: 'How do you know the questions are correct?',
        a: [
          'Nothing is published until a solver has proved it. Equation systems are searched exhaustively across the permitted range and rejected unless exactly one solution exists. Figure sequences are re-simulated against the documented rule space and rejected if the four shown matrices allow more than one continuation. Latin squares are checked by exhaustive completion of the marked cell.',
          'Every question also carries a written explanation and a note on each wrong option explaining the specific mistake that produces it, and those are re-checked against the question itself rather than trusted.',
        ],
      },
      {
        id: 'free',
        q: 'What do I get for free?',
        a: [
          'A 150-question sample — 50 from each Core subtest — with full solutions, plus the complete rules, methods and worked examples for all three subtests, timed single-subtest practice, and the General Academic pilot packs. No account is required and nothing expires.',
          'Pro unlocks the rest of the Core bank, all four fixed mock exams and the combined Core plus General Academic sample sitting, for a single payment rather than a subscription.',
        ],
      },
      {
        id: 'account',
        q: 'Do I need an account?',
        a: [
          'Not to practise. Your progress is stored in your browser and works perfectly well without signing in.',
          'Signing in with Google carries that progress between devices and is required for Pro access. It adds durability; it does not unlock any content on its own.',
        ],
      },
      {
        id: 'gam-status',
        q: 'How complete is the General Academic material?',
        a: [
          'It is a pilot, and we would rather say so than imply otherwise. The source packs pass every automated check — answers traced to a verbatim span of the source, exactly four options, a refutation for every wrong one — but no human reviewer has signed them off.',
          'They are also far shorter than a real module: a sample of ten questions against the roughly sixty the real General Academic Module carries. The combined sitting is labelled a sample for that reason.',
        ],
      },
      {
        id: 'mobile',
        q: 'Does it work on a phone?',
        a: [
          'Yes. Every screen is built for phone and laptop alike, including the figure diagrams, which are drawn as vectors rather than images and stay sharp at any size.',
          'For full timed mocks a larger screen is more comfortable, simply because you can see more of the grid at once.',
        ],
      },
    ],
  },
]

export const FAQ_COUNT = FAQ.reduce((n, c) => n + c.items.length, 0)
