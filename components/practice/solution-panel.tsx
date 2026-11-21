'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Lightbulb, Lock, X } from 'lucide-react'

import { DifficultyBadge } from '@/components/practice/difficulty-badge'
import { FeedbackDetail } from '@/components/practice/feedback-panel'
import { Button } from '@/components/ui/button'
import { isCorrect, type Question, type Selection } from '@/lib/types/question'
import { cn } from '@/lib/utils'

/**
 * Hints and the full working, beside the question rather than inside it.
 *
 * This is the v2 prototype's `.spanel`, and it replaces two separate older
 * presentations: an inline hint block that unfolded inside the question card,
 * and a sheet that slid over the page to show the solution. Both had the same
 * flaw from opposite directions — the inline block pushed every question below
 * it down the page, and the sheet covered the question you were asking about.
 *
 * The prototype's answer is one panel holding both, which is why they are one
 * component here rather than two. Its three rules, taken from the artifact:
 *
 *  · **All three hint slots are always visible.** A hint you have not asked for
 *    reads "Hidden until you ask" rather than being absent, so the shape of the
 *    help on offer is known before you spend any of it.
 *  · **The full working is locked until the question is answered**, with an
 *    explicit way through. Trying first is the default, not a rule.
 *  · **The footer steps between questions** without closing, so working through
 *    a set with the panel open is one continuous motion.
 *
 * On a screen below `lg` it is a drawer over the page, dismissed by the close
 * button or Escape. Above `lg` it is an in-flow sticky column and overlaps
 * nothing. See `.spanel` in `app/globals.css`.
 */
export function SolutionPanel({
  question,
  selection,
  hintsUsed,
  position,
  total,
  answered,
  atStart,
  atEnd,
  hiddenOnMobile,
  onReveal,
  onClose,
  onStep,
}: {
  question: Question
  selection: Selection
  /** How many hints are open, 0–3. */
  hintsUsed: number
  /** 1-based index of this question in the current list. */
  position: number
  total: number
  answered: boolean
  /** Whether stepping back or forward would leave the filtered list. */
  atStart: boolean
  atEnd: boolean
  /** Below `lg` the sidebar is a drawer; above it this is ignored. */
  hiddenOnMobile: boolean
  onReveal: (next: number) => void
  onClose: () => void
  onStep: (delta: -1 | 1) => void
}) {
  const panel = useRef<HTMLElement>(null)

  // Escape closes it. Only meaningful while it is a drawer, but harmless as a
  // column and one less thing to make conditional.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const hints = question.hints ?? []
  const right = answered && isCorrect(question, selection)

  return (
    <aside
      ref={panel}
      tabIndex={-1}
      className={cn('spanel focus:outline-none', hiddenOnMobile && 'max-lg:hidden')}
      aria-label={`Hints and solution for question ${position}`}
    >
      <div className="sp-h">
        <span className="flex min-w-0 items-center gap-2">
          <b className="font-mono text-xs font-semibold tabular-nums">
            Q{String(position).padStart(2, '0')}
          </b>
          <DifficultyBadge difficulty={question.difficulty} />
          <span className="text-muted-foreground truncate font-mono text-xs">{question.id}</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close hints and solution"
          className="text-muted-foreground hover:text-foreground grid size-7 shrink-0 cursor-pointer place-items-center rounded-md transition-colors duration-150 lg:hidden"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* ------------------------------------------------------------ hints */}
        <section className="panel">
          <div className="panel-h min-h-[38px]">
            <span className="ptitle">Hints</span>
            <span className="text-muted-foreground font-mono text-xs">
              {hints.length === 0 ? 'None' : `${hintsUsed} of ${hints.length}`}
            </span>
          </div>
          <div className="surface flex flex-col gap-2 p-2.5">
            {hints.length === 0 ? (
              <p className="text-muted-foreground px-1 py-1.5 text-sm">
                This question has no hints.
              </p>
            ) : (
              hints.map((hint, index) => {
                const open = index < hintsUsed
                return (
                  <div
                    key={hint.level}
                    className={cn(
                      'flex gap-2.5 rounded-lg px-2.5 py-2 text-sm leading-5',
                      open ? 'bg-accent text-accent-foreground' : 'bg-frame text-muted-foreground',
                    )}
                  >
                    <span className="shrink-0 pt-px font-mono text-[11px]">H{hint.level}</span>
                    <span>{open ? hint.text : 'Hidden until you ask'}</span>
                  </div>
                )
              })
            )}

            {hints.length > 0 && hintsUsed < hints.length ? (
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => onReveal(hintsUsed + 1)}
              >
                <Lightbulb className="text-brand size-4" aria-hidden />
                Show hint {hintsUsed + 1}
              </Button>
            ) : null}
          </div>
        </section>

        {/* --------------------------------------------------------- solution */}
        <section className="panel">
          <div className="panel-h min-h-[38px]">
            <span className="ptitle">Full solution</span>
            {answered ? null : <Lock className="text-muted-foreground size-3.5" aria-hidden />}
          </div>
          <div className="surface">
            {answered ? (
              <div className="p-3.5">
                <FeedbackDetail
                  question={question}
                  selection={selection}
                  correct={right}
                  hintsUsed={hintsUsed}
                />
              </div>
            ) : (
              <p className="text-muted-foreground p-4 text-sm leading-5">
                Try it first. The working opens once you answer.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="sp-f">
        <Button
          variant="outline"
          size="sm"
          disabled={atStart}
          onClick={() => onStep(-1)}
          aria-label="Previous question"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </Button>
        <span className="text-muted-foreground font-mono text-xs tabular-nums">
          {position} / {total}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={atEnd}
          onClick={() => onStep(1)}
          aria-label="Next question"
        >
          Next
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </aside>
  )
}

/**
 * The opening affordance, in the question card's header strip.
 *
 * It reports how much help has already been taken — "Hint 2 of 3" rather than
 * a bare "Hint" — so the cost of opening it again is legible before you do.
 * The prototype puts it exactly here, next to the bookmark, and not beside the
 * primary action: asking for a hint should not sit where "submit" sits.
 */
export function HintTrigger({
  hintsUsed,
  total,
  onOpen,
}: {
  hintsUsed: number
  total: number
  onOpen: () => void
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 px-2 text-xs"
      onClick={onOpen}
      aria-label={hintsUsed > 0 ? `Hints, ${hintsUsed} of ${total} shown` : 'Need a hint?'}
    >
      <Lightbulb className="text-brand size-3.5" aria-hidden />
      {hintsUsed > 0 ? `Hint ${hintsUsed} of ${total}` : 'Need a hint?'}
    </Button>
  )
}
