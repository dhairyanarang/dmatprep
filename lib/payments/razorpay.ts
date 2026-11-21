import type { PaymentProvider, CheckoutReturn, CreatedOrder, PaymentSnapshot } from './provider.ts'
import { redact } from './redact.ts'
import { sha256Hex, verifyCheckoutSignature, verifyWebhookSignature } from './signature.ts'
import type { NormalisedEvent, PaymentStatus } from './types.ts'

/**
 * The Razorpay adapter.
 *
 * Deliberately no SDK. The REST API is three endpoints and Basic auth, and the
 * official Node helper's own documentation page shows the `JSON.stringify`
 * pattern that breaks raw-body signing — so the dependency would add risk
 * rather than remove it. Verified against Razorpay's documentation on
 * 18 November 2026; see `docs/RAZORPAY.md`.
 *
 * Credentials are read from the environment at call time and never logged.
 * Nothing here is exported to the browser: the module is only ever imported by
 * `lib/payments/server.ts`, which carries `import 'server-only'`.
 */

const API = 'https://api.razorpay.com/v1'

type Env = { keyId: string; keySecret: string; webhookSecret: string }

function env(): Env {
  return {
    keyId: process.env.RAZORPAY_KEY_ID ?? '',
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  }
}

/** Whether the adapter can run at all. Checked before any route does work. */
export function razorpayConfigured(): boolean {
  const e = env()
  return Boolean(e.keyId && e.keySecret && e.webhookSecret)
}

function authHeader(e: Env): string {
  return `Basic ${Buffer.from(`${e.keyId}:${e.keySecret}`).toString('base64')}`
}

/**
 * Razorpay's payment states, mapped onto ours.
 *
 * `authorized` is money held but not taken. It deliberately maps to `created`
 * rather than `captured`: granting on an authorisation would give access before
 * the money is ours. Auto-capture is the normal configuration, in which case
 * `captured` follows within moments.
 */
function mapStatus(s: unknown): PaymentStatus | null {
  switch (s) {
    case 'captured':
      return 'captured'
    case 'authorized':
    case 'created':
      return 'created'
    case 'failed':
      return 'failed'
    case 'refunded':
      return 'refunded'
    default:
      return null
  }
}

type Disposition = { disposition: 'fact' | 'acknowledge' | 'park'; status: PaymentStatus | null; note: string }

/**
 * What a Razorpay event means for our records.
 *
 * The dispute rules are the ones worth reading, and the first is a correction
 * of a real defect: an earlier version treated `payment.dispute.created` as a
 * chargeback and revoked access the moment a dispute was OPENED. Razorpay's
 * dispute payloads carry `payload.payment.entity` alongside the dispute, so
 * that code found a payment id, applied `charged_back`, and cut off a customer
 * whose money we still held.
 *
 * A dispute opened is not a dispute lost. Event names verified against
 * razorpay.com/docs/webhooks/payloads/disputes on 18 November 2026:
 * `created`, `under_review`, `action_required`, `won`, `lost`, `closed`, with
 * entity `status` one of open | under_review | won | lost | closed.
 */
function dispositionForEvent(eventType: string, payloadStatus: unknown, disputeStatus: unknown): Disposition {
  if (eventType === 'payment.captured') {
    return { disposition: 'fact', status: 'captured', note: 'payment captured' }
  }
  if (eventType === 'payment.failed') {
    return { disposition: 'fact', status: 'failed', note: 'payment failed' }
  }
  if (eventType === 'refund.processed' || eventType === 'refund.created') {
    return { disposition: 'fact', status: 'refunded', note: 'refund issued' }
  }

  if (eventType.startsWith('payment.dispute.')) {
    // We lost: the bank has taken the money back. This is the only dispute
    // event that may revoke access.
    if (eventType === 'payment.dispute.lost' || disputeStatus === 'lost') {
      return { disposition: 'fact', status: 'charged_back', note: 'dispute lost' }
    }
    // We won: the capture stands and the entitlement is untouched.
    if (eventType === 'payment.dispute.won' || disputeStatus === 'won') {
      return { disposition: 'acknowledge', status: null, note: 'dispute won — entitlement unchanged' }
    }
    // Opened, or still being decided. The money is still ours. Record it and
    // change nothing.
    if (
      eventType === 'payment.dispute.created' ||
      eventType === 'payment.dispute.under_review' ||
      eventType === 'payment.dispute.action_required' ||
      disputeStatus === 'open' ||
      disputeStatus === 'under_review'
    ) {
      return { disposition: 'acknowledge', status: null, note: `dispute ${eventType.split('.').pop()} — no entitlement change` }
    }
    // `closed` with no decided status, or an event name we do not know. Never
    // guessed at.
    return { disposition: 'park', status: null, note: 'dispute outcome unclear' }
  }

  const mapped = mapStatus(payloadStatus)
  if (mapped) return { disposition: 'fact', status: mapped, note: `mapped from payment status ${String(payloadStatus)}` }
  return { disposition: 'park', status: null, note: 'unhandled event type' }
}

type RzpPaymentEntity = {
  id?: string
  order_id?: string
  amount?: number
  status?: string
}

type RzpDisputeEntity = {
  id?: string
  payment_id?: string
  amount?: number
  status?: string
  phase?: string
}

