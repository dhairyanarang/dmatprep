import { SECTIONS, type SectionId } from '@/lib/sections'
import {
  bucketAccuracy,
  bucketOf,
  sectionStats,
  type MetricBucket,
  type ProgressState,
} from '@/lib/types/progress'

/**
 * Deterministic, inspectable summaries of where preparation stands.
 *
 * Nothing here is a model or a prediction. Every number is a count or a ratio
 * over attempts the candidate actually made, and every threshold is written
 * down in this file so the reason for any verdict can be read off directly.
 */

const MIN_ATTEMPTS_FOR_SIGNAL = 5

export type SectionSignal = {
  sectionId: SectionId
  title: string
  attempts: number
  accuracy: number | null
  /** Distinct questions attempted, against the bank size. */
  seen: number
  bankSize: number
  /** Mean seconds per attempt, when timing was recorded. */
  averageSeconds: number | null
  hintRate: number | null
}

export function sectionSignals(
  progress: ProgressState,
  bankSizes: Record<SectionId, number>,
  buckets: readonly MetricBucket[] = ['practice'],
): SectionSignal[] {
  return SECTIONS.map((section) => {
    const stats = sectionStats(progress, section.id, buckets)
    const attempts = progress.attempts.filter(
      (a) => a.sectionId === section.id && buckets.includes(bucketOf(a.mode)),
    )
    const timed = attempts.filter((a) => typeof a.durationMs === 'number')
    const withHints = attempts.filter((a) => (a.hintsUsed ?? 0) > 0)

    return {
      sectionId: section.id,
      title: section.title,
      attempts: stats.attempts,
      accuracy: stats.accuracy,
      seen: stats.uniqueQuestions,
      bankSize: bankSizes[section.id],
      averageSeconds: timed.length
        ? Math.round(timed.reduce((n, a) => n + (a.durationMs ?? 0), 0) / timed.length / 1000)
        : null,
      hintRate: attempts.length ? withHints.length / attempts.length : null,
    }
  })
}

export type Recommendation = {
  sectionId: SectionId
  title: string
  reason: string
  /** Questions left unseen in that section. */
  unseen: number
}

/**
 * What to do next, by fixed rules:
 *
 *   1. a section with too little evidence comes first — you cannot improve what
 *      you have not measured;
 *   2. otherwise the lowest accuracy;
 *   3. ties on accuracy break towards the slower section.
 */
export function recommendNext(signals: SectionSignal[]): Recommendation {
  // Least-practised first, so "you have not tried this yet" beats "you have
  // tried this four times".
  const untouched = signals
    .filter((s) => s.attempts < MIN_ATTEMPTS_FOR_SIGNAL)
    .sort((a, b) => a.attempts - b.attempts)

  if (untouched.length) {
    const next = untouched[0]
    return {
      sectionId: next.sectionId,
      title: next.title,
      reason:
        next.attempts === 0
          ? 'You have not tried this section yet.'
          : 'Not enough attempts here yet to tell how you are doing.',
      unseen: next.bankSize - next.seen,
    }
  }

  const ranked = [...signals].sort((a, b) => {
    const byAccuracy = (a.accuracy ?? 1) - (b.accuracy ?? 1)
    if (Math.abs(byAccuracy) > 0.02) return byAccuracy
    return (b.averageSeconds ?? 0) - (a.averageSeconds ?? 0)
  })

  const weakest = ranked[0]
  const others = ranked.slice(1)
  const clearlyWeakest =
    others.length === 0 || (others[0].accuracy ?? 1) - (weakest.accuracy ?? 1) > 0.02

  return {
    sectionId: weakest.sectionId,
    title: weakest.title,
    reason: clearlyWeakest
      ? `Your lowest accuracy so far, at ${Math.round((weakest.accuracy ?? 0) * 100)}%.`
      : 'Your accuracy is even across the three, so this is the one you are slowest at.',
    unseen: weakest.bankSize - weakest.seen,
  }
}

