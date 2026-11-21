/**
 * The funnel vocabulary, in one place.
 *
 * Nine events, fixed names, and a hard allowlist of properties. The allowlist
 * is the point: analytics is the easiest place in a product to leak personal
 * data by accident, because the call site that adds `email` looks helpful. A
 * blocklist would have to be updated every time someone adds a field; an
 * allowlist cannot be wrong by omission.
 *
 * **Unique buyers are deliberately NOT countable here.** No user id, no email,
 * no session identifier of ours goes to Vercel Analytics. Counting distinct
 * humans is the database's job — see `supabase/reports/funnel.sql` — and the
 * database is the source of truth for anything involving money.
 *
 * Where each event is emitted, and by whom:
 *
 * | event                | side   | emitted when                                   |
 * |----------------------|--------|------------------------------------------------|
 * | `premium_viewed`     | client | the pricing page is shown                      |
 * | `premium_buy_clicked`| client | the buy button is pressed                      |
 * | `checkout_created`   | SERVER | an order row has been written                  |
 * | `checkout_opened`    | client | Razorpay Checkout actually opened              |
 * | `payment_succeeded`  | SERVER | a capture is applied for the FIRST time         |
 * | `payment_failed`     | SERVER | a failure is applied, or verification refused   |
 * | `payment_pending`    | client | we could not confirm yet and said so            |
 * | `premium_unlocked`   | SERVER | the first capture that grants the entitlement   |
 * | `support_clicked`    | client | a support link is followed                      |
 *
 * The three money events are server-side on purpose. **A browser redirect is
 * not proof of payment**, so nothing the client says can move the funnel past
 * `checkout_opened`; and because the server only emits on the first successful
 * processing of an event, a webhook delivered five times counts once.
 */

export const EVENTS = {
  premiumViewed: 'premium_viewed',
  premiumBuyClicked: 'premium_buy_clicked',
  checkoutCreated: 'checkout_created',
  checkoutOpened: 'checkout_opened',
  paymentSucceeded: 'payment_succeeded',
  paymentFailed: 'payment_failed',
  paymentPending: 'payment_pending',
  premiumUnlocked: 'premium_unlocked',
  supportClicked: 'support_clicked',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

/** Vercel Analytics accepts only these property value types. */
export type PropertyValue = string | number | boolean | null

/**
 * Every property any event may carry. Nothing else is ever sent.
 *
 * `order_ref` is our provider order id: an opaque reference to a row we own,
 * not a credential and not personal data, and the one field that makes a
 * funnel number traceable back to a record when something looks wrong.
 */
const ALLOWED_PROPERTIES = [
  'order_ref',
  'amount_minor',
  'currency',
  'status',
  'reason',
  'surface',
  'method',
] as const

export type EventProperties = Partial<Record<(typeof ALLOWED_PROPERTIES)[number], PropertyValue>>

export const ALLOWED_PROPERTY_KEYS: readonly string[] = ALLOWED_PROPERTIES

/**
 * Drop anything not on the allowlist, and anything of a type the API refuses.
 *
 * Applied on both the client and the server paths, so a call site cannot leak
 * by adding a field — the field simply never arrives.
 */
export function safeProperties(input: EventProperties = {}): Record<string, PropertyValue> {
  const out: Record<string, PropertyValue> = {}
  for (const key of ALLOWED_PROPERTIES) {
    const value = input[key]
    if (value === undefined) continue
    const t = typeof value
    if (value === null || t === 'string' || t === 'number' || t === 'boolean') {
      out[key] = value as PropertyValue
    }
  }
  return out
}
