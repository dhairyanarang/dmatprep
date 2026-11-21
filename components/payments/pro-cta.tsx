'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

import { trackEvent } from '@/lib/analytics/client'
import { EVENTS } from '@/lib/analytics/events'
import { COMMERCE_ENABLED, formatPrice } from '@/lib/payments/config'
import { useEntitlement } from '@/lib/payments/use-entitlement'

/**
 * The Pro column's call to action.
 *
 * It only ever *starts* the purchase: the charge itself happens on
 * `/checkout`, where the buyer can see the total and the terms before anything
 * opens. A pricing page that fires a payment window straight off a feature
 * list gives nowhere to read what is about to be bought.
 *
 * With commerce off it says so plainly rather than offering a button that
 * cannot charge anything.
 */
export function ProCta({ bankSize }: { bankSize: number }) {
  const entitlement = useEntitlement()

  if (!COMMERCE_ENABLED) {
    return (
      <p className="text-muted-foreground text-sm leading-relaxed">
        Everything is free at the moment — all {bankSize} Core questions, with full explanations,
        and all four fixed mock exams. There is nothing to buy yet, and nothing has been taken
        away.
      </p>
    )
  }

  if (entitlement.ready && entitlement.access) {
    return (
      <Link
        href="/account"
        className="border-gold-line text-gold-text hover:bg-gold-soft flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors"
      >
        <Check aria-hidden className="size-4" />
        You are on Pro · Manage
      </Link>
    )
  }

  return (
    <Link
      href="/checkout"
      onClick={() => trackEvent(EVENTS.premiumBuyClicked, { surface: 'pricing' })}
      className="bg-gold text-gold-dark hover:bg-gold-strong flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors"
    >
      Unlock Pro — {formatPrice()}
      <ArrowRight aria-hidden className="size-4" />
    </Link>
  )
}
