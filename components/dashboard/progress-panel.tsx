'use client'

import { ChartNoAxesCombined } from 'lucide-react'

import { ProgressBar } from '@/components/dashboard/progress-snapshot'
import { readiness, sectionSignals } from '@/lib/practice/insights'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import type { SectionId } from '@/lib/sections'
import { bucketAccuracy } from '@/lib/types/progress'
import { cn } from '@/lib/utils'

/**
 * Where preparation stands: the band and its reasoning on the left, the numbers
 * behind it on the right.
 *
 * Practice attempts only. Timed and mock runs are scored separately, so a mock
 * can neither prop up nor drag down the figure that is meant to say how well the
 * material is understood.
 */
export function ProgressPanel({ bankSizes }: { bankSizes: Record<SectionId, number> }) {
  const progress = useProgress()
  const ready = useProgressReady()

  const signals = sectionSignals(progress, bankSizes)
  const state = readiness(progress, signals)
  const practice = bucketAccuracy(progress, 'practice')

  const measured = signals.filter((s) => s.accuracy !== null)
  const best = measured.length
    ? measured.reduce((a, b) => ((b.accuracy ?? 0) > (a.accuracy ?? 0) ? b : a))
    : null
  const sectionsAttempted = signals.filter((s) => s.attempts > 0).length

  if (!ready) {
    return (
      <div className="border-border bg-card text-muted-foreground rounded-2xl border p-4 text-sm">
        Loading your progress…
      </div>
    )
  }

  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-4 lg:flex-row">
      {/* Left: the verdict and why. */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden className="bg-brand/8 flex shrink-0 items-center rounded-md p-2">
            <ChartNoAxesCombined className="text-brand size-5" />
          </span>
          <h3 className="text-lg leading-5 font-semibold">{state.label}</h3>
        </div>

        <div className="text-muted-foreground flex flex-col gap-2.5 text-sm leading-relaxed font-medium">
          <p>
            {best
              ? `Strongest in ${best.title}.`
              : 'Nothing attempted yet — a few questions will give this something to read.'}
            {practice.accuracy !== null
              ? ` ${Math.round(practice.accuracy * 100)}% practice accuracy across ${practice.attempts} ${practice.attempts === 1 ? 'question' : 'questions'}.`
              : ''}
          </p>
          {state.nextUp ? (
            <p>
              <span className="text-foreground">To move up:</span> {state.nextUp}
            </p>
          ) : null}
          <p>
            A dMAT Prep indicator based on your practice here. Not an official dMAT score, and not a
            university admission threshold.
          </p>
        </div>
      </div>

      {/* The divider runs horizontally when the panel stacks. */}
      <div aria-hidden className="bg-border h-px w-full shrink-0 lg:h-auto lg:w-px" />

      {/* Right: the numbers. */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="divide-border grid grid-cols-3 divide-x">
          <Stat
            label="Practice accuracy"
            value={practice.accuracy === null ? '—' : `${Math.round(practice.accuracy * 100)}%`}
          />
          <Stat label="Questions attempted" value={String(practice.attempts)} className="px-3" />
          <Stat
            label="Sections attempted"
            value={`${sectionsAttempted}/${signals.length}`}
            className="pl-3"
          />
        </div>

        <div aria-hidden className="bg-border h-px w-full" />

        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm font-medium">Accuracy by section</p>
          {signals.map((signal) => (
            <div
              key={signal.sectionId}
              className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4"
            >
              {/* Narrow enough and the bar drops below the name rather than
                  truncating it — a clipped section title tells you nothing. */}
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{signal.title}</p>
              <div className="flex w-full shrink-0 flex-col gap-1.5 sm:w-[240px]">
                <div className="text-muted-foreground flex items-baseline justify-between">
                  <span className="text-sm tabular-nums">
                    {signal.accuracy === null ? 'not started' : `${Math.round(signal.accuracy * 100)}%`}
                  </span>
                  <span className="text-xs tabular-nums">({signal.attempts})</span>
                </div>
                <ProgressBar value={signal.accuracy ?? 0} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * The value hangs off the bottom of the cell rather than following the label,
 * so the three numbers stay on one line together even when a label wraps to two
 * — which it does as soon as the panel is narrow enough.
 */
function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('flex h-full min-w-0 flex-col gap-2 pr-3', className)}>
      <p className="text-muted-foreground text-sm leading-5 font-medium">{label}</p>
      <p className="mt-auto text-base leading-5 font-medium tabular-nums">{value}</p>
    </div>
  )
}
