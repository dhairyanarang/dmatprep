'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuthActions } from '@/lib/auth/use-auth'
import { cn } from '@/lib/utils'

/** Google's mark, inlined: the CSP allows no remote images, and it is four paths. */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden className={cn('size-4', className)}>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  )
}

/**
 * The only way into an account.
 *
 * One provider, and the label says what signing in *does* rather than what it
 * creates — nothing here is an account you have to manage, it is a place to keep
 * your progress.
 */
export function GoogleButton({
  next,
  className,
  variant = 'default',
  size = 'default',
  label = 'Continue with Google',
}: {
  next?: string
  className?: string
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm'
  label?: string
}) {
  const { signInWithGoogle } = useAuthActions()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Button
        variant={variant}
        size={size}
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setError(null)
          const result = await signInWithGoogle(next)
          // On success the browser is already navigating to Google, so the
          // spinner stays up until the page goes — which is the honest state.
          if (result?.error) {
            setError(result.error)
            setBusy(false)
          }
        }}
      >
        {busy ? (
          <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
        ) : (
          <GoogleMark />
        )}
        {busy ? 'Taking you to Google…' : label}
      </Button>
      {error ? (
        <p role="alert" className="text-danger-fg text-xs">
          {error}
        </p>
      ) : null}
    </div>
  )
}
