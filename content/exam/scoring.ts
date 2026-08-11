import type { ContentBlock } from '@/lib/types/content'

export const scoring: ContentBlock[] = [
  {
    type: 'prose',
    text: 'There is no pass or fail. You receive a score and a percentile rank, and universities decide what to make of them.',
    sources: [{ id: 'dmat-home' }],
  },

  { type: 'heading', text: 'The dMAT score' },
  {
    type: 'rules',
    items: [
      {
        text: 'The dMAT score is a conversion of the total number of correct answers to a value between 0 and 200.',
        sources: [{ id: 'dmat-home' }],
      },
      {
        text: 'The mean score is 100.',
        sources: [{ id: 'dmat-home' }],
      },
      {
        text: 'You also receive a percentile rank, comparing your performance to that of other participants.',
        sources: [{ id: 'dmat-home' }],
      },
      {
        text: 'The total score combines the Core Module and Subject Module results.',
        sources: [{ id: 'dmat-home' }],
      },
    ],
  },
  {
    type: 'prose',
    text: 'Because the test is standardised and centrally evaluated, scores are designed to be comparable across all participants regardless of which subject module they sat.',
    sources: [{ id: 'gam-pdf', page: 5 }],
  },

  { type: 'heading', text: 'Should you guess?' },
  {
    type: 'prose',
    text: 'Yes. The official instructions say so directly, and repeat it in each subtest: if you do not know an answer, guess which answer might be correct.',
    sources: [
      { id: 'gam-pdf', page: 8 },
      { id: 'gam-pdf', page: 25 },
      { id: 'gam-pdf', page: 34 },
    ],
  },
  {
    type: 'prose',
    text: 'There is no penalty for a wrong answer, so a blank costs exactly what a wrong guess costs, and a guess sometimes pays.',
    confidence: 'unconfirmed',
    note: 'No official source states this either way. It follows from the score being described as a conversion of the number of correct answers, and from g.a.s.t. instructing candidates to guess — but "no negative marking" is nowhere written down, so treat it as a strong inference rather than a published rule.',
    sources: [{ id: 'dmat-home' }, { id: 'gam-pdf', page: 8 }],
  },

  { type: 'heading', text: 'Results and the certificate' },
  {
    type: 'rules',
    items: [
      {
        text: 'For the 26 September 2026 sitting, certificates are available from 12 October 2026.',
        sources: [{ id: 'dmat-india' }, { id: 'aps-dmat' }],
      },
      {
        text: 'Results are accessible only through the participant portal. Neither g.a.s.t. nor the test centre will notify you of results by telephone or email.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'Certificates can be downloaded and printed as PDFs.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'The dMAT certificate is valid indefinitely.',
        sources: [{ id: 'dmat-terms' }, { id: 'dmat-home' }],
      },
      {
        text: 'If part of the exam cannot be evaluated because of a technical fault caused by g.a.s.t., you have the right to retake the dMAT at one of the next exam dates.',
        sources: [{ id: 'dmat-terms' }],
      },
    ],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'What the score does not do',
    text: 'APS India is explicit that the dMAT does not replace document verification, does not establish formal eligibility, does not override recognition requirements, and does not compensate for a degree or institution that is not formally recognised. A strong score is not a substitute for meeting the ordinary requirements.',
  },
]
