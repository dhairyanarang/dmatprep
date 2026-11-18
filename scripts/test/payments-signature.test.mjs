/**
 * Signature verification, for both of Razorpay's schemes.
 *
 * There are two, with different keys and different messages, and confusing them
 * produces verification that is wrong in a way that looks right:
 *
 *   webhook          HMAC-SHA256( raw request body )     keyed on the WEBHOOK SECRET
 *   checkout return  HMAC-SHA256( order_id + "|" + pid ) keyed on the API KEY SECRET
 *
 * Two of these tests exist because of documented traps rather than imagined
 * ones. The first is that Razorpay's own Node sample re-serialises a parsed body
 * with `JSON.stringify`, on the same page that warns not to parse it. The
 * second is that Razorpay's documentation says "Do not use the
 * razorpay_order_id returned by Checkout" — so a tampered response must not be
 * able to verify against itself.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  hmacHex,
  sha256Hex,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from '../../lib/payments/signature.ts'

const WEBHOOK_SECRET = 'webhook-secret'
const KEY_SECRET = 'api-key-secret'

/* ---------------------------------------------------------------- webhooks */

test('a webhook signed over the raw body verifies', () => {
  const raw = '{"event":"payment.captured","payload":{}}'
  assert.equal(verifyWebhookSignature(raw, hmacHex(raw, WEBHOOK_SECRET), WEBHOOK_SECRET), true)
})

test('THE TRAP: a signature over JSON.stringify(parsed) does not verify', () => {
  // Whitespace after the colon is what Razorpay signed. Re-serialising loses
  // it, so the bytes differ and the HMAC differs. This is exactly what
  // Razorpay's own Node sample does, and it fails intermittently in
  // production — only on payloads that do not happen to round-trip.
  const raw = '{"event":"payment.captured", "payload":{"a":1}}'
  const reserialised = JSON.stringify(JSON.parse(raw))
  assert.notEqual(reserialised, raw, 'the fixture must not round-trip, or it proves nothing')

  const realSignature = hmacHex(raw, WEBHOOK_SECRET)
  assert.equal(
    verifyWebhookSignature(reserialised, realSignature, WEBHOOK_SECRET),
    false,
    'verifying a re-serialised body must fail — if this passes, the raw-body rule is not enforced',
  )
  assert.equal(verifyWebhookSignature(raw, realSignature, WEBHOOK_SECRET), true)
})

test('a tampered body does not verify', () => {
  const raw = '{"event":"payment.captured","payload":{"amount":59900}}'
  const signature = hmacHex(raw, WEBHOOK_SECRET)
  const tampered = raw.replace('59900', '100')
  assert.equal(verifyWebhookSignature(tampered, signature, WEBHOOK_SECRET), false)
})

test('the wrong secret does not verify', () => {
  const raw = '{"event":"payment.captured"}'
  assert.equal(verifyWebhookSignature(raw, hmacHex(raw, 'other'), WEBHOOK_SECRET), false)
})

test('a missing signature header or secret fails closed', () => {
  const raw = '{"event":"payment.captured"}'
  assert.equal(verifyWebhookSignature(raw, null, WEBHOOK_SECRET), false)
  assert.equal(verifyWebhookSignature(raw, hmacHex(raw, ''), ''), false)
})

test('a signature of the wrong length is rejected rather than throwing', () => {
  // timingSafeEqual throws on a length mismatch, so the guard must be explicit.
  const raw = '{"event":"payment.captured"}'
  assert.doesNotThrow(() => verifyWebhookSignature(raw, 'abc', WEBHOOK_SECRET))
  assert.equal(verifyWebhookSignature(raw, 'abc', WEBHOOK_SECRET), false)
})

/* -------------------------------------------------------- checkout returns */

test('a checkout return signed over storedOrderId|paymentId verifies', () => {
  const stored = 'order_ABC'
  const payment = 'pay_XYZ'
  const signature = hmacHex(`${stored}|${payment}`, KEY_SECRET)
  assert.equal(verifyCheckoutSignature(stored, payment, signature, KEY_SECRET), true)
})

test('A TAMPERED CHECKOUT RETURN CANNOT VERIFY AGAINST ITSELF', () => {
  // The attack this prevents: the browser sends back an order id of its own
  // choosing, along with a signature computed over that id. If the server signs
  // what the client sent, the two agree and a forged payment is accepted.
  // Razorpay's docs: "Do not use the razorpay_order_id returned by Checkout."
  const storedOrderId = 'order_REAL'
  const attackerOrderId = 'order_FORGED'
  const payment = 'pay_XYZ'

  const selfConsistent = hmacHex(`${attackerOrderId}|${payment}`, KEY_SECRET)

  assert.equal(
    verifyCheckoutSignature(attackerOrderId, payment, selfConsistent, KEY_SECRET),
    true,
    'sanity: the forged pair is internally consistent, which is what makes it dangerous',
  )
  assert.equal(
    verifyCheckoutSignature(storedOrderId, payment, selfConsistent, KEY_SECRET),
    false,
    'signing against the STORED order id must reject it',
  )
})

test('the two schemes are not interchangeable', () => {
  // A webhook signature must not verify as a checkout return, or vice versa:
  // different key, different message. If either direction passed, the adapter
  // would be using one secret for both.
  const stored = 'order_ABC'
  const payment = 'pay_XYZ'
  const message = `${stored}|${payment}`

  const withWebhookSecret = hmacHex(message, WEBHOOK_SECRET)
  assert.equal(verifyCheckoutSignature(stored, payment, withWebhookSecret, KEY_SECRET), false)

  const raw = '{"event":"payment.captured"}'
  const withKeySecret = hmacHex(raw, KEY_SECRET)
  assert.equal(verifyWebhookSignature(raw, withKeySecret, WEBHOOK_SECRET), false)
})

test('the body hash is stable and is not the body', () => {
  const raw = '{"event":"payment.captured"}'
  assert.equal(sha256Hex(raw), sha256Hex(raw))
  assert.match(sha256Hex(raw), /^[0-9a-f]{64}$/)
  assert.ok(!sha256Hex(raw).includes('payment'))
})
