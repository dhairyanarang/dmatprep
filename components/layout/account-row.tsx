'use client'

import Link from 'next/link'
import { ChevronRight, UserRound } from 'lucide-react'

import { useAuth } from '@/lib/auth/use-auth'
import { COMMERCE_ENABLED } from '@/lib/payments/config'
import { useEntitlement } from '@/lib/payments/use-entitlement'
import { cn } from '@/lib/utils'

/**
 * Who you are, at the foot of the sidebar, opening the account page.
 *
 * The product kept its only account affordance in the top bar, as a popover.
 * A popover is right for the two things you do in a hurry — check your work is
 * saved, sign out — and wrong for the questions that need a page: what is
 * stored, what this account may open, how to remove it. So there are two
 * surfaces, and they do different jobs rather than the same job twice.
 *
 * Signed out it still renders, and says so plainly. A row that disappeared
 * when you were not signed in would hide the one place that explains where
 * your work is actually being kept.
 */
export function AccountRow({ onNavigate }: { onNavigate?: () => void }) {
  const auth = useAuth()
  const entitlement = useEntitlement()

  const user = auth.user
  const loading = auth.status === 'loading'
  const pro = COMMERCE_ENABLED && entitlement.ready && entitlement.access

  const name = user?.name ?? user?.email ?? (loading ? ' ' : 'Not signed in')
  const plan = loading
    ? ' '
    : !user
      ? 'Saved in this browser'
      : pro
        ? 'Pro — lifetime'
        : COMMERCE_ENABLED
          ? 'Free plan'
          : 'Signed in'

  return (
    <Link
      href="/account"
      onClick={onNavigate}
      className={cn(
        'group border-sidebar-border hover:bg-sidebar-accent/60 flex items-center gap-2.5 rounded-lg border px-2.5 py-2',
        'focus-visible:ring-ring transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none',
      )}
    >
      <span
        aria-hidden
        className="bg-muted text-foreground/70 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full"
      >
        {user?.avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element --
             a Google avatar is an arbitrary remote URL, and routing one 28px
             picture through next/image would mean whitelisting a host. */
          <img src={user.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <UserRound className="size-4" />
        )}
      </span>

      {/* The one place in the sidebar that can hold a real name and address. */}
      <span className="flex min-w-0 flex-1 flex-col" data-clarity-mask="true">
        <span className="text-foreground truncate text-sm leading-5">{name}</span>
        <span className="text-muted-foreground truncate text-xs leading-4">{plan}</span>
      </span>

      <ChevronRight
        aria-hidden
        className="text-muted-foreground size-3.5 shrink-0 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
      />
    </Link>
  )
}
