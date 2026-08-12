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
 */
export function HintPanel({
  hints,
  revealed,
  onReveal,
  disabled,
}: {
  hints: Hint[]
  /** How many hints are currently open, 0–3. */
  revealed: number
  onReveal: (next: number) => void
  disabled?: boolean
}) {
  if (hints.length === 0) return null

  const shown = hints.slice(0, revealed)
  const remaining = hints.length - revealed

  if (revealed === 0) {
    return (
      <Button variant="outline" size="sm" onClick={() => onReveal(1)} disabled={disabled}>
        <Lightbulb className="size-4" aria-hidden />
        Need a hint?
      </Button>
    )
  }

  return (
    <div className="border-border bg-muted/40 space-y-3 rounded-xl border p-4">
      <ol className="space-y-3">
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
        <Button variant="outline" size="sm" onClick={() => onReveal(revealed + 1)} disabled={disabled}>
          Still stuck? Get a stronger hint
        </Button>
      ) : (
        <p className="text-muted-foreground text-xs">
          That is every hint for this question. Answer it, and the full walkthrough opens up.
        </p>
      )}
    </div>
  )
}
