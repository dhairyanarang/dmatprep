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
  contactEmail: null,
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
