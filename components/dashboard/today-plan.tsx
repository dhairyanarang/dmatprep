'use client'

import Link from 'next/link'
import { Lightbulb } from 'lucide-react'

import { recommendNext, sectionSignals } from '@/lib/practice/insights'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import type { SectionId } from '@/lib/sections'

/**
 * What to do next, as an ordered short list rather than a single banner.
 *
 * Every row comes from the same `recommendNext` rules the Prepare and Test
 * pages use, so the three surfaces can never recommend different things on the
 * same evidence. Nothing here is a schedule: the product has no notion of what
 * day of a plan someone is on, and inventing one would be a claim about them
 * that nothing supports.
 */
export function TodayPlan({ bankSizes }: { bankSizes: Record<SectionId, number> }) {
  const progress = useProgress()
  const ready = useProgressReady()

  const signals = sectionSignals(progress, bankSizes)
  const recommendation = recommendNext(signals)

  // Most recent attempt per question, so a later success clears an earlier
  // miss — the same rule the review list uses.
  const latest = new Map<string, boolean>()
  for (const attempt of progress.attempts) latest.set(attempt.questionId, attempt.correct)
  const misses = [...latest.values()].filter((correct) => !correct).length

  const untried = ready && progress.attempts.length === 0

  const steps: { href: string; title: string; detail: string }[] = untried
    ? [
        {
          href: '/practice/diagnostic',
          title: 'Take the diagnostic',
          detail: 'Fifteen questions, no clock. It finds where to begin.',
        },
        {
          href: `/module-a/${recommendation.sectionId}/overview`,
          title: `Read the ${recommendation.title} rules`,
          detail: 'What the subtest asks, and how it is marked.',
        },
        {
          href: '/test',
          title: 'Then try it under the clock',
          detail: '20 questions in 25 minutes, no hints.',
        },
      ]
    : [
        {
          href: `/module-a/${recommendation.sectionId}/practice`,
          title: `Practise ${recommendation.title}`,
          detail: recommendation.reason,
        },
        ...(misses > 0
          ? [
              {
                href: '/practice/mistakes',
                title: `Retry ${misses} ${misses === 1 ? 'mistake' : 'mistakes'}`,
                detail: 'Questions you got wrong, and have not since got right.',
              },
            ]
          : []),
        {
          href: '/test',
          title: 'Sit a timed set',
          detail: 'One subtest under its own clock, or a full Core mock.',
        },
      ]

  const slowest = signals
    .filter((s) => s.averageSeconds !== null)
    .sort((a, b) => (b.averageSeconds ?? 0) - (a.averageSeconds ?? 0))[0]

  return (
    <section className="panel min-w-0 flex-[1_1_300px]">
      <div className="panel-h">
        <h2 className="ptitle">What to do next</h2>
      </div>

      <div className="surface flex flex-1 flex-col">
        {steps.map((step, i) => (
          <Link key={step.href} href={step.href} className="listrow items-start">
            <span
              aria-hidden
              className="mt-px block size-5 shrink-0 rounded-full border-[1.5px]"
              style={{ borderColor: i === 0 ? 'var(--brand)' : '#cfcfcf' }}
            />
            <span className="flex flex-1 flex-col gap-0.5">
              <b className="text-sm font-semibold">{step.title}</b>
              <span className="text-muted-foreground text-xs leading-4">{step.detail}</span>
            </span>
            {i === 0 ? (
              <span className="bg-brand text-brand-foreground flex h-[26px] shrink-0 items-center rounded-[7px] px-2.5 text-[13px] font-medium">
                Start
              </span>
            ) : null}
          </Link>
        ))}

        {/* Only when there is something measured to say. 75 seconds is 25
            minutes divided by 20 — the pacing guide, not a published limit. */}
        {slowest?.averageSeconds ? (
          <p className="note mx-2.5 mt-auto mb-2.5">
            <Lightbulb aria-hidden className="text-brand mt-px size-4 shrink-0" />
            {slowest.title} takes you {slowest.averageSeconds}s a question. The exam allows about
            75s.
          </p>
        ) : null}
      </div>
    </section>
  )
}
