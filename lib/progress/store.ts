import type {
  ActiveSession,
  AttemptInput,
  ExposureContext,
  KeyDate,
  PracticeDraft,
  ProgressState,
  SessionResult,
} from '@/lib/types/progress'
import type { SectionId } from '@/lib/sections'

/**
 * The single seam between the app and wherever progress happens to live.
 *
 * Everything in the UI reads and writes through this interface. The local
 * adapter is the only thing that touches `localStorage`, and the cloud layer
 * sits *behind* it rather than replacing it: writes always land locally first,
 * so answering a question never waits on a network round trip, and a failed
 * upload can never lose an answer that has already been shown as recorded.
 */
export interface ProgressStore {
  /** Must return a referentially stable value until something actually changes. */
  getSnapshot(): ProgressState
  /** Used during SSR and hydration; always the empty state. */
  getServerSnapshot(): ProgressState
  subscribe(listener: () => void): () => void

  /** Returns the stored record, id included, so a caller can link to it. */
  recordAttempt(attempt: AttemptInput): void
  /** Store a completed timed session so its result survives a reload. */
  recordSession(result: SessionResult): void
  toggleMilestone(id: string): void
  setKeyDates(dates: KeyDate[]): void

  /** Note that questions have been shown, spending them from one pool only. */
  recordExposure(
    shown: readonly { questionId: string; sectionId: SectionId }[],
    context: ExposureContext,
  ): void

  /** In-flight timed or mock session. `null` clears it. */
  setActiveSession(session: ActiveSession | null): void
  /** Where an untimed practice run had got to. */
  setPracticeDraft(draft: PracticeDraft): void
  clearPracticeDraft(key: string): void

  /** Replace everything — used by the cloud merge, never by the UI. */
  replaceAll(next: ProgressState): void
  reset(): void
}
