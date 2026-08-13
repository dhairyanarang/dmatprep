'use client'

import { useSyncExternalStore } from 'react'
import { X } from 'lucide-react'

import { GoogleButton } from '@/components/auth/google-button'
import { useAuth } from '@/lib/auth/use-auth'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import { cn } from '@/lib/utils'

const DISMISSED_KEY = 'dmat-prep:invite-dismissed:v1'

/**
 * Whether the invite has been waved away, read the same way every other piece of
 * browser state in this app is read: through an external store, so the server
 * renders "hidden" and the client corrects it after hydration rather than
 * flashing the card on every page load.
 */
let dismissedCache: boolean | null = null
const dismissListeners = new Set<() => void>()

function subscribeDismissed(listener: () => void) {
  dismissListeners.add(listener)
  return () => dismissListeners.delete(listener)
}

function readDismissed(): boolean {
  if (dismissedCache === null) {
    try {
      dismissedCache = window.localStorage.getItem(DISMISSED_KEY) === '1'
    } catch {
      dismissedCache = false
    }
  }
  return dismissedCache
}

function dismiss() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    // ignore
  }
  dismissedCache = true
  for (const l of dismissListeners) l()
}

/** Enough history that losing it would actually sting. */
const MEANINGFUL_ATTEMPTS = 15

export type InviteMoment = 'diagnostic' | 'mock' | 'history'

const COPY: Record<InviteMoment, { title: string; body: string }> = {
  diagnostic: {
    title: 'Save your starting point',
    body: 'This is the reading everything else gets measured against. Sign in and it follows you to any device, along with the questions you have already seen.',
  },
  mock: {
    title: 'Save this result',
    body: 'Mock results are worth keeping — they are the only record of how you did under a clock. Sign in and they stay with you.',
  },
  history: {
    title: 'Save your progress across devices',
    body: 'Everything so far lives in this browser. Clearing site data would take it with it. Sign in and it moves to your account instead.',
  },
}

/**
 * Asking to sign in, at a moment where the answer is obviously yes.
 *
 * Never on arrival, never during a question, and never twice: it appears after
 * something has been *finished* — a diagnostic, a mock, or enough practice to
 * have a history worth keeping — and a dismissal is permanent. Signing in is a
 * convenience the product offers, not a gate it puts up.
 */
export function SaveProgressInvite({
  moment,
  className,
}: {
  moment: InviteMoment
  className?: string
}) {
  const auth = useAuth()
  const progress = useProgress()
  const ready = useProgressReady()
  const dismissed = useSyncExternalStore(subscribeDismissed, readDismissed, () => true)

  if (auth.status !== 'guest' || !ready || dismissed) return null
  if (moment === 'history' && progress.attempts.length < MEANINGFUL_ATTEMPTS) return null

  const copy = COPY[moment]

  return (
    <div
      className={cn(
        'border-border bg-surface-muted relative rounded-2xl border p-4',
        'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200',
        className,
      )}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Not now"
        className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring absolute top-3 right-3 rounded-md p-1 transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
      >
        <X className="size-4" aria-hidden />
      </button>

      <p className="pr-8 text-sm font-medium">{copy.title}</p>
      <p className="text-muted-foreground mt-1.5 max-w-prose text-sm leading-relaxed">
        {copy.body}
      </p>
      <GoogleButton size="sm" variant="outline" className="mt-3 w-fit" />
    </div>
  )
}
