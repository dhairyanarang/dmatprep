import type { ContentBlock } from '@/lib/types/content'

export const format: ContentBlock[] = [
  {
    type: 'prose',
    text: 'The dMAT is a digital study aptitude test used in the admission of international applicants to Master’s programmes in Germany. It was developed by German universities together with g.a.s.t., and is evaluated centrally at the TestDaF Institute in Bochum.',
    sources: [{ id: 'gam-pdf', page: 5 }, { id: 'dmat-home' }],
  },
  {
    type: 'prose',
    text: 'It consists of two modules: a Core Module measuring general study aptitude, and a Subject Module measuring subject-specific aptitude. In India the Subject Module is the General Academic Module.',
    sources: [{ id: 'dmat-structure' }, { id: 'dmat-india' }],
  },

  { type: 'heading', text: 'Core Module' },
  {
    type: 'prose',
    text: 'Three subtests of general cognitive ability, sat back to back. Each runs 25 minutes for 20 items — 75 minutes and 60 items in total.',
    sources: [{ id: 'gam-pdf', page: 8 }],
  },
  {
    type: 'rules',
    items: [
      {
        text: 'Figure Sequences — 25 minutes, 20 items. Continue a series of matrices in which symbols move, rotate and change colour.',
        sources: [{ id: 'gam-pdf', page: 8 }],
      },
      {
        text: 'Mathematical Equations — 25 minutes, 20 items. Solve small systems of equations where every letter is a whole number from 1 to 20.',
        sources: [{ id: 'gam-pdf', page: 18 }],
      },
      {
        text: 'Latin Squares — 25 minutes, 20 items. Determine the letter belonging in a marked cell of a 5×5 grid.',
        sources: [{ id: 'gam-pdf', page: 25 }],
      },
    ],
  },

  { type: 'heading', text: 'Subject Module — General Academic' },
  {
    type: 'prose',
    text: 'Ninety minutes in total. Each task pairs an academic input text — which may include figures, tables or formulas — with a set of related questions, each having four answer options and exactly one correct answer. It tests application rather than memorised factual knowledge.',
    sources: [{ id: 'gam-pdf', page: 34 }, { id: 'dmat-structure' }],
  },
  {
    type: 'prose',
    text: 'Topics span mathematics, computational sciences, natural sciences, engineering, business administration, economics, social sciences and humanities.',
    sources: [{ id: 'gam-pdf', page: 34 }],
  },

  { type: 'heading', text: 'How long the day runs' },
  {
    type: 'prose',
    text: 'There is a 30-minute break between the two modules. Adding up the published parts gives 75 minutes of Core Module, a 30-minute break and 90 minutes of Subject Module: 195 minutes, or three hours and 15 minutes of scheduled time — before check-in and identity verification.',
    sources: [{ id: 'gam-pdf', page: 6 }],
  },
  {
    type: 'callout',
    variant: 'warning',
    title: 'The two official sources disagree here',
    text: 'The preparatory materials say the exam takes "about three hours with a break of 30 minutes between the two parts", while d-mat.de says "three and a half hours with a break between the examination modules". Both are approximations of the same schedule; the 195 minutes computed from the published per-part timings is the figure to plan around.',
  },

  { type: 'heading', text: 'Answer format' },
  {
    type: 'prose',
    text: 'Every task on the dMAT is single-choice — you select one answer from a list rather than entering it.',
    sources: [{ id: 'dmat-home' }],
  },
  {
    type: 'prose',
    text: 'Figure Sequences is the exception worth knowing about: a single item asks for two matrices, each chosen from three options, so it takes two selections.',
    sources: [{ id: 'gam-pdf', page: 7 }],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'Detailed instructions appear only in the preparatory materials',
    text: 'g.a.s.t. states that the full task instructions are available only in the preparation materials — in the exam itself you see only short reminders. Reading them before the day is not optional.',
  },
  {
    type: 'quote',
    text: 'The detailed instructions for the individual task types are only available in these preparation materials! In the dMAT exam you will only see short explanations of the processing as a reminder.',
    sources: [{ id: 'gam-pdf', page: 4 }],
  },
]
