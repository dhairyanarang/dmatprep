'use client'

import { Progress } from '@/components/ui/progress'
import { useProgressReady, useSectionStats } from '@/lib/progress/use-progress'
import type { SectionId } from '@/lib/sections'
import { cn } from '@/lib/utils'

const percent = (value: number | null) => (value === null ? '—' : `${Math.round(value * 100)}%`)

/** Compact attempted/accuracy readout for a single section. */
export function SectionProgress({
  sectionId,
  bankSize,
  className,
}: {
  sectionId: SectionId
  bankSize: number
  className?: string
}) {
  const stats = useSectionStats(sectionId)
  const ready = useProgressReady()

  if (!ready) {
    // Hold back for one paint rather than flashing zeroes over real numbers.
    return <div className={cn('h-[52px]', className)} aria-hidden />
  }

  const coverage = bankSize > 0 ? stats.uniqueQuestions / bankSize : 0

  return (
    <div className={cn('space-y-2', className)}>
      <div className="text-muted-foreground flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        <span>
          <span className="text-foreground font-medium">{stats.attempts}</span> attempted
        </span>
        <span>
          <span className="text-foreground font-medium">{percent(stats.accuracy)}</span> accuracy
        </span>
        <span>
          <span className="text-foreground font-medium">{stats.uniqueQuestions}</span> of {bankSize}{' '}
          seen
        </span>
      </div>
      <Progress value={coverage * 100} aria-label="Share of the question bank seen" />
    </div>
  )
}
