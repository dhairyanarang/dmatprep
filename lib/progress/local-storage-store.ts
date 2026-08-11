import type { ProgressStore } from '@/lib/progress/store'
import { EMPTY_PROGRESS, type AttemptRecord, type KeyDate, type ProgressState } from '@/lib/types/progress'

const STORAGE_KEY = 'dmat-prep:progress:v1'

/** Keep the attempt log bounded; the dashboard only ever needs aggregates. */
const MAX_ATTEMPTS = 5000

function parse(raw: string | null): ProgressState {
  if (!raw) return EMPTY_PROGRESS
  try {
    const parsed = JSON.parse(raw) as Partial<ProgressState>
    if (parsed?.version !== 1 || !Array.isArray(parsed.attempts)) return EMPTY_PROGRESS
    return {
      version: 1,
      attempts: parsed.attempts,
      milestones: parsed.milestones ?? {},
      keyDates: Array.isArray(parsed.keyDates) ? parsed.keyDates : [],
      lastSession: parsed.lastSession,
    }
  } catch {
    // Corrupted or hand-edited storage shouldn't take the whole app down.
    return EMPTY_PROGRESS
  }
}

function createLocalStorageStore(): ProgressStore {
  const listeners = new Set<() => void>()
  let cache: ProgressState | null = null

  const notify = () => listeners.forEach((l) => l())

  const read = (): ProgressState => {
    if (cache) return cache
    cache = typeof window === 'undefined'
      ? EMPTY_PROGRESS
      : parse(window.localStorage.getItem(STORAGE_KEY))
    return cache
  }

  const write = (next: ProgressState) => {
    cache = next
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Private mode or a full quota: keep the in-memory state usable anyway.
    }
    notify()
  }

  return {
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

    recordAttempt(attempt: AttemptRecord) {
      const current = read()
      const attempts = [...current.attempts, attempt].slice(-MAX_ATTEMPTS)
      write({
        ...current,
        attempts,
        lastSession: {
          sectionId: attempt.sectionId,
          questionId: attempt.questionId,
          at: attempt.at,
        },
      })
    },

    toggleMilestone(id: string) {
      const current = read()
      write({
        ...current,
        milestones: { ...current.milestones, [id]: !current.milestones[id] },
      })
    },

    setKeyDates(dates: KeyDate[]) {
      const current = read()
      write({ ...current, keyDates: dates })
    },

    reset() {
      try {
        window.localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
      cache = EMPTY_PROGRESS
      notify()
    },
  }
}

/** One store per browser session. */
export const progressStore: ProgressStore = createLocalStorageStore()
