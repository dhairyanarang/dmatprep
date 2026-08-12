'use client'

import type { ReactNode } from 'react'
import { Lightbulb, Target } from 'lucide-react'

import { Disclosure } from '@/components/content/disclosure'
import { FigureSequenceSolution } from '@/components/practice/solutions/figure-sequence-solution'
import { LatinSquareSolution } from '@/components/practice/solutions/latin-square-solution'
import { MathEquationSolution } from '@/components/practice/solutions/math-equation-solution'
import type { Question, SolutionStep } from '@/lib/types/question'

/**
 * The walkthrough, ordered so it can be read in ten seconds or in two minutes.
 *
 * Key insight and takeaway stay open because they are one line each and carry
 * the transferable lesson. The step-by-step working — which is where the
 * diagrams live and where the length is — is collapsed, so a student who
 * already understands the item is not made to scroll past six matrices to
 * reach the next question.
 */
export function SolutionViewer({
  question,
  defaultOpen = false,
}: {
  question: Question
  /** Open the steps immediately — used after a wrong answer. */
  defaultOpen?: boolean
}) {
  // Questions predating the structured walkthrough fall back to their prose.
  if (!question.walkthrough) {
    return (
      <Disclosure summary="How it works out" defaultOpen={defaultOpen}>
        <p className="text-muted-foreground text-sm leading-relaxed">{question.explanation}</p>
      </Disclosure>
    )
  }

  const { keyInsight, steps, takeaway } = question.walkthrough

  return (
    <div className="space-y-3">
      <Callout icon={<Target className="size-4" aria-hidden />} title="The key insight">
        {keyInsight}
      </Callout>

      <Disclosure
        summary="Step-by-step working"
        hint={`${steps.length} ${steps.length === 1 ? 'step' : 'steps'}`}
        defaultOpen={defaultOpen}
      >
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <StepRow key={`${step.title}-${i}`} index={i} step={step}>
              <SolutionVisual question={question} step={step} />
            </StepRow>
          ))}
        </ol>
      </Disclosure>

      <Callout icon={<Lightbulb className="size-4" aria-hidden />} title="Next time">
        {takeaway}
      </Callout>
    </div>
  )
}

function Callout({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <div className="flex items-start gap-2.5">
        <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{children}</p>
        </div>
      </div>
    </div>
  )
}

function StepRow({
  index,
  step,
  children,
}: {
  index: number
  step: SolutionStep
  children: ReactNode
}) {
  return (
    <li className="flex items-start gap-3">
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
