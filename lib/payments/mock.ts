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

type Disposition = { disposition: 'fact' | 'acknowledge' | 'park'; status: PaymentStatus | null; note: string }

/** The same rules as the Razorpay adapter, including the dispute policy. */
function dispositionForEvent(eventType: string, raw: unknown, disputeStatus: unknown): Disposition {
  if (eventType === 'payment.captured') return { disposition: 'fact', status: 'captured', note: 'payment captured' }
  if (eventType === 'payment.failed') return { disposition: 'fact', status: 'failed', note: 'payment failed' }
  if (eventType.startsWith('refund.')) return { disposition: 'fact', status: 'refunded', note: 'refund issued' }

  if (eventType.startsWith('payment.dispute.')) {
    if (eventType === 'payment.dispute.lost' || disputeStatus === 'lost') {
      return { disposition: 'fact', status: 'charged_back', note: 'dispute lost' }
    }
    if (eventType === 'payment.dispute.won' || disputeStatus === 'won') {
      return { disposition: 'acknowledge', status: null, note: 'dispute won — entitlement unchanged' }
    }
    if (
      eventType === 'payment.dispute.created' ||
      eventType === 'payment.dispute.under_review' ||
      eventType === 'payment.dispute.action_required' ||
      disputeStatus === 'open' ||
      disputeStatus === 'under_review'
    ) {
      return { disposition: 'acknowledge', status: null, note: 'dispute open — no entitlement change' }
    }
    return { disposition: 'park', status: null, note: 'dispute outcome unclear' }
  }

  if (raw === 'captured') return { disposition: 'fact', status: 'captured', note: 'mapped from status' }
  return { disposition: 'park', status: null, note: 'unhandled event type' }
}

/**
 * A dispute webhook body, shaped like Razorpay's.
 *
 * Carries `payload.payment.entity` alongside `payload.dispute.entity`, exactly
 * as the real one does — which is precisely what made the old code revoke on a
 * dispute being opened. A fixture that left the payment entity out would hide
 * the bug rather than catch it.
 */
export function mockDisputeBody(input: {
  event: string
  orderId: string
  paymentId: string
  amountMinor: number
  disputeStatus?: string
  phase?: string
}): string {
  return JSON.stringify({
    event: input.event,
    payload: {
      payment: {
        entity: {
          id: input.paymentId,
          order_id: input.orderId,
          amount: input.amountMinor,
          status: 'captured',
          email: 'buyer@example.com',
          contact: '+919999999999',
        },
      },
      dispute: {
        entity: {
          id: 'disp_mock1',
          payment_id: input.paymentId,
          amount: input.amountMinor,
          status: input.disputeStatus ?? 'open',
          phase: input.phase ?? 'chargeback',
        },
      },
    },
  })
}

export type MockProvider = PaymentProvider & {
  /**
   * Put a payment on the provider's side WITHOUT delivering a webhook.
   *
   * This is how a test reproduces the failure that matters: the customer paid,
   * Razorpay captured it, the webhook never arrived and the customer never came
   * back. Nothing local knows, and only reconciliation can find it.
   */
  __setProviderPayment(providerOrderId: string, snapshot: PaymentSnapshot): void
  /** How many times the sweep asked about each order, for rate-limit tests. */
  __callCounts(): Record<string, number>
}

export function createMockProvider(): MockProvider {
  let counter = 0
  const orders = new Map<string, CreatedOrder>()
  const providerPayments = new Map<string, PaymentSnapshot[]>()
  const calls: Record<string, number> = {}

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

      const dispute = (payload.dispute?.entity ?? {}) as Record<string, unknown>
      const { disposition, status, note } = dispositionForEvent(eventType, entity.status, dispute.status)

      return {
        provider: 'razorpay',
        eventId,
        eventType,
        disposition,
        note,
        providerOrderId: typeof entity.order_id === 'string' ? entity.order_id : null,
        providerPaymentId:
          typeof dispute.payment_id === 'string'
            ? dispute.payment_id
            : typeof entity.id === 'string'
              ? entity.id
              : null,
        status,
        amountMinor: typeof entity.amount === 'number' ? entity.amount : null,
        redacted: {
          ...redact({ event: eventType, ...entity }),
          // Operational, not personal — and what a human needs when reading a
          // parked dispute row. Mirrors the Razorpay adapter exactly.
          ...(payload.dispute?.entity
            ? { dispute_status: dispute.status, dispute_phase: dispute.phase }
            : {}),
          body_sha256: sha256Hex(raw),
        },
      }
    },

    verifyCheckoutReturn(storedOrderId: string, ret: CheckoutReturn): boolean {
      return verifyCheckoutSignature(storedOrderId, ret.providerPaymentId, ret.signature, MOCK_KEY_SECRET)
    },

    async fetchPaymentStatus(providerPaymentId: string): Promise<PaymentSnapshot | null> {
      for (const list of providerPayments.values()) {
        const hit = list.find((p) => p.providerPaymentId === providerPaymentId)
        if (hit) return hit
      }
      return { providerPaymentId, providerOrderId: null, status: 'captured', amountMinor: null }
    },

    async fetchOrderPayments(providerOrderId: string): Promise<PaymentSnapshot[]> {
      calls[providerOrderId] = (calls[providerOrderId] ?? 0) + 1
      return providerPayments.get(providerOrderId) ?? []
    },

    async refund(providerPaymentId: string) {
      return { ok: true, id: `rfnd_mock_${providerPaymentId}` }
    },

    __setProviderPayment(providerOrderId, snapshot) {
      const list = providerPayments.get(providerOrderId) ?? []
      list.push(snapshot)
      providerPayments.set(providerOrderId, list)
    },

    __callCounts() {
      return { ...calls }
    },
  }
}
