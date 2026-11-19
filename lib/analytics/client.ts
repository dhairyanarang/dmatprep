'use client'

import { track } from '@vercel/analytics'

import { safeProperties, type EventName, type EventProperties } from './events.ts'

/**
 * Emit a funnel event from the browser.
 *
 * Never throws and never blocks: an analytics failure must not be able to
 * interrupt a purchase. Properties pass through the allowlist first, so a call
 * site cannot send anything personal even by mistake.
 *
 * Client events stop at `checkout_opened`. Everything about money is emitted by
 * the server, because a browser redirect is not proof of payment.
 */
export function trackEvent(name: EventName, properties?: EventProperties): void {
  try {
    track(name, safeProperties(properties))
  } catch {
    // Deliberately silent.
  }
}
