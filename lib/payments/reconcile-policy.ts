import type { PaymentSnapshot } from './provider.ts'

/**
 * What the sweep should do about one order, decided from the provider's answer.
 *
 * Pure, so the rules that decide whether someone gets access can be tested
 * without a database — which matters, because the database is the one thing
 * this project cannot currently stand up locally.
 *
 *   recover     — a captured payment exists that we had no record of. Grant.
 *   wait        — nothing captured, but too young to draw any conclusion.
 *   unconfirmed — nothing captured, old enough to report. An INFERENCE.
 */
export type OrderOutcome =
  | { action: 'recover'; payment: PaymentSnapshot }
  | { action: 'wait'; reason: string }
  | { action: 'unconfirmed'; reason: string }

export const UNCONFIRMED_AFTER_MINUTES = 30

/**
 * The rules, in the order they apply:
 *
 * 1. **Only `captured` is money.** An `authorized`, `created` or `failed`
 *    attempt is not, and must never grant access. Razorpay's auto-capture
 *    makes `authorized` brief, but brief is not the same as safe.
 * 2. **A captured payment is recovered regardless of age.** If the money is
 *    there, the customer should have access now, not in thirty minutes.
 * 3. **Nothing captured and young → wait.** The customer may still be on
 *    Razorpay's page, or a bank may still be deciding.
 * 4. **Nothing captured and old → unconfirmed.** Reported, never marked
 *    failed, and never called a cancellation: a payment that confirms later
 *    simply leaves the list.
 *
 * The amount is NOT checked here. `apply_payment_event` re-checks it against
 * the stored order inside the same transaction that would grant, and parks on
 * a mismatch — so a wrong amount can never grant even if this said recover.
 */
export function decideOrderOutcome(
  payments: PaymentSnapshot[],
  ageMinutes: number,
): OrderOutcome {
  const captured = payments.find((p) => p.status === 'captured')
  if (captured) return { action: 'recover', payment: captured }

  if (ageMinutes < UNCONFIRMED_AFTER_MINUTES) {
    return { action: 'wait', reason: payments.length ? 'attempted-not-captured' : 'no-attempt-yet' }
  }

  return {
    action: 'unconfirmed',
    reason: payments.length ? 'attempts-but-none-captured' : 'no-payment-attempt',
  }
}
