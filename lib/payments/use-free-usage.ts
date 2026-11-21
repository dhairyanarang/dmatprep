'use client'

import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import { FREE_TOTAL } from '@/lib/payments/free-quota'

/**
 * How much of the free sample this candidate has actually worked through.
 *
 * Distinct questions attempted, against the size of the free set. Only shown
 * to someone without Pro, which is what makes the count honest: without an
 * entitlement every question the app will mark comes from the free 150, so
 * "distinct questions attempted" and "free questions used" are the same
 * number. For a Pro account they would not be, which is why the card that uses
 * this does not render for one.
 *
 * Derived from attempts, never stored — the same rule as every other figure in
 * the product, so this can never drift from the section pages.
 */
export function useFreeUsage(): { ready: boolean; used: number; total: number } {
  const progress = useProgress()
  const ready = useProgressReady()

  if (!ready) return { ready: false, used: 0, total: FREE_TOTAL }

  const used = new Set(progress.attempts.map((a) => a.questionId)).size
  return { ready: true, used: Math.min(used, FREE_TOTAL), total: FREE_TOTAL }
}
