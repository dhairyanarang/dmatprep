'use client'

import { FeedbackDetail } from '@/components/practice/feedback-panel'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { isCorrect, type Question, type Selection } from '@/lib/types/question'

/**
 * The full working for one question, beside the page rather than inside it.
 *
 * A card that unfolds a walkthrough pushes every question below it down the
 * page, which on a bank of a hundred and seventy items means losing your place
 * to read something optional. So the detail opens alongside and the page stays
 * exactly where it was.
 *
 * It is a reader, not a control: opening it commits nothing, changes no answer
 * and records no attempt. The question is already answered by the time this can
 * be opened at all.
 *
 * On a narrow screen the same component comes up from the bottom, which is what
 * `side` is for — a right-hand drawer on a phone would leave the working in a
 * column too narrow for a matrix.
 */
export function ExplanationSheet({
  question,
  selection,
  hintsUsed,
  position,
  onClose,
}: {
  question: Question | null
  selection: Selection
  hintsUsed: number
  /** Which question this is in the current list, for the heading. */
  position: number
  onClose: () => void
}) {
  return (
    <Sheet open={Boolean(question)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={[
          // Bottom sheet on phones, side panel from `sm` up.
          //
          // Every override carries the `data-[side=right]` selector as well as
          // the breakpoint. The primitive positions by that attribute, so a bare
          // `max-sm:w-full` loses to `data-[side=right]:w-3/4` on specificity and
          // the phone gets a narrow left-hand column instead of a sheet — which
          // is exactly what happened the first time.
          'max-sm:data-[side=right]:inset-x-0 max-sm:data-[side=right]:inset-y-auto',
          'max-sm:data-[side=right]:bottom-0 max-sm:data-[side=right]:h-[85dvh]',
          'max-sm:data-[side=right]:w-full max-sm:data-[side=right]:max-w-none',
          'max-sm:data-[side=right]:rounded-t-2xl',
          'max-sm:data-[side=right]:border-t max-sm:data-[side=right]:border-l-0',
          // ...and so does the entrance, or it would still slide in sideways.
          'max-sm:data-[side=right]:data-starting-style:translate-x-0',
          'max-sm:data-[side=right]:data-ending-style:translate-x-0',
          'max-sm:data-[side=right]:data-starting-style:translate-y-[2.5rem]',
          'max-sm:data-[side=right]:data-ending-style:translate-y-[2.5rem]',
          'sm:max-w-lg',
        ].join(' ')}
      >
        {question ? (
          <>
            <SheetHeader className="border-b pr-12">
              <SheetTitle>Question {position}</SheetTitle>
              <SheetDescription>How it works out</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
              <FeedbackDetail
                question={question}
                selection={selection}
                correct={isCorrect(question, selection)}
                hintsUsed={hintsUsed}
              />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
