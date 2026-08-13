import { SECTION_IDS, type SectionId } from '@/lib/sections'
import {
  EMPTY_PROGRESS,
  PROGRESS_VERSION,
  exposureContextOf,
  type AttemptRecord,
  type ExposureEntry,
  type ProgressState,
  type SessionResult,
} from '@/lib/types/progress'

/**
 * Reading a stored ProgressState of any version this app has ever written.
 *
 * The rule is that an upgrade never costs the candidate anything. A v1 store
 * predates attempt ids and the exposure log, so both are reconstructed from the
 * history that is already there rather than starting empty — otherwise everyone
 * with existing progress would silently have their mock pool reset on the day
 * they upgraded.
 */

/**
 * A stable id for an attempt recorded before ids existed.
 *
 * Deterministic on purpose: the same legacy attempt must produce the same id on
 * every device and every reload, or the guest → cloud merge would insert it
 * again under a fresh key each time it ran.
 */
export function legacyAttemptId(a: { questionId: string; at: string; mode?: string }): string {
  return `legacy:${a.mode ?? 'practice'}:${a.questionId}:${a.at}`
}

export function newAttemptId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  // Older Safari in a non-secure context. Only needs to be unique per device;
  // the cloud key is scoped to the user anyway.
  return `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const isSection = (v: unknown): v is SectionId => SECTION_IDS.includes(v as SectionId)

/** Exposure rebuilt from attempts and completed sessions, for a v1 upgrade. */
export function exposureFromHistory(
  attempts: readonly AttemptRecord[],
  sessions: readonly SessionResult[],
  questionSection?: (questionId: string) => SectionId | undefined,
): ExposureEntry[] {
  const byKey = new Map<string, ExposureEntry>()

  const touch = (
    questionId: string,
    sectionId: SectionId,
    context: ExposureEntry['context'],
    at: string,
  ) => {
    const key = `${context}:${questionId}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, {
        questionId,
        context,
        sectionId,
        timesSeen: 1,
        firstSeenAt: at,
        lastSeenAt: at,
      })
      return
    }
    existing.timesSeen += 1
    if (at < existing.firstSeenAt) existing.firstSeenAt = at
    if (at > existing.lastSeenAt) existing.lastSeenAt = at
  }

  for (const a of attempts) {
    touch(a.questionId, a.sectionId, exposureContextOf(a.mode), a.at)
  }

  // A session shows every question it contains, including ones left unanswered —
  // which is exactly the case an attempt-only reconstruction would miss.
  for (const s of sessions) {
    const context = exposureContextOf(s.mode)
    for (const id of s.questionIds) {
      const section = questionSection?.(id) ?? s.sections[0]
      if (!section) continue
      touch(id, section, context, s.at)
    }
  }

  return [...byKey.values()]
}

type Unknown = Record<string, unknown>

/**
 * Parse whatever is in storage into a current-version state.
 *
 * Anything unrecognisable degrades to the empty state rather than throwing: a
 * hand-edited or half-written store should cost the candidate their history at
 * worst, never the ability to open the app.
 */
export function migrateProgress(raw: unknown): ProgressState {
  if (!raw || typeof raw !== 'object') return EMPTY_PROGRESS
  const parsed = raw as Unknown

  const version = typeof parsed.version === 'number' ? parsed.version : 0
  if (version < 1 || version > PROGRESS_VERSION) return EMPTY_PROGRESS
  if (!Array.isArray(parsed.attempts)) return EMPTY_PROGRESS

  const attempts: AttemptRecord[] = (parsed.attempts as Unknown[])
    .filter((a) => isSection(a.sectionId) && typeof a.questionId === 'string')
    .map((a) => ({
      ...(a as unknown as AttemptRecord),
      id: typeof a.id === 'string' && a.id ? a.id : legacyAttemptId(a as never),
    }))

  const sessions: SessionResult[] = Array.isArray(parsed.sessions)
    ? (parsed.sessions as SessionResult[])
    : []

  const exposure: ExposureEntry[] = Array.isArray(parsed.exposure)
    ? (parsed.exposure as ExposureEntry[])
    : // v1 → v2: no exposure log existed, so rebuild it from what was done.
      exposureFromHistory(attempts, sessions)

  return {
    version: PROGRESS_VERSION,
    attempts,
    milestones: (parsed.milestones as Record<string, boolean>) ?? {},
    keyDates: Array.isArray(parsed.keyDates) ? (parsed.keyDates as never) : [],
    sessions,
    exposure,
    activeSession:
      parsed.activeSession && typeof parsed.activeSession === 'object'
        ? (parsed.activeSession as never)
        : null,
    practiceDrafts:
      parsed.practiceDrafts && typeof parsed.practiceDrafts === 'object'
        ? (parsed.practiceDrafts as never)
        : {},
    lastSession: parsed.lastSession as never,
  }
}
