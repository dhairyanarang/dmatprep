'use client'

import { Disclosure } from '@/components/content/disclosure'
import { Card, CardContent } from '@/components/ui/card'
import { readiness, sectionSignals } from '@/lib/practice/insights'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import { bucketAccuracy } from '@/lib/types/progress'
import type { SectionId } from '@/lib/sections'

/**
 * How preparation is going, in three layers.
 *
 * The screen previously showed accuracy, speed, hint dependence, exposure,
 * difficulty and readiness at once, which is more than anyone can act on. The
 * headline is now one sentence; the numbers behind it are one click away.
 */
export function ProgressPanel({ bankSizes }: { bankSizes: Record<SectionId, number> }) {
  const progress = useProgress()
  const ready = useProgressReady()

  const signals = sectionSignals(progress, bankSizes)
  const state = readiness(progress, signals)
  const practice = bucketAccuracy(progress, 'practice')
  const timed = bucketAccuracy(progress, 'timed')
  const mock = bucketAccuracy(progress, 'mock')

  const measured = signals.filter((s) => s.accuracy !== null)
  const best = measured.length
    ? measured.reduce((a, b) => ((b.accuracy ?? 0) > (a.accuracy ?? 0) ? b : a))
    : null

  if (!ready) {
    return <p className="text-muted-foreground text-sm">Loading your progress…</p>
  }

  return (
    <div className="space-y-3">
      <Card className="[--card-spacing:--spacing(5)]">
        <CardContent className="space-y-3">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">Readiness</p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight">{state.label}</h3>
          </div>

          <p className="text-sm leading-relaxed">
            {best
              ? `You're strongest in ${best.title}.`
              : 'Nothing attempted yet — a few questions will give this something to read.'}
            {practice.accuracy !== null ? (
              <span className="text-muted-foreground">
                {' '}
                {Math.round(practice.accuracy * 100)}% practice accuracy across{' '}
                {practice.attempts} {practice.attempts === 1 ? 'question' : 'questions'}.
              </span>
            ) : null}
          </p>

          {state.nextUp ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              <span className="text-foreground font-medium">To move up: </span>
              {state.nextUp}
            </p>
          ) : null}

          <p className="text-muted-foreground border-t pt-3 text-xs leading-relaxed">
            A dMAT Prep indicator based on your practice here — not an official dMAT score, and not
            a university admission threshold.
          </p>
        </CardContent>
      </Card>

      <Disclosure summary="See the breakdown" hint={`${signals.length} sections`}>
        <div className="space-y-5">
          <div>
            <h4 className="text-sm font-medium">By section</h4>
            <ul className="mt-2 space-y-2">
              {signals.map((signal) => (
                <li key={signal.sectionId} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                  <span className="min-w-40 flex-1">{signal.title}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {signal.accuracy === null
                      ? 'not started'
                      : `${Math.round(signal.accuracy * 100)}% · ${signal.attempts} attempts`}
                  </span>
                  {signal.averageSeconds !== null ? (
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {signal.averageSeconds}s average
                    </span>
                  ) : null}
                  {signal.hintRate ? (
                    <span className="text-muted-foreground text-xs tabular-nums">
                      hints on {Math.round(signal.hintRate * 100)}%
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium">Practice against tests</h4>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              Kept apart on purpose: an untimed attempt with hints available measures understanding,
              a timed one measures exam performance, and averaging them would describe neither.
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              <Row label="Practice" data={practice} />
              <Row label="Timed practice" data={timed} />
              <Row label="Mocks" data={mock} />
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium">Why this band</h4>
            <ul className="text-muted-foreground mt-2 space-y-1 text-sm leading-relaxed">
              {state.because.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </Disclosure>
    </div>
  )
}

function Row({
  label,
  data,
}: {
  label: string
  data: { attempts: number; correct: number; accuracy: number | null }
}) {
  return (
    <li className="flex items-baseline justify-between gap-4">
      <span>{label}</span>
      <span className="text-muted-foreground tabular-nums">
        {data.accuracy === null
          ? 'none yet'
          : `${Math.round(data.accuracy * 100)}% of ${data.attempts}`}
      </span>
    </li>
  )
}
