/**
 * The entitlement projection.
 *
 * Entitlement is DERIVED from the payment facts rather than mutated by each
 * event, and that one decision is what makes duplicate, concurrent and
 * out-of-order delivery incapable of producing a wrong result. These tests are
 * the specification of the precedence order, case by case.
 *
 * The honest limitation, recorded here rather than in a report nobody reads:
 * this exercises `projectEntitlement` in TypeScript. Production runs
 * `recompute_entitlement` in plpgsql, and a mirror is not a proof. The SQL
 * needs its own integration tests against a real Postgres, which needs a
 * container runtime that is not installed. Until then the SQL is unverified.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { projectEntitlement } from '../../lib/payments/entitlement.ts'
import { advances, grantsAccess, rank } from '../../lib/payments/types.ts'

const project = (paymentStatuses, latestManualAction = null) =>
  projectEntitlement({ paymentStatuses, latestManualAction })

/* ------------------------------------------------------ the ordinary cases */

test('no payment at all grants nothing', () => {
  assert.deepEqual(project([]), { status: 'revoked', reason: 'no-qualifying-payment' })
  assert.equal(grantsAccess({ status: 'revoked', expiresAt: null }), false)
})

test('a captured payment grants access', () => {
  assert.deepEqual(project(['captured']), { status: 'active', reason: 'captured-payment' })
  assert.equal(grantsAccess({ status: 'active', expiresAt: null }), true)
})

test('a failed payment grants nothing', () => {
  assert.deepEqual(project(['failed']), { status: 'revoked', reason: 'no-qualifying-payment' })
})

test('a created-but-not-captured payment grants nothing', () => {
  // `authorized` maps to `created`: money held is not money taken, and
  // granting on an authorisation would give access before it is ours.
  assert.deepEqual(project(['created']), { status: 'revoked', reason: 'no-qualifying-payment' })
})

/* -------------------------------------------- the cases that actually bite */

test('a refund revokes access and says why', () => {
  assert.deepEqual(project(['refunded']), { status: 'refunded', reason: 'refunded' })
  assert.equal(grantsAccess({ status: 'refunded', expiresAt: null }), false)
})

test('REFUND BEFORE CAPTURE: a late capture cannot resurrect access', () => {
  // The ordering case Razorpay explicitly does not protect against. The
  // monotonic status trigger drops the late `captured`, so by the time the
  // projection runs the payment is still `refunded` and the only fact present
  // is a refund.
  assert.equal(advances('refunded', 'captured'), false, 'captured must not advance over refunded')
  assert.deepEqual(project(['refunded']), { status: 'refunded', reason: 'refunded' })
})

test('a duplicate refund changes nothing', () => {
  assert.deepEqual(project(['refunded', 'refunded']), project(['refunded']))
})

test('a chargeback revokes', () => {
  assert.deepEqual(project(['charged_back']), { status: 'revoked', reason: 'charged-back' })
})

test('a chargeback after a refund still revokes', () => {
  assert.equal(advances('refunded', 'charged_back'), true)
  assert.deepEqual(project(['charged_back']), { status: 'revoked', reason: 'charged-back' })
})

test('TWO PAYMENTS ON ONE ORDER: a failed attempt then a capture grants access', () => {
  assert.deepEqual(project(['failed', 'captured']), {
    status: 'active',
    reason: 'captured-payment',
  })
})

test('TWO ORDERS: refunding one purchase does not revoke the other', () => {
  // Bought, refunded, bought again. One captured payment survives, so access
  // stands. Incremental mutation would have revoked on the refund event.
  assert.deepEqual(project(['refunded', 'captured']), {
    status: 'active',
    reason: 'captured-payment',
  })
})

test('order of arrival never changes the result', () => {
  const facts = ['failed', 'captured', 'refunded']
  const forwards = project(facts)
  const backwards = project([...facts].reverse())
  const shuffled = project(['refunded', 'failed', 'captured'])
  assert.deepEqual(forwards, backwards)
  assert.deepEqual(forwards, shuffled)
})

test('running the projection twice gives the same answer', () => {
  assert.deepEqual(project(['captured']), project(['captured']))
  assert.deepEqual(project(['captured', 'captured']), project(['captured']))
})

/* ------------------------------------------------------------ manual grants */

test('a manual grant grants access with no payment', () => {
  // Grandfathering: an existing user keeps what they had.
  assert.deepEqual(project([], 'grant'), { status: 'active', reason: 'manual-grant' })
})

test('a manual revoke beats a captured payment', () => {
  // Fraud. The operator override has to win or it is not an override.
  assert.deepEqual(project(['captured'], 'revoke'), { status: 'revoked', reason: 'manual-revoke' })
})

test('a goodwill grant after a chargeback restores access', () => {
  assert.deepEqual(project(['charged_back'], 'grant'), { status: 'active', reason: 'manual-grant' })
})

test('a captured payment is reported as such even with a manual grant present', () => {
  // The reason matters for audit: the payment is why they have access.
  assert.deepEqual(project(['captured'], 'grant'), {
    status: 'active',
    reason: 'captured-payment',
  })
})

/* ---------------------------------------------------------------- the rule */

test('an expired entitlement grants nothing even when active', () => {
  assert.equal(
    grantsAccess({ status: 'active', expiresAt: new Date(Date.now() - 1000).toISOString() }),
    false,
  )
  assert.equal(
    grantsAccess({ status: 'active', expiresAt: new Date(Date.now() + 60_000).toISOString() }),
    true,
  )
})

test('a null entitlement grants nothing', () => {
  assert.equal(grantsAccess(null), false)
})

test('the status lattice only moves one way', () => {
  const order = ['created', 'failed', 'captured', 'refunded', 'charged_back']
  for (let i = 0; i < order.length - 1; i += 1) {
    assert.ok(rank(order[i]) < rank(order[i + 1]), `${order[i]} must rank below ${order[i + 1]}`)
    assert.equal(advances(order[i], order[i + 1]), true)
    assert.equal(advances(order[i + 1], order[i]), false)
  }
})
