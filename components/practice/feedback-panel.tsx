'use client'

import { ChevronRight } from 'lucide-react'

import { Disclosure } from '@/components/content/disclosure'
import { ResultBanner } from '@/components/practice/result-banner'
import { SolutionViewer } from '@/components/practice/solution-viewer'
import { Button } from '@/components/ui/button'
import type { Question, Selection } from '@/lib/types/question'

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

/**
 * What the card shows the moment an answer is committed: the verdict, and one
 * line of reasoning.
 *
 * Deliberately short. On a page where every question is present at once, a full
 * walkthrough opening under each answered card would bury the next question
 * under six matrices of working nobody asked for. The line shown is the item's
 * own key insight — already written to be the one transferable sentence — and
 * everything longer is a click away in the side panel.
 */
export function FeedbackSummary({
  question,
  selection,
  correct,
  hintsUsed = 0,
  onSeeMore,
}: {
  question: Question
  selection: Selection
  correct: boolean
  hintsUsed?: number
  onSeeMore: () => void
}) {
  const gist = question.walkthrough?.keyInsight ?? question.explanation

  return (
    // The verdict pushes the card's own content down as it arrives, so it fades
    // and rises into place rather than shunting under the reader's eye.
    <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 space-y-3 motion-safe:duration-200">
      <ResultBanner
        question={question}
        selection={selection}
        correct={correct}
        hintsUsed={hintsUsed}
      />

      <div className="space-y-2">
        <p className="text-muted-foreground text-sm leading-relaxed">{gist}</p>
        <Button variant="outline" size="sm" onClick={onSeeMore}>
          See more
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  )
}

/**
 * The long form, for the side panel: the full walkthrough and every wrong
 * option with the note that explains it.
 *
 * The content is exactly what the card used to unfold inline — the same
 * components, the same prose. Only where it is shown has changed.
 */
export function FeedbackDetail({
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
  const wrong = wrongOptions(question)

  return (
    <div className="space-y-3">
      <ResultBanner
        question={question}
        selection={selection}
        correct={correct}
        hintsUsed={hintsUsed}
      />

      <SolutionViewer question={question} defaultOpen />

      {wrong.length > 0 && (
        <Disclosure summary="Why the other options are wrong" hint={`${wrong.length}`}>
          <ul className="space-y-2.5">
            {wrong.map((option) => (
              <li key={option.key} className="text-muted-foreground text-sm leading-relaxed">
                <span className="text-foreground font-mono font-medium">{option.label}</span>
                {' — '}
                {option.note}
              </li>
            ))}
          </ul>
        </Disclosure>
      )}
    </div>
  )
}
