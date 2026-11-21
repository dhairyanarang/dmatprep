import { processWebhook } from '@/lib/payments/server'

/**
 * Razorpay's webhook endpoint.
 *
 * Three properties of Razorpay's verified contract dictate everything here:
 *
 *  · The signature is over the RAW body. `request.text()` is called first and
 *    nothing parses the body before it is verified. Razorpay's own Node sample
 *    does `JSON.stringify(parsedBody)`, which does not reproduce the signed
 *    bytes — it passes in testing and fails in production.
 *  · Delivery is at-least-once and ordering is not guaranteed, so processing is
 *    idempotent and order-independent by construction, not by special cases.
 *  · A response slower than FIVE SECONDS is treated as a timeout and the event
 *    is resent even if the work completed. Nothing slow — no email, no
 *    analytics, no receipt — happens in front of the response.
 *
 * Dynamic by necessity: this is one of the few request-time handlers in a
 * product where every page is static.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // RAW. Before any parsing. This line is the whole signature contract.
  const raw = await request.text()

  const outcome = await processWebhook(raw, request.headers)

  // The body is for our logs, not for Razorpay, which only reads the status.
  return new Response(JSON.stringify({ note: outcome.note }), {
    status: outcome.http,
    headers: { 'content-type': 'application/json' },
  })
}
