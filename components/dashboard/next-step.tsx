'use client'

import { NextStepCard } from '@/components/dashboard/next-step-card'
import { ButtonLink } from '@/components/ui/button-link'
import { recommendNext, sectionSignals } from '@/lib/practice/insights'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import type { SectionId } from '@/lib/sections'

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

  if (brandNew) {
    return (
      <NextStepCard
        eyebrow="Start preparing"
        title="New to the dMAT? Take the diagnostic"
        description="Fifteen questions, no clock. It finds where to begin, and locks nothing in."
      >
        <div className="flex shrink-0 flex-wrap gap-2">
          <ButtonLink
            href="/practice/diagnostic"
            size="sm"
            className="bg-brand-cta text-brand-cta-foreground hover:bg-brand-cta/90 rounded-full"
          >
            Take the diagnostic
          </ButtonLink>
          <ButtonLink
            href="/prepare"
            size="sm"
            variant="ghost"
            className="rounded-full text-white hover:bg-white/10 hover:text-white"
          >
            I already know the dMAT
          </ButtonLink>
        </div>
      </NextStepCard>
    )
  }

  return (
    <NextStepCard
      title={`Practice ${recommendation.title}`}
      description={ready ? recommendation.reason : 'Checking where you left off…'}
      action="Start Practice"
      href={`/module-a/${recommendation.sectionId}/practice`}
    />
  )
}
