'use client'

import { Lightbulb } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Hint } from '@/lib/types/question'

/**
 * Progressive hints: direction, then a narrowed search, then a procedural nudge.
 *
 * Nothing is shown until it is asked for, and no hint contains the answer —
 * `verify-bank` fails the build if one does, so the guarantee is mechanical
 * rather than a matter of authoring discipline.
 *
 * The opening trigger lives in the action bar, not here: hints are secondary to
 * answering, and putting the trigger beside the primary action keeps it from
 * competing with the question for attention.
 */
export function HintPanel({
  hints,
  revealed,
  onReveal,
}: {
  hints: Hint[]
  /** How many hints are currently open, 0–3. */
  revealed: number
  onReveal: (next: number) => void
}) {
  if (hints.length === 0 || revealed === 0) return null

  const shown = hints.slice(0, revealed)
  const remaining = hints.length - revealed

  return (
    <aside
      // Keyed on the count so each further hint animates in on its own, rather
      // than the panel re-playing from scratch every time one is added.
      key={revealed}
      className="border-border bg-muted/40 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 space-y-3 rounded-2xl border p-4 motion-safe:duration-200"
      aria-label="Hints"
    >
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
        <Lightbulb className="size-3.5" aria-hidden />
        Hint {revealed} of {hints.length}
      </div>

      <ol className="space-y-2.5">
        {shown.map((hint) => (
          <li key={hint.level} className="flex items-start gap-2.5">
            <span
              className="bg-background text-muted-foreground border-border mt-px flex size-5 shrink-0 items-center justify-center rounded-sm border text-xs font-medium tabular-nums"
              aria-hidden
            >
              {hint.level}
            </span>
            <p className="text-sm leading-relaxed">{hint.text}</p>
          </li>
        ))}
      </ol>

      {remaining > 0 ? (
        <Button variant="outline" size="sm" onClick={() => onReveal(revealed + 1)}>
          Still stuck? Get a stronger hint
        </Button>
      ) : (
        <p className="text-muted-foreground text-xs">
          That is every hint. The full walkthrough opens once you answer.
        </p>
      )}
    </aside>
  )
}

/** The opening affordance, rendered in the action bar alongside the primary CTA. */
export function HintTrigger({ onReveal }: { onReveal: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onReveal}>
      <Lightbulb className="size-4" aria-hidden />
      Need a hint?
    </Button>
  )
}