export type ReadinessBand = 'not-started' | 'building' | 'developing' | 'strong' | 'mock-ready'

export type Readiness = {
  band: ReadinessBand
  label: string
  /** Plain sentences explaining exactly why this band was chosen. */
  because: string[]
  /** What would move it up. */
  nextUp: string | null
}

const BAND_LABEL: Record<ReadinessBand, string> = {
  'not-started': 'Not started',
  building: 'Building',
  developing: 'Developing',
  strong: 'Strong',
  'mock-ready': 'Mock-ready',
}

/**
 * A transparent band, never a percentage.
 *
 * A number like "83.4% ready" would imply a precision nothing here supports —
 * this is a count of what has been practised and how accurately, and it says so.
 */
export function readiness(progress: ProgressState, signals: SectionSignal[]): Readiness {
  const totalAttempts = signals.reduce((n, s) => n + s.attempts, 0)
  const covered = signals.filter((s) => s.attempts >= MIN_ATTEMPTS_FOR_SIGNAL)
  const accuracies = signals.map((s) => s.accuracy).filter((a): a is number => a !== null)
  const overall = accuracies.length
    ? accuracies.reduce((n, a) => n + a, 0) / accuracies.length
    : 0
  const weakest = accuracies.length ? Math.min(...accuracies) : 0
  const hintRates = signals.map((s) => s.hintRate ?? 0)
  const hintLean = hintRates.length ? Math.max(...hintRates) : 0
  const timedSessions = progress.sessions.filter(
    (s) => s.mode === 'timed' || s.mode === 'simulation',
  )
  // Read separately, never averaged into the practice figure.
  const timedScore = bucketAccuracy(progress, 'timed')
  const mockScore = bucketAccuracy(progress, 'mock')

  const because: string[] = []

  if (totalAttempts === 0) {
    return {
      band: 'not-started',
      label: BAND_LABEL['not-started'],
      because: ['You have not attempted any questions yet.'],
      nextUp: 'Answer a few questions in any section to get a first reading.',
    }
  }

  because.push(`${totalAttempts} question${totalAttempts === 1 ? '' : 's'} attempted.`)
  because.push(`${covered.length} of 3 sections practised enough to judge.`)
  if (accuracies.length) {
    because.push(
      `Practice accuracy averages ${Math.round(overall * 100)}%, weakest section ${Math.round(weakest * 100)}%.`,
    )
  }
  if (timedScore.accuracy !== null) {
    because.push(`Timed practice accuracy ${Math.round(timedScore.accuracy * 100)}%, counted separately.`)
  }
  if (mockScore.accuracy !== null) {
    because.push(`Mock accuracy ${Math.round(mockScore.accuracy * 100)}%, counted separately.`)
  }
  if (hintLean > 0.4) because.push(`Hints used on ${Math.round(hintLean * 100)}% of attempts in one section.`)
  if (timedSessions.length) because.push(`${timedSessions.length} timed session${timedSessions.length === 1 ? '' : 's'} completed.`)

  if (covered.length < 3 || totalAttempts < 20) {
    return {
      band: 'building',
      label: BAND_LABEL.building,
      because,
      nextUp: 'Practise all three sections until each has at least a handful of attempts.',
    }
  }
  if (weakest < 0.6 || hintLean > 0.5) {
    return {
      band: 'developing',
      label: BAND_LABEL.developing,
      because,
      nextUp: 'Bring your weakest section above 60% accuracy, leaning on hints less.',
    }
  }
  if (timedSessions.length === 0) {
    return {
      band: 'strong',
      label: BAND_LABEL.strong,
      because,
      nextUp: 'Sit a timed practice test — accuracy under a clock is a different skill.',
    }
  }
  return {
    band: 'mock-ready',
    label: BAND_LABEL['mock-ready'],
    because,
    nextUp: null,
  }
}
