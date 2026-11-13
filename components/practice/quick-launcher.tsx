'use client'

import { useMemo } from 'react'

import { PracticeRunner } from '@/components/practice/practice-runner'
import { Card, CardContent } from '@/components/ui/card'
import { planSession, recentSessionIds } from '@/lib/practice/selection'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import type { SectionId } from '@/lib/sections'
import type { PublicQuestion } from '@/lib/content/registry'
import type { Question } from '@/lib/types/question'
import { useSolutions } from '@/lib/solutions/use-solutions'

/**
 * A ten-question mixed set, using the same selection engine as the mocks but
 * running under ordinary practice rules — hints available, feedback after each
 * answer, and every attempt filed as practice.
 *
 * Switching subtest every few questions is its own skill: the Core Module is
 * three back to back, so the mix is deliberate rather than incidental.
 */
export function QuickLauncher({
  pools,
  count = 10,
}: {
  pools: Record<SectionId, PublicQuestion[]>
  count?: number
}) {
  const progress = useProgress()
  const ready = useProgressReady()

  // Pools arrive without answers; merge the other half back before planning.
  const sections = useMemo(() => Object.keys(pools) as SectionId[], [pools])
  const solutions = useSolutions(sections)

  if (solutions.error) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm">
            The answers for this set could not be loaded, so practice would not be able to mark
            your work. Check your connection and reload the page.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!ready || !solutions.ready) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">Putting a set together…</p>
        </CardContent>
      </Card>
    )
  }

  const seen = new Set(progress.attempts.map((a) => a.questionId))
  const avoid = recentSessionIds(progress)
  const seed = progress.attempts.length * 17 + progress.sessions.length * 3 + 5

  // Roughly even across the three subtests, remainder spread from the front.
  // Pools are hydrated first: planning and the runner both need full questions.
  const entries = (Object.entries(pools) as [SectionId, PublicQuestion[]][]).map(
    ([sectionId, pool]) => [sectionId, solutions.hydrate(pool)] as [SectionId, Question[]],
  )
  const base = Math.floor(count / entries.length)
  const extra = count - base * entries.length

  const questions = entries.flatMap(([sectionId, pool], i) =>
    planSession({
      pool,
      count: base + (i < extra ? 1 : 0),
      seen,
      avoid,
      seed: seed + i * 37,
    }).questions.map((q) => ({ ...q, sectionId })),
  )

  // Interleave so the set alternates subtest rather than running in blocks.
  const mixed: Question[] = []
  const buckets = entries.map(([sectionId]) =>
    questions.filter((q) => q.section === sectionId),
  )
  for (let i = 0; mixed.length < questions.length; i++) {
    for (const bucket of buckets) {
      if (bucket[i]) mixed.push(bucket[i])
    }
  }

  if (mixed.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm">There are no questions available for a quick session.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <PracticeRunner
      questions={mixed}
      mode="quick"
      showProgress={false}
      showFilter={false}
    />
  )
}
