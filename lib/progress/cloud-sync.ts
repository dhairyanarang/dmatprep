'use client'

import { progressStore } from '@/lib/progress/local-storage-store'
import { mergeProgress } from '@/lib/progress/merge'
import { getSupabaseBrowserClient, type DmatSupabaseClient } from '@/lib/supabase/client'
import type { AttemptRow, ExposureRow, SessionRow } from '@/lib/supabase/types'
import type {
  ActiveSession,
  AttemptRecord,
  ExposureEntry,
  ProgressState,
  SessionResult,
} from '@/lib/types/progress'

/**
 * Keeping a signed-in candidate's progress in Supabase.
 *
 * The local store stays the render source at all times — practice must not wait
 * on a network round trip — and this module moves records between it and the
 * cloud in two directions:
 *
 *   pull   on sign-in and on return to the tab: read everything, merge, write
 *          back locally. The merge is a union of immutable records, so this is
 *          also the guest → account migration; there is no separate code path
 *          for "the first time", which is what stops the two from drifting.
 *
 *   push   whatever the outbox says is outstanding, upserted by primary key so
 *          a retry after a failed write can never double-count an attempt.
 *
 * Everything here is best-effort. A failed request leaves the outbox untouched
 * and the candidate none the wiser; nothing in the UI blocks on it.
 */

const LAST_TOUCH_KEY = 'dmat-prep:documents-touched:v1'
const MIGRATED_KEY = 'dmat-prep:migrated-for:v1'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

let status: SyncStatus = 'idle'
const listeners = new Set<() => void>()

function setStatus(next: SyncStatus) {
  if (status === next) return
  status = next
  for (const l of listeners) l()
}

export function getSyncStatus(): SyncStatus {
  return status
}

export function subscribeSyncStatus(listener: () => void) {
  listeners.add(listener)
  const off = progressStore.subscribeSync(listener)
  return () => {
    listeners.delete(listener)
    off()
  }
}

/** How much is still waiting to reach the cloud. */
export function pendingCount(): number {
  const outbox = progressStore.getOutbox()
  return (
    outbox.attemptIds.length +
    outbox.sessionIds.length +
    (outbox.activeSession ? 1 : 0) +
    (outbox.userState ? 1 : 0) +
    (outbox.exposure ? 1 : 0)
  )
}

// ---------------------------------------------------------------------------
// Row mapping. Kept in one place so the wire format and the app's own types can
// each change without the other having to.
// ---------------------------------------------------------------------------

const attemptToRow = (a: AttemptRecord, userId: string) => ({
  id: a.id,
  user_id: userId,
  question_id: a.questionId,
  section: a.sectionId,
  difficulty: a.difficulty,
  mode: a.mode ?? ('practice' as const),
  selection: a.selection,
  is_correct: a.correct,
  hints_used: a.hintsUsed ?? 0,
  duration_ms: a.durationMs ?? null,
  session_id: a.sessionId ?? null,
  attempted_at: a.at,
})

const rowToAttempt = (r: AttemptRow): AttemptRecord => ({
  id: r.id,
  questionId: r.question_id,
  sectionId: r.section,
  difficulty: r.difficulty,
  correct: r.is_correct,
  selection: r.selection ?? {},
  mode: r.mode,
  sessionId: r.session_id ?? undefined,
  at: r.attempted_at,
  durationMs: r.duration_ms ?? undefined,
  hintsUsed: (r.hints_used ?? 0) as 0 | 1 | 2 | 3,
})

const resultToRow = (s: SessionResult, userId: string) => ({
  id: s.id,
  user_id: userId,
  mode: s.mode,
  sections: s.sections,
  status: 'completed' as const,
  // A finished session keeps only the list of questions it used; the per-stage
  // labels were presentation and are rebuilt from the bank when it is reviewed.
  stages: [{ sectionId: s.sections[0], label: '', unitNoun: '', questionIds: s.questionIds }],
  phase: 'done' as const,
  started_at: new Date(new Date(s.at).getTime() - s.durationMs).toISOString(),
  completed_at: s.at,
  timed_out: s.timedOut,
  duration_ms: s.durationMs,
  total: s.total,
  answered: s.answered,
  correct: s.correct,
})

