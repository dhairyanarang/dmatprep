/**
 * The fixed dates. These live in content, not in user state — they are facts,
 * not preferences, so they can't be edited away or lost with localStorage.
 */
export type FixedDate = {
  id: string
  label: string
  /** ISO date, YYYY-MM-DD. */
  date: string
}

export const FIXED_DATES: FixedDate[] = [
  { id: 'registration-deadline', label: 'Registration closes', date: '2026-09-15' },
  { id: 'exam-date', label: 'Exam day', date: '2026-09-26' },
]

export const CERTIFICATE_DATE = '2026-10-12'
