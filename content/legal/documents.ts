import { formatPrice } from '@/lib/payments/config'

/**
 * The published legal documents, as content rather than components.
 *
 * `docs/legal/*.md` remains the fuller source a lawyer reviews; these are the
 * candidate-facing versions, and the two must say the same things. Tokens in
 * `{braces}` are substituted from `content/legal/operator.ts` and render as a
 * visible placeholder when the fact has not been supplied.
 *
 * NOT REVIEWED BY A LAWYER. `docs/legal/README.md` and the legal readiness
 * report record that plainly, and nothing here should be read as advice.
 */

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'note'; text: string }

export type LegalDocument = {
  slug: string
  title: string
  description: string
  blocks: LegalBlock[]
}

export const TERMS: LegalDocument = {
  slug: 'terms',
  title: 'Terms of Use',
  description: 'What dMAT Prep is, what you get, and what we promise',
  blocks: [
    {
      type: 'note',
      text: 'The short version: dMAT Prep is an independent study tool. It is not the examination and has no connection to the people who run it. Free practice stays free. Pro is a single payment, refundable within seven days.',
    },

    { type: 'h', text: 'We are independent' },
    {
      type: 'p',
      text: 'dMAT Prep is not affiliated with, endorsed by, or sponsored by g.a.s.t. (Gesellschaft für Akademische Studienvorbereitung und Testentwicklung e. V.), APS India, or any examination authority. Nobody connected with the examination has reviewed or approved anything here. The examination’s name is used only to identify which examination this resource prepares you for.',
    },
    {
      type: 'p',
      text: 'Information about the examination itself is restated from official sources and cited. Where an official source is unclear, or two disagree, we say so rather than choosing. Always confirm dates, fees and eligibility with the official sources directly.',
    },

    { type: 'h', text: 'What you get' },
    {
      type: 'list',
      items: [
        'Free: 50 practice questions in each of the three Core subtests, with full explanations, feedback and progress tracking. No account needed.',
        'Pro: the rest of the Core question bank, for a single payment. It does not expire and does not renew.',
        'Neither includes the examination itself, official materials, or any guarantee of a result.',
      ],
    },
    {
      type: 'p',
      text: 'The real examination may differ in content, difficulty and structure. Using dMAT Prep guarantees no examination result and no admission outcome.',
    },

    { type: 'h', text: 'Your account' },
    {
      type: 'p',
      text: 'Free practice needs no account. An account keeps your progress across devices, and is required to buy Pro because access is attached to it. You are responsible for the Google account you sign in with — tell us at {contactEmail} if you think it has been used without your permission.',
    },

    { type: 'h', text: 'Paying' },
    {
      type: 'list',
      items: [
        'Pro is a one-time payment. Nothing recurs and nothing is charged again automatically.',
        'Payment is handled by our payment provider. We never receive or store your card number, UPI ID or bank details.',
        'Access is granted once the payment is confirmed. If a payment succeeds but access does not appear, write to {contactEmail} — a background check looks for exactly this, and we would rather hear from you than have you wait.',
      ],
    },
    {
      type: 'p',
      text: 'Refunds are covered by our refund policy, which forms part of these terms.',
    },

    { type: 'h', text: 'What you may and may not do' },
    {
      type: 'list',
      items: [
        'Use the material to prepare for the examination, for yourself.',
        'Do not redistribute, resell, publish or share paid content.',
        'Do not scrape, bulk-download or automate access.',
        'Do not try to get round access controls, or help anyone else do so.',
        'Do not send us questions recalled from a live examination. We will not use them, and sharing them may breach the examination’s own rules, which bind you as a candidate.',
      ],
    },

    { type: 'h', text: 'Our content' },
    {
      type: 'p',
      text: 'The practice questions, explanations and software are ours. The examination’s own materials are not, and we do not reproduce them. If you believe anything here infringes your rights, write to {contactEmail} with enough detail to identify it and we will investigate, and remove it while we do.',
    },

    { type: 'h', text: 'Availability and liability' },
    {
      type: 'p',
      text: 'We try to keep the service available but cannot promise it will be uninterrupted or error-free, and we may change or withdraw features. If we withdraw something you have paid for and cannot offer an equivalent, write to us and we will discuss a refund.',
    },
    {
      type: 'p',
      text: 'dMAT Prep is a study aid. We are not liable for your examination result, an admission decision, or anything following from either. Where liability can be limited by law, ours is limited to what you have paid us. Nothing here limits liability that cannot be limited — including for fraud, or for death or personal injury caused by negligence.',
    },

    { type: 'h', text: 'Complaints' },
    {
      type: 'p',
      text: 'Write to {contactEmail}. We aim to acknowledge within 48 hours and to resolve complaints within one month.',
    },

    { type: 'h', text: 'Changes' },
    {
      type: 'p',
      text: 'We may update these terms. If a change materially affects access you have already paid for, we will tell you.',
    },
  ],
}

export const REFUNDS: LegalDocument = {
  slug: 'refunds',
  title: 'Refunds',
  description: 'When you can get your money back, and how to ask',
  blocks: [
    {
      type: 'note',
      text: 'Seven days, no questions asked, as long as you have not worked through most of the paid material. Email {contactEmail}.',
    },

    { type: 'h', text: 'What you are buying' },
    {
      type: 'p',
      text: `A one-time purchase of ${formatPrice()} that unlocks the paid half of the Core question bank on your account. There is no subscription, so there is nothing to cancel.`,
    },
    {
      type: 'p',
      text: 'Try the free side first. Fifty questions in each of the three Core subtests, with full explanations and progress tracking, and no account needed. We would rather you did that than bought and asked for the money back.',
    },

    { type: 'h', text: 'The seven-day window' },
    {
      type: 'p',
      text: 'Ask within seven days of buying and we will refund you in full, provided you have not answered more than 20% of the paid questions. We will not ask why.',
    },
    {
      type: 'p',
      text: 'The 20% condition exists because the product is delivered instantly and in full. It is not a trap — if you are near it and still unhappy, write to us.',
    },

    { type: 'h', text: 'After seven days' },
    {
      type: 'p',
      text: 'We will still consider a refund if the product did not work as described, if you were charged twice, or if you paid and never got access. We will not normally refund because you changed your mind later, finished the material, or did not get the result you hoped for.',
    },

    { type: 'h', text: 'How to ask, and how long it takes' },
    {
      type: 'p',
      text: 'Email {contactEmail} from the address on your account and say when you bought. That is the whole process. We reply within 48 hours; once approved, the money goes back to the method you paid with — our provider cannot send it anywhere else — and normally arrives within 5 to 7 working days. Your access ends when the refund is issued.',
    },
    {
      type: 'note',
      text: 'Our payment provider cannot process a normal refund more than six months after the payment. If that applies to you, write to us anyway and we will find another way.',
    },

    { type: 'h', text: 'Failed and duplicate payments' },
    {
      type: 'p',
      text: 'If a payment fails you are not charged and nothing is unlocked. If money has left your account but access has not appeared, it is usually a delayed confirmation and resolves by itself. If it has not within a few hours, write to us.',
    },
    {
      type: 'p',
      text: 'If you were charged twice for the same thing, tell us and we will refund the duplicate in full. The seven-day window and the 20% condition do not apply to a duplicate charge.',
    },
  ],
}

export const LEGAL_DOCUMENTS = [TERMS, REFUNDS]
