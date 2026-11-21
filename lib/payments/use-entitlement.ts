'use client'

import { useEffect, useSyncExternalStore } from 'react'

import { COMMERCE_ENABLED } from './config.ts'

/**
 * What the signed-in user is allowed, for the interface only.
 *
 * This decides what to SHOW — a lock, an upgrade prompt, a price. It never
 * decides what to SERVE. Premium content comes from `/api/content/solutions`,
 * which performs its own check against the database on every request, so a
 * stale or forged value here cannot release a single byte.
 *
 * When commerce is disabled it resolves immediately to "everything is
 * available", which is the product as it stands today: every Core question
 * free, no account needed, no network call made.
 *
 * ## Why this is a store rather than a cached promise
 *
 * It used to be a module-scope promise that each component read once, on
 * mount, and `invalidateEntitlement()` cleared that promise and told nobody.
 * So after a real payment the fourteen components that read entitlement kept
 * whatever they had resolved to at mount — Free, forever. Navigating to a
 * route that mounted a *fresh* component refetched and showed Pro, which is
 * exactly the symptom reported: the plans page knew, and checkout and the
 * sidebar did not.
 *
 * The fix is that there is now one value, and everything reading it is
 * subscribed. Invalidating refetches and notifies, so checkout, the sidebar,
 * the dashboard and the plans page cannot disagree about what the server said.
 */

export type EntitlementState = {
  /** Resolved. False only while the first request is in flight. */
  ready: boolean
  /** Whether premium content should be shown as available. */
  access: boolean
  status: 'active' | 'refunded' | 'revoked' | null
}

const OPEN: EntitlementState = { ready: true, access: true, status: null }
const PENDING: EntitlementState = { ready: false, access: false, status: null }
/** Fail closed: a network error must never present premium as available. */
const CLOSED: EntitlementState = { ready: true, access: false, status: null }

let state: EntitlementState = COMMERCE_ENABLED ? PENDING : OPEN
let inFlight: Promise<EntitlementState> | null = null
const listeners = new Set<() => void>()

function publish(next: EntitlementState) {
  // Referential stability matters: `useSyncExternalStore` re-renders whenever
  // the snapshot's identity changes, so an equal-but-new object on every
  // request would re-render fourteen components for nothing.
  if (
    state.ready === next.ready &&
    state.access === next.access &&
    state.status === next.status
  ) {
    return
  }
  state = next
  for (const listener of listeners) listener()
}

/**
 * Ask the server what this account holds, and tell everyone.
 *
 * Concurrent callers share one request — a purchase completing while the
 * window regains focus should not produce two.
 */
export function refreshEntitlement(): Promise<EntitlementState> {
  if (!COMMERCE_ENABLED) return Promise.resolve(OPEN)
  inFlight ??= fetch('/api/entitlement', { credentials: 'same-origin' })
    .then((r) => (r.ok ? r.json() : { access: false, status: null }))
    .then((body: { access?: boolean; status?: EntitlementState['status'] }) => {
      const next: EntitlementState = {
        ready: true,
        access: Boolean(body.access),
        status: body.status ?? null,
      }
      publish(next)
      return next
    })
    .catch(() => {
      publish(CLOSED)
      return CLOSED
    })
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

/**
 * Drop what we know and ask again — called after a purchase is verified.
 *
 * Kept as the name the payment flow already uses. It no longer merely clears
 * a cache: it refetches and notifies, which is the whole point.
 */
export function invalidateEntitlement(): Promise<EntitlementState> {
  return refreshEntitlement()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => state
/** Always pending during SSR: the server render has no session to read. */
const getServerSnapshot = () => (COMMERCE_ENABLED ? PENDING : OPEN)

export function useEntitlement(): EntitlementState {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    if (!COMMERCE_ENABLED) return
    // The first mount anywhere in the tree starts the one request.
    if (!state.ready) void refreshEntitlement()

    /**
     * Re-ask when the window comes back.
     *
     * Entitlement is server state and it changes without this tab doing
     * anything: a webhook arrives moments after the payment window closes, a
     * refund is processed, access is revoked. Coming back to the tab is the
     * cheapest honest moment to find out, and it costs one request.
     */
    const recheck = () => {
      if (document.visibilityState === 'visible') void refreshEntitlement()
    }
    window.addEventListener('focus', recheck)
    document.addEventListener('visibilitychange', recheck)
    return () => {
      window.removeEventListener('focus', recheck)
      document.removeEventListener('visibilitychange', recheck)
    }
  }, [])

  return snapshot
}
