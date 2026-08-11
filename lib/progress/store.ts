import type { AttemptRecord, KeyDate, ProgressState } from '@/lib/types/progress'

/**
 * The single seam between the app and wherever progress happens to live.
 *
 * Everything in the UI reads and writes through this interface, and only the
 * adapter below knows about `localStorage`. Moving to a real backend later means
 * writing one new adapter — no component changes.
 */
export interface ProgressStore {
  /** Must return a referentially stable value until something actually changes. */
  getSnapshot(): ProgressState
  /** Used during SSR and hydration; always the empty state. */
  getServerSnapshot(): ProgressState
  subscribe(listener: () => void): () => void

  recordAttempt(attempt: AttemptRecord): void
  toggleMilestone(id: string): void
  setKeyDates(dates: KeyDate[]): void
  reset(): void
}
