import type { PaymentProvider, CheckoutReturn, CreatedOrder, PaymentSnapshot } from './provider.ts'
import { redact } from './redact.ts'
import { hmacHex, sha256Hex, verifyCheckoutSignature, verifyWebhookSignature } from './signature.ts'
import type { NormalisedEvent, PaymentStatus } from './types.ts'

/**
 * A provider that does not exist, for tests and for local development.
 *
 * It signs and verifies with the SAME two schemes as Razorpay — the webhook
 * over the raw body, the checkout return over `order_id|payment_id` — so a test
 * exercising this exercises the real verification path rather than a stub that
 * always returns true. `signWebhook` and `signCheckoutReturn` are the halves
 * Razorpay would normally perform, exposed so a test can forge a valid delivery.
 *
 * Refused in production builds. The purchase flow must never be able to grant
 * an entitlement from a provider that takes no money.
 */

const MOCK_WEBHOOK_SECRET = 'mock-webhook-secret'
const MOCK_KEY_SECRET = 'mock-key-secret'

export function mockSecrets() {
  return { webhookSecret: MOCK_WEBHOOK_SECRET, keySecret: MOCK_KEY_SECRET }
}

/** What Razorpay would do: HMAC over the exact bytes it is about to send. */
export function signWebhook(raw: string, secret = MOCK_WEBHOOK_SECRET): string {
  return hmacHex(raw, secret)
}

/** What Razorpay would hand the browser after a successful payment. */
export function signCheckoutReturn(
  orderId: string,
  paymentId: string,
  secret = MOCK_KEY_SECRET,
): string {
  return hmacHex(`${orderId}|${paymentId}`, secret)
}

export function mockWebhookBody(input: {
  event: string
  orderId: string
  paymentId: string
  amountMinor: number
  status?: string
}): string {
  return JSON.stringify({
    event: input.event,
    payload: {
      payment: {
        entity: {
          id: input.paymentId,
          order_id: input.orderId,
          amount: input.amountMinor,
          status: input.status ?? 'captured',
          // Present on purpose: a test asserts these never reach the database.
          email: 'buyer@example.com',
          contact: '+919999999999',
          vpa: 'buyer@upi',
          card: { last4: '1111', network: 'Visa', issuer: 'HDFC' },
        },
      },
    },
  })
}

function statusForEvent(eventType: string, raw: unknown): PaymentStatus | null {
  if (eventType === 'payment.captured') return 'captured'
  if (eventType === 'payment.failed') return 'failed'
  if (eventType.startsWith('refund.')) return 'refunded'
  if (eventType.startsWith('payment.dispute.')) return 'charged_back'
  return raw === 'captured' ? 'captured' : null
}

export function createMockProvider(): PaymentProvider {
  let counter = 0
  const orders = new Map<string, CreatedOrder>()

  return {
    id: 'razorpay',

    async createOrder({ amountMinor, currency }): Promise<CreatedOrder> {
      counter += 1
      const order = { providerOrderId: `order_mock${counter}`, amountMinor, currency }
      orders.set(order.providerOrderId, order)
      return order
    },

    verifyWebhook(raw, headers): NormalisedEvent | null {
      if (!verifyWebhookSignature(raw, headers.get('x-razorpay-signature'), MOCK_WEBHOOK_SECRET)) {
        return null
      }
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
      const entity = payload.payment?.entity ?? {}

      return {
        provider: 'razorpay',
        eventId,
        eventType,
        providerOrderId: typeof entity.order_id === 'string' ? entity.order_id : null,
        providerPaymentId: typeof entity.id === 'string' ? entity.id : null,
        status: statusForEvent(eventType, entity.status),
        amountMinor: typeof entity.amount === 'number' ? entity.amount : null,
        redacted: { ...redact({ event: eventType, ...entity }), body_sha256: sha256Hex(raw) },
      }
    },

    verifyCheckoutReturn(storedOrderId: string, ret: CheckoutReturn): boolean {
      return verifyCheckoutSignature(storedOrderId, ret.providerPaymentId, ret.signature, MOCK_KEY_SECRET)
    },

    async fetchPaymentStatus(providerPaymentId: string): Promise<PaymentSnapshot | null> {
      return { providerPaymentId, providerOrderId: null, status: 'captured', amountMinor: null }
    },

    async listRecentPayments(): Promise<PaymentSnapshot[]> {
      return []
    },

    async refund(providerPaymentId: string) {
      return { ok: true, id: `rfnd_mock_${providerPaymentId}` }
    },
  }
}
