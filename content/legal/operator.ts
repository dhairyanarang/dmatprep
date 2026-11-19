/**
 * The facts about the seller that only the operator can supply.
 *
 * Every value here is `null` on purpose and must never be guessed. A legal
 * document containing an invented legal name, address or grievance officer is
 * worse than no document: it misrepresents a real person's obligations, and it
 * is the one category of content this repository must not fabricate.
 *
 * Filling these in is a single edit. Until they are filled, the pages that
 * depend on them render a visible notice saying they are not in force, and they
 * are excluded from indexing — see `components/legal/legal-document.tsx`.
 *
 * Required by the Consumer Protection (E-Commerce) Rules, 2020 (legal name,
 * principal geographic address, grievance officer with contact details) and by
 * Razorpay, which withholds live API keys until About, Contact, Pricing, Terms,
 * Privacy and Refunds pages exist. See `docs/BUSINESS_SETUP.md` §8.
 */

export type OperatorDetails = {
  /** The name on the merchant account — an individual's own, or an entity's. */
  legalName: string | null
  /** A service address. Required, and it becomes public. */
  address: string | null
  /** A monitored support address. Not a personal mailbox once public. */
  contactEmail: string | null
  /** Name and designation. For a sole operator, the operator. */
  grievanceOfficer: string | null
  /** The city whose courts have jurisdiction. */
  jurisdiction: string | null
  /** When the published documents were last revised. */
  lastUpdated: string | null
}

export const OPERATOR: OperatorDetails = {
  legalName: null,
  address: null,
  /**
   * Carried over, not invented.
   *
   * This exact address was already hardcoded and live in three pages —
   * `app/privacy` (account deletion), `app/about` (infringement reports) and
   * `app/global-error` — before it was centralised here. Leaving this `null`
   * while migrating those references would have silently removed a working
   * contact route from two pages that carry real obligations, so the value
   * moved with them.
   *
   * It is a personal mailbox, which `docs/legal/README.md` says is the wrong
   * answer once the product is public and taking money. **Replace it with a
   * monitored support address before launch** — one edit, here, and every
   * support link and policy page follows.
   */
  contactEmail: 'dhairyanarang077@gmail.com',
  grievanceOfficer: null,
  jurisdiction: null,
  lastUpdated: null,
}

export const OPERATOR_FIELD_LABELS: Record<keyof OperatorDetails, string> = {
  legalName: 'legal name',
  address: 'service address',
  contactEmail: 'support email',
  grievanceOfficer: 'grievance officer',
  jurisdiction: 'jurisdiction',
  lastUpdated: 'last updated date',
}

/** Which required facts are still missing. Empty means the pages may go live. */
export function missingOperatorFields(details: OperatorDetails = OPERATOR): (keyof OperatorDetails)[] {
  return (Object.keys(details) as (keyof OperatorDetails)[]).filter((k) => !details[k])
}

export function operatorComplete(details: OperatorDetails = OPERATOR): boolean {
  return missingOperatorFields(details).length === 0
}

/* -------------------------------------------------------------- support ---- */

/**
 * The one place a support address is read from.
 *
 * It was previously hardcoded in three pages — privacy, about and the global
 * error boundary — which meant changing it was three edits and forgetting one
 * was silent. It is also why the address currently published is a personal
 * mailbox: there was no single field to point at something better.
 */
export type SupportContext = {
  /** What the customer was doing. Becomes the email subject. */
  topic: string
  /**
   * A non-sensitive reference, if we have one.
   *
   * Our own provider order id and nothing else. Never a payment id tied to a
   * card, never an email address, and never anything the customer would have
   * to be told to keep secret.
   */
  orderRef?: string | null
}

/** The response time we aim for. An aim, stated as one — never a guarantee. */
export const SUPPORT_RESPONSE_AIM = 'We aim to reply within 1–2 hours, though we cannot guarantee it.'

/**
 * A `mailto:` for a support request, or null when no address is configured.
 *
 * Returning null rather than a broken link is deliberate: a `mailto:` with an
 * empty address opens an empty draft and looks like the product is broken.
 * Every caller renders a plain fallback instead.
 */
export function supportMailto(
  context: SupportContext,
  details: OperatorDetails = OPERATOR,
): string | null {
  const address = details.contactEmail
  if (!address) return null

  const subject = `dMAT Prep — ${context.topic}`
  const lines = [
    `Hello,`,
    ``,
    `I need help with: ${context.topic}`,
    ...(context.orderRef ? [``, `Order reference: ${context.orderRef}`] : []),
    ``,
    `What happened:`,
    ``,
    ``,
    `— Please do not include card numbers, UPI PINs, passwords or OTPs in this`,
    `  email. We will never ask for them, and we do not need them to help.`,
  ]

  const params = new URLSearchParams({ subject, body: lines.join('\n') })
  // URLSearchParams encodes spaces as "+", which some mail clients render
  // literally in a subject line.
  return `mailto:${address}?${params.toString().replace(/\+/g, '%20')}`
}

/** Whether a support route can be offered at all. */
export function supportConfigured(details: OperatorDetails = OPERATOR): boolean {
  return Boolean(details.contactEmail)
}
