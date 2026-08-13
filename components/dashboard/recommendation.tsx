'use client'

import { NextStepCard } from '@/components/dashboard/next-step-card'
import { recommendNext, sectionSignals } from '@/lib/practice/insights'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import type { SectionId } from '@/lib/sections'

/**
 * "Here is the one thing to do next", for Prepare and Test.
 *
 * Home answers the same question with more context — it also has to greet
 * someone who has never opened the product. These two pages are already a
 * decision to learn or to be tested, so the banner simply picks the subtest and
 * gets out of the way.
 *
 * Both read the same `recommendNext` rules, so the three surfaces can never
 * recommend different things on the same evidence.
 */
export function Recommendation({
  bankSizes,
  intent,
}: {
  bankSizes: Record<SectionId, number>
  intent: 'practice' | 'test'
}) {
  const progress = useProgress()
  const ready = useProgressReady()

  const signals = sectionSignals(progress, bankSizes)
  const recommendation = recommendNext(signals)

  // Nothing attempted yet: on Test that means the clock is the wrong next step,
  // so it says so rather than pushing someone into a mock cold.
  const untried = ready && progress.attempts.length === 0

  if (intent === 'test' && untried) {
    return (
      <NextStepCard
        title="Practise before you time yourself"
        description="Timed practice is most useful once you know the rules of a subtest. The diagnostic finds where to start — fifteen questions, no clock."
        action="Take the diagnostic"
        href="/practice/diagnostic"
      />
    )
  }

  if (intent === 'test') {
    return (
      <NextStepCard
        title={`Test ${recommendation.title}`}
        description={
          ready
            ? `${recommendation.reason} 20 questions in 25 minutes, no hints.`
            : 'Checking where you left off…'
        }
        action="Start Test"
        href={`/practice/timed/${recommendation.sectionId}`}
      />
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
