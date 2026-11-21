'use client'

import { useState } from 'react'
import { UserRound } from 'lucide-react'

import { initialsFor } from '@/lib/auth/initials'
import type { AuthUser } from '@/lib/auth/use-auth'
import { cn } from '@/lib/utils'

/**
 * One avatar, used everywhere a signed-in person is shown.
 *
 * Three states, in order: the photograph, their initials, a generic glyph.
 *
 * The middle one is the point. Google does not always return a picture, and
 * the two call sites this replaced disagreed about what to do then — the
 * sidebar fell back to initials, the account page went straight to an outline
 * figure. Neither handled the third case at all: a `avatarUrl` that is present
 * but fails to load left the browser to draw its own broken-image icon inside
 * a 32px circle.
 *
 * `onError` is what closes that. A photograph that 404s, is blocked, or times
 * out falls back to exactly what a missing one does, so there is no path to a
 * broken image.
 *
 * The glyph is kept as a last resort rather than removed: an account with no
 * name and no email — which the type permits — would otherwise render an empty
 * circle.
 */
export function UserAvatar({
  user,
  className,
  textClassName,
  iconClassName,
}: {
  user: Pick<AuthUser, 'name' | 'email' | 'avatarUrl'> | null
  /** The circle itself. Callers own the size, colour and radius. */
  className?: string
  /** Sizing for the initials, which differ between a 32px and a 40px circle. */
  textClassName?: string
  iconClassName?: string
}) {
  const [failed, setFailed] = useState(false)

  const initials = initialsFor(user)
  const showPhoto = Boolean(user?.avatarUrl) && !failed

  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-full',
        className,
      )}
    >
      {showPhoto ? (
        /* eslint-disable-next-line @next/next/no-img-element --
           a Google avatar is an arbitrary remote URL; routing one 32px picture
           through next/image would mean whitelisting a host. */
        <img
          src={user!.avatarUrl!}
          alt=""
          className="size-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : initials ? (
        <span className={cn('font-semibold', textClassName)}>{initials}</span>
      ) : (
        <UserRound className={cn('size-4', iconClassName)} />
      )}
    </span>
  )
}
