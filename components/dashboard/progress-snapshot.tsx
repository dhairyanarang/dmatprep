'use client'

import Link from 'next/link'

import { ArrowAffordance } from '@/components/ui/arrow-affordance'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import { SECTION_ICON } from '@/lib/nav'
import { SECTIONS, type SectionId } from '@/lib/sections'
import { sectionStats } from '@/lib/types/progress'

/**
 * Accuracy and coverage per subtest.
 *
 * Practice attempts only — timed and mock runs are scored separately, so a
 * mock can neither prop up nor drag down the number that is meant to say how
 * well the material is understood.
 */
export function ProgressSnapshot({ bankSizes }: { bankSizes: Record<SectionId, number> }) {
  const progress = useProgress()
  const ready = useProgressReady()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SECTIONS.map((section) => {
        const stats = sectionStats(progress, section.id)
        const bankSize = bankSizes[section.id]
        const accuracy = stats.accuracy === null ? null : Math.round(stats.accuracy * 100)
        const Icon = SECTION_ICON[section.id]

        return (
          <Link
            key={section.id}
            href={`/module-a/${section.id}/practice`}
            className="group border-border bg-card hover:border-brand/40 focus-visible:ring-ring flex flex-col gap-4 rounded-2xl border p-5 transition-[border-color,translate] duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="text-brand size-5 shrink-0" aria-hidden />
                <span className="text-eyebrow truncate">{section.title}</span>
              </span>
              <ArrowAffordance />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex items-baseline gap-2.5">
                  <span className="text-metric tabular-nums">
                    {!ready || accuracy === null ? '—' : `${accuracy}%`}
                  </span>
                  <span className="text-muted-foreground text-sm">accuracy</span>
                </span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {ready ? `${stats.uniqueQuestions}/${bankSize} seen` : `${bankSize} questions`}
                </span>
              </div>

              <ProgressBar value={ready ? stats.uniqueQuestions / bankSize : 0} />
            </div>
          </Link>
        )
      })}
    </div>
  )
}

/**
 * 4px track, brand fill. Shared so every bar in the product is the same object —
 * the value is also written out beside it, so nothing here depends on colour.
 */
export function ProgressBar({ value }: { value: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <span className="bg-surface-muted block h-1 w-full overflow-hidden rounded-full">
      {/* Scaled rather than widened: `width` is a layout property, and a bar on
          the dashboard sits beside a dozen others. The transition fires only
          when the value actually changes, so a re-render does not replay it. */}
      <span
        className="bg-brand block h-full w-full origin-left rounded-full transition-transform duration-500 ease-out"
        style={{ transform: `scaleX(${pct / 100})` }}
      />
    </span>
  )
}
