'use client'

import type { ReactNode } from 'react'

import { DifficultyBadge } from '@/components/practice/difficulty-badge'
import { EquationSystem } from '@/components/render/equation-system'
import { FigureMatrix } from '@/components/render/figure-matrix'
import { LatinGrid, LatinLetterKey } from '@/components/render/latin-grid'
import type { Question } from '@/lib/types/question'

/**
 * A real item from the bank, shown solved.
 *
 * This deliberately does *not* render the practice option grids. It used to:
 * `<QuestionView submitted onSelect={() => {}} />` drew every answer choice,
 * marked the right one, and disabled the rest. On the page that reads as a
 * question waiting to be answered, and visitors answered it — Clarity recorded
 * whole sessions of clicks on the overview pages that could not, by
 * construction, do anything. An illustration should not look like a prompt.
 *
 * So the answer is *shown* instead of offered: the sequence is completed, the
 * value is stated, the letter is named. The renderers underneath are still the
 * practice ones (FigureMatrix, EquationSystem, LatinGrid), so what you study is
 * drawn exactly as you will meet it — only the choosing is gone, because there
 * is nothing here to choose.
 */
export function WorkedExample({
  question,
  caption,
}: {
  question: Question
  caption?: string
}) {
  return (
    <figure className="bg-muted/20 space-y-4 rounded-lg border p-4 sm:p-5">
      <figcaption className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Worked example
        </span>
        <DifficultyBadge difficulty={question.difficulty} />
        {caption ? <span className="text-muted-foreground text-sm">{caption}</span> : null}
      </figcaption>

      <SolvedItem question={question} />

      <div className="space-y-1 border-t pt-3">
        <h4 className="text-sm font-medium">How it works out</h4>
        <p className="text-muted-foreground text-sm leading-relaxed">{question.explanation}</p>
      </div>
    </figure>
  )
}

function SolvedItem({ question }: { question: Question }) {
  switch (question.kind) {
    case 'figure-sequence':
      return <SolvedFigureSequence question={question} />
    case 'math-equations':
      return <SolvedMathEquations question={question} />
    case 'latin-square':
      return <SolvedLatinSquare question={question} />
  }
}

/** The label under an answer panel or beside a stated value. */
function AnswerLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-success-fg text-[11px] font-medium tracking-wide uppercase">
      {children}
    </span>
  )
}

function SolvedFigureSequence({
  question,
}: {
  question: Extract<Question, { kind: 'figure-sequence' }>
}) {
  // The fifth and sixth panels, taken from the marked option rather than
  // re-derived: the bank is the authority on which continuation is correct.
  const answers = question.images.map((image) => {
    const option = image.options.find((o) => o.id === image.correctOptionId)
    return option?.panel
  })

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm">
        Four matrices are given. The fifth and sixth continue the sequence.
      </p>
      {/* Six-up, exactly as in practice — but with the answers in place of the
          two blanks, so the sequence reads straight through. */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {question.given.map((panel, i) => (
          <div key={`given-${i}`} className="space-y-1">
            <FigureMatrix
              panel={panel}
              rows={question.grid.rows}
              cols={question.grid.cols}
              title={`Matrix ${i + 1}`}
              className="max-w-none"
            />
          </div>
        ))}
        {answers.map((panel, i) =>
          panel ? (
            <div key={`answer-${i}`} className="space-y-1">
              <div className="border-success bg-success-tint rounded-md border p-1">
                <FigureMatrix
                  panel={panel}
                  rows={question.grid.rows}
                  cols={question.grid.cols}
                  title={`Matrix ${i + 5}, the answer`}
                  className="max-w-none"
                />
              </div>
              <AnswerLabel>Matrix {i + 5}</AnswerLabel>
            </div>
          ) : null,
        )}
      </div>
    </div>
  )
}

function SolvedMathEquations({
  question,
}: {
  question: Extract<Question, { kind: 'math-equations' }>
}) {
  const value = question.options.find((o) => o.id === question.correctOptionId)?.value

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Every letter is a whole number from 1 to 20, and one set of values makes all the
        equations true.
      </p>

      <EquationSystem equations={question.equations} />

      {value === undefined ? null : (
        <p className="flex items-baseline gap-2">
          <AnswerLabel>Answer</AnswerLabel>
          <span className="font-mono text-lg font-medium">
            {question.asked} = {value}
          </span>
        </p>
      )}
    </div>
  )
}

function SolvedLatinSquare({
  question,
}: {
  question: Extract<Question, { kind: 'latin-square' }>
}) {
  // The placements the deduction relied on, shown filled in — the same reveal
  // practice gives once an answer is in.
  const reveal = Object.fromEntries(
    question.solutionSteps.map((step) => [`${step.cell.row},${step.cell.col}`, step.letter]),
  )
  const letter = question.options.find((o) => o.id === question.correctOptionId)?.letter

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Each letter appears exactly once in every row and every column. The highlighted cell is
        the one being solved.
      </p>

      <div className="flex flex-col items-start gap-3">
        <LatinGrid grid={question.grid} target={question.target} reveal={reveal} />
        <LatinLetterKey letters={question.letters} />
      </div>

      {letter === undefined ? null : (
        <p className="flex items-baseline gap-2">
          <AnswerLabel>Answer</AnswerLabel>
          <span className="font-mono text-lg font-medium">{letter}</span>
        </p>
      )}
    </div>
  )
}
