'use client'


import { Disclosure } from '@/components/content/disclosure'
import { DifficultyBadge } from '@/components/practice/difficulty-badge'
import { ResultBanner } from '@/components/practice/result-banner'
import { SolutionViewer } from '@/components/practice/solution-viewer'
import { ButtonLink } from '@/components/ui/button-link'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import { SECTION_BY_ID } from '@/lib/sections'
import type { AttemptRecord } from '@/lib/types/progress'
import type { Question } from '@/lib/types/question'

/**
 * Everything worth a second look: answered wrong, or answered right only after
 * a hint. Both are gaps, and the second one is the easier to miss.
 *
 * Deliberately not a spaced-repetition engine — it is a list of the most recent
 * attempt per question, newest first.
 */
export function ReviewList({ questions }: { questions: Question[] }) {
  const progress = useProgress()
  const ready = useProgressReady()

  const byId = new Map(questions.map((q) => [q.id, q]))

  // Most recent attempt per question, so a later success clears an earlier miss.
  const latest = new Map<string, AttemptRecord>()
  for (const attempt of progress.attempts) latest.set(attempt.questionId, attempt)

  const rows = [...latest.values()]
    .filter((a) => !a.correct || (a.hintsUsed ?? 0) > 0)
    .filter((a) => byId.has(a.questionId))
    .sort((a, b) => b.at.localeCompare(a.at))

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
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        {rows.length} {rows.length === 1 ? 'question' : 'questions'} to revisit.
      </p>

      <ul className="space-y-3">
        {rows.map((attempt) => {
          const question = byId.get(attempt.questionId)
          if (!question) return null
          const section = SECTION_BY_ID[attempt.sectionId]

          return (
            <li key={attempt.questionId} className="border-border bg-card rounded-2xl border p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="text-sm font-medium">{section.title}</span>
                <DifficultyBadge difficulty={attempt.difficulty} />
                <span className="text-muted-foreground text-xs">
                  {attempt.correct ? 'Correct with help' : 'Incorrect'}
                </span>
                {(attempt.hintsUsed ?? 0) > 0 ? (
                  <span className="text-muted-foreground text-xs">
                    {attempt.hintsUsed} {attempt.hintsUsed === 1 ? 'hint' : 'hints'}
                  </span>
                ) : null}
                <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                  {new Date(attempt.at).toLocaleDateString()}
                </span>
              </div>

              <div className="mt-3 space-y-3">
                <Disclosure summary="Review the solution">
                  <div className="space-y-3">
                    <ResultBanner
                      question={question}
                      selection={attempt.selection}
                      correct={attempt.correct}
                      hintsUsed={attempt.hintsUsed ?? 0}
                    />
                    <SolutionViewer question={question} defaultOpen />
                  </div>
                </Disclosure>

                <ButtonLink
                  variant="outline"
                  size="sm"
                  href={`/module-a/${attempt.sectionId}/practice`}
                >
                  Practise {section.title} again
                </ButtonLink>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
