'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * GAM progress, kept in its own store.
 *
 * `lib/progress/` is typed to `SectionId` and to a bank of standalone questions.
 * GAM has neither: its attempts belong to a pack, and a pack is not a section.
 * Widening the Core store to accommodate that would change Module A's data
 * model, which is exactly what this module must not do — so this is a parallel
 * store that follows the same conventions rather than an extension of that one.
 *
 * The conventions it keeps, because they were learned the hard way:
 *
 *   - only this file touches `window.localStorage`;
 *   - reads go through `useSyncExternalStore`, so a first render never reads
 *     storage and hydration cannot mismatch;
 *   - a session's deadline is an absolute timestamp, never a remaining-seconds
 *     counter, which is a lie the moment the tab is closed;
 *   - attempts are append-only.
 */

const KEY = 'dmat-prep:gam:v1'

export type GamAttempt = {
  id: string
  packId: string
  questionId: string
  chosenOptionId: string
  correct: boolean
  at: string
  mode: GamMode
}

export type GamMode = 'practice' | 'timed'

export type GamSessionResult = {
  id: string
  mode: GamMode
  packIds: string[]
  at: string
  durationMs: number
  timedOut: boolean
  total: number
  answered: number
  correct: number
}

/** Work in progress on one pack, so a reload does not cost it. */
export type GamDraft = {
  key: string
  packIds: string[]
  mode: GamMode
  index: number
  answers: Record<string, string>
  submitted: boolean
  /** Absolute deadline, present only for a timed session. */
  endsAt?: string
  startedAt: string
}

export type GamState = {
  attempts: GamAttempt[]
  sessions: GamSessionResult[]
  drafts: Record<string, GamDraft>
}

const EMPTY: GamState = { attempts: [], sessions: [], drafts: {} }

let state: GamState = EMPTY
let hydrated = false
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((l) => l())

function read(): GamState {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<GamState>
    return {
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      drafts: parsed.drafts && typeof parsed.drafts === 'object' ? parsed.drafts : {},
    }
  } catch {
    // A private window, cleared site data, or storage the browser refuses to
    // hand over. An empty history is the right answer to all of them.
    return EMPTY
  }
}

function write(next: GamState) {
  state = next
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Writing may fail where reading did not. The session continues in memory
    // rather than throwing away the candidate's answers.
  }
  emit()
}

function ensureHydrated() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  state = read()
  emit()
}

const subscribe = (listener: () => void) => {
  ensureHydrated()
  listeners.add(listener)
  // Another tab answering a question should be visible in this one.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return
    state = read()
    emit()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

const getSnapshot = () => state
const getServerSnapshot = () => EMPTY

export function useGamProgress(): GamState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** False until the store has read storage, so a runner can hold its first paint. */
export function useGamReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hydrated,
    () => false,
  )
}

export function useGamActions() {
  const recordAttempts = useCallback((attempts: Omit<GamAttempt, 'id' | 'at'>[]) => {
    if (!attempts.length) return
    const at = new Date().toISOString()
    const added = attempts.map((a, i) => ({
      ...a,
      // Client-minted and stable, so a retry can never count an answer twice.
      id: `${a.questionId}:${at}:${i}`,
      at,
    }))
    const seen = new Set(state.attempts.map((a) => a.id))
    write({ ...state, attempts: [...state.attempts, ...added.filter((a) => !seen.has(a.id))] })
  }, [])

  const recordSession = useCallback((session: GamSessionResult) => {
    if (state.sessions.some((s) => s.id === session.id)) return
    write({ ...state, sessions: [...state.sessions, session] })
  }, [])

  const saveDraft = useCallback((draft: GamDraft) => {
    write({ ...state, drafts: { ...state.drafts, [draft.key]: draft } })
  }, [])

  const clearDraft = useCallback((key: string) => {
    const drafts = { ...state.drafts }
    delete drafts[key]
    write({ ...state, drafts })
  }, [])

  return { recordAttempts, recordSession, saveDraft, clearDraft }
}

/* ------------------------------------------------------------------ derived */

/**
 * Aggregates are always derived, never stored — the Core module's rule, and for
 * the same reason: a stored total is a second source of truth that drifts.
 */
export function packStats(state: GamState, packId: string) {
  const attempts = state.attempts.filter((a) => a.packId === packId)
  const answered = new Set(attempts.map((a) => a.questionId))
  const correct = new Set(attempts.filter((a) => a.correct).map((a) => a.questionId))
  return {
    attempted: answered.size,
    correct: correct.size,
    accuracy: attempts.length ? attempts.filter((a) => a.correct).length / attempts.length : 0,
  }
}
