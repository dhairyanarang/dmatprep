'use client'

import { ArrowRight } from 'lucide-react'

import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent } from '@/components/ui/card'
import { readiness, recommendNext, sectionSignals } from '@/lib/practice/insights'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import { SECTION_ACCENT } from '@/lib/nav'
import type { SectionId } from '@/lib/sections'
import { cn } from '@/lib/utils'

const DOT = { figures: 'bg-figures', equations: 'bg-equations', latin: 'bg-latin' } as const

/**
 * The home page's job is to answer one question: what should I do right now?
 *
 * The recommendation is fixed rules over recorded attempts — least evidence
 * first, then lowest accuracy, ties broken by pace. No model, and nothing that
 * cannot be explained in a sentence on the card itself.
 */
export function NextStep({ bankSizes }: { bankSizes: Record<SectionId, number> }) {
  const progress = useProgress()
  const ready = useProgressReady()

  const signals = sectionSignals(progress, bankSizes)
  const recommendation = recommendNext(signals)
  const state = readiness(progress, signals)

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card className="[--card-spacing:--spacing(5)]">
        <CardContent className="flex h-full flex-col gap-4">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              Recommended next step
            </p>
            <h3 className="mt-2 flex items-center gap-2 text-base font-semibold tracking-tight">
              <span
                aria-hidden
                className={cn('size-2 rounded-full', DOT[SECTION_ACCENT[recommendation.sectionId]])}
              />
              {recommendation.title}
            </h3>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              {ready ? recommendation.reason : 'Checking where you left off…'}
            </p>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-3">
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

      <Card className="[--card-spacing:--spacing(5)]">
        <CardContent className="flex h-full flex-col gap-3">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              dMAT Prep readiness
            </p>
            <p className="mt-2 text-base font-semibold tracking-tight">{state.label}</p>
          </div>

          <ul className="text-muted-foreground space-y-1 text-xs leading-relaxed">
            {state.because.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          {state.nextUp ? (
            <p className="text-muted-foreground border-t pt-3 text-xs leading-relaxed">
              <span className="text-foreground font-medium">To move up: </span>
              {state.nextUp}
            </p>
          ) : null}

          <p className="text-muted-foreground mt-auto border-t pt-3 text-xs leading-relaxed">
            A dMAT Prep indicator based on your practice here — not an official dMAT score, and not
            a prediction of one.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
