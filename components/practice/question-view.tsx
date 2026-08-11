'use client'

import { EquationSystem } from '@/components/render/equation-system'
import { FigureMatrix, FigureUnknown, describePanel } from '@/components/render/figure-matrix'
import { LatinGrid, LatinLetterKey } from '@/components/render/latin-grid'
import { OptionButton, optionState } from '@/components/practice/option-button'
import type { Question, Selection } from '@/lib/types/question'

type Props = {
  question: Question
  selection: Selection
  submitted: boolean
  onSelect: (key: string, optionId: string) => void
}

export function QuestionView(props: Props) {
  switch (props.question.kind) {
    case 'figure-sequence':
      return <FigureSequenceView {...props} question={props.question} />
    case 'math-equations':
      return <MathEquationsView {...props} question={props.question} />
    case 'latin-square':
      return <LatinSquareView {...props} question={props.question} />
  }
}

function FigureSequenceView({
  question,
  selection,
  submitted,
  onSelect,
}: Props & { question: Extract<Question, { kind: 'figure-sequence' }> }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-3 text-sm">
          Continue the sequence. Work out what the fifth and sixth matrices look like.
        </p>
        {/* Three-up on phones so all six panels are visible at once; the whole
            point of the task is comparing them, so horizontal scrolling here
            actively gets in the way. */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {question.given.map((panel, i) => (
            <FigureMatrix
              key={i}
              panel={panel}
              rows={question.grid.rows}
              cols={question.grid.cols}
              title={`Matrix ${i + 1}`}
              className="max-w-none"
            />
          ))}
          <FigureUnknown
            rows={question.grid.rows}
            cols={question.grid.cols}
            className="max-w-none"
          />
          <FigureUnknown
            rows={question.grid.rows}
            cols={question.grid.cols}
            className="max-w-none"
          />
        </div>
      </div>

      {question.images.map((image, imageIndex) => (
        <fieldset key={image.label} className="space-y-2">
          <legend className="text-sm font-medium">
            {imageIndex === 0 ? 'Image 1 — the fifth matrix' : 'Image 2 — the sixth matrix'}
          </legend>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {image.options.map((option, i) => (
              <OptionButton
                key={option.id}
                state={optionState({
                  optionId: option.id,
                  selectedId: selection[image.label],
                  correctId: image.correctOptionId,
                  submitted,
                })}
                onSelect={() => onSelect(image.label, option.id)}
                disabled={submitted}
                label={`Matrix ${i + 1}: ${describePanel(option.panel)}`}
                className="justify-center p-2"
              >
                <FigureMatrix
                  panel={option.panel}
                  rows={question.grid.rows}
                  cols={question.grid.cols}
                />
              </OptionButton>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  )
}

function MathEquationsView({
  question,
  selection,
  submitted,
  onSelect,
}: Props & { question: Extract<Question, { kind: 'math-equations' }> }) {
  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm">
        Find the value of each letter so that all equations are true. Every letter is a whole
        number from 1 to 20.
      </p>

      <EquationSystem equations={question.equations} />

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">
          What number does {question.asked} correspond to?
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {question.options.map((option) => (
            <OptionButton
              key={option.id}
              state={optionState({
                optionId: option.id,
                selectedId: selection.answer,
                correctId: question.correctOptionId,
                submitted,
              })}
              onSelect={() => onSelect('answer', option.id)}
              disabled={submitted}
              label={`${question.asked} equals ${option.value}`}
              className="justify-center"
            >
              <span className="font-mono text-lg font-medium">{option.value}</span>
            </OptionButton>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

function LatinSquareView({
  question,
  selection,
  submitted,
  onSelect,
}: Props & { question: Extract<Question, { kind: 'latin-square' }> }) {
  // Once answered, show the prerequisite placements the deduction relied on.
  const reveal = submitted
    ? Object.fromEntries(
        question.solutionSteps.map((step) => [`${step.cell.row},${step.cell.col}`, step.letter]),
      )
    : undefined

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm">
        Each letter appears exactly once in every row and every column. Which letter belongs in the
        highlighted cell?
      </p>

      <div className="flex flex-col items-start gap-3">
        <LatinGrid grid={question.grid} target={question.target} reveal={reveal} />
        <LatinLetterKey letters={question.letters} />
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Choose the letter</legend>
        <div className="grid grid-cols-5 gap-2">
          {question.options.map((option) => (
            <OptionButton
              key={option.id}
              state={optionState({
                optionId: option.id,
                selectedId: selection.answer,
                correctId: question.correctOptionId,
                submitted,
              })}
              onSelect={() => onSelect('answer', option.id)}
              disabled={submitted}
              label={`Letter ${option.letter}`}
              className="justify-center"
            >
              <span className="font-mono text-lg font-medium">{option.letter}</span>
            </OptionButton>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
