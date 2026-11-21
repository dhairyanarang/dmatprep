import { track } from '@vercel/analytics/server'

import { safeProperties, type EventName, type EventProperties } from './events.ts'

/**
 * Emit a funnel event from a route handler.
 *
 * The money events live here rather than in the browser, and only ever fire on
 * the FIRST successful processing of a payment event — the claim in
 * `claim_webhook_event` is what makes that true, so a webhook delivered five
 * times produces one `payment_succeeded`.
 *
 * Awaited by callers that can afford to, swallowed either way: the webhook
 * handler has five seconds before Razorpay treats it as a timeout, and
 * analytics must never be the reason it misses.
 */
export async function trackServerEvent(
  name: EventName,
  properties?: EventProperties,
): Promise<void> {
  try {
    await track(name, safeProperties(properties))
  } catch {
    // Deliberately silent.
  }
}