const rowToResult = (r: SessionRow): SessionResult => ({
  id: r.id,
  mode: r.mode,
  sections: r.sections ?? [],
  at: r.completed_at ?? r.updated_at,
  durationMs: r.duration_ms ?? 0,
  timedOut: r.timed_out,
  total: r.total ?? 0,
  answered: r.answered ?? 0,
  correct: r.correct ?? 0,
  questionIds: (r.stages ?? []).flatMap((stage) => stage.questionIds ?? []),
})

const activeToRow = (s: ActiveSession, userId: string) => ({
  id: s.id,
  user_id: userId,
  mode: s.mode,
  sections: [...new Set(s.stages.map((stage) => stage.sectionId))],
  status: 'in_progress' as const,
  stages: s.stages,
  stage_index: s.stageIndex,
  current_index: s.currentIndex,
  answers: s.answers,
  phase: s.phase,
  started_at: s.startedAt,
  stage_ends_at: s.stageEndsAt,
})

const rowToActive = (r: SessionRow): ActiveSession | null => {
  const stages = r.stages ?? []
  if (stages.length === 0) return null
  return {
    id: r.id,
    mode: r.mode,
    // Route and title are presentation, not state; the launcher supplies them
    // when it adopts the row, so a stale copy cannot send a resume elsewhere.
    route: '',
    title: '',
    stages,
    stageIndex: r.stage_index ?? 0,
    currentIndex: r.current_index ?? 0,
    answers: r.answers ?? {},
    phase: r.phase === 'break' ? 'break' : 'running',
    startedAt: r.started_at,
    stageEndsAt: r.stage_ends_at,
    minutesPerStage: 0,
    untimed: r.stage_ends_at === null,
    updatedAt: r.updated_at,
  }
}

const exposureToRow = (e: ExposureEntry, userId: string) => ({
  user_id: userId,
  question_id: e.questionId,
  context: e.context,
  section: e.sectionId,
  times_seen: e.timesSeen,
  first_seen_at: e.firstSeenAt,
  last_seen_at: e.lastSeenAt,
})

const rowToExposure = (r: ExposureRow): ExposureEntry => ({
  questionId: r.question_id,
  context: r.context,
  sectionId: r.section,
  timesSeen: r.times_seen,
  firstSeenAt: r.first_seen_at,
  lastSeenAt: r.last_seen_at,
})

// ---------------------------------------------------------------------------

function localTouchedAt(): string | null {
  try {
    return window.localStorage.getItem(LAST_TOUCH_KEY)
  } catch {
    return null
  }
}

export function markDocumentsTouched() {
  try {
    window.localStorage.setItem(LAST_TOUCH_KEY, new Date().toISOString())
  } catch {
    // ignore
  }
}

/**
 * Read everything the cloud holds and fold it into the local store.
 *
 * Also the migration path: a guest who signs in has local records the cloud has
 * never seen, and they are pushed straight afterwards. Nothing is deleted on
 * either side, so an interrupted sign-in can simply be run again.
 */
export async function pull(supabase: DmatSupabaseClient, userId: string): Promise<void> {
  const [attempts, sessions, exposure, state] = await Promise.all([
    supabase.from('attempts').select('*').eq('user_id', userId),
    supabase.from('sessions').select('*').eq('user_id', userId),
    supabase.from('question_exposure').select('*').eq('user_id', userId),
    supabase.from('user_state').select('*').eq('user_id', userId).maybeSingle(),
  ])

  const error = attempts.error ?? sessions.error ?? exposure.error ?? state.error
  if (error) throw error

  const rows = sessions.data ?? []
  const completed = rows.filter((r) => r.status === 'completed')
  const inFlight = rows.find((r) => r.status === 'in_progress')

  const cloud: Partial<ProgressState> & { documentsUpdatedAt?: string } = {
    attempts: (attempts.data ?? []).map(rowToAttempt),
    sessions: completed.map(rowToResult),
    exposure: (exposure.data ?? []).map(rowToExposure),
    activeSession: inFlight ? rowToActive(inFlight) : null,
    milestones: state.data?.milestones ?? {},
    keyDates: state.data?.key_dates ?? [],
    documentsUpdatedAt: state.data?.updated_at,
  }

  const merged = mergeProgress(progressStore.getSnapshot(), cloud, localTouchedAt())
  progressStore.replaceAll(merged)
}

