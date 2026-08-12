'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown, Lightbulb, Target } from 'lucide-react'

import { FigureSequenceSolution } from '@/components/practice/solutions/figure-sequence-solution'
import { LatinSquareSolution } from '@/components/practice/solutions/latin-square-solution'
import { MathEquationSolution } from '@/components/practice/solutions/math-equation-solution'
import { Button } from '@/components/ui/button'
import type { Question, SolutionStep } from '@/lib/types/question'
import { cn } from '@/lib/utils'

/**
 * The shared shell every solution renders into: key insight, numbered steps with
 * their visual evidence, the answer, and the takeaway.
 *
 * The audit found the old explanations described the answer rather than teaching
 * the search, which is why the structure is fixed here rather than left to each
 * section — a section can choose its visuals, not whether to show a method.
 */
export function SolutionViewer({ question }: { question: Question }) {
  // Questions generated before the Phase 3 upgrade have no structured
  // walkthrough. They fall back to their prose explanation rather than breaking.
  if (!question.walkthrough) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">How it works out</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{question.explanation}</p>
      </div>
    )
  }

  const { keyInsight, steps, answer, takeaway } = question.walkthrough

  return (
    <div className="space-y-5">
      <section className="border-border bg-card rounded-xl border p-4">
        <div className="flex items-start gap-2.5">
          <Target className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <h3 className="text-sm font-medium">The key insight</h3>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{keyInsight}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium">Working it out</h3>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <StepCard key={`${step.title}-${i}`} index={i} step={step}>
              <SolutionVisual question={question} step={step} />
            </StepCard>
          ))}
        </ol>
      </section>

      <section className="border-success/25 bg-success-tint/40 rounded-xl border p-4">
        <h3 className="text-sm font-medium">Answer</h3>
        <p className="mt-1.5 text-sm leading-relaxed">{answer}</p>
      </section>

      <section className="border-border bg-muted/50 rounded-xl border p-4">
        <div className="flex items-start gap-2.5">
          <Lightbulb className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <h3 className="text-sm font-medium">Next time</h3>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{takeaway}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function StepCard({
  index,
  step,
  children,
}: {
  index: number
  step: SolutionStep
  children: ReactNode
}) {
  return (
    <li className="border-border bg-card rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <span
          className="bg-muted text-muted-foreground mt-px flex size-5 shrink-0 items-center justify-center rounded-sm text-xs font-medium tabular-nums"
          aria-hidden
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{step.title}</p>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{step.detail}</p>
          {children}
        </div>
      </div>
    </li>
  )
}

function SolutionVisual({ question, step }: { question: Question; step: SolutionStep }) {
  if (!step.visual) return null

  switch (question.kind) {
    case 'figure-sequence':
      return <FigureSequenceSolution question={question} visual={step.visual} />
    case 'math-equations':
      return <MathEquationSolution question={question} visual={step.visual} />
    case 'latin-square':
      return <LatinSquareSolution question={question} visual={step.visual} />
  }
}

/** Collapsed by default — the answer is the point, the reasoning is opt-in. */
export function CollapsibleSolution({ question }: { question: Question }) {
  const [open, setOpen] = useState(false)

  if (open) return <SolutionViewer question={question} />

  return (
    <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full sm:w-auto">
      Show the full walkthrough
      <ChevronDown className={cn('size-4')} aria-hidden />
    </Button>
  )
}
