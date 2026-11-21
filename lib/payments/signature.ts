import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Signature verification, for both of Razorpay's schemes.
 *
 * There are TWO, with different keys and different messages, and confusing them
 * produces verification that is wrong in a way that looks right:
 *
 *   webhook          HMAC-SHA256( raw request body )        keyed on the WEBHOOK SECRET
 *   checkout return  HMAC-SHA256( order_id + "|" + pid )    keyed on the API KEY SECRET
 *
 * Both verified against Razorpay's documentation on 18 November 2026.
 *
 * No provider SDK is used. That is deliberate and not merely frugal: Razorpay's
 * own Node sample calls `validateWebhookSignature(JSON.stringify(body), …)`
 * while the same page warns "Do not parse or cast the webhook request body".
 * `JSON.stringify` re-serialises a parsed object, so key order, whitespace and
 * number formatting are no longer guaranteed to match the bytes that were
 * signed — verification passes in testing and fails in production. Taking the
 * raw text ourselves makes that mistake unavailable.
 */

/** Constant-time compare that cannot throw on a length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function hmacHex(message: string, secret: string): string {
  return createHmac('sha256', secret).update(message, 'utf8').digest('hex')
}

/**
 * Verify a webhook.
 *
 * `raw` must be the exact request body as text — `await request.text()`, before
 * any parsing. Passing a re-serialised object is the documented trap above.
 */
export function verifyWebhookSignature(
  raw: string,
  headerSignature: string | null,
  webhookSecret: string,
): boolean {
  if (!headerSignature || !webhookSecret) return false
  return safeEqual(hmacHex(raw, webhookSecret), headerSignature)
}

/**
 * Verify the Checkout return.
 *
 * `storedOrderId` is the id **we** wrote at order creation, read back from our
 * own table. Razorpay's documentation is blunt about this: "Do not use the
 * `razorpay_order_id` returned by Checkout." Signing with the value the browser
 * handed back would let a tampered response verify against itself, which is why
 * this function takes the stored id as a separate argument rather than reading
 * it out of the payload.
 */
export function verifyCheckoutSignature(
  storedOrderId: string,
  providerPaymentId: string,
  returnedSignature: string | null,
  apiKeySecret: string,
): boolean {
  if (!returnedSignature || !apiKeySecret) return false
  const message = `${storedOrderId}|${providerPaymentId}`
  return safeEqual(hmacHex(message, apiKeySecret), returnedSignature)
}

/**
 * A hash of exactly what we received.
 *
 * Stored instead of the payload so a dispute can be answered without retaining
 * the contact email, phone, card last four, issuer and UPI VPA that a Razorpay
 * payload carries. See `redact.ts`.
 */
export function sha256Hex(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex')
}
