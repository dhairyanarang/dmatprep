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
 * Four states, and the distinction between the first two is the one most often
 * got wrong: a signed-out visitor is **not** a free member. They have no
 * account at all, so telling them they are on the Free plan would be a small
 * lie that makes the upgrade message read as a downgrade.
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
        'group border-sidebar-border bg-card relative block rounded-xl border p-3',
        'transition-[background-color,box-shadow] duration-150 ease-out',
        'hover:shadow-[0_4px_8px_rgba(0,0,0,0.06)]',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
      )}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md',
            isPro ? 'bg-brand/12 text-brand' : 'bg-foreground/5 text-foreground/70',
          )}
        >
          <Sparkles className="size-3.5" />
        </span>
        <span className="text-foreground text-sm leading-5 font-semibold">
          {/* A signed-out visitor has no plan at all. Labelling them "Free"
              states something untrue about an account that does not exist, and
              makes the invitation below read as a downgrade. */}
          {resolving ? 'Membership' : isPro ? 'Pro' : signedIn ? 'Free' : 'Not signed in'}
        </span>
        {isPro ? (
          <span className="bg-brand/12 text-brand ml-auto rounded px-1.5 py-0.5 text-[10px] leading-4 font-medium">
            Active
          </span>
        ) : null}
      </div>

      <p className="text-muted-foreground mt-1.5 text-xs leading-4">
        {resolving
          ? ' '
          : isPro
            ? 'Every Core question is unlocked on this account.'
            : signedIn
              ? 'Ready for more? Unlock your full preparation.'
              : 'Sign in to save your progress — and see what Pro adds.'}
      </p>

      {!isPro && !resolving ? (
        <span className="text-foreground mt-2 flex items-center gap-1 text-xs font-medium">
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
