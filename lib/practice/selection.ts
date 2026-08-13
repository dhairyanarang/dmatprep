import type { SectionId } from '@/lib/sections'
import type { AttemptRecord, ProgressState } from '@/lib/types/progress'
import type { Difficulty, Question } from '@/lib/types/question'

/**
 * Building a session out of the bank.
 *
 * Two rules matter and both come from the brief: a mock must use questions the
 * candidate has not seen, and composition must be balanced by metadata rather
 * than sampled at random. When the bank cannot supply enough unseen questions
 * that is reported, never papered over by silently repeating content.
 */

export type SessionPlan = {
  questions: Question[]
  /** Unseen questions the plan wanted but the bank could not supply. */
  shortfall: number
  /** Seen questions included to make up the shortfall. */
  reused: number
}

/** Seeded so a plan is reproducible and testable; mulberry32, as in the generators. */
function makeRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(rng: () => number, items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Every question the candidate has attempted, in any mode. */
export function attemptedIds(progress: ProgressState, sectionId?: SectionId): Set<string> {
  const out = new Set<string>()
  for (const a of progress.attempts) {
    if (sectionId && a.sectionId !== sectionId) continue
    out.add(a.questionId)
  }
  return out
}

/** Questions used by the most recent session, so a new one does not repeat them. */
export function recentSessionIds(progress: ProgressState): Set<string> {
  const last = progress.sessions[progress.sessions.length - 1]
  return new Set(last?.questionIds ?? [])
}

/**
 * An even split across the three tiers.
 *
 * The official materials publish two exercises at each of low, medium and high
 * and say nothing about the exam's own distribution — so an even split is the
 * only defensible reading, and it is dMAT Prep's composition, not a claim about
 * the exam.
 */
export function evenDifficultySplit(count: number): Record<Difficulty, number> {
  const base = Math.floor(count / 3)
  const rest = count - base * 3
  return {
    low: base + (rest > 2 ? 1 : 0),
    medium: base + (rest > 0 ? 1 : 0),
    high: base + (rest > 1 ? 1 : 0),
  }
}

/**
 * Pick `count` questions, preferring unseen ones and spreading across the
 * pattern metadata so a session cannot end up being the same skill twenty times.
 */
export function planSession({
  pool,
  count,
  seen = new Set<string>(),
  softSeen = new Set<string>(),
  avoid = new Set<string>(),
  split,
  seed,
}: {
  pool: Question[]
  count: number
  /** Already spent from *this* pool — a mock's own earlier questions. */
  seen?: Set<string>
  /**
   * Met somewhere else: answered in practice, or shown in the diagnostic.
   * Ranked below fresh material but above anything this pool has already used,
   * which is what keeps working through the bank in practice from emptying the
   * mock pool rather than merely making it second choice.
   */
  softSeen?: Set<string>
  /** Questions from the immediately preceding session. */
  avoid?: Set<string>
  split?: Record<Difficulty, number>
  seed: number
}): SessionPlan {
  const rng = makeRng(seed)
  const targets = split ?? evenDifficultySplit(count)

  // Fresh first, then met-elsewhere, then already spent from this pool, and last
  // of all whatever the previous session used. Ordering the pool this way means
  // the balancing pass below never has to think about staleness.
  const rank = (q: Question) =>
    avoid.has(q.id) ? 3 : seen.has(q.id) ? 2 : softSeen.has(q.id) ? 1 : 0
  const ordered = shuffle(rng, pool).sort((a, b) => rank(a) - rank(b))

  const chosen: Question[] = []
  const usedPatterns = new Set<string>()

  const takeFrom = (candidates: Question[], want: number) => {
    let taken = 0
    while (taken < want) {
      // Prefer a question adding a pattern this session has not covered yet.
      const next =
        candidates.find(
          (q) =>
            !chosen.includes(q) &&
            (q.meta?.patternType ?? []).some((p) => !usedPatterns.has(p)),
        ) ?? candidates.find((q) => !chosen.includes(q))
      if (!next) break
      chosen.push(next)
      for (const p of next.meta?.patternType ?? []) usedPatterns.add(p)
      taken++
    }
    return taken
  }

  for (const difficulty of ['low', 'medium', 'high'] as const) {
    takeFrom(
      ordered.filter((q) => q.difficulty === difficulty),
      targets[difficulty] ?? 0,
    )
  }
  // Top up if a tier could not fill its quota.
  takeFrom(ordered, count - chosen.length)

  // Anything the candidate has met before, wherever they met it: the warning
  // this feeds is about a score reading high through familiarity.
  const reused = chosen.filter((q) => seen.has(q.id) || softSeen.has(q.id)).length
  return { questions: chosen, shortfall: Math.max(0, count - chosen.length), reused }
}

/** How many questions in a section the candidate has never attempted. */
export function unseenCount(pool: Question[], seen: Set<string>): number {
  return pool.filter((q) => !seen.has(q.id)).length
}

/** Attempts for one question, most recent first. */
export function attemptsFor(progress: ProgressState, questionId: string): AttemptRecord[] {
  return progress.attempts.filter((a) => a.questionId === questionId).reverse()
}
