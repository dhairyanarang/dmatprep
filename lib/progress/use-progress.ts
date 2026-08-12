'use client'

import { useSyncExternalStore } from 'react'

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
    toggleMilestone: progressStore.toggleMilestone,
    setKeyDates: progressStore.setKeyDates,
    recordSession: progressStore.recordSession,
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
