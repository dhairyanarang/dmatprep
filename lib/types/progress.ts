import type { SectionId } from '@/lib/sections'
import type { Difficulty, Selection } from '@/lib/types/question'

export type AttemptRecord = {
  questionId: string
  sectionId: SectionId
  difficulty: Difficulty
  correct: boolean
  selection: Selection
  /** ISO timestamp. */
  at: string
  /**
   * Recorded from day one even though practice is untimed, so a timed mode can
   * be added later without a schema migration.
   */
  durationMs?: number
  /**
   * How far up the hint ladder this attempt went. Absent on attempts recorded
   * before hints existed, which is why it is optional rather than defaulted.
   */
  hintsUsed?: 0 | 1 | 2 | 3
}

/** A date the user adds themselves. The two fixed exam dates are content, not state. */
export type KeyDate = {
  id: string
  label: string
  /** ISO date, YYYY-MM-DD. */
  date: string
}

export type ProgressState = {
  /** Bumped when the shape changes, so a migration has something to switch on. */
  version: 1
  attempts: AttemptRecord[]
  milestones: Record<string, boolean>
  keyDates: KeyDate[]
  lastSession?: {
    sectionId: SectionId
    questionId: string
    at: string
  }
}

export const EMPTY_PROGRESS: ProgressState = {
  version: 1,
  attempts: [],
  milestones: {},
  keyDates: [],
}

export type DifficultyStats = { attempts: number; correct: number }

export type SectionStats = {
  /** Total attempts, including repeats of the same question. */
  attempts: number
  correct: number
  /** 0–1, or null when nothing has been attempted yet. */
  accuracy: number | null
  /** Distinct questions seen at least once. */
  uniqueQuestions: number
  byDifficulty: Record<Difficulty, DifficultyStats>
  lastAttemptAt?: string
}

const emptyStats = (): SectionStats => ({
  attempts: 0,
  correct: 0,
  accuracy: null,
  uniqueQuestions: 0,
  byDifficulty: {
    low: { attempts: 0, correct: 0 },
    medium: { attempts: 0, correct: 0 },
    high: { attempts: 0, correct: 0 },
  },
})

/**
 * Stats are always derived from `attempts`, never stored alongside it — that way
 * they cannot drift out of agreement with the underlying record.
 */
export function sectionStats(state: ProgressState, sectionId: SectionId): SectionStats {
  const stats = emptyStats()
  const seen = new Set<string>()

  for (const a of state.attempts) {
    if (a.sectionId !== sectionId) continue
    stats.attempts += 1
    if (a.correct) stats.correct += 1
    seen.add(a.questionId)

    const bucket = stats.byDifficulty[a.difficulty]
    bucket.attempts += 1
    if (a.correct) bucket.correct += 1

    if (!stats.lastAttemptAt || a.at > stats.lastAttemptAt) stats.lastAttemptAt = a.at
  }

  stats.uniqueQuestions = seen.size
  stats.accuracy = stats.attempts > 0 ? stats.correct / stats.attempts : null
  return stats
}

/** Question ids already answered correctly at least once, for "unseen first" ordering. */
export function answeredCorrectly(state: ProgressState, sectionId: SectionId): Set<string> {
  const out = new Set<string>()
  for (const a of state.attempts) {
    if (a.sectionId === sectionId && a.correct) out.add(a.questionId)
  }
  return out
}
