'use client'

import { useEffect, useState } from 'react'

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
 */

export type EntitlementState = {
  /** Resolved. False only while the first request is in flight. */
  ready: boolean
  /** Whether premium content should be shown as available. */
  access: boolean
  status: 'active' | 'refunded' | 'revoked' | null
}

const OPEN: EntitlementState = { ready: true, access: true, status: null }

let cached: Promise<EntitlementState> | null = null

function load(): Promise<EntitlementState> {
  cached ??= fetch('/api/entitlement', { credentials: 'same-origin' })
    .then((r) => (r.ok ? r.json() : { access: false, status: null }))
    .then((body: { access?: boolean; status?: EntitlementState['status'] }) => ({
      ready: true,
      access: Boolean(body.access),
      status: body.status ?? null,
    }))
    .catch(() => {
      cached = null
      // Fail closed for the interface. A network error must not present
      // premium as available; the server would refuse it anyway.
      return { ready: true, access: false, status: null } as EntitlementState
    })
  return cached
}

/** Drops the cache so the next read refetches — called after a purchase. */
export function invalidateEntitlement() {
  cached = null
}

export function useEntitlement(): EntitlementState {
  const [state, setState] = useState<EntitlementState>(
    COMMERCE_ENABLED ? { ready: false, access: false, status: null } : OPEN,
  )

  useEffect(() => {
    if (!COMMERCE_ENABLED) return
    let live = true
    load().then((next) => {
      if (live) setState(next)
    })
    return () => {
      live = false
    }
  }, [])

  return state
}
