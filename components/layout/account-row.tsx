'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronsUpDown, LogOut, ShieldCheck, Sparkles, UserRound } from 'lucide-react'

import { GoogleButton } from '@/components/auth/google-button'
import { useAuth, useAuthActions } from '@/lib/auth/use-auth'
import { COMMERCE_ENABLED } from '@/lib/payments/config'
import { useEntitlement } from '@/lib/payments/use-entitlement'
import { cn } from '@/lib/utils'

/**
 * Who you are, at the foot of the sidebar, with a menu that opens upward.
 *
 * The design puts the account control here rather than in the top bar, and the
 * menu opens over the sidebar because there is nothing below it to open into.
 * It holds the two things done in a hurry — go to the account page, sign out —
 * and leaves the rest to `/account`.
 *
 * Signed out it still renders, and says so plainly. A row that disappeared
 * when you were not signed in would hide the one place that explains where
 * your work is actually being kept.
 */
export function AccountRow({ onNavigate }: { onNavigate?: () => void }) {
  const auth = useAuth()
  const { signOut } = useAuthActions()
  const entitlement = useEntitlement()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const user = auth.user
  const loading = auth.status === 'loading'
  const pro = COMMERCE_ENABLED && entitlement.ready && entitlement.access

  const name = user?.name ?? user?.email ?? (loading ? '' : 'Not signed in')
  const plan = loading
    ? ''
    : !user
      ? 'Saved in this browser'
      : pro
        ? 'Pro'
        : COMMERCE_ENABLED
          ? 'Free plan'
          : 'Signed in'

  const initials = (user?.name ?? user?.email ?? '')
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <div ref={root} className="relative">
      {open ? (
        <div
          role="menu"
          className={cn(
            'border-border bg-card absolute right-0 bottom-[calc(100%+6px)] left-0 z-30 rounded-[10px] border p-1',
            'shadow-[0_12px_32px_rgba(10,10,10,0.14)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-150',
          )}
        >
          <MenuLink href="/account" icon={ShieldCheck} onClick={onNavigate}>
            Account and data
          </MenuLink>
          {COMMERCE_ENABLED ? (
            <MenuLink href="/pricing" icon={Sparkles} onClick={onNavigate}>
              Plans and pricing
            </MenuLink>
          ) : null}

          {user ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => void signOut()}
              className="hover:bg-frame flex h-[34px] w-full items-center gap-2 rounded-md px-2.5 text-left text-sm"
            >
              <LogOut className="size-4 shrink-0" aria-hidden />
              Sign out
            </button>
          ) : auth.status === 'guest' ? (
            <div className="p-1.5">
              <GoogleButton size="sm" variant="outline" className="w-full" />
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="border-border bg-card hover:bg-frame focus-visible:ring-ring flex w-full items-center gap-2.5 rounded-[10px] border p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <span
          aria-hidden
          className="bg-foreground grid size-8 shrink-0 place-items-center overflow-hidden rounded-full text-xs font-semibold text-[#f3f0e6]"
        >
          {user?.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element --
               a Google avatar is an arbitrary remote URL; routing one 32px
               picture through next/image would mean whitelisting a host. */
            <img src={user.avatarUrl} alt="" className="size-full object-cover" />
          ) : initials ? (
            initials
          ) : (
            <UserRound className="size-4" />
          )}
        </span>

        {/* The one place in the sidebar that can hold a real name and address. */}
        <span className="flex min-w-0 flex-1 flex-col" data-clarity-mask="true">
          <b className="truncate text-[13px] leading-[18px] font-semibold">{name}</b>
          <span className="text-muted-foreground truncate text-xs leading-4">{plan}</span>
        </span>

        <ChevronsUpDown aria-hidden className="text-muted-foreground size-4 shrink-0" />
      </button>
    </div>
  )
}

function MenuLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string
  icon: typeof ShieldCheck
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="hover:bg-frame flex h-[34px] w-full items-center gap-2 rounded-md px-2.5 text-sm"
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {children}
    </Link>
  )
}
