import type { ContentBlock } from '@/lib/types/content'

export const rules: ContentBlock[] = [
  {
    type: 'prose',
    text: 'These come from g.a.s.t.’s Terms & Conditions and the preparatory materials. Most carry exclusion from the exam as the penalty, with no refund — so they are worth reading once properly rather than skimming on the day.',
    sources: [{ id: 'dmat-terms' }],
  },

  { type: 'heading', text: 'Identification and arrival' },
  {
    type: 'rules',
    items: [
      {
        text: 'You must present a valid ID card or passport on the day. Without one you will not be admitted.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'The identity document must match the one given at online registration.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'If you arrive after the exam materials have been distributed, you will not be admitted.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'Identity may be re-verified, and the certificate is issued only if your identity is proven beyond doubt.',
        sources: [{ id: 'dmat-terms' }],
      },
    ],
  },

  { type: 'heading', text: 'What you may not bring' },
  {
    type: 'quote',
    text: 'You may not carry mobile phones, tablets, mp3 players, wristwatches (including smartwatches), fitness watches, calculators or other electronic devices.',
    sources: [{ id: 'dmat-terms' }],
  },
  {
    type: 'rules',
    items: [
      {
        text: 'Only your identity document is allowed on your desk.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'Devices must be switched off for the entire test. If your phone rings during the examination you will be excluded.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'There is no calculator, and none is provided. All arithmetic is mental.',
        sources: [{ id: 'dmat-terms' }],
      },
    ],
  },

  { type: 'heading', text: 'No notes, at any point' },
  {
    type: 'quote',
    text: 'You may not take notes throughout the exam.',
    sources: [{ id: 'gam-pdf', page: 6 }],
  },
  {
    type: 'prose',
    text: 'Scratch paper is not merely unavailable — it is classified as a prohibited aid, alongside notes and reference books. This shapes how you should practise: the official materials tell you to work through the exercises without taking notes, because you will have no helping tools in the exam either.',
    sources: [{ id: 'dmat-terms' }, { id: 'gam-pdf', page: 9 }],
  },
  {
    type: 'callout',
    variant: 'warning',
    title: 'Practise the way you will sit',
    text: 'If you rehearse Latin Squares by sketching the grid, you are training a skill you cannot use. Everything in this hub is built to be solved by reading and mental tracking alone.',
  },

  { type: 'heading', text: 'Movement during the exam' },
  {
    type: 'rules',
    items: [
      {
        text: 'You may not leave the exam building for the duration of the examination.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'Once you have been assigned a seat you may not leave the exam room until the end of that module.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'Lavatories may be used only during the designated breaks.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'Cafeteria or canteen visits are not permitted during breaks.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'Consulting notes or reference books during breaks counts as a violation.',
        sources: [{ id: 'dmat-terms' }],
      },
    ],
  },

  { type: 'heading', text: 'Conduct' },
  {
    type: 'rules',
    items: [
      {
        text: 'Using prohibited aids or attempting to copy from other participants results in exclusion.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'Not following the test administrator’s instructions results in exclusion.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'Falsified identity documents, hand scanners, or attempting to take exam documents away result in exclusion.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'Exclusion means no refund of the exam fee, and the Examination Board may deny admission to future sittings.',
        sources: [{ id: 'dmat-terms' }],
      },
    ],
  },

  { type: 'heading', text: 'Confidentiality of exam content' },
  {
    type: 'prose',
    text: 'You may not record any information about the content of the dMAT, discuss it with other test takers, pass it to third parties, or publish it — including on social networks and internet forums. g.a.s.t. states that breaches will be brought to legal prosecution.',
    sources: [{ id: 'dmat-terms' }],
  },
]
