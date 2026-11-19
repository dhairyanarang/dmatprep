'use client'

import { useEffect, useRef } from 'react'

import { trackEvent } from '@/lib/analytics/client'
import { EVENTS } from '@/lib/analytics/events'

/**
 * The top of the funnel: the pricing page was seen.
 *
 * A tiny client island inside an otherwise static page, so the page itself
 * stays prerendered. The ref guard makes it fire once per mount rather than
 * twice under React's development double-invoke, which would otherwise double
 * every view count in local testing and make the funnel look wrong.
 */
export function PremiumViewed({ surface = 'pricing' }: { surface?: string }) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    trackEvent(EVENTS.premiumViewed, { surface })
  }, [surface])
  return null
}
