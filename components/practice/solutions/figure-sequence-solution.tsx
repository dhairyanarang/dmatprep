'use client'

import { FigureMatrix } from '@/components/render/figure-matrix'
import type { FigureSequenceQuestion, SolutionVisual } from '@/lib/types/question'

/**
 * Visual evidence for a Figure Sequences step.
 *
 * The whole difficulty of the task is that four symbols compete for attention at
 * once, so every step here shows the four given matrices with exactly one symbol
 * at full strength and the rest faded — which is what makes "track one symbol at
 * a time" an instruction you can actually follow.
 */
export function FigureSequenceSolution({
  question,
  visual,
}: {
  question: FigureSequenceQuestion
  visual: SolutionVisual
}) {
  const { rows, cols } = question.grid

  if (visual.type === 'fs-track' || visual.type === 'fs-aspect') {
    const panels = visual.panels.map((i) => question.given[i]).filter(Boolean)

    // The cells this symbol occupies across the shown matrices, drawn as a trail
    // so the path is readable without stepping back and forth between panels.
    const trail = question.given
      .map((panel) => panel.symbols.find((s) => s.id === visual.symbolId)?.cell)
      .filter((cell): cell is { row: number; col: number } => Boolean(cell))

    return (
      <div className="mt-3 space-y-2">
        <div className="grid grid-cols-4 gap-2">
          {panels.map((panel, i) => (
            <FigureMatrix
              key={i}
              panel={panel}
              rows={rows}
              cols={cols}
              title={`Matrix ${(visual.panels[i] ?? i) + 1}`}
              highlight={[visual.symbolId]}
              trail={visual.type === 'fs-aspect' && visual.aspect !== 'colour' ? trail : undefined}
              className="max-w-none"
            />
          ))}
        </div>
        {visual.type === 'fs-aspect' ? (
          <p className="text-muted-foreground text-xs">
            {ASPECT_CAPTION[visual.aspect]}
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Matrices 1 to 4, with everything except this symbol faded back.
          </p>
        )}
      </div>
    )
  }

  if (visual.type === 'fs-predict') {
    const image = question.images[visual.panel - 4]
    if (!image) return null
    const correct = image.options.find((o) => o.id === image.correctOptionId)
    if (!correct) return null

    return (
      <div className="mt-3 flex items-end gap-3">
        <div>
          <FigureMatrix
            panel={question.given[3]}
            rows={rows}
            cols={cols}
            title="Matrix 4"
            className="max-w-[104px]"
          />
          <p className="text-muted-foreground mt-1 text-center text-xs">Matrix 4</p>
        </div>
        <span className="text-muted-foreground pb-6 text-sm" aria-hidden>
          →
        </span>
        <div>
          <FigureMatrix
            panel={correct.panel}
            rows={rows}
            cols={cols}
            title={`Matrix ${visual.panel + 1}`}
            className="max-w-[104px]"
          />
          <p className="mt-1 text-center text-xs font-medium">Matrix {visual.panel + 1}</p>
        </div>
      </div>
    )
  }

  return null
}

const ASPECT_CAPTION: Record<string, string> = {
  movement: 'Follow the highlighted cells: that is the path, and the gaps between them are the step size.',
  rotation: 'Watch the facing, not the position — the travel is deliberately distracting here.',
  colour: 'Compare only the fill from panel to panel; where it sits does not matter for this rule.',
  boundary: 'The marked path reaches an edge and turns. That is the sequence telling you which boundary rule applies.',
  acceleration: 'The gaps are not equal — measure all three before deciding the step size.',
}
