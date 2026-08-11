import type { ContentBlock } from '@/lib/types/content'

export const logistics: ContentBlock[] = [
  { type: 'heading', text: 'Dates' },
  {
    type: 'rules',
    items: [
      {
        text: 'Registration opened 29 June 2026.',
        sources: [{ id: 'dmat-india' }, { id: 'aps-dmat' }],
      },
      {
        text: 'Registration closes 15 September 2026.',
        sources: [{ id: 'dmat-india' }, { id: 'aps-dmat' }],
      },
      {
        text: 'The exam is on 26 September 2026 — the first ever sitting.',
        sources: [{ id: 'dmat-india' }, { id: 'aps-dmat' }],
      },
      {
        text: 'Certificates are available from 12 October 2026.',
        sources: [{ id: 'dmat-india' }, { id: 'aps-dmat' }],
      },
    ],
  },

  { type: 'heading', text: 'Fee and refunds' },
  {
    type: 'rules',
    items: [
      {
        text: 'The fee is €150.00, payable to g.a.s.t. on registration — not to APS India.',
        sources: [{ id: 'aps-dmat' }],
      },
      {
        text: 'Payment is by electronic payment; payment at the test centre is allowed only in exceptional cases.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'You may revoke the contract within 14 days of concluding it, by contacting g.a.s.t.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'Deregistering before the deadline is refunded minus an administrative fee of up to 15%.',
        sources: [{ id: 'dmat-terms' }],
      },
      {
        text: 'There is no refund for deregistering after the deadline, for not attending, or for discontinuing the exam.',
        sources: [{ id: 'dmat-terms' }],
      },
    ],
  },

  { type: 'heading', text: 'Test centres' },
  {
    type: 'prose',
    text: 'Ten centres in India — Ahmedabad, Bengaluru, Bhopal, Chandigarh, Chennai, Kolkata, Mananthavady, Mumbai, New Delhi and Pune — plus Kathmandu in Nepal.',
    sources: [{ id: 'dmat-india' }, { id: 'aps-dmat' }],
  },
  {
    type: 'prose',
    text: 'Registration is handled through the g.a.s.t. participant portal at gast.de, not through APS India.',
    sources: [{ id: 'dmat-india' }],
  },

  { type: 'heading', text: 'Who has to take it' },
  {
    type: 'prose',
    text: 'The requirement applies to Master’s applicants whose previous degree falls within one of three field groups: Engineering; Commerce, Accounting, Finance or Economics; and Business or Management. It applies to applicants targeting the summer semester 2027 intake or later.',
    sources: [{ id: 'aps-dmat' }, { id: 'aps-fields' }],
  },
  {
    type: 'callout',
    variant: 'note',
    title: 'The field list is guidance, not a closed list',
    text: 'APS India states its list of affected fields is not exhaustive, and that the official degree title, branch, major, honours subject or specialisation on your academic documents is what decides. Fields not listed may still be affected if clearly equivalent, and a name containing "Engineering" or "Management" is not sufficient on its own.',
  },
  {
    type: 'rules',
    title: 'Exempt from the requirement',
    items: [
      {
        text: 'Applicants who completed APS online registration before 29 June 2026.',
        sources: [{ id: 'aps-dmat' }],
      },
      {
        text: 'Applicants who shipped complete APS documents before 29 June 2026.',
        sources: [{ id: 'aps-dmat' }],
      },
      {
        text: 'Applicants who already hold an APS certificate.',
        sources: [{ id: 'aps-dmat' }],
      },
      {
        text: 'Bachelor’s applicants and PhD applicants.',
        sources: [{ id: 'aps-dmat' }],
      },
      {
        text: 'Participants in officially confirmed exchange, double-degree or university partnership programmes.',
        sources: [{ id: 'aps-dmat' }],
      },
    ],
  },

  { type: 'heading', text: 'How it fits with APS' },
  {
    type: 'prose',
    text: 'The dMAT certificate accompanies your APS application documents, and the result is reflected on the APS certificate. It is an additional element in the APS documentation — it does not replace document verification, does not establish formal eligibility, does not replace anabin, and does not override recognition requirements.',
    sources: [{ id: 'aps-dmat' }, { id: 'dmat-india' }],
  },
]
