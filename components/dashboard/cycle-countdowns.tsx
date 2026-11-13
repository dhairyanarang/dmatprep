'use client'

import { EXAM_CYCLES, nextCycle, openForRegistration } from '@/content/exam/key-dates'
import { useToday } from '@/lib/dates/use-today'

import { CountdownCard } from './countdown-card'

/**
 * Which cycle to count down to is decided in the browser, not at build time.
 *
 * Every route here is statically prerendered, so a cycle chosen on the server
 * would be frozen at whatever the build date was — the slow version of the bug
 * this replaces. `useToday` already exists for exactly this, and returns null
 * on the first paint so the server and client markup agree.
 */
export function CycleCountdowns() {
  const today = useToday()
  const sitting = today ? nextCycle(today) : EXAM_CYCLES[0]
  const registration = today ? openForRegistration(today) : EXAM_CYCLES[0]

  if (today && !sitting) {
    return (
      <div className="border-border bg-card rounded-2xl border p-5">
        <p className="text-eyebrow">Exam dates</p>
        <p className="mt-3 text-sm">
          Every announced dMAT sitting has now passed. g.a.s.t. publishes new cycles on its{' '}
          <a
            className="underline underline-offset-2"
            href="https://www.d-mat.de/en/dmat-in-india/"
            target="_blank"
            rel="noreferrer"
          >
            dMAT in India
          </a>{' '}
          page — check there rather than here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {registration ? (
        <CountdownCard
          label={`Registration closes · ${registration.label}`}
          date={registration.registrationDeadline}
          unit="Days to Register"
        />
      ) : (
        <CountdownCard
          label="Registration closed"
          date={EXAM_CYCLES[EXAM_CYCLES.length - 1].registrationDeadline}
          unit="Days to Register"
        />
      )}
      {sitting ? (
        <CountdownCard
          label={`Exam day · ${sitting.label}`}
          date={sitting.testDate}
          unit="Days to the Exam"
        />
      ) : null}
    </div>
  )
}
