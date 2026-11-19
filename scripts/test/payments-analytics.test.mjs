/**
 * What may and may not reach analytics.
 *
 * Analytics is the easiest place in a product to leak personal data by
 * accident, because the call site that adds `email` looks helpful. The guard
 * is an allowlist rather than a blocklist: a blocklist has to be updated every
 * time someone adds a field, and the field they add is the one that matters.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ALLOWED_PROPERTY_KEYS, EVENTS, safeProperties } from '../../lib/analytics/events.ts'

const root = fileURLToPath(new URL('../../', import.meta.url))

test('all nine funnel events are defined with stable names', () => {
  assert.deepEqual(Object.values(EVENTS).sort(), [
    'checkout_created',
    'checkout_opened',
    'payment_failed',
    'payment_pending',
    'payment_succeeded',
    'premium_buy_clicked',
    'premium_unlocked',
    'premium_viewed',
    'support_clicked',
  ])
})

test('the allowlist contains nothing personal and no credential', () => {
  for (const banned of [
    'email',
    'name',
    'contact',
    'phone',
    'vpa',
    'card',
    'last4',
    'user_id',
    'session_id',
    'signature',
    'secret',
    'key',
    'token',
    'payment_id',
  ]) {
    assert.ok(!ALLOWED_PROPERTY_KEYS.includes(banned), `"${banned}" must not be sendable`)
  }
})

test('personal fields handed to an event are dropped, not sent', () => {
  const out = safeProperties({
    order_ref: 'order_1',
    amount_minor: 59900,
    // Everything below is not on the allowlist and must vanish.
    email: 'buyer@example.com',
    user_id: 'c0ffee',
    vpa: 'buyer@upi',
    signature: 'deadbeef',
  })
  assert.deepEqual(out, { order_ref: 'order_1', amount_minor: 59900 })
  const serialised = JSON.stringify(out)
  for (const needle of ['buyer@example.com', 'c0ffee', 'buyer@upi', 'deadbeef']) {
    assert.ok(!serialised.includes(needle))
  }
})

test('only value types the analytics API accepts get through', () => {
  const out = safeProperties({
    order_ref: 'order_1',
    // Objects and arrays are rejected: they are how a whole payload sneaks in.
    status: { nested: 'object' },
    reason: ['a', 'b'],
    amount_minor: 100,
    currency: null,
  })
  assert.deepEqual(out, { order_ref: 'order_1', amount_minor: 100, currency: null })
})

test('undefined is omitted rather than sent as a key', () => {
  assert.deepEqual(safeProperties({ order_ref: undefined, amount_minor: 1 }), { amount_minor: 1 })
  assert.deepEqual(safeProperties(), {})
  assert.deepEqual(safeProperties({}), {})
})

/* ------------------------------------------- where events are emitted from */

function sourceFiles(dir = root, found = []) {
  const SKIP = new Set(['node_modules', '.next', '.git', 'out', 'coverage', '.clarity'])
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) sourceFiles(full, found)
    else if (/\.(ts|tsx)$/.test(name)) found.push(relative(root, full))
  }
  return found
}

const files = sourceFiles().map((path) => ({ path, text: readFileSync(join(root, path), 'utf8') }))

test('the money events are emitted from the server only', () => {
  // A browser redirect is not proof of payment, so nothing the client says may
  // move the funnel past `checkout_opened`.
  const serverOnly = ['paymentSucceeded', 'premiumUnlocked', 'checkoutCreated']
  const clientFiles = files.filter((f) => /^\s*['"]use client['"]/m.test(f.text))
  for (const event of serverOnly) {
    const offenders = clientFiles.filter((f) => f.text.includes(`EVENTS.${event}`)).map((f) => f.path)
    assert.deepEqual(offenders, [], `EVENTS.${event} is emitted from a client component: ${offenders}`)
  }
})

test('nothing imports the analytics server module into a client component', () => {
  const offenders = files
    .filter((f) => /^\s*['"]use client['"]/m.test(f.text))
    .filter((f) => /lib\/analytics\/server/.test(f.text))
    .map((f) => f.path)
  assert.deepEqual(offenders, [])
})

test('no call site builds properties outside the allowlist helper', () => {
  // Both wrappers run `safeProperties`, so a raw `track(` elsewhere would
  // bypass the guard entirely.
  const offenders = files
    .filter((f) => !f.path.startsWith('lib/analytics/'))
    .filter((f) => /from '@vercel\/analytics/.test(f.text))
    .map((f) => f.path)
  assert.deepEqual(
    offenders,
    ['app/layout.tsx'],
    `only the layout may import @vercel/analytics directly (for <Analytics/>), found: ${offenders}`,
  )
})
