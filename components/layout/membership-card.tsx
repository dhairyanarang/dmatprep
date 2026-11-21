'use client'

import Link from 'next/link'
import { ChevronRight, Crown } from 'lucide-react'

import { ProBadge } from '@/components/layout/sidebar-brand'
import { useAuth } from '@/lib/auth/use-auth'
import { COMMERCE_ENABLED } from '@/lib/payments/config'
import { useEntitlement } from '@/lib/payments/use-entitlement'
import { useFreeUsage } from '@/lib/payments/use-free-usage'

/**
 * Membership, at the foot of the sidebar.
 *
 * Two shapes, following the design. Someone on Pro gets a quiet card that
 * states what they hold and goes to their account; everyone else gets the
 * upgrade card, with a rail showing how much of the free sample they have
 * actually used. The rail is the honest version of a nag: it says where you
 * are rather than how much you are missing, and it disappears the moment it
 * stops being true.
 *
 * It reports MEMBERSHIP only. Who you are is the account row's job, directly
 * below it — this card used to lead with "Not signed in", which left the
 * sidebar saying that twice, in two cards, one above the other.
 *
 * It renders whether or not the purchase flow is switched on. The price and
 * the contents of Pro are decided; only the ability to take the money is not,
 * and the pricing page says so in its own words. Hiding the card until the
 * switch flips is what made the offering undiscoverable in the product that
 * is actually running.
 */
export function MembershipCard({
  onNavigate,
  bankSize,
}: {
  onNavigate?: () => void
  /** Counted by the server component that renders the sidebar. */
  bankSize: number
}) {
  const auth = useAuth()
  const entitlement = useEntitlement()
  const usage = useFreeUsage()

  if (auth.status === 'loading') return null
  if (COMMERCE_ENABLED && !entitlement.ready) return null

  if (COMMERCE_ENABLED && entitlement.access) {
    // No rail and no usage figure here. "38 of 150 free questions used" is a
    // Free plan's number, and leaving it up after an upgrade is the stalest
    // thing the sidebar could say. A Pro account has no quota to report.
    return (
      <Link
        href="/account"
        onClick={onNavigate}
        className="border-gold-line bg-card hover:border-gold group flex flex-col gap-1 rounded-xl border px-3.5 py-3 transition-colors"
      >
        <span className="flex items-center justify-between gap-2">
          <b className="text-sm font-semibold">Pro</b>
          <ProBadge />
        </span>
        <span className="text-muted-foreground text-xs leading-4">
          All {bankSize} Core questions and all four mocks, for good.
        </span>
        <span className="text-foreground mt-1 inline-flex items-center gap-1 text-xs font-medium">
          Manage membership
          <ChevronRight aria-hidden className="size-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    )
  }

  return (
    <div className="border-border bg-card flex flex-col gap-2.5 rounded-xl border p-3.5">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="bg-gold-tint text-gold-text grid size-7 shrink-0 place-items-center rounded-lg"
        >
          <Crown className="size-4" />
        </span>
        <b className="text-sm font-semibold">Go Pro</b>
      </div>

      <span className="text-muted-foreground text-xs leading-[17px]">
        The full Core question bank and all four fixed mock exams, for one payment.
      </span>

      {COMMERCE_ENABLED && usage.ready && usage.total > 0 ? (
        <div className="flex flex-col gap-1.5">
          <div className="rail bg-[#edecea]">
            <i style={{ width: `${Math.min(100, Math.round((usage.used / usage.total) * 100))}%` }} />
          </div>
          <span className="text-muted-foreground text-[11px] leading-4">
            {usage.used} of {usage.total} free questions used
          </span>
        </div>
      ) : null}

      <Link
        href="/pricing"
        onClick={onNavigate}
        className="bg-brand text-brand-foreground hover:bg-brand-strong flex h-[30px] w-full items-center justify-center rounded-[7px] text-[13px] font-medium transition-colors"
      >
        See plans
      </Link>
    </div>
  )
}
