/**
 * The provider adapter, through the same verification path production uses.
 *
 * The mock signs with the SAME two schemes as Razorpay rather than returning
 * true, so these exercise real HMAC verification, real normalisation and real
 * redaction. A stub that always verified would test nothing.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  createMockProvider,
  mockWebhookBody,
  signCheckoutReturn,
  signWebhook,
} from '../../lib/payments/mock.ts'

const provider = createMockProvider()

const headers = (raw, eventId = 'evt_1') =>
  new Headers({
    'x-razorpay-signature': signWebhook(raw),
    'x-razorpay-event-id': eventId,
  })

test('a correctly signed capture normalises to a captured fact', () => {
  const raw = mockWebhookBody({
    event: 'payment.captured',
    orderId: 'order_1',
    paymentId: 'pay_1',
    amountMinor: 59900,
  })
  const event = provider.verifyWebhook(raw, headers(raw))
  assert.ok(event, 'a valid delivery must verify')
  assert.equal(event.eventType, 'payment.captured')
  assert.equal(event.status, 'captured')
  assert.equal(event.providerOrderId, 'order_1')
  assert.equal(event.providerPaymentId, 'pay_1')
  assert.equal(event.amountMinor, 59900)
  assert.equal(event.eventId, 'evt_1')
})

test('a bad signature returns null and nothing is normalised', () => {
  const raw = mockWebhookBody({
    event: 'payment.captured',
    orderId: 'order_1',
    paymentId: 'pay_1',
    amountMinor: 59900,
  })
  const bad = new Headers({
    'x-razorpay-signature': 'deadbeef',
    'x-razorpay-event-id': 'evt_2',
  })
  assert.equal(provider.verifyWebhook(raw, bad), null)
})

test('a missing event id returns null — dedupe is impossible without it', () => {
  const raw = mockWebhookBody({
    event: 'payment.captured',
    orderId: 'o',
    paymentId: 'p',
    amountMinor: 59900,
  })
  const h = new Headers({ 'x-razorpay-signature': signWebhook(raw) })
  assert.equal(provider.verifyWebhook(raw, h), null)
})

test('a signed but malformed body returns null rather than throwing', () => {
  const raw = 'not json at all'
  assert.doesNotThrow(() => provider.verifyWebhook(raw, headers(raw)))
  assert.equal(provider.verifyWebhook(raw, headers(raw)), null)
})

test('NO PERSONAL DATA SURVIVES NORMALISATION', () => {
  // The mock payload deliberately carries email, phone, VPA and card details,
  // exactly as a real Razorpay payload does.
  const raw = mockWebhookBody({
    event: 'payment.captured',
    orderId: 'order_1',
    paymentId: 'pay_1',
    amountMinor: 59900,
  })
  assert.ok(raw.includes('buyer@example.com'), 'the fixture must contain personal data')

  const event = provider.verifyWebhook(raw, headers(raw))
  const stored = JSON.stringify(event.redacted)
  for (const needle of ['buyer@example.com', '919999999999', 'buyer@upi', '1111', 'HDFC']) {
    assert.ok(!stored.includes(needle), `"${needle}" reached what we store`)
  }
  assert.match(String(event.redacted.body_sha256), /^[0-9a-f]{64}$/)
})

test('event types map to the fact they assert', () => {
  const cases = [
    ['payment.captured', 'captured'],
    ['payment.failed', 'failed'],
    ['refund.processed', 'refunded'],
    ['payment.dispute.lost', 'charged_back'],
  ]
  for (const [eventType, expected] of cases) {
    const raw = mockWebhookBody({
      event: eventType,
      orderId: 'order_1',
      paymentId: 'pay_1',
      amountMinor: 59900,
    })
    const event = provider.verifyWebhook(raw, headers(raw, `evt_${eventType}`))
    assert.equal(event.status, expected, `${eventType} should assert ${expected}`)
  }
})

test('an unrecognised event type yields a null status, which parks it', () => {
  const raw = mockWebhookBody({
    event: 'subscription.charged',
    orderId: 'order_1',
    paymentId: 'pay_1',
    amountMinor: 59900,
    status: 'something',
  })
  const event = provider.verifyWebhook(raw, headers(raw, 'evt_unknown'))
  assert.ok(event, 'it still verifies — it is signed')
  assert.equal(event.status, null, 'but asserts no fact, so the handler parks it')
})

test('a checkout return verifies only against the stored order id', async () => {
  const order = await provider.createOrder({ amountMinor: 59900, currency: 'INR', receipt: 'r' })
  const paymentId = 'pay_checkout'
  const signature = signCheckoutReturn(order.providerOrderId, paymentId)

  assert.equal(
    provider.verifyCheckoutReturn(order.providerOrderId, { providerPaymentId: paymentId, signature }),
    true,
  )
  assert.equal(
    provider.verifyCheckoutReturn('order_FORGED', { providerPaymentId: paymentId, signature }),
    false,
  )
})

test('createOrder returns the amount it was asked for, not one from input', async () => {
  const order = await provider.createOrder({ amountMinor: 59900, currency: 'INR', receipt: 'r' })
  assert.equal(order.amountMinor, 59900)
  assert.equal(order.currency, 'INR')
  assert.match(order.providerOrderId, /^order_mock/)
})
