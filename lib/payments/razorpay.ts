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

/** Razorpay event names → the fact the event asserts. */
function statusForEvent(eventType: string, payloadStatus: unknown): PaymentStatus | null {
  if (eventType === 'payment.captured') return 'captured'
  if (eventType === 'payment.failed') return 'failed'
  if (eventType === 'refund.processed' || eventType === 'refund.created') return 'refunded'
  if (eventType === 'payment.dispute.created' || eventType === 'payment.dispute.lost') {
    return 'charged_back'
  }
  return mapStatus(payloadStatus)
}

type RzpPaymentEntity = {
  id?: string
  order_id?: string
  amount?: number
  status?: string
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

      const payload = (parsed.payload ?? {}) as Record<string, { entity?: RzpPaymentEntity }>
      const payment = payload.payment?.entity
      const refund = payload.refund?.entity as (RzpPaymentEntity & { payment_id?: string }) | undefined

      const providerPaymentId = payment?.id ?? refund?.payment_id ?? null
      const providerOrderId = payment?.order_id ?? null
      const amountMinor = typeof payment?.amount === 'number' ? payment.amount : null

      return {
        provider: 'razorpay',
        eventId,
        eventType,
        providerOrderId,
        providerPaymentId,
        status: statusForEvent(eventType, payment?.status),
        amountMinor,
        redacted: {
          ...redact({ event: eventType, ...(payment ?? {}) }),
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

    async listRecentPayments(sinceEpochSeconds: number): Promise<PaymentSnapshot[]> {
      const e = env()
      const url = `${API}/payments?from=${sinceEpochSeconds}&count=100`
      const response = await fetch(url, { headers: { authorization: authHeader(e) } })
      if (!response.ok) return []
      const body = (await response.json()) as { items?: RzpPaymentEntity[] }
      return (body.items ?? []).map((item) => ({
        providerPaymentId: item.id ?? '',
        providerOrderId: item.order_id ?? null,
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
