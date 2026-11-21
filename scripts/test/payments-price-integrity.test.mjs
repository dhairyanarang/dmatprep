/**
 * One price, in one place, and no way for a browser to change it.
 *
 * The amount a buyer is shown and the amount their card is charged have to be
 * the same number, and that is only guaranteed while there is exactly one
 * number. These are structural checks over the source, because the alternative
 * — asserting it against a live Razorpay order — needs credentials this suite
 * must never hold.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'

const root = fileURLToPath(new URL('../../', import.meta.url))
const read = (p) => readFileSync(join(root, p), 'utf8')

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', '.next', '.git', '.playwright-mcp'].includes(entry)) continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, out)
    else out.push(path)
  }
  return out
}

const sources = [
  ...walk(join(root, 'app')),
  ...walk(join(root, 'components')),
  ...walk(join(root, 'lib')),
].filter((f) => /\.tsx?$/.test(f))

test('the price is declared exactly once', () => {
  const config = read('lib/payments/config.ts')
  assert.match(config, /export const PRICE_MINOR = 99_900/, 'the agreed price is ₹999')

  // Anything else writing the amount in minor units is a second copy waiting
  // to disagree with the first.
  const offenders = []
  for (const file of sources) {
    const rel = relative(root, file)
    if (rel === 'lib/payments/config.ts') continue
    const code = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    if (/\b99_?900\b/.test(code)) offenders.push(rel)
  }
  assert.deepEqual(offenders, [], 'the price in minor units appears outside the config')
})

test('nothing renders a rupee figure the config does not supply', () => {
  // `formatPrice()` is the only way the amount reaches a screen. A literal
  // "₹999" would keep showing the old number the day the price changes.
  const offenders = []
  for (const file of sources) {
    const rel = relative(root, file)
    if (rel === 'lib/payments/config.ts') continue
    const code = readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    // ₹0 is the Free column and is not the product's price.
    for (const match of code.matchAll(/₹\s?([\d,]+)/g)) {
      if (match[1] !== '0') offenders.push(`${rel}: ₹${match[1]}`)
    }
  }
  assert.deepEqual(offenders, [], 'a hardcoded price is rendered somewhere')
})

test('order creation takes no amount from the request', () => {
  const route = read('app/api/checkout/order/route.ts')
  // A POST with no body parse at all is the strongest form of this: there is
  // nothing from the client to trust.
  assert.match(route, /export async function POST\(\)/, 'the handler must not read a request body')
  assert.doesNotMatch(route, /request\.json\(\)/, 'nothing from the client may reach the order')
  assert.match(route, /createOrderForUser\(data\.user\.id\)/, 'the order is built from the session')
})

test('the order is refused unless commerce is on and the caller is signed in', () => {
  const route = read('app/api/checkout/order/route.ts')
  assert.match(route, /if \(!COMMERCE_ENABLED\)/, 'no order exists while nothing is for sale')
  assert.match(route, /supabase\.auth\.getUser\(\)/, 'the user is verified, not read from a cookie')
  assert.match(route, /sign-in-required.*401/s, 'an anonymous caller is refused')
})

test('the checkout page does not exist while nothing is for sale', () => {
  // A checkout that cannot charge anything is a dead end, and the brief for
  // this product forbids dead ends more than it forbids missing pages.
  const page = read('app/checkout/page.tsx')
  assert.match(page, /if \(!COMMERCE_ENABLED\) notFound\(\)/)
})

test('the client never decides entitlement', () => {
  // The purchase button may report what the server decided; it may not decide.
  const button = read('components/payments/purchase-button.tsx')
  assert.match(button, /\/api\/checkout\/verify/, 'the result is verified server-side')
  assert.match(
    button,
    /invalidateEntitlement\(\)/,
    'access is re-read from the server rather than assumed from the callback',
  )
})
