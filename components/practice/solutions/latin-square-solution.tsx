'use client'

import { LatinGrid } from '@/components/render/latin-grid'
import type { LatinSquaresQuestion, SolutionVisual } from '@/lib/types/question'

/**
 * Visual evidence for a Latin Squares step.
 *
 * The grid is the argument, so every step re-renders it with only the cells that
 * step reasons about kept bright. Both official techniques are supported: a
 * naked single lights the target's row and column, pair elimination lights the
 * line that is missing two letters.
 */
export function LatinSquareSolution({
  question,
  visual,
}: {
  question: LatinSquaresQuestion
  visual: SolutionVisual
}) {
  if (visual.type === 'ls-lines') {
    return (
      <div className="mt-3">
        <LatinGrid
          grid={question.grid}
          target={question.target}
          focusRow={visual.row}
          focusCol={visual.col}
        />
        <p className="text-muted-foreground mt-2 text-xs">
          Row {(visual.row ?? 0) + 1} and column {(visual.col ?? 0) + 1} are the only lines that can
          rule a letter out of the marked cell.
        </p>
      </div>
    )
  }

  if (visual.type === 'ls-place') {
    // Show everything placed up to and including this step, so the grid the
    // reader sees matches the state the reasoning is talking about.
    const upto: Record<string, string> = {}
    for (const step of question.solutionSteps) {
      upto[`${step.cell.row},${step.cell.col}`] = step.letter
      if (step.cell.row === visual.cell.row && step.cell.col === visual.cell.col) break
    }

    return (
      <div className="mt-3">
        <LatinGrid
          grid={question.grid}
          target={question.target}
          reveal={upto}
          focusCells={[`${visual.cell.row},${visual.cell.col}`]}
        />
        <p className="text-muted-foreground mt-2 text-xs">
          {visual.technique === 'pair-elimination'
            ? 'Placed by elimination within a line — no single cell was forced on its own.'
            : 'Placed because four letters are already ruled out of this cell.'}
        </p>
      </div>
    )
  }

  if (visual.type === 'ls-pair') {
    const isRow = visual.line.kind === 'row'
    return (
      <div className="mt-3">
        <LatinGrid
          grid={question.grid}
          target={question.target}
          focusRow={isRow ? visual.line.index : undefined}
          focusCol={isRow ? undefined : visual.line.index}
          focusCells={visual.cells.map((c) => `${c.row},${c.col}`)}
        />
        <p className="text-muted-foreground mt-2 text-xs">
          {isRow ? `Row ${visual.line.index + 1}` : `Column ${visual.line.index + 1}`} is missing only{' '}
          <span className="text-foreground font-mono font-medium">
            {visual.letters.join(' and ')}
          </span>
          , across the two highlighted cells. Fixing one fixes the other.
        </p>
      </div>
    )
  }

  return null
}
