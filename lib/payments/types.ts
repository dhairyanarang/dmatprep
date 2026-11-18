/**
 * The payment domain, with no provider in it.
 *
 * Every name here is one dMAT Prep owns. `provider` is a value, never part of a
 * field name, so switching from Razorpay to Cashfree is an adapter change
 * rather than a migration.
 */

export type ProviderId = 'razorpay' | 'cashfree'

/**
 * A payment's status, as a one-way lattice.
 *
 * The order matters and is enforced in the database by a trigger: a status may
 * only move up. That is what makes out-of-order webhook delivery a non-event —
 * a `captured` arriving after a `refunded` is dropped rather than resurrecting
 * access. Razorpay states outright that ordering is not guaranteed.
 */
export const PAYMENT_STATUS_RANK = {
  created: 0,
  failed: 1,
  captured: 2,
  refunded: 3,
  charged_back: 4,
} as const

export type PaymentStatus = keyof typeof PAYMENT_STATUS_RANK

export function rank(status: PaymentStatus): number {
  return PAYMENT_STATUS_RANK[status]
}

/** Whether applying `next` over `current` is a move forward. */
export function advances(current: PaymentStatus, next: PaymentStatus): boolean {
  return rank(next) > rank(current)
}

export type EntitlementStatus = 'active' | 'refunded' | 'revoked'

export type EntitlementReason =
  | 'captured-payment'
  | 'manual-grant'
  | 'manual-revoke'
  | 'charged-back'
  | 'refunded'
  | 'no-qualifying-payment'
  | 'bootstrap'

export type Entitlement = {
  userId: string
  product: string
  status: EntitlementStatus
  reason: EntitlementReason
  expiresAt: string | null
}

/** Whether an entitlement currently permits access. The only access rule. */
export function grantsAccess(e: Pick<Entitlement, 'status' | 'expiresAt'> | null): boolean {
  if (!e) return false
  if (e.status !== 'active') return false
  if (e.expiresAt && new Date(e.expiresAt).getTime() <= Date.now()) return false
  return true
}

/** The outcome of claiming a webhook event. See `claim_webhook_event`. */
export type ClaimOutcome = 'claimed' | 'already_processed' | 'parked' | 'locked'

/** A provider event, normalised by the adapter. */
export type NormalisedEvent = {
  provider: ProviderId
  eventId: string
  eventType: string
  providerOrderId: string | null
  providerPaymentId: string | null
  status: PaymentStatus | null
  amountMinor: number | null
  /** Allowlisted fields only. Never the raw payload. */
  redacted: Record<string, unknown>
}
