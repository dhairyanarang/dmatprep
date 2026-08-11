'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { SECTION_ACCENT } from '@/lib/nav'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import { SECTIONS, type SectionId } from '@/lib/sections'
import { sectionStats } from '@/lib/types/progress'
import { cn } from '@/lib/utils'

const DOT = { figures: 'bg-figures', equations: 'bg-equations', latin: 'bg-latin' } as const

// The indicator sits inside Track, so this needs a descendant selector rather
// than the direct-child `*:` variant.
const BAR = {
  figures: '[&_[data-slot=progress-indicator]]:bg-figures',
  equations: '[&_[data-slot=progress-indicator]]:bg-equations',
  latin: '[&_[data-slot=progress-indicator]]:bg-latin',
} as const

/**
 * Two numbers per section — accuracy, and how much of the bank you have seen.
 * Raw attempt count lives on the practice page; on a dashboard it competes with
 * the numbers that actually tell you what to do next.
 */
export function ProgressSnapshot({ bankSizes }: { bankSizes: Record<SectionId, number> }) {
  const progress = useProgress()
  const ready = useProgressReady()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SECTIONS.map((section) => {
        const stats = sectionStats(progress, section.id)
        const bankSize = bankSizes[section.id]
        const coverage = bankSize > 0 ? stats.uniqueQuestions / bankSize : 0
        const accent = SECTION_ACCENT[section.id]

        return (
          <Card key={section.id} className="[--card-spacing:--spacing(5)]">
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span aria-hidden className={cn('size-2 shrink-0 rounded-full', DOT[accent])} />
                  <h3 className="truncate text-sm font-medium">{section.title}</h3>
                </div>
                <Link
                  href={`/module-a/${section.id}/practice`}
                  className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 text-xs transition-colors"
                >
                  Practise
                  <ArrowRight className="size-3" aria-hidden />
                </Link>
              </div>

              {!ready ? (
                <div className="h-14" aria-hidden />
              ) : (
                <>
                  <div className="flex min-h-6 items-baseline justify-between gap-2">
                    {stats.accuracy === null ? (
                      // An em dash at 2xl reads as a rule, not a placeholder.
                      <span className="text-muted-foreground text-sm">Not started</span>
                    ) : (
                      <p className="flex items-baseline gap-1">
                        <span className="text-2xl leading-none font-semibold tabular-nums">
                          {Math.round(stats.accuracy * 100)}%
                        </span>
                        <span className="text-muted-foreground text-xs">accuracy</span>
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs tabular-nums">
                      {stats.uniqueQuestions}/{bankSize} seen
                    </p>
                  </div>

                  <Progress
                    value={coverage * 100}
                    className={BAR[accent]}
                    aria-label={`${section.title}: ${stats.uniqueQuestions} of ${bankSize} questions seen`}
                  />
                </>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
