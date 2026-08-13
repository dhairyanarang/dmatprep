import { migrateProgress, newAttemptId } from '@/lib/progress/migrate'
import type { ProgressStore } from '@/lib/progress/store'
import type { SectionId } from '@/lib/sections'
import {
  EMPTY_PROGRESS,
  withExposure,
  type ActiveSession,
  type AttemptInput,
  type AttemptRecord,
  type ExposureContext,
  type KeyDate,
  type PracticeDraft,
  type ProgressState,
  type SessionResult,
} from '@/lib/types/progress'

const STORAGE_KEY = 'dmat-prep:progress:v1'

/** Keep the attempt log bounded; the dashboard only ever needs aggregates. */
const MAX_ATTEMPTS = 5000

/**
 * Ids written locally but not yet accepted by the cloud.
 *
 * A queue of what is *outstanding* rather than a log of what has synced: it
 * stays small, it survives a reload, and it is the thing that makes a failed
 * upload a delay rather than a loss.
 */
const OUTBOX_KEY = 'dmat-prep:outbox:v1'

export type Outbox = {
  attemptIds: string[]
  sessionIds: string[]
  /** Set when the in-flight session or the mutable documents need pushing. */
  activeSession: boolean
  userState: boolean
  exposure: boolean
}

const EMPTY_OUTBOX: Outbox = {
  attemptIds: [],
  sessionIds: [],
  activeSession: false,
  userState: false,
  exposure: false,
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode or a full quota. The in-memory state stays usable, which is
    // better than refusing the answer the candidate just gave.
  }
}

/** Equal in everything that matters — that is, everything except when. */
function sameSession(a: ActiveSession, b: ActiveSession): boolean {
  return (
    a.id === b.id &&
    a.stageIndex === b.stageIndex &&
    a.currentIndex === b.currentIndex &&
    a.phase === b.phase &&
    a.stageEndsAt === b.stageEndsAt &&
    JSON.stringify(a.answers) === JSON.stringify(b.answers)
  )
}

function sameDraft(a: PracticeDraft, b: PracticeDraft): boolean {
  return (
    a.index === b.index &&
    a.submitted === b.submitted &&
    a.hintsUsed === b.hintsUsed &&
    a.filter === b.filter &&
    JSON.stringify(a.selection) === JSON.stringify(b.selection) &&
    a.questionIds.length === b.questionIds.length
  )
}

