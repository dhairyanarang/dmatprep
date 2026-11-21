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
      text: 'The short version: dMAT Prep is an independent study tool. It is not the examination and has no connection to the people who run it. Free practice stays free. Pro is a single payment that unlocks everything immediately.',
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
        `Pro is a one-time payment of ${formatPrice()}. Nothing recurs and nothing is charged again automatically.`,
        'Payment is handled by our payment provider. We never receive or store your card number, UPI ID or bank details.',
        'Access is granted once the payment is confirmed. If a payment succeeds but access does not appear, write to {contactEmail} — a background check looks for exactly this, and we would rather hear from you than have you wait.',
      ],
    },
    { type: 'h', text: 'Refunds' },
    {
      type: 'p',
      text: 'Pro is delivered in full the moment it is paid for — every question, every explanation and every mock becomes available at once — so we do not offer refunds for a change of mind. Try the free side first: fifty questions in each Core subtest, with the same explanations and the same practice screen, and no account needed.',
    },
    {
      type: 'p',
      text: 'We do refund where something went wrong on our side: a duplicate charge, a payment that took your money without granting access, or a failure that left the product not working as described. Write to {contactEmail} from the address on your account. Once approved, the money goes back to the method you paid with — our provider cannot send it anywhere else.',
    },
    {
      type: 'p',
      text: 'Nothing here removes rights you have under consumer law. Where those rights apply, they apply regardless of what this page says.',
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
      text: 'We try to keep the service available but cannot promise it will be uninterrupted or error-free, and we may change or withdraw features. If we withdraw something you have paid for and cannot offer an equivalent, write to us.',
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

export const LEGAL_DOCUMENTS = [TERMS]
