'use client'

import type { MathEquationsQuestion, SolutionVisual } from '@/lib/types/question'
import { cn } from '@/lib/utils'

/**
 * Visual evidence for a Mathematical Equations step.
 *
 * Equations render as equations rather than inside a sentence: the audit found
 * the old explanations were a paragraph of prose that restated the substitution,
 * which is the hardest possible way to read algebra.
 */
export function MathEquationSolution({
  question,
  visual,
}: {
  question: MathEquationsQuestion
  visual: SolutionVisual
}) {
  if (visual.type === 'me-equation') {
    return (
      <div className="mt-3 space-y-1.5">
        <ul className="space-y-1.5 font-mono text-sm" aria-label="System of equations">
          {question.equations.map((equation) => {
            const active = equation === visual.equation
            return (
              <li
                key={equation}
                className={cn(
                  'rounded-md border px-3 py-1.5 tabular-nums transition-colors',
                  active
                    ? 'border-equations/40 bg-equations-tint text-foreground'
                    : 'border-transparent bg-muted/40 text-muted-foreground',
                )}
              >
                {equation}
              </li>
            )
          })}
        </ul>
        {visual.note ? (
          <p className="text-foreground font-mono text-sm font-medium">{visual.note}</p>
        ) : null}
      </div>
    )
  }

  if (visual.type === 'me-values') {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(visual.values).map(([name, value]) => {
          const asked = name === question.asked
          return (
            <span
              key={name}
              className={cn(
                'rounded-md border px-2.5 py-1 font-mono text-sm tabular-nums',
                asked
                  ? 'border-foreground/30 bg-accent text-foreground font-medium'
                  : 'border-border bg-muted/40 text-muted-foreground',
              )}
            >
              {name} = {value}
              {asked ? <span className="ml-1.5 font-sans text-xs">asked</span> : null}
            </span>
          )
        })}
      </div>
    )
  }

  return null
}
