'use client'

import { QuestionView } from '@/components/practice/question-view'
import { DifficultyBadge } from '@/components/practice/difficulty-badge'
import type { Question, Selection } from '@/lib/types/question'

/** The correct selection, so the example renders already answered. */
function correctSelection(question: Question): Selection {
  if (question.kind === 'figure-sequence') {
    return Object.fromEntries(question.images.map((i) => [i.label, i.correctOptionId]))
  }
  return { answer: question.correctOptionId }
}

/**
 * A real item from the bank, shown solved.
 *
 * Worked examples reuse the practice renderers rather than a parallel set, so
 * what you study is exactly what you'll meet in practice.
 */
export function WorkedExample({
  question,
  caption,
}: {
  question: Question
  caption?: string
}) {
  return (
    <figure className="bg-muted/20 space-y-4 rounded-lg border p-4 sm:p-5">
      <figcaption className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Worked example
        </span>
        <DifficultyBadge difficulty={question.difficulty} />
        {caption ? <span className="text-muted-foreground text-sm">{caption}</span> : null}
      </figcaption>

      <QuestionView
        question={question}
        selection={correctSelection(question)}
        submitted
        onSelect={() => {}}
      />

      <div className="space-y-1 border-t pt-3">
        <h4 className="text-sm font-medium">How it works out</h4>
        <p className="text-muted-foreground text-sm leading-relaxed">{question.explanation}</p>
      </div>
    </figure>
  )
}
