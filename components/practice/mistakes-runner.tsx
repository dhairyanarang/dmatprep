'use client'

import { useMemo } from 'react'

import { PracticeRunner } from '@/components/practice/practice-runner'
import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent } from '@/components/ui/card'
import type { PublicQuestion } from '@/lib/content/registry'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import type { SectionId } from '@/lib/sections'

/**
 * Everything answered wrong and not since answered right.
 *
 * `/review` was removed from the navigation on the grounds that mistakes are
 * worth looking at at the end of a set rather than as a fifth destination.
 * This is the other half of that decision: the end of a set can point *here*,
 * and so can the dashboard, without putting a fifth thing in the sidebar.
 *
 * The rule is the one the review list already used — most recent attempt per
 * question, so a later success clears an earlier miss. Nothing is scheduled and
 * nothing decays: it is a list of what is currently wrong, and it empties as
 * they are put right.
 */
export function MistakesRunner({ pools }: { pools: Record<SectionId, PublicQuestion[]> }) {
  const progress = useProgress()
  const ready = useProgressReady()

  const questions = useMemo(() => {
    const latest = new Map<string, boolean>()
    for (const attempt of progress.attempts) latest.set(attempt.questionId, attempt.correct)

    const wrong = new Set([...latest.entries()].filter(([, ok]) => !ok).map(([id]) => id))
    if (wrong.size === 0) return []

    // Newest miss first: the one just made is the one worth redoing.
    const order = new Map<string, string>()
    for (const attempt of progress.attempts) {
      if (wrong.has(attempt.questionId)) order.set(attempt.questionId, attempt.at)
    }

    return Object.values(pools)
      .flat()
      .filter((q) => wrong.has(q.id))
      .sort((a, b) => (order.get(b.id) ?? '').localeCompare(order.get(a.id) ?? ''))
    // `progress.attempts` is the only input that matters and it is read here;
    // the pools are static for the life of the page.
  }, [progress.attempts, pools])

  if (!ready) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">Looking for your mistakes…</p>
        </CardContent>
      </Card>
    )
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-3">
          <p className="text-sm font-medium">Nothing to retry</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Every question you have answered, you have since answered correctly. Practise some
            more and anything you get wrong will collect here.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <ButtonLink href="/prepare">Practise</ButtonLink>
            <ButtonLink variant="outline" href="/test">
              Sit a timed set
            </ButtonLink>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <PracticeRunner mode="quick" questions={questions} showProgress={false} showFilter={false} />
}
