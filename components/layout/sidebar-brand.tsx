'use client'

import Link from 'next/link'

import { COMMERCE_ENABLED } from '@/lib/payments/config'
import { useEntitlement } from '@/lib/payments/use-entitlement'
import { cn } from '@/lib/utils'

/**
 * The brand row: a 24px mark, the name, and a PRO badge when the account has
 * one.
 *
 * The countdown that used to sit under the name has moved to the dashboard,
 * where the design puts it — as a figure with a label, beside the other three.
 * A number small enough to fit under a wordmark could not say what it counted,
 * so it had to be read twice to be understood.
 */
export function SidebarBrand({ className }: { className?: string }) {
  const entitlement = useEntitlement()
  const pro = COMMERCE_ENABLED && entitlement.ready && entitlement.access

  return (
    <Link
      href="/"
      className={cn(
        'focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-2 rounded transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    >
      <span
        aria-hidden
        className="bg-foreground text-background flex size-6 shrink-0 items-center justify-center rounded-[5px] text-[13px] font-semibold"
      >
        D
      </span>
      <span className="truncate text-sm leading-5 font-semibold">dMAT Prep</span>
      {pro ? <ProBadge /> : null}
    </Link>
  )
}

/** The one badge that means paid access. Gold, mono, never blue. */
export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'bg-gold text-gold-dark flex h-[18px] shrink-0 items-center rounded-sm px-1.5 font-mono text-[10px] leading-none font-semibold tracking-[0.04em]',
        className,
      )}
    >
      PRO
    </span>
  )
}
