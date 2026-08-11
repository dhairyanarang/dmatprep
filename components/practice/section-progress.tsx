'use client'

import { useProgressReady, useSectionStats } from '@/lib/progress/use-progress'
import type { SectionId } from '@/lib/sections'
import { cn } from '@/lib/utils'

/**
 * A single line of stats. No progress bar here — at low coverage the filled
 * sliver reads as a stray underline, and "3 of 40 seen" already says it.
 */
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

  if (!ready) return <div className={cn('h-5', className)} aria-hidden />

  return (
    <div
      className={cn(
        'text-muted-foreground flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm',
        className,
      )}
    >
      <span>
        <span className="text-foreground font-medium tabular-nums">{stats.attempts}</span> attempted
      </span>
      <span>
        <span className="text-foreground font-medium tabular-nums">
          {stats.accuracy === null ? '—' : `${Math.round(stats.accuracy * 100)}%`}
        </span>{' '}
        accuracy
      </span>
      <span>
        <span className="text-foreground font-medium tabular-nums">{stats.uniqueQuestions}</span> of{' '}
        {bankSize} seen
      </span>
    </div>
  )
}
