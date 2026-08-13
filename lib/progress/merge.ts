import type {
  ActiveSession,
  AttemptRecord,
  ExposureEntry,
  KeyDate,
  ProgressState,
  SessionResult,
} from '@/lib/types/progress'

/**
 * How local and cloud progress are reconciled.
 *
 * The conflict strategy is decided by the *kind* of record, not by which side
 * happens to be newer:
 *
 *   attempts, sessions   union by id. Both are statements about something that
 *                        happened, so neither side can invalidate the other's;
 *                        the merge is a set union and nothing is ever dropped.
 *
 *   exposure             per (question, context): the larger `timesSeen`, the
 *                        earlier `firstSeenAt`, the later `lastSeenAt`. Summing
 *                        would double-count a row that has already synced.
 *
 *   activeSession        last write wins on `updatedAt`. Only one device can
 *                        sensibly be sitting a mock, and the one that wrote most
 *                        recently is the one being used.
 *
 *   milestones, keyDates last write wins on the document's timestamp. They are
 *                        small mutable documents that are replaced wholesale.
 *
 * The important property is that merging is idempotent: running it twice — which
 * is exactly what happens if a sign-in is interrupted and retried — produces the
 * same result as running it once.
 */

function unionById<T extends { id: string }>(local: readonly T[], cloud: readonly T[]): T[] {
  const byId = new Map<string, T>()
  for (const item of cloud) byId.set(item.id, item)
  // Local wins a tie only in the sense of being the object kept; the records are
  // immutable, so the two sides are the same record when the ids match.
  for (const item of local) if (!byId.has(item.id)) byId.set(item.id, item)
  return [...byId.values()]
}

export function mergeAttempts(
  local: readonly AttemptRecord[],
  cloud: readonly AttemptRecord[],
): AttemptRecord[] {
  return unionById(local, cloud).sort((a, b) => a.at.localeCompare(b.at))
}

export function mergeSessions(
  local: readonly SessionResult[],
  cloud: readonly SessionResult[],
): SessionResult[] {
  return unionById(local, cloud).sort((a, b) => a.at.localeCompare(b.at))
}

export function mergeExposure(
  local: readonly ExposureEntry[],
  cloud: readonly ExposureEntry[],
): ExposureEntry[] {
  const byKey = new Map<string, ExposureEntry>()

  for (const entry of [...cloud, ...local]) {
    const key = `${entry.context}:${entry.questionId}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, { ...entry })
      continue
    }
    byKey.set(key, {
      ...existing,
      timesSeen: Math.max(existing.timesSeen, entry.timesSeen),
      firstSeenAt:
        entry.firstSeenAt < existing.firstSeenAt ? entry.firstSeenAt : existing.firstSeenAt,
      lastSeenAt: entry.lastSeenAt > existing.lastSeenAt ? entry.lastSeenAt : existing.lastSeenAt,
    })
  }

  return [...byKey.values()]
}

export function mergeActiveSession(
  local: ActiveSession | null,
  cloud: ActiveSession | null,
): ActiveSession | null {
  if (!local) return cloud
  if (!cloud) return local
  return cloud.updatedAt > local.updatedAt ? cloud : local
}

/**
 * The two mutable documents.
 *
 * `cloudUpdatedAt` comes from the database, which stamps it with its own clock —
 * a device with a badly wrong time cannot win the comparison by claiming to be
 * from next year.
 */
export function mergeDocuments(
  local: { milestones: Record<string, boolean>; keyDates: KeyDate[] },
  cloud: { milestones: Record<string, boolean>; keyDates: KeyDate[]; updatedAt: string } | null,
  localTouchedAt: string | null,
): { milestones: Record<string, boolean>; keyDates: KeyDate[] } {
  if (!cloud) return local
  // Nothing pending locally: the cloud copy is authoritative.
  if (!localTouchedAt) return { milestones: cloud.milestones, keyDates: cloud.keyDates }
  return cloud.updatedAt > localTouchedAt
    ? { milestones: cloud.milestones, keyDates: cloud.keyDates }
    : local
}

/** The whole state, merged. Pure, so it can be reasoned about on its own. */
export function mergeProgress(
  local: ProgressState,
  cloud: Partial<ProgressState> & { documentsUpdatedAt?: string },
  localTouchedAt: string | null,
): ProgressState {
  const documents = mergeDocuments(
    { milestones: local.milestones, keyDates: local.keyDates },
    cloud.documentsUpdatedAt
      ? {
          milestones: cloud.milestones ?? {},
          keyDates: cloud.keyDates ?? [],
          updatedAt: cloud.documentsUpdatedAt,
        }
      : null,
    localTouchedAt,
  )

  return {
    ...local,
    attempts: mergeAttempts(local.attempts, cloud.attempts ?? []),
    sessions: mergeSessions(local.sessions, cloud.sessions ?? []),
    exposure: mergeExposure(local.exposure, cloud.exposure ?? []),
    activeSession: mergeActiveSession(local.activeSession, cloud.activeSession ?? null),
    milestones: documents.milestones,
    keyDates: documents.keyDates,
  }
}
