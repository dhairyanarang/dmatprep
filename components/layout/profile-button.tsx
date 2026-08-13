'use client'

import { User } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Placeholder for a future account.
 *
 * There is no authentication, no profile and no backend — progress lives in
 * localStorage. This exists so the top bar has the right shape when an account
 * eventually arrives, and it says so rather than pretending to be signed in.
 * Deliberately quiet: it is the least important control on the page.
 */
export function ProfileButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="Account — not available yet"
      title="Accounts are not available yet. Your progress is saved in this browser."
      className={cn(
        'border-border bg-card text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors',
        'hover:text-foreground hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    >
      <User className="size-4" aria-hidden />
    </button>
  )
}
