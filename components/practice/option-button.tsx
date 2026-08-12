'use client'

import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'

import { cn } from '@/lib/utils'

export type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'missed'

/**
 * One answer choice.
 *
 * After submission the states carry the whole feedback story: `correct` for a
 * right pick, `incorrect` for a wrong one, and `missed` to point out the right
 * answer when the candidate chose something else.
 */
export function OptionButton({
  state,
  onSelect,
  disabled,
  label,
  children,
  className,
}: {
  state: OptionState
  onSelect: () => void
  disabled?: boolean
  /** Accessible name, needed when the visible content is a diagram. */
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={state === 'selected' || state === 'correct' || state === 'incorrect'}
      aria-label={label}
      className={cn(
        'relative flex items-center gap-3 rounded-md border p-3 text-left transition-colors',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        !disabled && 'hover:border-foreground/40 cursor-pointer',
        state === 'idle' && 'border-border',
        // Selection stays neutral-bright rather than acid lime: lime is reserved
        // for the single action on the view, which is the Check answer button.
        state === 'selected' && 'border-foreground bg-accent',
        state === 'correct' && 'border-success bg-success-tint',
        state === 'incorrect' && 'border-danger bg-danger-tint',
        state === 'missed' && 'border-success/60 border-dashed',
        className,
      )}
    >
      {children}

      {(state === 'correct' || state === 'missed') && (
        <Check className="text-success-fg absolute top-2 right-2 size-4" aria-hidden />
      )}
      {state === 'incorrect' && (
        <X className="text-danger-fg absolute top-2 right-2 size-4" aria-hidden />
      )}
    </button>
  )
}

/** Resolve an option's visual state from the current answer/selection. */
export function optionState({
  optionId,
  selectedId,
  correctId,
  submitted,
}: {
  optionId: string
  selectedId: string | undefined
  correctId: string
  submitted: boolean
}): OptionState {
  if (!submitted) return selectedId === optionId ? 'selected' : 'idle'
  if (optionId === correctId) return selectedId === optionId ? 'correct' : 'missed'
  return selectedId === optionId ? 'incorrect' : 'idle'
}
