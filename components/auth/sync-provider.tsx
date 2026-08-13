'use client'

import { useEffect, useRef } from 'react'

import { useAuth } from '@/lib/auth/use-auth'
import {
  clearLocalAfterSignOut,
  pendingCount,
  subscribeSyncStatus,
  sync,
} from '@/lib/progress/cloud-sync'

/**
 * When progress moves between this browser and the cloud.
 *
 * Four triggers, and nothing else:
 *
 *   sign-in            a full pull-then-push, which is also the guest → account
 *                      migration;
 *   returning to the   a pull, in case the same account was used elsewhere, plus
 *   tab                a push of anything queued while away;
 *   coming back        a push, because the outbox is the record of what a failed
 *   online             write left behind;
 *   a queued write     a push, debounced, so twenty answers in a mock become one
 *                      request rather than twenty.
 *
 * Deliberately not on every render or every store change: practice must not turn
 * into a network conversation.
 */
export function SyncProvider() {
  const auth = useAuth()
  const userId = auth.status === 'authenticated' ? auth.user.id : null
  const previousUser = useRef<string | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    // Signing out clears this browser's copy so a shared machine does not leave
    // one person's history on screen for the next.
    if (previousUser.current && !userId) clearLocalAfterSignOut()
    previousUser.current = userId
    if (!userId) return

    void sync(userId)

    const pushSoon = () => {
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        if (pendingCount() > 0) void sync(userId, { withPull: false })
      }, 2_000)
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void sync(userId)
    }

    window.addEventListener('online', pushSoon)
    document.addEventListener('visibilitychange', onVisible)
    // Fires whenever the outbox changes in this tab — the actual "something
    // needs sending" signal, rather than a poll.
    const unsubscribe = subscribeSyncStatus(pushSoon)

    // A backstop for the case where a push failed and nothing has been written
    // since: without it, a queued answer would sit there until the next answer.
    const interval = window.setInterval(pushSoon, 60_000)

    return () => {
      window.removeEventListener('online', pushSoon)
      document.removeEventListener('visibilitychange', onVisible)
      unsubscribe()
      window.clearInterval(interval)
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [userId])

  return null
}
