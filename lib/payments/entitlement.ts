import type { EntitlementReason, EntitlementStatus, PaymentStatus } from './types.ts'

/**
 * The entitlement projection, as a pure function.
 *
 * Entitlement is DERIVED from the payment facts rather than mutated by each
 * event, and that single decision is what makes duplicate, concurrent and
 * out-of-order delivery incapable of producing a wrong result. Running this
 * twice gives the same answer; running it on events that arrived backwards
 * gives the same answer as if they had arrived in order, because it reads the
 * SET of facts and never accumulates.
 *
 * It mirrors `recompute_entitlement` in
 * `supabase/migrations/20261118120000_payments.sql`, and the honest caveat is
 * that a mirror is not a proof: these tests exercise this function, not the
 * SQL. The precedence table below is the shared specification, and the SQL
 * needs its own integration tests against a real Postgres before anyone relies
 * on it. See `docs/archive/SPRINT4_REPORT.md` §6.1 risk 1.
 *
 * Precedence, in order, and each line exists because of a real case:
 *
 *   1. a manual `revoke` wins over everything        — fraud, chargeback abuse
 *   2. any captured payment grants access            — refunded order A, bought again as B
 *   3. a manual `grant` grants access                — grandfathering, comps, goodwill
 *   4. a chargeback revokes                          — money taken back by the bank
 *   5. a refund revokes, recorded as `refunded`      — money returned by us
 *   6. otherwise there is nothing to grant
 */

export type Facts = {
  /** The most recent manual action for this (user, product), if any. */
  latestManualAction?: 'grant' | 'revoke' | null
  /** The statuses of every payment attempt across every order for this product. */
  paymentStatuses: PaymentStatus[]
}

export type Projection = {
  status: EntitlementStatus
  reason: EntitlementReason
}

export function projectEntitlement(facts: Facts): Projection {
  const statuses = new Set(facts.paymentStatuses)
  const manual = facts.latestManualAction ?? null

  if (manual === 'revoke') return { status: 'revoked', reason: 'manual-revoke' }
  if (statuses.has('captured')) return { status: 'active', reason: 'captured-payment' }
  if (manual === 'grant') return { status: 'active', reason: 'manual-grant' }
  if (statuses.has('charged_back')) return { status: 'revoked', reason: 'charged-back' }
  if (statuses.has('refunded')) return { status: 'refunded', reason: 'refunded' }
  return { status: 'revoked', reason: 'no-qualifying-payment' }
}