function createLocalStorageStore() {
  const listeners = new Set<() => void>()
  let cache: ProgressState | null = null
  let outboxCache: Outbox | null = null

  const notify = () => listeners.forEach((l) => l())

  const read = (): ProgressState => {
    if (cache) return cache
    cache =
      typeof window === 'undefined'
        ? EMPTY_PROGRESS
        : migrateProgress(readJson<unknown>(STORAGE_KEY, null))
    return cache
  }

  const write = (next: ProgressState) => {
    cache = next
    writeJson(STORAGE_KEY, next)
    notify()
  }

  const readOutbox = (): Outbox => {
    outboxCache ??= readJson<Outbox>(OUTBOX_KEY, EMPTY_OUTBOX)
    return outboxCache
  }

  const writeOutbox = (next: Outbox) => {
    outboxCache = next
    writeJson(OUTBOX_KEY, next)
    // Deliberately no notify(): the outbox is plumbing, and re-rendering the
    // whole tree because a row uploaded would be motion with no meaning.
    for (const l of syncListeners) l()
  }

  const syncListeners = new Set<() => void>()

  const queue = (patch: Partial<Outbox>) => {
    const current = readOutbox()
    writeOutbox({
      ...current,
      ...patch,
      attemptIds: patch.attemptIds
        ? [...new Set([...current.attemptIds, ...patch.attemptIds])].slice(-MAX_ATTEMPTS)
        : current.attemptIds,
      sessionIds: patch.sessionIds
        ? [...new Set([...current.sessionIds, ...patch.sessionIds])]
        : current.sessionIds,
    })
  }

  const store: ProgressStore & {
    getOutbox(): Outbox
    clearOutbox(patch: Partial<Outbox>): void
    subscribeSync(listener: () => void): () => void
  } = {
    getSnapshot: read,
    getServerSnapshot: () => EMPTY_PROGRESS,

    subscribe(listener) {
      listeners.add(listener)

      // Keep other tabs in sync.
      const onStorage = (e: StorageEvent) => {
        if (e.key !== STORAGE_KEY) return
        cache = null
        notify()
      }
      window.addEventListener('storage', onStorage)

      return () => {
        listeners.delete(listener)
        window.removeEventListener('storage', onStorage)
      }
    },

    recordAttempt(input: AttemptInput) {
      const current = read()
      const attempt: AttemptRecord = { ...input, id: input.id ?? newAttemptId() }

      // An id already present means this exact attempt was recorded before —
      // a double-submit, or a replayed queue. Recording it twice would inflate
      // every count derived from the log.
      if (current.attempts.some((a) => a.id === attempt.id)) return

      write({
        ...current,
        attempts: [...current.attempts, attempt].slice(-MAX_ATTEMPTS),
        lastSession: {
          sectionId: attempt.sectionId,
          questionId: attempt.questionId,
          at: attempt.at,
        },
      })
      queue({ attemptIds: [attempt.id] })
    },

    recordSession(result: SessionResult) {
      const current = read()
      if (current.sessions.some((s) => s.id === result.id)) return
      write({ ...current, sessions: [...current.sessions, result].slice(-100) })
      queue({ sessionIds: [result.id] })
    },

    recordExposure(
      shown: readonly { questionId: string; sectionId: SectionId }[],
      context: ExposureContext,
    ) {
      if (shown.length === 0) return
      const current = read()
      write({
        ...current,
        exposure: withExposure(current.exposure, shown, context, new Date().toISOString()),
      })
      queue({ exposure: true })
    },

    setActiveSession(session: ActiveSession | null) {
      const current = read()
      if (current.activeSession === session) return

      // A restore point that differs only in its timestamp is not a change. The
      // guard matters: writing notifies every reader, and a reader that feeds
      // the writer would loop forever on `updatedAt` alone.
      if (current.activeSession && session && sameSession(current.activeSession, session)) return

      write({ ...current, activeSession: session })
      queue({ activeSession: true })
    },

    setPracticeDraft(draft: PracticeDraft) {
      const current = read()
      const existing = current.practiceDrafts[draft.key]
      // Same guard as the session above, for the same reason.
      if (existing && sameDraft(existing, draft)) return
      write({ ...current, practiceDrafts: { ...current.practiceDrafts, [draft.key]: draft } })
    },

    clearPracticeDraft(key: string) {
      const current = read()
      if (!current.practiceDrafts[key]) return
      const next = { ...current.practiceDrafts }
      delete next[key]
      write({ ...current, practiceDrafts: next })
    },

    toggleMilestone(id: string) {
      const current = read()
      write({
        ...current,
        milestones: { ...current.milestones, [id]: !current.milestones[id] },
      })
      queue({ userState: true })
    },

    setKeyDates(dates: KeyDate[]) {
      const current = read()
      write({ ...current, keyDates: dates })
      queue({ userState: true })
    },

    replaceAll(next: ProgressState) {
      write(next)
    },

    reset() {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
        window.localStorage.removeItem(OUTBOX_KEY)
      } catch {
        // ignore
      }
      cache = EMPTY_PROGRESS
      outboxCache = EMPTY_OUTBOX
      notify()
    },

    getOutbox: readOutbox,

    clearOutbox(patch: Partial<Outbox>) {
      const current = readOutbox()
      writeOutbox({
        ...current,
        attemptIds: patch.attemptIds
          ? current.attemptIds.filter((id) => !patch.attemptIds!.includes(id))
          : current.attemptIds,
        sessionIds: patch.sessionIds
          ? current.sessionIds.filter((id) => !patch.sessionIds!.includes(id))
          : current.sessionIds,
        activeSession: patch.activeSession ? false : current.activeSession,
        userState: patch.userState ? false : current.userState,
        exposure: patch.exposure ? false : current.exposure,
      })
    },

    subscribeSync(listener: () => void) {
      syncListeners.add(listener)
      return () => syncListeners.delete(listener)
    },
  }

  return store
}

/** One store per browser session. */
export const progressStore = createLocalStorageStore()
