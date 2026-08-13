'use client'

import { useSyncExternalStore } from 'react'

import { getSyncStatus, pendingCount, subscribeSyncStatus } from '@/lib/progress/cloud-sync'
import { progressStore } from '@/lib/progress/local-storage-store'
import type { SectionId } from '@/lib/sections'
import { sectionStats, type ProgressState, type SectionStats } from '@/lib/types/progress'

/**
 * Read progress in a way that survives SSR.
 *
 * `useSyncExternalStore` renders the server snapshot during hydration and only
 * then swaps to the real client snapshot, which is what keeps localStorage from
 * producing hydration mismatches. Never read `localStorage` directly in a
 * component — go through here.
 *
 * This stays the single read path whether or not the candidate is signed in.
 * The cloud layer writes *into* this store rather than replacing it, so no
 * component has to know where the data came from.
 */
export function useProgress(): ProgressState {
  return useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
    progressStore.getServerSnapshot,
  )
}

export function useSectionStats(sectionId: SectionId): SectionStats {
  const state = useProgress()
  return sectionStats(state, sectionId)
}

/** Mutations are stable for the life of the store, so they never need memoising. */
export function useProgressActions() {
  return {
    recordAttempt: progressStore.recordAttempt,
    recordSession: progressStore.recordSession,
    recordExposure: progressStore.recordExposure,
    setActiveSession: progressStore.setActiveSession,
    setPracticeDraft: progressStore.setPracticeDraft,
    clearPracticeDraft: progressStore.clearPracticeDraft,
    toggleMilestone: progressStore.toggleMilestone,
    setKeyDates: progressStore.setKeyDates,
    reset: progressStore.reset,
  }
}

/**
 * True once the client snapshot is live. Use it to hold back progress-dependent
 * UI for one paint instead of flashing zeroes over real numbers.
 */
export function useProgressReady(): boolean {
  return useSyncExternalStore(
    progressStore.subscribe,
    () => true,
    () => false,
  )
}

/** Sync state, for the one small indicator in the account menu. */
export function useSyncState(): { status: ReturnType<typeof getSyncStatus>; pending: number } {
  const status = useSyncExternalStore(
    subscribeSyncStatus,
    getSyncStatus,
    () => 'idle' as const,
  )
  const pending = useSyncExternalStore(
    subscribeSyncStatus,
    pendingCount,
    () => 0,
  )
  return { status, pending }
}
