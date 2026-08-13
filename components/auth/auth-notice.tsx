'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, Check, X } from 'lucide-react'

import { PageContainer } from '@/components/layout/page-shell'

/**
 * What sign-in leaves behind on its way back.
 *
 * Three outcomes worth a line: it worked, it was cancelled, or it broke. The
 * third is the one that matters — a candidate who taps "Continue with Google"
 * and silently ends up back where they started will assume the product is
 * broken, which, from where they are standing, it is.
 *
 * A strip rather than a dialog: nothing here needs acknowledging before the app
 * can be used, and practice should never be interrupted by an account.
 */
function Notice() {
  const params = useSearchParams()
  const [dismissed, setDismissed] = useState(false)

  const error = params.get('error') ?? (params.get('auth-error') ? 'sign_in_failed' : null)
  const signedIn = params.get('signed-in') === '1'
  if (dismissed || (!error && !signedIn)) return null

  const cancelled = error === 'access_denied'
  const description = params.get('error_description')

  const message = signedIn
    ? 'Signed in. Your progress from this browser has been added to your account.'
    : cancelled
      ? 'Sign-in was cancelled. Nothing changed, and your progress is still here.'
      : `Sign-in did not complete${description ? `: ${description}` : '.'} Your progress is safe in this browser — you can carry on and try again later.`

  return (
    <div className={signedIn ? 'bg-success-tint/60' : 'bg-warning-tint/60'}>
      <PageContainer className="flex items-center gap-2.5 py-2.5">
        {signedIn ? (
          <Check className="text-success-fg size-4 shrink-0" aria-hidden />
        ) : (
          <AlertTriangle className="text-warning-fg size-4 shrink-0" aria-hidden />
        )}
        <p role="status" className="min-w-0 flex-1 text-sm">
          {message}
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground hover:bg-background/60 focus-visible:ring-ring shrink-0 rounded-md p-1 transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="size-4" aria-hidden />
        </button>
      </PageContainer>
    </div>
  )
}

export function AuthNotice() {
  // `useSearchParams` needs a boundary, and everything else on the page is
  // static — so the strip is the only thing that waits for the URL.
  return (
    <Suspense fallback={null}>
      <Notice />
    </Suspense>
  )
}