export function createRazorpayProvider(): PaymentProvider {
  return {
    id: 'razorpay',

    async createOrder({ amountMinor, currency, receipt }): Promise<CreatedOrder> {
      const e = env()
      const response = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: authHeader(e) },
        body: JSON.stringify({
          amount: amountMinor,
          currency,
          receipt,
          // Auto-capture: without it a payment sits `authorized` and must be
          // captured by a second call, which is one more thing to reconcile.
          payment_capture: 1,
        }),
      })
      if (!response.ok) {
        throw new Error(`razorpay: create order failed (HTTP ${response.status})`)
      }
      const body = (await response.json()) as { id: string; amount: number; currency: string }
      return { providerOrderId: body.id, amountMinor: body.amount, currency: body.currency }
    },

    verifyWebhook(raw: string, headers: Headers): NormalisedEvent | null {
      const e = env()
      const signature = headers.get('x-razorpay-signature')
      if (!verifyWebhookSignature(raw, signature, e.webhookSecret)) return null

      // Only now. An unverified payload is never parsed.
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(raw) as Record<string, unknown>
      } catch {
        return null
      }

      const eventType = typeof parsed.event === 'string' ? parsed.event : ''
      const eventId = headers.get('x-razorpay-event-id') ?? ''
      if (!eventType || !eventId) return null

      const payload = (parsed.payload ?? {}) as Record<string, { entity?: Record<string, unknown> }>
      const payment = payload.payment?.entity as RzpPaymentEntity | undefined
      const refund = payload.refund?.entity as (RzpPaymentEntity & { payment_id?: string }) | undefined
      const dispute = payload.dispute?.entity as RzpDisputeEntity | undefined

      // A dispute names its own payment. Prefer that over the payment entity
      // that rides alongside it, so the two can never disagree.
      const providerPaymentId = dispute?.payment_id ?? payment?.id ?? refund?.payment_id ?? null
      const providerOrderId = payment?.order_id ?? null
      const amountMinor = typeof payment?.amount === 'number' ? payment.amount : null

      const { disposition, status, note } = dispositionForEvent(
        eventType,
        payment?.status,
        dispute?.status,
      )

      return {
        provider: 'razorpay',
        eventId,
        eventType,
        disposition,
        note,
        providerOrderId,
        providerPaymentId,
        status,
        amountMinor,
        redacted: {
          ...redact({ event: eventType, ...(payment ?? {}) }),
          // Dispute phase and status are operational facts with nothing
          // personal in them, and they are what a human needs when reading a
          // parked row.
          ...(dispute ? { dispute_status: dispute.status, dispute_phase: dispute.phase } : {}),
          body_sha256: sha256Hex(raw),
        },
      }
    },

    verifyCheckoutReturn(storedOrderId: string, ret: CheckoutReturn): boolean {
      const e = env()
      // `ret.claimedOrderId` is intentionally unused. Razorpay's own docs: "Do
      // not use the razorpay_order_id returned by Checkout."
      return verifyCheckoutSignature(storedOrderId, ret.providerPaymentId, ret.signature, e.keySecret)
    },

    async fetchPaymentStatus(providerPaymentId: string): Promise<PaymentSnapshot | null> {
      const e = env()
      const response = await fetch(`${API}/payments/${encodeURIComponent(providerPaymentId)}`, {
        headers: { authorization: authHeader(e) },
      })
      if (!response.ok) return null
      const body = (await response.json()) as RzpPaymentEntity
      return {
        providerPaymentId: body.id ?? providerPaymentId,
        providerOrderId: body.order_id ?? null,
        status: mapStatus(body.status),
        amountMinor: typeof body.amount === 'number' ? body.amount : null,
      }
    },

    /**
     * Every payment attempt against ONE of our orders.
     *
     * `GET /v1/orders/{id}/payments`, verified on razorpay.com/docs/api/orders
     * on 18 November 2026: returns `{ entity: 'collection', count, items }`.
     *
     * Deliberately order-scoped rather than account-wide. The obvious
     * alternative — listing all recent payments and looking for ones we do not
     * know about — walks the whole account, needs pagination, burns rate limit
     * on payments that were never ours, and still has to be matched back to an
     * order. Asking about orders we already know are unresolved is bounded by
     * our own data and answers the question directly.
     *
     * One order carries a handful of attempts at most, so `count=100` is far
     * beyond what any order can produce; if it ever truncated, the caller would
     * rather know than silently reconcile half an order.
     */
    async fetchOrderPayments(providerOrderId: string): Promise<PaymentSnapshot[]> {
      const e = env()
      const url = `${API}/orders/${encodeURIComponent(providerOrderId)}/payments?count=100`
      const response = await fetch(url, { headers: { authorization: authHeader(e) } })
      if (!response.ok) return []
      const body = (await response.json()) as { items?: RzpPaymentEntity[] }
      const items = body.items ?? []
      if (items.length >= 100) {
        console.warn(`razorpay: order ${providerOrderId} returned 100 payments; list may be truncated`)
      }
      // Only these four fields are read. The response also carries `email`,
      // `contact`, `vpa` and card details, and none of it is taken.
      return items.map((item) => ({
        providerPaymentId: item.id ?? '',
        providerOrderId: item.order_id ?? providerOrderId,
        status: mapStatus(item.status),
        amountMinor: typeof item.amount === 'number' ? item.amount : null,
      }))
    },

    async refund(providerPaymentId: string, amountMinor?: number) {
      const e = env()
      const response = await fetch(
        `${API}/payments/${encodeURIComponent(providerPaymentId)}/refund`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: authHeader(e) },
          body: JSON.stringify(amountMinor ? { amount: amountMinor } : {}),
        },
      )
      if (!response.ok) return { ok: false }
      const body = (await response.json()) as { id?: string }
      return { ok: true, id: body.id }
    },
  }
}
