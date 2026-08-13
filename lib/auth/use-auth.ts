'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'

/**
 * Who is signed in, if anyone.
 *
 * `unavailable` is a first-class state, not an error: when Supabase is not
 * configured the product is guest-only by design, and the UI should show no
 * sign-in affordance at all rather than a button that cannot work.
 */
export type AuthUser = {
  id: string
  email: string | null
  name: string | null
  avatarUrl: string | null
}

export type AuthState =
  | { status: 'unavailable'; user: null }
  | { status: 'loading'; user: null }
  | { status: 'guest'; user: null }
  | { status: 'authenticated'; user: AuthUser }

const UNAVAILABLE: AuthState = { status: 'unavailable', user: null }
const LOADING: AuthState = { status: 'loading', user: null }
const GUEST: AuthState = { status: 'guest', user: null }

let state: AuthState = isSupabaseConfigured ? LOADING : UNAVAILABLE
const listeners = new Set<() => void>()
let started = false

function set(next: AuthState) {
  // Referential stability matters: useSyncExternalStore re-renders on identity
  // change, and the three constants above are shared for exactly that reason.
  if (next.status === state.status && next.user?.id === state.user?.id) return
  state = next
  for (const l of listeners) l()
}

function toUser(raw: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}): AuthUser {
  const meta = raw.user_metadata ?? {}
  const pick = (key: string) => (typeof meta[key] === 'string' ? (meta[key] as string) : null)
  return {
    id: raw.id,
    email: raw.email ?? null,
    name: pick('full_name') ?? pick('name') ?? raw.email ?? null,
    avatarUrl: pick('avatar_url') ?? pick('picture'),
  }
}

/**
 * One subscription for the whole app, opened lazily on first read.
 *
 * `getUser()` rather than `getSession()` for the initial read: it verifies the
 * token with the auth server instead of trusting whatever is in the cookie.
 */
function start() {
  if (started) return
  started = true

  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    set(UNAVAILABLE)
    return
  }

  void supabase.auth.getUser().then(({ data, error }) => {
    set(!error && data.user ? { status: 'authenticated', user: toUser(data.user) } : GUEST)
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    set(session?.user ? { status: 'authenticated', user: toUser(session.user) } : GUEST)
  })
}

function subscribe(listener: () => void) {
  start()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAuth(): AuthState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    // The server can never know who is signed in — this app is statically
    // rendered — so it always hydrates as "still deciding".
    () => (isSupabaseConfigured ? LOADING : UNAVAILABLE),
  )
}

/** Actions, separated so components that only *read* auth do not re-render. */
export function useAuthActions() {
  const signInWithGoogle = useCallback(async (next?: string) => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return { error: 'Sign-in is not available in this deployment.' }

    const target = new URL('/auth/callback', window.location.origin)
    target.searchParams.set('next', next ?? window.location.pathname)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: target.toString(),
        // Ask Google for a fresh consent only when it has none: this keeps the
        // flow to a single tap for a returning candidate.
        queryParams: { prompt: 'select_account' },
      },
    })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  return { signInWithGoogle, signOut }
}

/**
 * Run `effect` once, the first time the candidate is known to be signed in.
 * Used by the sync layer, which must not re-run its merge on every render.
 */
export function useOnAuthenticated(effect: (user: AuthUser) => void) {
  const auth = useAuth()
  useEffect(() => {
    if (auth.status !== 'authenticated') return
    effect(auth.user)
    // Keyed on the user id alone: a token refresh produces a new session object
    // but the same person, and must not trigger a second merge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status, auth.user?.id])
}
