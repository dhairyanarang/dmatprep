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

/**
 * A ticking clock, for the things that compare against a deadline.
 *
 * `useToday` caches once and never moves, which is right for a date and wrong
 * for "has this session's time run out?" — a tab left open for an hour would
 * still be answering that with the timestamp it first rendered at. This is an
 * external store rather than a `setState` in an effect so that it neither
 * upsets the React Compiler's effect rules nor re-renders on the server.
 */
let now = 0
let ticker: number | null = null
const nowListeners = new Set<() => void>()

function subscribeNow(listener: () => void) {
  nowListeners.add(listener)
  if (ticker === null) {
    ticker = window.setInterval(() => {
      now = Date.now()
      for (const l of nowListeners) l()
    }, 1000)
  }
  return () => {
    nowListeners.delete(listener)
    if (nowListeners.size === 0 && ticker !== null) {
      window.clearInterval(ticker)
      ticker = null
    }
  }
}

function getNow(): number {
  if (now === 0) now = Date.now()
  return now
}

export function useNow(): number {
  return useSyncExternalStore(subscribeNow, getNow, () => 0)
}
