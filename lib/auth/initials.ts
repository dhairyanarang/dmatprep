import type { AuthUser } from './use-auth.ts'

/**
 * Up to two initials for a signed-in person.
 *
 * Kept in its own module, and not in `user-avatar.tsx`, so it can be imported
 * by the test suite: Node strips types from `.ts` but cannot parse `.tsx`.
 *
 * Falls back to the local part of the email, split on the separators people
 * actually use in addresses, so `dhairya.narang@…` gives DN rather than D. The
 * domain is dropped — the initials of "gmail" belong to nobody. Returns an
 * empty string when there is nothing to work with, which is the caller's
 * signal to draw a glyph instead.
 */
export function initialsFor(user: Pick<AuthUser, 'name' | 'email'> | null): string {
  const source = user?.name?.trim() || user?.email?.split('@')[0] || ''
  return source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
