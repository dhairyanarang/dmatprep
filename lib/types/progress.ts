import type { SectionId } from '@/lib/sections'
import type { Difficulty, Selection } from '@/lib/types/question'

/**
 * Where an attempt came from. Absent on attempts recorded before timed modes
 * existed, which are all ordinary practice.
 */
export type PracticeMode = 'practice' | 'quick' | 'diagnostic' | 'timed' | 'simulation'

export const isExamMode = (mode: PracticeMode | undefined): boolean =>
  mode === 'timed' || mode === 'simulation' || mode === 'diagnostic'

/**
 * Learning and assessment are different measurements and must not be averaged
 * together.
 *
 * An untimed attempt with three hints available says something about
 * understanding; a mock attempt under a clock with none says something about
 * exam performance. Mixing them produces a number that means neither. Readiness
 * may read all four buckets, but only ever separately.
 */
export type MetricBucket = 'practice' | 'timed' | 'mock' | 'diagnostic'

export function bucketOf(mode: PracticeMode | undefined): MetricBucket {
  switch (mode) {
    case 'timed':
      return 'timed'
    case 'simulation':
      return 'mock'
    case 'diagnostic':
      return 'diagnostic'
    // `undefined` covers attempts recorded before modes existed; those were all
    // ordinary practice.
    default:
      return 'practice'
  }
}

export const PRACTICE_ONLY: readonly MetricBucket[] = ['practice']

/** A completed timed session, kept so results stay reviewable after a reload. */
export type SessionResult = {
  id: string
  mode: PracticeMode
  sections: SectionId[]
  /** ISO timestamp of completion. */
  at: string
  durationMs: number
  /** True when the clock ran out rather than the candidate submitting. */
  timedOut: boolean
  total: number
  answered: number
  correct: number
  questionIds: string[]
}

export type AttemptRecord = {
  questionId: string
  sectionId: SectionId
  difficulty: Difficulty
  correct: boolean
  selection: Selection
  mode?: PracticeMode
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
  /** Completed timed sessions. Defaulted on read, so older stores still load. */
  sessions: SessionResult[]
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
  sessions: [],
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
 *
 * Defaults to practice only: "your Latin Squares accuracy" on the dashboard
 * means how you are doing while learning, and a timed mock should not drag it
 * down or prop it up.
 */
export function sectionStats(
  state: ProgressState,
  sectionId: SectionId,
  buckets: readonly MetricBucket[] = PRACTICE_ONLY,
): SectionStats {
  const stats = emptyStats()
  const seen = new Set<string>()

  for (const a of state.attempts) {
    if (a.sectionId !== sectionId) continue
    if (!buckets.includes(bucketOf(a.mode))) continue
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

/**
 * Question ids already answered correctly at least once, for "unseen first"
 * ordering. Deliberately spans every mode — a question met in a mock has still
 * been met, whatever bucket it was scored in.
 */
export function answeredCorrectly(state: ProgressState, sectionId: SectionId): Set<string> {
  const out = new Set<string>()
  for (const a of state.attempts) {
    if (a.sectionId === sectionId && a.correct) out.add(a.questionId)
  }
  return out
}

/** Accuracy within one bucket, across every section. Null when untried. */
export function bucketAccuracy(
  state: ProgressState,
  bucket: MetricBucket,
): { attempts: number; correct: number; accuracy: number | null } {
  let attempts = 0
  let correct = 0
  for (const a of state.attempts) {
    if (bucketOf(a.mode) !== bucket) continue
    attempts++
    if (a.correct) correct++
  }
  return { attempts, correct, accuracy: attempts ? correct / attempts : null }
}
