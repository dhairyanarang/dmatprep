'use client'


import { X } from 'lucide-react'

import { Disclosure } from '@/components/content/disclosure'
import { DifficultyBadge } from '@/components/practice/difficulty-badge'
import { ResultBanner } from '@/components/practice/result-banner'
import { SolutionViewer } from '@/components/practice/solution-viewer'
import { ButtonLink } from '@/components/ui/button-link'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import { SECTION_BY_ID } from '@/lib/sections'
import type { AttemptRecord, ProgressState } from '@/lib/types/progress'
import type { Question } from '@/lib/types/question'

/**
 * Everything worth a second look: answered wrong, or answered right only after
 * a hint. Both are gaps, and the second one is the easier to miss.
 *
 * Deliberately not a spaced-repetition engine — it is a list of the most recent
 * attempt per question, newest first.
 */
/** Most recent attempt per question, so a later success clears an earlier miss. */
function reviewable(progress: ProgressState, questions: Question[]): AttemptRecord[] {
  const ids = new Set(questions.map((q) => q.id))
  const latest = new Map<string, AttemptRecord>()
  for (const attempt of progress.attempts) latest.set(attempt.questionId, attempt)
  return [...latest.values()]
    .filter((a) => !a.correct || (a.hintsUsed ?? 0) > 0)
    .filter((a) => ids.has(a.questionId))
    .sort((a, b) => b.at.localeCompare(a.at))
}

export function ReviewList({ questions }: { questions: Question[] }) {
  const progress = useProgress()
  const ready = useProgressReady()

  const byId = new Map(questions.map((q) => [q.id, q]))
  const rows = reviewable(progress, questions)

  if (!ready) {
    return <p className="text-muted-foreground text-sm">Loading your attempts…</p>
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center">
        <p className="text-sm font-medium">Nothing to review yet</p>
        <p className="text-muted-foreground mx-auto mt-2 max-w-prose text-sm leading-relaxed">
          Questions you get wrong, or get right only after a hint, collect here so you can come back
          to them.
        </p>
        <ButtonLink variant="outline" size="sm" className="mt-4" href="/">
          Find something to practise
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((attempt) => {
        const question = byId.get(attempt.questionId)
        if (!question) return null
        const section = SECTION_BY_ID[attempt.sectionId]

        return (
          <Disclosure
            key={attempt.questionId}
            className="p-0"
            chevron="end"
            summary={
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <span aria-hidden className="bg-danger/8 flex shrink-0 items-center rounded-md p-2">
                  <X className="text-danger size-5" />
                </span>
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-base leading-5 font-medium">{section.title}</span>
                  <DifficultyBadge difficulty={attempt.difficulty} />
                  <span className="text-muted-foreground text-xs">
                    {attempt.correct ? 'Correct with help' : 'Incorrect'}
                    {(attempt.hintsUsed ?? 0) > 0
                      ? ` · ${attempt.hintsUsed} ${attempt.hintsUsed === 1 ? 'hint' : 'hints'}`
                      : ''}
                  </span>
                </span>
              </span>
            }
          >
            <div className="space-y-3">
              <ResultBanner
                question={question}
                selection={attempt.selection}
                correct={attempt.correct}
                hintsUsed={attempt.hintsUsed ?? 0}
              />
              <SolutionViewer question={question} defaultOpen />
              <ButtonLink
                variant="outline"
                size="sm"
                href={`/module-a/${attempt.sectionId}/practice`}
              >
                Practise {section.title} again
              </ButtonLink>
            </div>
          </Disclosure>
        )
      })}
    </div>
  )
}

/** The "N questions to revisit." line, shown beside the Mistakes heading. */
export function MistakeCount({ questions }: { questions: Question[] }) {
  const progress = useProgress()
  const ready = useProgressReady()
  const count = reviewable(progress, questions).length
  if (!ready) return null
  return <>{count === 0 ? 'Nothing to revisit yet.' : `${count} ${count === 1 ? 'question' : 'questions'} to revisit.`}</>
}
