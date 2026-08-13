'use client'

import { Disclosure } from '@/components/content/disclosure'
import { ResultBanner } from '@/components/practice/result-banner'
import { SolutionViewer } from '@/components/practice/solution-viewer'
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
 * Everything shown after submitting, in the order a student needs it:
 * result, then the reasoning, then why the other options fail.
 *
 * The next action is not here — it lives in the sticky action bar, so the
 * length of this panel never decides how far the student has to scroll.
 */
export function FeedbackPanel({
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
    // The verdict pushes the page down as it arrives, so it fades and rises into
    // place instead of shunting the content under the reader's eye.
    <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 space-y-3 motion-safe:duration-200">
      <ResultBanner
        question={question}
        selection={selection}
        correct={correct}
        hintsUsed={hintsUsed}
      />

      {/* Open the working straight away when the answer was wrong — that is the
          moment the explanation is actually wanted. */}
      <SolutionViewer question={question} defaultOpen={!correct} />

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
