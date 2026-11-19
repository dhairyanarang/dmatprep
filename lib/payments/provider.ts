import type { NormalisedEvent, ProviderId } from './types.ts'

/**
 * The provider boundary.
 *
 * Five operations, and everything provider-shaped lives behind them: both
 * signature schemes and their different keys, the raw-body rule, hex versus
 * base64, the header names, Cashfree's timestamp-prefixed signing. Nothing
 * outside this boundary imports a provider SDK or knows a provider's field
 * names.
 *
 * Razorpay is the primary provider and Cashfree the sole fallback. Only one is
 * implemented; the point of this interface is that the second is a bounded
 * change rather than a rebuild.
 */

export type CreatedOrder = {
  providerOrderId: string
  amountMinor: number
  currency: string
}

export type PaymentSnapshot = {
  providerPaymentId: string
  providerOrderId: string | null
  status: NormalisedEvent['status']
  amountMinor: number | null
}

export type CheckoutReturn = {
  providerPaymentId: string
  /** The signature Checkout handed the browser. Never trusted on its own. */
  signature: string
  /** What Checkout claims the order was. Deliberately ignored for signing. */
  claimedOrderId?: string
}

export interface PaymentProvider {
  readonly id: ProviderId

  /** Create an order server-side. Razorpay refuses to capture without one. */
  createOrder(input: {
    amountMinor: number
    currency: string
    receipt: string
  }): Promise<CreatedOrder>

  /**
   * Verify a webhook and normalise it.
   *
   * `raw` is the exact request body as text, before any parsing. Returns null
   * when the signature does not verify — the caller writes nothing in that case.
   */
  verifyWebhook(raw: string, headers: Headers): NormalisedEvent | null

  /**
   * Verify the Checkout return.
   *
   * `storedOrderId` is read from our own table, never from the browser. The
   * argument exists separately so no implementation can reach for the
   * client-supplied value.
   */
  verifyCheckoutReturn(storedOrderId: string, ret: CheckoutReturn): boolean

  /** Ask the provider what actually happened. The reconciliation primitive. */
  fetchPaymentStatus(providerPaymentId: string): Promise<PaymentSnapshot | null>

  /**
   * Every payment attempt against one of OUR orders.
   *
   * The reconciliation primitive. Order-scoped on purpose: the sweep already
   * knows which of its orders are unresolved, so it asks about those rather
   * than walking the provider's whole account.
   */
  fetchOrderPayments(providerOrderId: string): Promise<PaymentSnapshot[]>

  refund(providerPaymentId: string, amountMinor?: number): Promise<{ ok: boolean; id?: string }>
}
