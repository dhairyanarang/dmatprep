'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import { SECTIONS, type SectionId } from '@/lib/sections'
import { sectionStats } from '@/lib/types/progress'

/**
 * Per-section snapshot with a direct link into practice — this is what keeps
 * "practice Latin Squares" one click from the homepage.
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

        return (
          <Card key={section.id}>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium">{section.title}</h3>
                <Link
                  href={`/module-a/${section.id}/practice`}
                  className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 text-xs underline underline-offset-4"
                >
                  Practise
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </div>

              {!ready ? (
                <div className="h-[46px]" aria-hidden />
              ) : (
                <>
                  <div className="flex items-baseline gap-3 text-sm">
                    <span>
                      <span className="text-xl font-semibold tabular-nums">{stats.attempts}</span>
                      <span className="text-muted-foreground ml-1 text-xs">attempted</span>
                    </span>
                    <span>
                      <span className="text-xl font-semibold tabular-nums">
                        {stats.accuracy === null ? '—' : `${Math.round(stats.accuracy * 100)}%`}
                      </span>
                      <span className="text-muted-foreground ml-1 text-xs">accuracy</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Progress value={coverage * 100} aria-label={`${section.title} bank covered`} />
                    <p className="text-muted-foreground text-xs">
                      {stats.uniqueQuestions} of {bankSize} questions seen
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
