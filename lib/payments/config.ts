/**
 * The commercial configuration, server-side and in one place.
 *
 * The price lives here and not in a component, a database row or a client
 * bundle, because the amount sent to the provider and the amount checked on the
 * webhook must be the same figure and must not come from the browser. A client
 * that asks to pay ₹1 for a ₹999 product is refused at order creation.
 *
 * `PRICE_MINOR` was set to ₹999 on 20 November 2026, by decision. It replaces
 * the ₹599 that `docs/PRICING_DECISION.md` had recommended — that document now
 * records both the recommendation and the decision that overrode it, rather
 * than being quietly edited to agree.
 *
 * One number, one place. The pricing page, the sidebar card, the Terms, the
 * refund policy and the order the server creates all read it from here, so a
 * price shown to a buyer and a price charged to a card cannot disagree.
 */

export const PRODUCT = 'core-premium' as const
export type ProductId = typeof PRODUCT

/** Minor units. 99900 is ₹999.00. Never a float, never a rupee decimal. */
export const PRICE_MINOR = 99_900
export const CURRENCY = 'INR' as const

/**
 * Paid once, kept for good.
 *
 * `entitlements.expires_at` is nullable and nothing ever sets it, so access
 * already does not expire — this constant exists so the COPY cannot drift from
 * that fact. If a time-limited product is ever introduced, this is the thing
 * that has to change first.
 */
export const ACCESS_IS_LIFETIME = true

/**
 * Whether the purchase flow is live.
 *
 * Three things are false today and each one independently blocks selling: the
 * price is not approved, the access policy is not approved, and no Razorpay
 * account exists. Rather than scatter those conditions through the UI, the
 * whole commercial surface reads this one flag, so the product ships today
 * behaving exactly as it always has.
 */
export const COMMERCE_ENABLED = process.env.NEXT_PUBLIC_COMMERCE_ENABLED === '1'

/** Rupees, for display. Formatting lives here so no two pages disagree. */
export function formatPrice(minor: number = PRICE_MINOR): string {
  return `₹${(minor / 100).toLocaleString('en-IN', {
    minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * What the gateway takes, computed rather than quoted.
 *
 * Razorpay's published domestic rate, verified 18 November 2026: a 2% platform
 * fee, plus 18% GST **on the fee** and not on the transaction. Shown on the
 * pricing page's internal notes rather than to the customer, who is quoted one
 * number.
 */
export const PLATFORM_FEE_RATE = 0.02
export const GST_ON_FEE_RATE = 0.18

export function gatewayCost(minor: number = PRICE_MINOR) {
  const fee = minor * PLATFORM_FEE_RATE
  const gst = fee * GST_ON_FEE_RATE
  return { fee, gst, total: fee + gst, net: minor - fee - gst }
}
