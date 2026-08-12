import { ArrowRight, Check, X } from 'lucide-react'

import { cn } from '@/lib/utils'

/* ------------------------------------------------------------- mini grid */

type Mark = {
  r: number
  c: number
  /** solid = the symbol now · ghost = where it was · target = the cell in question */
  kind?: 'solid' | 'ghost' | 'target'
  label?: string
}

const ACCENT_FILL = {
  figures: 'bg-figures',
  equations: 'bg-equations',
  latin: 'bg-latin',
} as const

type Accent = keyof typeof ACCENT_FILL

function MiniGrid({
  n = 4,
  marks = [],
  accent = 'figures',
  highlightRow,
  highlightCol,
  cell = 20,
}: {
  n?: number
  marks?: Mark[]
  accent?: Accent
  highlightRow?: number
  highlightCol?: number
  cell?: number
}) {
  return (
    <div
      className="bg-border/60 inline-grid gap-px rounded-sm p-px"
      style={{ gridTemplateColumns: `repeat(${n}, ${cell}px)` }}
      aria-hidden
    >
      {Array.from({ length: n * n }, (_, i) => {
        const r = Math.floor(i / n)
        const c = i % n
        const mark = marks.find((m) => m.r === r && m.c === c)
        const lit = highlightRow === r || highlightCol === c

        return (
          <div
            key={i}
            className={cn(
              'flex items-center justify-center',
              lit ? 'bg-accent' : 'bg-card',
            )}
            style={{ width: cell, height: cell }}
          >
            {mark?.label ? (
              <span className="text-foreground font-mono text-[10px]">{mark.label}</span>
            ) : mark ? (
              <span
                className={cn(
                  'rounded-[2px]',
                  mark.kind === 'ghost'
                    ? 'bg-muted-foreground/35'
                    : mark.kind === 'target'
                      ? 'ring-foreground/60 bg-transparent ring-1'
                      : ACCENT_FILL[accent],
                )}
                style={{ width: cell * 0.5, height: cell * 0.5 }}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function Figure({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <figure className="border-border bg-card flex flex-col items-center gap-3 rounded-xl border p-4">
      {children}
      <figcaption className="text-muted-foreground text-center text-xs leading-relaxed">
        {caption}
      </figcaption>
    </figure>
  )
}

/* ------------------------------------------------- figure sequences: anatomy */

/** What a single item actually consists of — four shown, two to choose. */
export function ItemAnatomy() {
  const given: Mark[][] = [
    [{ r: 1, c: 1 }],
    [{ r: 1, c: 0 }],
    [{ r: 1, c: 1 }],
    [{ r: 1, c: 2 }],
  ]

  return (
    <div className="border-border bg-card space-y-4 rounded-xl border p-5">
      <div className="flex flex-wrap items-end gap-6">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">Four matrices shown</p>
          <div className="flex gap-2">
            {given.map((marks, i) => (
              <MiniGrid key={i} marks={marks} />
            ))}
          </div>
        </div>

        <ArrowRight className="text-muted-foreground mb-6 size-4 shrink-0" aria-hidden />

        <div className="space-y-2">
          <p className="text-primary text-xs font-medium">You choose both of these</p>
          <div className="flex gap-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="border-primary/50 text-muted-foreground flex items-center justify-center rounded-sm border border-dashed text-sm"
                style={{ width: 82, height: 82 }}
              >
                ?
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-muted-foreground border-border border-t pt-3 text-xs leading-relaxed">
        Each of the two answers is picked from <span className="text-foreground">three</span>{' '}
        candidate matrices, and the item only counts as correct when both are right.
      </p>
    </div>
  )
}

/* -------------------------------------------- figure sequences: movement types */

export function MovementTypes() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Figure caption="Vertical or horizontal — travels along one fixed row or column">
        <MiniGrid
          marks={[
            { r: 1, c: 0, kind: 'ghost' },
            { r: 1, c: 1, kind: 'ghost' },
            { r: 1, c: 2 },
          ]}
        />
      </Figure>

      <Figure caption="Diagonal — and a diagonal mover can never switch to another movement type">
        <MiniGrid
          marks={[
            { r: 0, c: 0, kind: 'ghost' },
            { r: 1, c: 1, kind: 'ghost' },
            { r: 2, c: 2 },
          ]}
        />
      </Figure>

      <Figure caption="Along the outer border — clockwise or counter-clockwise around the perimeter">
        <MiniGrid
          marks={[
            { r: 0, c: 1, kind: 'ghost' },
            { r: 0, c: 2, kind: 'ghost' },
            { r: 0, c: 3 },
          ]}
        />
      </Figure>

      <Figure caption="Accelerating by x + 1 — one step, then two, then three">
        <MiniGrid
          marks={[
            { r: 3, c: 0, kind: 'ghost' },
            { r: 3, c: 1, kind: 'ghost' },
            { r: 3, c: 3 },
          ]}
        />
      </Figure>
    </div>
  )
}

/* ------------------------------------------ figure sequences: bounce vs reflect */

/** The single most costly misreading in the subtest, shown side by side. */
export function BounceDiagram() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="border-success/30 bg-success-tint/30 space-y-3 rounded-xl border p-4">
        <div className="flex items-center gap-2">
          <Check className="text-success-fg size-4" aria-hidden />
          <p className="text-success-fg text-sm font-medium">Reversal — what actually happens</p>
        </div>
        <div className="flex justify-center">
          <MiniGrid
            marks={[
              { r: 2, c: 0, kind: 'ghost' },
              { r: 1, c: 1, kind: 'ghost' },
              { r: 0, c: 2 },
              { r: 1, c: 1, kind: 'target' },
            ]}
          />
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          On meeting the top edge the symbol turns back down the same diagonal it arrived on,
          retracing its path.
        </p>
      </div>

      <div className="border-danger/30 bg-danger-tint/30 space-y-3 rounded-xl border p-4">
        <div className="flex items-center gap-2">
          <X className="text-danger-fg size-4" aria-hidden />
          <p className="text-danger-fg text-sm font-medium">Reflection — the tempting misread</p>
        </div>
        <div className="flex justify-center">
          <MiniGrid
            marks={[
              { r: 2, c: 0, kind: 'ghost' },
              { r: 1, c: 1, kind: 'ghost' },
              { r: 0, c: 2 },
              { r: 1, c: 3, kind: 'target' },
            ]}
          />
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Carrying on in a mirrored direction, like a billiard ball. This answer is usually on
          offer as a distractor — which is exactly why it is dangerous.
        </p>
      </div>
    </div>
  )
}

/* --------------------------------------------- latin squares: the constraint */

/** Row and column are the whole constraint — nine cells, no boxes. */
export function ConstraintDiagram() {
  return (
    <div className="border-border bg-card flex flex-wrap items-center gap-6 rounded-xl border p-5">
      <MiniGrid
        n={5}
        cell={26}
        accent="latin"
        highlightRow={1}
        highlightCol={3}
        marks={[{ r: 1, c: 3, kind: 'target', label: '?' }]}
      />
      <div className="min-w-[16rem] flex-1 space-y-2">
        <p className="text-sm font-medium">Only the row and the column matter</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          A cell is constrained by exactly two things: its row and its column — the nine highlighted
          cells and nothing else. There are no boxes or sub-regions, so Sudoku instincts produce
          confident wrong answers here.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------- mathematical equations: the value range */

export function ValueRange() {
  return (
    <div className="border-border bg-card space-y-3 rounded-xl border p-5">
      <div className="flex items-center gap-1">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="bg-equations/30 h-6 flex-1 rounded-[2px] first:rounded-l-sm last:rounded-r-sm"
            aria-hidden
          />
        ))}
      </div>
      <div className="text-muted-foreground flex justify-between text-xs tabular-nums">
        <span className="text-foreground font-medium">1</span>
        <span>every letter is a whole number in this range</span>
        <span className="text-foreground font-medium">20</span>
      </div>
      <p className="text-muted-foreground border-border border-t pt-3 text-xs leading-relaxed">
        A result of 0, a negative, or a fraction is not a hard question — it is a signal that you
        have made an error. Back up rather than pressing on.
      </p>
    </div>
  )
}

/* ------------------------------------- mathematical equations: solving order */

export function SolveChain() {
  const steps = [
    { eq: '2 × A = 18', note: 'One unknown — start here' },
    { eq: 'A = 9', note: 'Divide both sides by 2' },
    { eq: '29 − A = B', note: 'Substitute A' },
    { eq: 'B = 20', note: 'The chain closes' },
  ]

  return (
    <ol className="grid gap-3 sm:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.eq} className="border-border bg-card relative rounded-xl border p-4">
          <p className="text-foreground font-mono text-sm">{s.eq}</p>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{s.note}</p>
          {i < steps.length - 1 ? (
            <ArrowRight
              className="text-muted-foreground/50 absolute top-1/2 -right-2.5 hidden size-3.5 -translate-y-1/2 sm:block"
              aria-hidden
            />
          ) : null}
        </li>
      ))}
    </ol>
  )
}

/* ------------------------------------------------------------- registry */

export const DIAGRAMS = {
  'fs-anatomy': ItemAnatomy,
  'fs-movement': MovementTypes,
  'fs-bounce': BounceDiagram,
  'ls-constraint': ConstraintDiagram,
  'me-range': ValueRange,
  'me-chain': SolveChain,
} as const

export type DiagramKind = keyof typeof DIAGRAMS
