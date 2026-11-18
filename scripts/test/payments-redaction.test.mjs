/**
 * What we keep from a provider payload, and what we must never keep.
 *
 * A Razorpay payment payload carries the buyer's phone, email, card last four,
 * card network, card issuer and UPI VPA. None of it is useful to us and all of
 * it is personal data under the DPDP Act. An earlier design stored the raw
 * payload indefinitely; this is the allowlist that replaced it, and these tests
 * are what stop it quietly becoming a blocklist again.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { ALLOWED_KEYS, redact } from '../../lib/payments/redact.ts'

const PERSONAL = ['email', 'contact', 'phone', 'vpa', 'card', 'last4', 'name', 'notes', 'bank']

test('the allowlist contains nothing personal', () => {
  for (const key of PERSONAL) {
    assert.ok(!ALLOWED_KEYS.includes(key), `"${key}" must not be on the allowlist`)
  }
})

test('personal fields are dropped from a realistic payload', () => {
  const out = redact({
    id: 'pay_123',
    order_id: 'order_123',
    amount: 59900,
    currency: 'INR',
    status: 'captured',
    method: 'upi',
    email: 'buyer@example.com',
    contact: '+919999999999',
    vpa: 'buyer@upi',
    card: { last4: '1111', network: 'Visa', issuer: 'HDFC' },
    notes: { internal: 'anything' },
  })

  assert.equal(out.order_id, 'order_123')
  assert.equal(out.amount, 59900)
  assert.equal(out.status, 'captured')
  assert.equal(out.method, 'upi')

  const serialised = JSON.stringify(out)
  for (const needle of ['buyer@example.com', '919999999999', 'buyer@upi', '1111', 'HDFC', 'Visa']) {
    assert.ok(!serialised.includes(needle), `redacted payload still contains "${needle}"`)
  }
})

test('a field the provider adds later is dropped, not kept', () => {
  // The whole reason this is an allowlist. A blocklist is out of date the
  // moment Razorpay adds a field, and the field it adds may be personal.
  const out = redact({ order_id: 'order_1', some_new_personal_field: 'aadhaar-number' })
  assert.deepEqual(Object.keys(out), ['order_id'])
})

test('nested objects are never kept, even under an allowlisted key', () => {
  const out = redact({ status: { nested: 'object' }, amount: 100 })
  assert.equal(out.status, undefined)
  assert.equal(out.amount, 100)
})

test('rubbish input returns an empty object rather than throwing', () => {
  for (const input of [null, undefined, 'string', 42, [], true]) {
    assert.doesNotThrow(() => redact(input))
    assert.equal(typeof redact(input), 'object')
  }
})
