/**
 * What we are allowed to keep from a provider payload.
 *
 * An ALLOWLIST, not a blocklist, and that choice is the point: a blocklist is
 * out of date the moment the provider adds a field, and the fields it would
 * have to exclude are the ones that matter. A Razorpay payment payload carries
 * `contact` (phone), `email`, `card.last4`, `card.network`, `card.issuer` and
 * `vpa` — personal data under the DPDP Act, and of no use to us whatsoever.
 *
 * What survives is what a reconciliation or a dispute actually needs: which
 * event, which order, which payment, how much, by what method, and when.
 */

const ALLOWED = [
  'event',
  'order_id',
  'payment_id',
  'amount',
  'currency',
  'status',
  'method',
  'created_at',
  'captured',
  'error_code',
  'error_description',
] as const

export type Redacted = Record<string, unknown>

/** Pick only allowlisted keys, and only primitives. */
export function redact(input: unknown): Redacted {
  if (input == null || typeof input !== 'object') return {}
  const source = input as Record<string, unknown>
  const out: Redacted = {}
  for (const key of ALLOWED) {
    const value = source[key]
    if (value === undefined || value === null) continue
    const t = typeof value
    if (t === 'string' || t === 'number' || t === 'boolean') out[key] = value
  }
  return out
}

/** The allowlist, exported so a test can assert nothing personal is in it. */
export const ALLOWED_KEYS: readonly string[] = ALLOWED
