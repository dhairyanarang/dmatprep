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

/**
 * Which pool a question has been spent from.
 *
 * Three contexts rather than one "seen" flag, because they must not consume each
 * other: meeting an item in the diagnostic should not disqualify it from a mock,
 * where unseen material is the whole point. `timed` and `simulation` share the
 * 'mock' context — a single-subtest mock and the full simulation are the same
 * kind of exposure.
 */
export type ExposureContext = 'practice' | 'diagnostic' | 'mock'

export function exposureContextOf(mode: PracticeMode | undefined): ExposureContext {
  switch (mode) {
    case 'diagnostic':
      return 'diagnostic'
    case 'timed':
    case 'simulation':
      return 'mock'
    default:
      return 'practice'
  }
}

export type ExposureEntry = {
  questionId: string
  context: ExposureContext
  sectionId: SectionId
  timesSeen: number
  /** ISO timestamps. */
  firstSeenAt: string
  lastSeenAt: string
}

export type AttemptRecord = {
  /**
   * Minted on the client so a write retried after a network failure collides on
   * the primary key rather than counting the same answer twice.
   */
  id: string
  questionId: string
  sectionId: SectionId
  difficulty: Difficulty
  correct: boolean
  selection: Selection
  mode?: PracticeMode
  /** Set when the attempt came from a timed or mock session. */
  sessionId?: string
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

/** Everything needed to record an attempt; the store mints the id. */
export type AttemptInput = Omit<AttemptRecord, 'id'> & { id?: string }

/** A date the user adds themselves. The two fixed exam dates are content, not state. */
export type KeyDate = {
  id: string
  label: string
  /** ISO date, YYYY-MM-DD. */
  date: string
}

/** The questions a session was built from, frozen so a resume is the same test. */
export type ActiveSessionStage = {
  sectionId: SectionId
  label: string
  unitNoun: string
  questionIds: string[]
}

/**
 * A timed or mock session that has started and not yet finished.
 *
 * Held so that closing the tab does not destroy 20 minutes of work. Timing is an
 * absolute `stageEndsAt`, never a remaining-seconds counter: a counter is a lie
 * the moment the browser is closed, whereas a deadline can always be compared
 * against the clock on the way back in.
 */
export type ActiveSession = {
  id: string
  mode: PracticeMode
  /** The route that owns it, so the prompt only appears where it belongs. */
  route: string
  title: string
  stages: ActiveSessionStage[]
  stageIndex: number
  currentIndex: number
  answers: Record<string, Selection>
  phase: 'running' | 'break'
  /** ISO timestamps. `stageEndsAt` is null for the untimed diagnostic. */
  startedAt: string
  stageEndsAt: string | null
  minutesPerStage: number
  untimed: boolean
  updatedAt: string
}

/**
 * Where an untimed practice run had got to.
 *
 * Kept apart from `activeSession` because the two want different behaviour on
 * return: a mock asks before resuming, since restarting one is a real decision,
 * while practice simply picks up where it was — there is nothing to decide.
 */
export type PracticeDraft = {
  /** Route key, e.g. `practice:latin-squares` or `quick`. */
  key: string
  questionIds: string[]
  index: number
  selection: Selection
  hintsUsed: number
  submitted: boolean
  filter: Difficulty | 'all'
  updatedAt: string
}

/** Current schema version. v1 stores are migrated on read, never discarded. */
export const PROGRESS_VERSION = 2

export type ProgressState = {
  /** Bumped when the shape changes, so a migration has something to switch on. */
  version: typeof PROGRESS_VERSION
  attempts: AttemptRecord[]
  milestones: Record<string, boolean>
  keyDates: KeyDate[]
  /** Completed timed sessions. Defaulted on read, so older stores still load. */
  sessions: SessionResult[]
  /** What has been shown, per context. Derived from history on first upgrade. */
  exposure: ExposureEntry[]
  activeSession: ActiveSession | null
  practiceDrafts: Record<string, PracticeDraft>
  lastSession?: {
    sectionId: SectionId
    questionId: string
    at: string
  }
}

export const EMPTY_PROGRESS: ProgressState = {
  version: PROGRESS_VERSION,
  attempts: [],
  milestones: {},
  keyDates: [],
  sessions: [],
  exposure: [],
  activeSession: null,
  practiceDrafts: {},
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

/** Question ids already shown in one context. */
export function exposedIn(state: ProgressState, context: ExposureContext): Set<string> {
  const out = new Set<string>()
  for (const e of state.exposure) if (e.context === context) out.add(e.questionId)
  return out
}

/** Merge a batch of newly-shown questions into the exposure log. */
export function withExposure(
  entries: readonly ExposureEntry[],
  shown: readonly { questionId: string; sectionId: SectionId }[],
  context: ExposureContext,
  at: string,
): ExposureEntry[] {
  const byKey = new Map(entries.map((e) => [`${e.context}:${e.questionId}`, e]))

  for (const q of shown) {
    const key = `${context}:${q.questionId}`
    const existing = byKey.get(key)
    byKey.set(
      key,
      existing
        ? { ...existing, timesSeen: existing.timesSeen + 1, lastSeenAt: at }
        : {
            questionId: q.questionId,
            context,
            sectionId: q.sectionId,
            timesSeen: 1,
            firstSeenAt: at,
            lastSeenAt: at,
          },
    )
  }

  return [...byKey.values()]
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
