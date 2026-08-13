'use client'

import { CheckCircle2, XCircle } from 'lucide-react'

import type { Question, Selection } from '@/lib/types/question'
import { cn } from '@/lib/utils'

/**
 * The result, on its own, above the walkthrough.
 *
 * Kept deliberately short: what happened, what you chose, what was right. The
 * reasoning lives below and is opt-in, because a student who got it right does
 * not need to scroll past six steps to reach the next question.
 */
export function ResultBanner({
  question,
  selection,
  correct,
  hintsUsed = 0,
}: {
  question: Question
  selection: Selection
  correct: boolean
  hintsUsed?: number
}) {
  const rows = answerRows(question, selection)

  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
        correct ? 'border-success/40 bg-success-tint/50' : 'border-danger/40 bg-danger-tint/50',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {correct ? (
          <CheckCircle2 className="text-success-fg size-5 shrink-0" aria-hidden />
        ) : (
          <XCircle className="text-danger-fg size-5 shrink-0" aria-hidden />
        )}
        <p className="font-medium">{correct ? 'Correct' : 'Not quite'}</p>
        {hintsUsed > 0 ? (
          <span className="text-muted-foreground text-xs">
            {hintsUsed === 1 ? '1 hint' : `${hintsUsed} hints`} used
          </span>
        ) : null}
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline gap-2">
            <dt className="text-muted-foreground shrink-0 text-xs">{row.label}</dt>
            <dd className="flex min-w-0 items-baseline gap-2 font-mono text-sm">
              <span className={cn(row.correct ? 'text-foreground' : 'text-muted-foreground')}>
                {row.yours ?? '—'}
              </span>
              {!row.correct ? (
                <>
                  {/* Never colour alone: the arrow and the label carry the meaning. */}
                  <span aria-hidden className="text-muted-foreground">
                    →
                  </span>
                  <span className="text-foreground font-medium">{row.answer}</span>
                </>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

type Row = { label: string; yours: string | null; answer: string; correct: boolean }

/** Your answer against the right one, per selection the item required. */
function answerRows(question: Question, selection: Selection): Row[] {
  if (question.kind === 'figure-sequence') {
    return question.images.map((image, i) => {
      const chosen = selection[image.label]
      return {
        label: `Image ${i + 1}`,
        yours: chosen ? chosen.replace('matrix', 'Matrix ') : null,
        answer: image.correctOptionId.replace('matrix', 'Matrix '),
        correct: chosen === image.correctOptionId,
      }
    })
  }

  const chosen = selection.answer
  if (question.kind === 'math-equations') {
    const yours = question.options.find((o) => o.id === chosen)
    const answer = question.options.find((o) => o.id === question.correctOptionId)
    return [
      {
        label: `${question.asked} =`,
        yours: yours ? String(yours.value) : null,
        answer: String(answer?.value ?? ''),
        correct: chosen === question.correctOptionId,
      },
    ]
  }

  return [
    {
      label: 'Marked cell',
      yours: chosen ?? null,
      answer: question.correctOptionId,
      correct: chosen === question.correctOptionId,
    },
  ]
}
