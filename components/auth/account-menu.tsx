'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, CloudOff, LogOut, RefreshCw, UserRound } from 'lucide-react'

import { GoogleButton } from '@/components/auth/google-button'
import { useAuth, useAuthActions } from '@/lib/auth/use-auth'
import { useSyncState } from '@/lib/progress/use-progress'
import { cn } from '@/lib/utils'

/**
 * The profile button, and everything an account does in this product.
 *
 * That is deliberately almost nothing: who you are, whether your work has been
 * saved, and a way out. There is no settings page, because there is nothing to
 * set — signing in exists to keep progress, not to create an identity.
 */
export function AccountMenu() {
  const auth = useAuth()
  const { signOut } = useAuthActions()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  // Click-away and Escape. A popover this small does not justify pulling in a
  // positioning library.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Not configured for this deployment: show the old static placeholder rather
  // than a button that cannot do anything.
  if (auth.status === 'unavailable') {
    return (
      <span
        aria-label="Your progress is saved in this browser"
        title="Your progress is saved in this browser."
        className="border-border bg-card text-foreground/70 flex size-9 shrink-0 items-center justify-center rounded-full border"
      >
        <UserRound className="size-5" aria-hidden />
      </span>
    )
  }

  const user = auth.user

  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={user ? `Account — ${user.name ?? user.email}` : 'Sign in to save your progress'}
        className={cn(
          'border-border bg-card text-foreground/70 flex size-9 items-center justify-center overflow-hidden rounded-full border',
          'hover:text-foreground hover:bg-muted focus-visible:ring-ring transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none',
          open && 'border-foreground/25 bg-muted',
        )}
      >
        {user?.avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element --
             a Google avatar is an arbitrary remote URL, and routing one 36px
             picture through next/image would mean whitelisting a host. */
          <img src={user.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <UserRound className="size-5" aria-hidden />
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            'border-border bg-card absolute right-0 z-50 mt-2 w-72 rounded-2xl border p-4 shadow-lg',
            'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-top-1 motion-safe:duration-150',
          )}
        >
          {user ? <SignedIn user={user} onSignOut={() => void signOut()} /> : <SignedOut />}
        </div>
      ) : null}
    </div>
  )
}

function SignedIn({
  user,
  onSignOut,
}: {
  user: NonNullable<ReturnType<typeof useAuth>['user']>
  onSignOut: () => void
}) {
  const { status, pending } = useSyncState()

  return (
    <div className="flex flex-col gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{user.name ?? 'Signed in'}</p>
        {user.email ? (
          <p className="text-muted-foreground truncate text-xs">{user.email}</p>
        ) : null}
      </div>

      <SyncLine status={status} pending={pending} />

      <a
        href="/privacy"
        role="menuitem"
        className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
      >
        What we store
      </a>

      <button
        type="button"
        role="menuitem"
        onClick={onSignOut}
        className="border-border hover:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
      >
        <LogOut className="size-4" aria-hidden />
        Sign out
      </button>
    </div>
  )
}

/** One line, and only because "is my work safe?" is a fair thing to want to know. */
function SyncLine({ status, pending }: { status: string; pending: number }) {
  const [icon, text] =
    pending > 0 && status === 'offline'
      ? [<CloudOff key="i" className="size-3.5" aria-hidden />, `${pending} waiting to sync`]
      : pending > 0
        ? [
            <RefreshCw
              key="i"
              className="size-3.5 motion-safe:animate-spin motion-safe:[animation-duration:2s]"
              aria-hidden
            />,
            `Saving ${pending}…`,
          ]
        : [<Check key="i" className="size-3.5" aria-hidden />, 'Progress saved to your account']

  return (
    <p className="text-muted-foreground border-border flex items-center gap-1.5 border-y py-2.5 text-xs">
      {icon}
      {text}
    </p>
  )
}

function SignedOut() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium">Save your progress</p>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Your work is saved in this browser. Sign in to keep it across devices — everything you
          have done so far comes with you.
        </p>
      </div>
      <GoogleButton size="sm" />
      <a
        href="/privacy"
        className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
      >
        What we store
      </a>
    </div>
  )
}
