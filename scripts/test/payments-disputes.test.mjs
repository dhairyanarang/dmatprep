/**
 * Dispute handling.
 *
 * These exist because of a real defect. An earlier version mapped
 * `payment.dispute.created` straight to `charged_back`, and Razorpay's dispute
 * payloads carry `payload.payment.entity` alongside the dispute — so the code
 * found a payment id, applied a chargeback, and revoked a customer's access
 * the moment a dispute was OPENED, while we still held the money.
 *
 * A dispute opened is not a dispute lost. Event names and the entity shape were
 * verified against razorpay.com/docs/webhooks/payloads/disputes on
 * 18 November 2026.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  createMockProvider,
  mockDisputeBody,
  mockWebhookBody,
  signWebhook,
} from '../../lib/payments/mock.ts'

const provider = createMockProvider()
const headers = (raw, eventId) =>
  new Headers({ 'x-razorpay-signature': signWebhook(raw), 'x-razorpay-event-id': eventId })

const dispute = (event, disputeStatus, eventId = `evt_${event}_${disputeStatus}`) => {
  const raw = mockDisputeBody({
    event,
    orderId: 'order_1',
    paymentId: 'pay_1',
    amountMinor: 59900,
    disputeStatus,
  })
  return provider.verifyWebhook(raw, headers(raw, eventId))
}

/* ------------------------------------------------- the defect, pinned down */

test('A DISPUTE BEING OPENED DOES NOT REVOKE ANYTHING', () => {
  const event = dispute('payment.dispute.created', 'open')
  assert.ok(event, 'the event is signed and must verify')
  assert.equal(event.disposition, 'acknowledge', 'opening a dispute is acknowledged, not applied')
  assert.equal(event.status, null, 'it asserts NO payment fact')
  assert.notEqual(event.status, 'charged_back', 'the original defect: revoking on dispute opened')
})

test('the dispute fixture carries a payment entity, as the real one does', () => {
  // If the fixture omitted payload.payment.entity the old bug would not
  // reproduce, and this test would prove nothing.
  const raw = mockDisputeBody({
    event: 'payment.dispute.created',
    orderId: 'order_1',
    paymentId: 'pay_1',
    amountMinor: 59900,
  })
  const parsed = JSON.parse(raw)
  assert.ok(parsed.payload.payment?.entity?.id, 'fixture must include payload.payment.entity')
  assert.ok(parsed.payload.dispute?.entity?.payment_id, 'fixture must include payload.dispute.entity')
})

/* ----------------------------------------------------------- the outcomes */

test('a dispute LOST is the only dispute event that charges back', () => {
  const event = dispute('payment.dispute.lost', 'lost')
  assert.equal(event.disposition, 'fact')
  assert.equal(event.status, 'charged_back')
})

test('a dispute WON leaves the entitlement alone', () => {
  const event = dispute('payment.dispute.won', 'won')
  assert.equal(event.disposition, 'acknowledge')
  assert.equal(event.status, null)
})

test('under_review and action_required change nothing', () => {
  for (const name of ['payment.dispute.under_review', 'payment.dispute.action_required']) {
    const event = dispute(name, 'under_review')
    assert.equal(event.disposition, 'acknowledge', `${name} must not apply a fact`)
    assert.equal(event.status, null)
  }
})

test('a dispute closed with no decided outcome is parked for a human', () => {
  const event = dispute('payment.dispute.closed', 'closed')
  assert.equal(event.disposition, 'park')
  assert.equal(event.status, null)
})

test('the entity status decides when the event name is ambiguous', () => {
  // `closed` is only meaningful with a status beside it.
  assert.equal(dispute('payment.dispute.closed', 'lost').status, 'charged_back')
  assert.equal(dispute('payment.dispute.closed', 'won').disposition, 'acknowledge')
})

test('the dispute names the payment, and is preferred over the payment entity', () => {
  const raw = JSON.stringify({
    event: 'payment.dispute.lost',
    payload: {
      payment: { entity: { id: 'pay_WRONG', order_id: 'order_1', amount: 59900 } },
      dispute: { entity: { payment_id: 'pay_RIGHT', status: 'lost' } },
    },
  })
  const event = provider.verifyWebhook(raw, headers(raw, 'evt_pref'))
  assert.equal(event.providerPaymentId, 'pay_RIGHT')
})

/* --------------------------------------------------- malformed and hostile */

test('a dispute event with no dispute entity is still safe', () => {
  const raw = JSON.stringify({
    event: 'payment.dispute.created',
    payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1', amount: 59900 } } },
  })
  const event = provider.verifyWebhook(raw, headers(raw, 'evt_nodispute'))
  assert.equal(event.disposition, 'acknowledge', 'still must not revoke')
  assert.equal(event.status, null)
})

test('a malformed dispute payload does not throw', () => {
  const raw = JSON.stringify({
    event: 'payment.dispute.lost',
    payload: { dispute: 'not-an-object' },
  })
  assert.doesNotThrow(() => provider.verifyWebhook(raw, headers(raw, 'evt_malformed')))
})

test('an unsigned dispute event is rejected outright', () => {
  const raw = mockDisputeBody({
    event: 'payment.dispute.lost',
    orderId: 'order_1',
    paymentId: 'pay_1',
    amountMinor: 59900,
    disputeStatus: 'lost',
  })
  const bad = new Headers({ 'x-razorpay-signature': 'nope', 'x-razorpay-event-id': 'evt_x' })
  assert.equal(provider.verifyWebhook(raw, bad), null)
})

test('no personal data survives a dispute event', () => {
  const raw = mockDisputeBody({
    event: 'payment.dispute.created',
    orderId: 'order_1',
    paymentId: 'pay_1',
    amountMinor: 59900,
  })
  assert.ok(raw.includes('buyer@example.com'), 'fixture must contain personal data')
  const event = provider.verifyWebhook(raw, headers(raw, 'evt_personal'))
  const stored = JSON.stringify(event.redacted)
  assert.ok(!stored.includes('buyer@example.com'))
  assert.ok(!stored.includes('919999999999'))
  // Operational fields that carry nothing personal are kept, because a human
  // reading a parked row needs them.
  assert.equal(event.redacted.dispute_status, 'open')
  assert.equal(event.redacted.dispute_phase, 'chargeback')
})

/* ------------------------------------------ duplicates and arrival order */

test('the same dispute event normalises identically every time', () => {
  // Duplicate delivery is handled by the claim, but normalisation must be
  // deterministic or the claim would be comparing different things.
  const a = dispute('payment.dispute.lost', 'lost', 'evt_dup')
  const b = dispute('payment.dispute.lost', 'lost', 'evt_dup')
  assert.deepEqual(a, b)
})

test('OUT OF ORDER: won arriving before lost does not matter', () => {
  // Disposition is computed per event from its own contents, never from what
  // arrived before it. `lost` asserts charged_back whenever it lands, and the
  // monotonic payment status in the database decides the rest.
  const won = dispute('payment.dispute.won', 'won', 'evt_o1')
  const lost = dispute('payment.dispute.lost', 'lost', 'evt_o2')
  assert.equal(won.status, null)
  assert.equal(lost.status, 'charged_back')
})

test('a capture arriving after a dispute is still just a capture', () => {
  const raw = mockWebhookBody({
    event: 'payment.captured',
    orderId: 'order_1',
    paymentId: 'pay_1',
    amountMinor: 59900,
  })
  const event = provider.verifyWebhook(raw, headers(raw, 'evt_late_capture'))
  assert.equal(event.status, 'captured')
  // The database's monotonic trigger, not the adapter, refuses to move a
  // charged-back payment back to captured.
})
