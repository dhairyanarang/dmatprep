'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

import { useAuth } from '@/lib/auth/use-auth'
import { COMMERCE_ENABLED } from '@/lib/payments/config'
import { useEntitlement } from '@/lib/payments/use-entitlement'
import { cn } from '@/lib/utils'

/**
 * Membership, at the foot of the sidebar.
 *
 * The state is read from the same two hooks the rest of the product uses —
 * `useAuth` for who you are and `useEntitlement` for what you may open. Nothing
 * here is hardcoded, and nothing here decides access: it reports what the
 * server already decided, so a tampered client gets a misleading card and no
 * extra content.
 *
 * It reports MEMBERSHIP only. Who you are is the account row's job, directly
 * below it — this card used to lead with "Not signed in", which left the
 * sidebar saying that twice, in two cards, one above the other.
 *
 * The distinction it still has to keep is that a signed-out visitor is **not**
 * a free member. They have no account at all, so telling them they are on the
 * Free plan would be a small lie that makes the invitation read as a
 * downgrade — which is why the signed-out state names the product rather than
 * a plan the visitor is not on.
 */
export function MembershipCard({ onNavigate }: { onNavigate?: () => void }) {
  const auth = useAuth()
  const entitlement = useEntitlement()

  // While either is resolving, render the frame but not a claim. The card is
  // small and the flash of a wrong status is worse than a quiet moment.
  const resolving = auth.status === 'loading' || (COMMERCE_ENABLED && !entitlement.ready)
  const signedIn = auth.status === 'authenticated'
  const isPro = COMMERCE_ENABLED && signedIn && entitlement.access

  return (
    <Link
      href="/pricing"
      onClick={onNavigate}
      aria-label={isPro ? 'Pro membership — view plan' : 'Explore Pro'}
      className={cn(
        // The same brand plane the dashboard's next-step card uses, so the one
        // promoted thing in the sidebar reads as part of the product rather
        // than as an advert bolted onto it.
        'group bg-brand relative block overflow-hidden rounded-xl p-3',
        'transition-shadow duration-150 ease-out hover:shadow-[0_4px_10px_color-mix(in_oklab,var(--brand)_28%,transparent)]',
        'focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
      )}
    >

      <div className="relative flex items-center gap-2">
        <span
          aria-hidden
          className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white/15 text-white"
        >
          <Sparkles className="size-3.5" />
        </span>
        <span className="text-sm leading-5 font-semibold text-white">
          {/* A signed-out visitor has no plan at all, so they are shown the
              product's name rather than a plan they are not on. */}
          {resolving ? 'Membership' : isPro ? 'Pro' : signedIn ? 'Free' : 'dMAT Prep Pro'}
        </span>
        {isPro ? (
          <span className="bg-brand-cta text-brand-cta-foreground ml-auto rounded px-1.5 py-0.5 text-[10px] leading-4 font-medium">
            Active
          </span>
        ) : null}
      </div>

      {/* The muted foreground token is near-invisible on the brand plane, so
          this uses the brand's own secondary foreground, measured in
          app/globals.css rather than written as an alpha here. */}
      <p className="relative mt-1.5 text-xs leading-4 text-brand-foreground-muted">
        {resolving
          ? ' '
          : isPro
            ? 'Every Core question is unlocked on this account.'
            : signedIn
              ? 'Ready for more? Unlock your full preparation.'
              : 'The full Core bank and four fixed mock exams. One payment, kept for good.'}
      </p>

      {!isPro && !resolving ? (
        <span className="bg-brand-cta text-brand-cta-foreground relative mt-2.5 inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors duration-150 group-hover:bg-brand-cta/90">
          {signedIn ? 'Explore Pro' : 'See what Pro adds'}
          <ArrowRight
            aria-hidden
            className="size-3 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
          />
        </span>
      ) : null}
    </Link>
  )
}
