'use client'

import { CheckCircle2, XCircle } from 'lucide-react'

import { Separator } from '@/components/ui/separator'
import type { Question, Selection } from '@/lib/types/question'
import { cn } from '@/lib/utils'

type WrongOption = { key: string; label: string; note: string }

/** Every incorrect option in the item, with the note explaining why it fails. */
function wrongOptions(question: Question): WrongOption[] {
  if (question.kind === 'figure-sequence') {
    return question.images.flatMap((image, imageIndex) =>
      image.options
        .filter((o) => o.id !== image.correctOptionId)
        .map((o) => ({
          key: `${image.label}:${o.id}`,
          label: `Image ${imageIndex + 1}, ${o.id.replace('matrix', 'Matrix ')}`,
          note: question.distractorNotes[`${image.label}:${o.id}`] ?? '',
        })),
    )
  }

  if (question.kind === 'math-equations') {
    return question.options
      .filter((o) => o.id !== question.correctOptionId)
      .map((o) => ({
        key: o.id,
        label: String(o.value),
        note: question.distractorNotes[o.id] ?? '',
      }))
  }

  return question.options
    .filter((o) => o.id !== question.correctOptionId)
    .map((o) => ({
      key: o.id,
      label: o.letter,
      note: question.distractorNotes[o.id] ?? '',
    }))
}

/** Per-image outcome, so a half-right figure item reads honestly. */
function imageOutcomes(question: Question, selection: Selection) {
  if (question.kind !== 'figure-sequence') return null
  return question.images.map((image, i) => ({
    label: `Image ${i + 1}`,
    correct: selection[image.label] === image.correctOptionId,
  }))
}

export function FeedbackPanel({
  question,
  selection,
  correct,
}: {
  question: Question
  selection: Selection
  correct: boolean
}) {
  const wrong = wrongOptions(question)
  const outcomes = imageOutcomes(question, selection)

  return (
    <div
      className={cn(
        'rounded-lg border-2 p-4 sm:p-5',
        correct
          ? 'border-emerald-600/40 bg-emerald-50/60 dark:bg-emerald-950/20'
          : 'border-rose-600/40 bg-rose-50/60 dark:bg-rose-950/20',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        {correct ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
        ) : (
          <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden />
        )}
        <p className="font-medium">{correct ? 'Correct' : 'Not quite'}</p>
      </div>

      {outcomes && !correct && (
        <p className="text-muted-foreground mt-1 text-sm">
          {outcomes.map((o) => `${o.label}: ${o.correct ? 'right' : 'wrong'}`).join(' · ')} — both
          have to be right for the item to count.
        </p>
      )}

      <Separator className="my-4" />

      <div className="space-y-2">
        <h3 className="text-sm font-medium">How it works out</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{question.explanation}</p>
      </div>

      {wrong.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium">Why the other options are wrong</h3>
          <ul className="space-y-2">
            {wrong.map((option) => (
              <li key={option.key} className="text-muted-foreground text-sm leading-relaxed">
                <span className="text-foreground font-mono font-medium">{option.label}</span>
                {' — '}
                {option.note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
