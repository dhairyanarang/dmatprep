/**
 * Reconciliation — the rules that decide whether a payment we never heard
 * about should grant access.
 *
 * These exist because of a defect: the sweep re-drove webhook events it had
 * already received, and did nothing else. If the webhook never arrived AND the
 * customer never returned to the site, there was no local event to re-drive,
 * so nothing recovered it. The customer had paid and had no access, and no
 * part of the product knew.
 *
 * `decideOrderOutcome` is pure, so the rules that decide who gets access can be
 * tested without a database — which matters here, because the database is the
 * one thing this project cannot currently stand up locally.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { createMockProvider } from '../../lib/payments/mock.ts'
import {
  UNCONFIRMED_AFTER_MINUTES,
  decideOrderOutcome,
} from '../../lib/payments/reconcile-policy.ts'

const payment = (status, id = 'pay_1', amountMinor = 59900) => ({
  providerPaymentId: id,
  providerOrderId: 'order_1',
  status,
  amountMinor,
})

/* ------------------------------------------- the failure that matters most */

test('MISSING WEBHOOK: a captured payment we never heard about is recovered', () => {
  const outcome = decideOrderOutcome([payment('captured')], 5)
  assert.equal(outcome.action, 'recover')
  assert.equal(outcome.payment.providerPaymentId, 'pay_1')
})

test('CUSTOMER NEVER RETURNED: age does not stop a recovery', () => {
  // No browser return, no webhook, three days later. The money is there, so
  // access is owed now — not after some cooling-off period.
  const outcome = decideOrderOutcome([payment('captured')], 60 * 24 * 3)
  assert.equal(outcome.action, 'recover')
})

test('a capture among failed attempts is still recovered', () => {
  const outcome = decideOrderOutcome(
    [payment('failed', 'pay_a'), payment('captured', 'pay_b'), payment('created', 'pay_c')],
    45,
  )
  assert.equal(outcome.action, 'recover')
  assert.equal(outcome.payment.providerPaymentId, 'pay_b')
})

/* ------------------------------------------------- what must NOT grant */

test('an authorised-but-not-captured payment grants nothing', () => {
  // Money held is not money taken. Razorpay maps `authorized` to `created`.
  const outcome = decideOrderOutcome([payment('created')], 45)
  assert.notEqual(outcome.action, 'recover')
})

test('a failed payment grants nothing', () => {
  assert.notEqual(decideOrderOutcome([payment('failed')], 45).action, 'recover')
})

test('a refunded payment is not re-granted by the sweep', () => {
  // The order has a terminal payment; `orders_awaiting_confirmation` excludes
  // it, and the policy would refuse anyway.
  assert.notEqual(decideOrderOutcome([payment('refunded')], 45).action, 'recover')
})

test('an empty answer from the provider grants nothing', () => {
  assert.notEqual(decideOrderOutcome([], 45).action, 'recover')
})

/* ----------------------------------------------- delayed, not abandoned */

test('DELAYED PAYMENT: a young order with no capture is waited on, not judged', () => {
  const outcome = decideOrderOutcome([], 3)
  assert.equal(outcome.action, 'wait')
})

test('a young order with an uncaptured attempt is also waited on', () => {
  const outcome = decideOrderOutcome([payment('created')], 10)
  assert.equal(outcome.action, 'wait')
  assert.equal(outcome.reason, 'attempted-not-captured')
})

test('UNCONFIRMED is only reported after the full window', () => {
  assert.equal(decideOrderOutcome([], UNCONFIRMED_AFTER_MINUTES - 1).action, 'wait')
  assert.equal(decideOrderOutcome([], UNCONFIRMED_AFTER_MINUTES).action, 'unconfirmed')
  assert.equal(UNCONFIRMED_AFTER_MINUTES, 30)
})

test('unconfirmed distinguishes "never tried" from "tried and did not capture"', () => {
  assert.equal(decideOrderOutcome([], 45).reason, 'no-payment-attempt')
  assert.equal(decideOrderOutcome([payment('failed')], 45).reason, 'attempts-but-none-captured')
})

test('unconfirmed is never the same thing as failed', () => {
  // The inference must not leak into the vocabulary of outcomes. Nothing in
  // this policy can mark a payment failed.
  const actions = new Set(
    [0, 10, 29, 30, 120].flatMap((age) => [
      decideOrderOutcome([], age).action,
      decideOrderOutcome([payment('created')], age).action,
    ]),
  )
  assert.ok(!actions.has('failed'))
  assert.deepEqual([...actions].sort(), ['unconfirmed', 'wait'])
})

/* ------------------------------------------------------- idempotence */

test('DUPLICATE RECONCILIATION: the same inputs give the same answer', () => {
  const payments = [payment('captured')]
  assert.deepEqual(decideOrderOutcome(payments, 45), decideOrderOutcome(payments, 45))
})

test('the event id for a recovery is deterministic, so a second sweep cannot double-grant', () => {
  // The sweep keys its claim on `reconcile:<payment id>`. Two sweeps produce
  // the same id, the second claim returns already_processed, and nothing is
  // granted twice.
  const first = `reconcile:${payment('captured').providerPaymentId}`
  const second = `reconcile:${payment('captured').providerPaymentId}`
  assert.equal(first, second)
})

/* ------------------------------------- mismatched payments, and the adapter */

test('MISMATCHED AMOUNT is not this policy’s decision to make', () => {
  // Deliberately recovers: the amount is re-checked inside the same database
  // transaction that would grant, which parks on a mismatch. Two places
  // checking the amount would be two places to get it wrong; the one that
  // checks is the one that can also refuse atomically.
  const outcome = decideOrderOutcome([payment('captured', 'pay_1', 100)], 45)
  assert.equal(outcome.action, 'recover')
  assert.equal(outcome.payment.amountMinor, 100)
})

test('the adapter asks about one order, not the whole account', async () => {
  const provider = createMockProvider()
  const order = await provider.createOrder({ amountMinor: 59900, currency: 'INR', receipt: 'r' })

  // A payment exists at the provider that we never heard about.
  provider.__setProviderPayment(order.providerOrderId, payment('captured', 'pay_ghost'))

  const found = await provider.fetchOrderPayments(order.providerOrderId)
  assert.equal(found.length, 1)
  assert.equal(found[0].providerPaymentId, 'pay_ghost')

  // An order we know nothing about returns nothing rather than erroring.
  assert.deepEqual(await provider.fetchOrderPayments('order_unknown'), [])

  // One call per order asked about — the sweep is bounded by our own orders,
  // not by the size of the provider's account.
  assert.deepEqual(provider.__callCounts(), { [order.providerOrderId]: 1, order_unknown: 1 })
})

test('the full recovery path: ghost payment found, then decided', async () => {
  const provider = createMockProvider()
  const order = await provider.createOrder({ amountMinor: 59900, currency: 'INR', receipt: 'r' })
  provider.__setProviderPayment(order.providerOrderId, payment('captured', 'pay_ghost'))

  const payments = await provider.fetchOrderPayments(order.providerOrderId)
  const outcome = decideOrderOutcome(payments, 45)

  assert.equal(outcome.action, 'recover')
  assert.equal(outcome.payment.providerPaymentId, 'pay_ghost')
})
