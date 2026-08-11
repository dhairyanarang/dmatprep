'use client'

import { useSyncExternalStore } from 'react'

/**
 * Today's date, resolved on the client only.
 *
 * The current date can't be read during render without a hydration mismatch,
 * and a prerendered page would otherwise bake in its build date. This mirrors
 * the progress store: a null server snapshot, and a client snapshot that is
 * cached so it stays referentially stable across renders.
 */
let cachedNow: number | null = null

const subscribe = () => () => {}

function getSnapshot(): number {
  cachedNow ??= Date.now()
  return cachedNow
}

const getServerSnapshot = (): null => null

export function useToday(): Date | null {
  const timestamp = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return timestamp === null ? null : new Date(timestamp)
}
