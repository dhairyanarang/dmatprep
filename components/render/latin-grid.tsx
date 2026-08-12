import type { GridCell } from '@/lib/types/question'
import { cn } from '@/lib/utils'

/**
 * A 5×5 Latin square with the target cell marked. `reveal` fills in the answer
 * (and any prerequisite placements) once the question has been answered.
 */
export function LatinGrid({
  grid,
  target,
  reveal,
  className,
  focusRow,
  focusCol,
  focusCells,
}: {
  grid: (string | null)[][]
  target: GridCell
  /** Cell → letter to show as newly filled in, keyed "row,col". */
  reveal?: Record<string, string>
  className?: string
  /** Solution steps light the line that is doing the work. */
  focusRow?: number
  focusCol?: number
  /** Individual cells a step is reasoning about, keyed "row,col". */
  focusCells?: string[]
}) {
  const size = grid.length
  const focusing = focusRow !== undefined || focusCol !== undefined || Boolean(focusCells?.length)

  // bg-border fills the 1px gaps between cells so they read as grid lines.
  return (
    <div
      className={cn('bg-border inline-grid gap-px rounded-md border p-px', className)}
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      role="table"
      aria-label={`${size} by ${size} Latin square puzzle`}
    >
      {grid.map((row, r) =>
        row.map((letter, c) => {
          const isTarget = r === target.row && c === target.col
          const revealed = reveal?.[`${r},${c}`]
          const shown = letter ?? revealed ?? null
          const onFocusLine = r === focusRow || c === focusCol
          const isFocusCell = focusCells?.includes(`${r},${c}`)
          const dimmed = focusing && !onFocusLine && !isFocusCell && !isTarget

          return (
            <div
              key={`${r}-${c}`}
              role="cell"
              aria-label={
                isTarget
                  ? `Row ${r + 1}, column ${c + 1}: the cell to solve${shown ? `, answer ${shown}` : ''}`
                  : `Row ${r + 1}, column ${c + 1}: ${shown ?? 'empty'}`
              }
              className={cn(
                'flex aspect-square w-11 items-center justify-center text-base font-medium transition-opacity sm:w-12 sm:text-lg',
                isTarget
                  ? 'bg-accent text-foreground ring-foreground/40 font-medium ring-1 ring-inset'
                  : revealed
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-background',
                isFocusCell && !isTarget && 'bg-latin-tint text-foreground',
                onFocusLine && !isFocusCell && !isTarget && 'bg-muted/60',
                dimmed && 'opacity-35',
              )}
            >
              {isTarget && !shown ? '?' : (shown ?? '')}
            </div>
          )
        }),
      )}
    </div>
  )
}

/** The response row: the only letters that may appear in the grid. */
export function LatinLetterKey({ letters }: { letters: string[] }) {
  return (
    <p className="text-muted-foreground text-xs">
      Available letters:{' '}
      <span className="text-foreground font-mono font-medium">{letters.join('  ')}</span>
    </p>
  )
}
