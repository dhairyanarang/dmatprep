'use client'

import { CheckCircle2, Clock, LayersIcon, Sparkles } from 'lucide-react'

import { Disclosure } from '@/components/content/disclosure'
import { ReviewList } from '@/components/practice/review-list'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent } from '@/components/ui/card'
import { useProgress } from '@/lib/progress/use-progress'
import { SECTION_BY_ID, type SectionId } from '@/lib/sections'
import type { Question } from '@/lib/types/question'

/**
 * What "you have answered everything in this set" should say.
 *
 * Not "you're done" — finishing a practice set is the middle of preparing for
 * an exam, not the end of anything. So it names what was finished, and offers
 * the two things that are genuinely useful next: the same material under a
 * clock, and the full mock.
 *
 * Mistakes appear here rather than on a page of their own. This is the moment
 * they are worth looking at, and it is why removing Review from the navigation
 * cost nothing: the list did not need a destination, it needed a time.
 */
export function SetComplete({
  sectionId,
  questions,
  answered,
  onRestart,
}: {
  sectionId: SectionId
  /** The questions in this set, for the mistake list to look up. */
  questions: Question[]
  answered: number
  onRestart: () => void
}) {
  const progress = useProgress()
  const section = SECTION_BY_ID[sectionId]

  const ids = new Set(questions.map((q) => q.id))
  const latest = new Map<string, boolean>()
  for (const a of progress.attempts) {
    if (ids.has(a.questionId)) latest.set(a.questionId, a.correct && (a.hintsUsed ?? 0) === 0)
  }
  const mistakes = [...latest.values()].filter((clean) => !clean).length

  return (
    <div className="flex flex-col gap-4">
      <Card className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
        <CardContent className="space-y-5">
          <div className="flex items-start gap-3">
            <span aria-hidden className="bg-success-tint flex shrink-0 items-center rounded-md p-2">
              <CheckCircle2 className="text-success-fg size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">
                You&apos;ve completed the current {section.title} practice set
              </h2>
              <p className="text-muted-foreground mt-1.5 max-w-prose text-sm leading-relaxed">
                {answered} {answered === 1 ? 'question' : 'questions'} answered. Untimed practice is
                where the rules get learned; the clock is a different skill, and it is the one the
                exam actually measures.
              </p>
            </div>
          </div>

          <div className="border-border grid gap-3 border-t pt-5 sm:grid-cols-2">
            <NextPath
              icon={Clock}
              title={`Timed ${section.title}`}
              meta="20 questions · 25 minutes"
              description="The documented pace, no hints, results at the end."
              href={`/practice/timed/${sectionId}`}
            />
            <NextPath
              icon={LayersIcon}
              title="Full Module A simulation"
              meta="60 questions · 75 minutes"
              description="All three Core subtests back to back, in the official order."
              href="/practice/simulation"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRestart}>
              Practise this set again
            </Button>
            <p className="text-muted-foreground text-xs">
              <Sparkles className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />
              More challenge questions are coming soon — nothing ships until a solver has verified
              it.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Only when there is something to look at. An empty "your mistakes"
          panel is a reproach, not a feature. */}
      {mistakes > 0 ? (
        <Disclosure
          summary={`Go back over what you got wrong (${mistakes})`}
          chevron="end"
          className="p-0"
        >
          <ReviewList questions={questions} />
        </Disclosure>
      ) : null}
    </div>
  )
}

function NextPath({
  icon: Icon,
  title,
  meta,
  description,
  href,
}: {
  icon: typeof Clock
  title: string
  meta: string
  description: string
  href: string
}) {
  return (
    <ButtonLink
      href={href}
      variant="outline"
      className="border-border hover:border-brand/40 h-auto flex-col items-start gap-2 rounded-2xl p-4 text-left whitespace-normal"
    >
      <span className="flex items-center gap-2">
        <Icon className="text-brand size-4 shrink-0" aria-hidden />
        <span className="text-sm font-medium">{title}</span>
      </span>
      <span className="text-muted-foreground text-xs tabular-nums">{meta}</span>
      <span className="text-muted-foreground text-xs leading-relaxed font-normal">
        {description}
      </span>
    </ButtonLink>
  )
}
