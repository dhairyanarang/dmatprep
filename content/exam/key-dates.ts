/**
 * The fixed dates. These live in content, not in user state — they are facts,
 * not preferences, so they cannot be edited away or lost with localStorage.
 *
 * Modelled as cycles rather than two loose dates, because two loose dates is
 * what went wrong: the app counted down to 15 and 26 September 2026 for seven
 * weeks after both had passed. A cycle list plus `nextCycle` cannot go stale
 * silently — once every cycle is behind us it says so, which is a prompt to
 * check the official page rather than a wrong number presented confidently.
 *
 * Every date below was read verbatim from d-mat.de/en/dmat-in-india on
 * 14 November 2026. The FAQ on the same site still shows the 2026 cycle; that
 * discrepancy is recorded in content/exam/sources.ts and must not be resolved
 * by picking one.
 */
export type ExamCycle = {
  id: string
  /** How a candidate would refer to it. */
  label: string
  /** ISO date, YYYY-MM-DD. */
  registrationDeadline: string
  testDate: string
  resultsDate: string
}

/** "28 October 2026 – Start registration". */
export const REGISTRATION_OPENED = '2026-10-28'

export const EXAM_CYCLES: ExamCycle[] = [
  {
    id: 'cycle-1-2027',
    label: 'January 2027',
    registrationDeadline: '2027-01-04',
    testDate: '2027-01-16',
    resultsDate: '2027-02-08',
  },
  {
    id: 'cycle-2-2027',
    label: 'March 2027',
    registrationDeadline: '2027-03-01',
    testDate: '2027-03-13',
    resultsDate: '2027-04-05',
  },
]

/**
 * Local calendar date as YYYY-MM-DD.
 *
 * Not `toISOString()`, which converts to UTC first: for a candidate in India
 * that shifts the date backwards for the first five and a half hours of every
 * day, so a countdown would read one day high all morning.
 */
function localISODate(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/**
 * The next cycle a candidate can still sit, or null once they have all passed.
 *
 * Keyed on the test date rather than the registration deadline: someone already
 * registered still wants the countdown to exam day after registration closes.
 */
export function nextCycle(now: Date): ExamCycle | null {
  const today = localISODate(now)
  return EXAM_CYCLES.find((c) => c.testDate >= today) ?? null
}

/** The cycle a candidate can still register for, which closes earlier. */
export function openForRegistration(now: Date): ExamCycle | null {
  const today = localISODate(now)
  return EXAM_CYCLES.find((c) => c.registrationDeadline >= today) ?? null
}
