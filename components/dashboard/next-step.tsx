'use client'

import { ArrowRight } from 'lucide-react'

import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent } from '@/components/ui/card'
import { recommendNext, sectionSignals } from '@/lib/practice/insights'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import { SECTION_ACCENT } from '@/lib/nav'
import type { SectionId } from '@/lib/sections'
import { cn } from '@/lib/utils'

const DOT = { figures: 'bg-figures', equations: 'bg-equations', latin: 'bg-latin' } as const

/**
 * The home page's one job: what should I do right now?
 *
 * Someone arriving for the first time gets two doors rather than a
 * recommendation built from no evidence — one for people who want to be shown
 * the exam, one for people who already know it and came to see the questions.
 * Everyone else gets a single recommendation and a single button.
 */
export function NextStep({ bankSizes }: { bankSizes: Record<SectionId, number> }) {
  const progress = useProgress()
  const ready = useProgressReady()

  const signals = sectionSignals(progress, bankSizes)
  const recommendation = recommendNext(signals)
  const brandNew = ready && progress.attempts.length === 0

  if (brandNew) return <FirstVisit />

  return (
    <Card className="[--card-spacing:--spacing(5)]">
      <CardContent className="space-y-4">
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">Next step</p>
          <h2 className="mt-2 flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span
              aria-hidden
              className={cn('size-2 rounded-full', DOT[SECTION_ACCENT[recommendation.sectionId]])}
            />
            Practise {recommendation.title}
          </h2>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            {ready ? recommendation.reason : 'Checking where you left off…'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href={`/module-a/${recommendation.sectionId}/practice`}>
            Start practice
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
          <span className="text-muted-foreground text-xs tabular-nums">
            {recommendation.unseen} unseen · about {Math.round(recommendation.unseen * 1.25)} min
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

/** Two doors, no onboarding flow. */
function FirstVisit() {
  return (
    <Card className="[--card-spacing:--spacing(5)]">
      <CardContent className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Start preparing</h2>
          <p className="text-muted-foreground mt-1.5 max-w-prose text-sm leading-relaxed">
            dMAT Prep covers Module A — the three Core subtests — with 135 verified questions,
            worked visual solutions and timed practice.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border-border bg-muted/40 space-y-2.5 rounded-xl border p-4">
            <p className="text-sm font-medium">I&rsquo;m new to the dMAT</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Fifteen questions, no clock, and it points you at a section to start with.
            </p>
            <ButtonLink href="/practice/diagnostic" size="sm">
              Take the diagnostic
            </ButtonLink>
          </div>

          <div className="border-border bg-muted/40 space-y-2.5 rounded-xl border p-4">
            <p className="text-sm font-medium">I already know the dMAT</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Go straight to the questions and judge them for yourself.
            </p>
            <ButtonLink href="/prepare" size="sm" variant="outline">
              Explore practice
            </ButtonLink>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
