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
  description: 'The agreement between you and the operator of dMAT Prep',
  blocks: [
    { type: 'h', text: 'Who we are' },
    {
      type: 'p',
      text: 'dMAT Prep is operated by {legalName}, at {address}. You can reach us at {contactEmail}.',
    },
    { type: 'h', text: 'We are independent' },
    {
      type: 'p',
      text: 'dMAT Prep is not affiliated with, endorsed by, or sponsored by g.a.s.t. (Gesellschaft für Akademische Studienvorbereitung und Testentwicklung e. V.), APS India, or any examination authority. Nobody connected with the examination has reviewed, approved or licensed anything here.',
    },
    {
      type: 'p',
      text: 'The examination’s name is used solely to identify the examination this resource prepares candidates for. “dMAT” is a trademark of g.a.s.t., used for that identification only.',
    },
    { type: 'h', text: 'What the service is' },
    {
      type: 'p',
      text: 'dMAT Prep provides independently developed practice questions, explanations and progress tracking for the Core Module subtests: Figure Sequences, Mathematical Equations and Latin Squares.',
    },
    {
      type: 'p',
      text: 'It is not the examination, not a source of official information, and not a predictor of your result. The real examination may differ in content, difficulty and structure. Using dMAT Prep guarantees no examination result and no admission outcome.',
    },
    {
      type: 'p',
      text: 'Information about the examination itself is restated from official sources and cited on the Sources page. Where an official source is unclear or two official sources disagree, we say so rather than choosing. Always confirm dates, fees and eligibility with the official sources directly.',
    },
    { type: 'h', text: 'Your account' },
    {
      type: 'p',
      text: 'An account is optional for free practice. You can use the free question bank, with complete explanations and progress tracking, without signing in at all. An account adds durability across devices, and is required to buy or access paid content.',
    },
    {
      type: 'p',
      text: 'You are responsible for the security of the Google account you sign in with. Tell us at {contactEmail} if you believe your account has been used without your permission.',
    },
    { type: 'h', text: 'Paid access' },
    {
      type: 'p',
      text: `Paid access is a one-time purchase of ${formatPrice()}, not a subscription. Nothing recurs and nothing is charged again automatically.`,
    },
    {
      type: 'p',
      text: 'Payment is collected by our payment provider. We do not receive or store your card number, UPI identifier or bank details; we store a record that a payment was made, for how much, and when.',
    },
    {
      type: 'p',
      text: 'Access is granted to your account once the payment is confirmed. If a payment succeeds but access does not appear, write to {contactEmail} — a reconciliation process checks for this automatically, and we would rather hear from you than have you wait.',
    },
    { type: 'h', text: 'What you may and may not do' },
    {
      type: 'list',
      items: [
        'Use the material to prepare for the examination, for yourself.',
        'Do not redistribute, resell, publish or share paid content.',
        'Do not scrape, bulk-download or automate access to the service.',
        'Do not attempt to bypass access controls, or help anyone else do so.',
        'Do not upload, send or ask us for recalled questions from a live examination. We will not accept them, and sharing them may breach the examination’s own terms and conditions, which bind you as a candidate.',
      ],
    },
    { type: 'h', text: 'Our content' },
    {
      type: 'p',
      text: 'The practice questions, explanations and software are ours. The examination’s own materials are not, and we do not reproduce them: facts about the examination are restated in our own words and cited.',
    },
    {
      type: 'p',
      text: 'If you believe anything here infringes your rights, write to {contactEmail} with enough detail to identify the material, and we will investigate and remove it while we do.',
    },
    { type: 'h', text: 'Availability' },
    {
      type: 'p',
      text: 'We try to keep the service available but do not promise that it will be uninterrupted or error-free. We may change or withdraw features. If we withdraw something you have paid for and cannot provide an equivalent, write to us and we will discuss a refund.',
    },
    { type: 'h', text: 'Limits on our liability' },
    {
      type: 'p',
      text: 'dMAT Prep is a study aid. We are not liable for your examination result, an admission decision, or any consequence of either. Nothing in these terms limits liability that cannot be limited by law, including liability for fraud or for death or personal injury caused by negligence.',
    },
    {
      type: 'p',
      text: 'Where liability can be limited, ours is limited to the amount you have paid us.',
    },
    { type: 'h', text: 'Grievances' },
    {
      type: 'p',
      text: '{grievanceOfficer} is our grievance officer, as required by the Consumer Protection (E-Commerce) Rules, 2020. Write to {contactEmail}. We acknowledge complaints within 48 hours and aim to resolve them within one month.',
    },
    { type: 'h', text: 'Changes' },
    {
      type: 'p',
      text: 'We may update these terms. If a change materially affects paid access you have already bought, we will tell you. The date at the top of this page is when it was last revised.',
    },
    { type: 'h', text: 'Governing law' },
    {
      type: 'p',
      text: 'These terms are governed by the laws of India, and the courts at {jurisdiction} have exclusive jurisdiction.',
    },
  ],
}