/**
 * Send whatever is outstanding.
 *
 * Every write is an upsert keyed on the primary key, so replaying the queue is
 * harmless — which is what lets the queue be cleared only *after* the server has
 * accepted the rows, rather than optimistically.
 */
export async function push(supabase: DmatSupabaseClient, userId: string): Promise<void> {
  const outbox = progressStore.getOutbox()
  const state = progressStore.getSnapshot()

  if (outbox.attemptIds.length) {
    const pending = state.attempts.filter((a) => outbox.attemptIds.includes(a.id))
    if (pending.length) {
      const { error } = await supabase
        .from('attempts')
        .upsert(
          pending.map((a) => attemptToRow(a, userId)),
          { onConflict: 'id', ignoreDuplicates: true },
        )
      if (error) throw error
    }
    progressStore.clearOutbox({ attemptIds: outbox.attemptIds })
  }

  if (outbox.sessionIds.length) {
    const pending = state.sessions.filter((s) => outbox.sessionIds.includes(s.id))
    if (pending.length) {
      const { error } = await supabase
        .from('sessions')
        .upsert(
          pending.map((s) => resultToRow(s, userId)),
          { onConflict: 'id' },
        )
      if (error) throw error
    }
    progressStore.clearOutbox({ sessionIds: outbox.sessionIds })
  }

  if (outbox.activeSession) {
    const active = state.activeSession
    if (active) {
      const { error } = await supabase
        .from('sessions')
        .upsert(activeToRow(active, userId), { onConflict: 'id' })
      if (error) throw error
    }
    progressStore.clearOutbox({ activeSession: true })
  }

  if (outbox.exposure && state.exposure.length) {
    const { error } = await supabase
      .from('question_exposure')
      .upsert(
        state.exposure.map((e) => exposureToRow(e, userId)),
        { onConflict: 'user_id,question_id,context' },
      )
    if (error) throw error
    progressStore.clearOutbox({ exposure: true })
  }

  if (outbox.userState) {
    const { error } = await supabase.from('user_state').upsert(
      {
        user_id: userId,
        milestones: state.milestones,
        key_dates: state.keyDates,
      },
      { onConflict: 'user_id' },
    )
    if (error) throw error
    progressStore.clearOutbox({ userState: true })
  }
}

let inFlight: Promise<void> | null = null

/**
 * One full cycle: pull, then push. Serialised, so two triggers arriving together
 * — a sign-in and a tab focus, say — cannot interleave two merges.
 */
export function sync(userId: string, { withPull = true } = {}): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return Promise.resolve()
  if (inFlight) return inFlight

  setStatus('syncing')

  inFlight = (async () => {
    try {
      if (withPull) await pull(supabase, userId)
      await push(supabase, userId)
      try {
        window.localStorage.setItem(MIGRATED_KEY, userId)
      } catch {
        // ignore
      }
      setStatus(pendingCount() > 0 ? 'error' : 'synced')
    } catch {
      // The outbox still holds everything unsent, so the next trigger retries.
      setStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error')
    } finally {
      inFlight = null
    }
  })()

  return inFlight
}

/** Whether this browser has already folded its guest history into this account. */
export function hasMigrated(userId: string): boolean {
  try {
    return window.localStorage.getItem(MIGRATED_KEY) === userId
  } catch {
    return false
  }
}

/**
 * Forget the signed-in copy on sign-out.
 *
 * The cloud keeps everything; what is dropped is this browser's cache of it, so
 * a shared machine does not leave one person's attempts on screen for the next.
 */
export function clearLocalAfterSignOut() {
  progressStore.reset()
  try {
    window.localStorage.removeItem(MIGRATED_KEY)
    window.localStorage.removeItem(LAST_TOUCH_KEY)
  } catch {
    // ignore
  }
}