export const REFUNDS: LegalDocument = {
  slug: 'refunds',
  title: 'Refund and Cancellation Policy',
  description: 'When you can get your money back, and how to ask',
  blocks: [
    {
      type: 'note',
      text: 'Seven days, no questions asked, as long as you have not worked through most of the paid material. Write to {contactEmail}.',
    },
    { type: 'h', text: 'What you are buying' },
    {
      type: 'p',
      text: `A one-time purchase of ${formatPrice()} that unlocks the paid half of the Core question bank on your account. There is no subscription and nothing recurs, so there is nothing to cancel.`,
    },
    { type: 'h', text: 'Before you buy' },
    {
      type: 'p',
      text: 'Everything on the free side stays free: 50 questions in each of the three Core subtests, with complete explanations, feedback and progress tracking, and no account required. We would rather you tried that first than bought and asked for a refund.',
    },
    { type: 'h', text: 'The seven-day window' },
    {
      type: 'p',
      text: 'Ask within seven days of your purchase and we will refund you in full, provided you have not answered more than 20% of the paid questions. We will not ask you why.',
    },
    {
      type: 'p',
      text: 'The 20% condition exists because the product is delivered instantly and in full. It is a limit on working through the material and then asking for the money back, not a trap: if you are near it and still unhappy, write to us.',
    },
    { type: 'h', text: 'After seven days' },
    {
      type: 'p',
      text: 'We will still consider a refund if the product did not work as described, if you were charged twice, or if you paid and never received access. Write to us and tell us what happened.',
    },
    {
      type: 'p',
      text: 'We will not normally refund because you have changed your mind after a week, because your examination result was not what you hoped, or because you have finished the material.',
    },
    { type: 'h', text: 'How to ask' },
    {
      type: 'p',
      text: 'Email {contactEmail} from the address on your account, with the date of purchase. That is the whole process — there is no form.',
    },
    { type: 'h', text: 'How long it takes' },
    {
      type: 'p',
      text: 'We respond within 48 hours. Once approved, the refund goes back to the payment method you used — our provider cannot send it anywhere else — and normally arrives within 5 to 7 working days. Your paid access ends when the refund is issued.',
    },
    {
      type: 'note',
      text: 'Our payment provider cannot process a normal refund for a payment more than six months old. If that applies, write to us anyway and we will find another way.',
    },
    { type: 'h', text: 'Failed and duplicate payments' },
    {
      type: 'p',
      text: 'If a payment fails, you are not charged and no access is granted. If money has left your account but access has not appeared, it is usually a delayed confirmation and resolves by itself — our reconciliation checks for exactly this. If it does not resolve within a few hours, write to us.',
    },
    {
      type: 'p',
      text: 'If you were charged twice for the same thing, tell us and we will refund the duplicate in full. The seven-day window and the 20% condition do not apply to a duplicate charge.',
    },
    { type: 'h', text: 'Grievances' },
    {
      type: 'p',
      text: 'If you are unhappy with how we have handled a refund, {grievanceOfficer} is our grievance officer. Write to {contactEmail}. We acknowledge within 48 hours and aim to resolve within one month.',
    },
  ],
}

export const LEGAL_DOCUMENTS = [TERMS, REFUNDS]
