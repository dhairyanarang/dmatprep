import { ArrowRight, Check, X } from 'lucide-react'

import { cn } from '@/lib/utils'

/* ------------------------------------------------------------- mini grid */

type Mark = {
  r: number
  c: number
  /** solid = the symbol now · ghost = where it was · target = the cell in question */
  kind?: 'solid' | 'ghost' | 'target'
  label?: string
  /** Degrees — renders an arrow glyph so orientation is visible. */
  rotate?: number
  /** Explicit fill, for demonstrating a colour cycle. */
  colour?: string
}

const ACCENT_FILL = {
  figures: 'bg-figures',
  equations: 'bg-equations',
  latin: 'bg-latin',
} as const

// Written out rather than interpolated — Tailwind only sees literal class names.
const ACCENT_TEXT = {
  figures: 'text-figures',
  equations: 'text-equations',
  latin: 'text-latin',
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
      className="bg-muted-foreground/30 inline-grid gap-px rounded-sm p-px"
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
            ) : mark?.rotate !== undefined ? (
              // An arrow, so a quarter turn is actually legible at this size.
              <svg
                width={cell * 0.62}
                height={cell * 0.62}
                viewBox="0 0 10 10"
                style={{ transform: `rotate(${mark.rotate}deg)` }}
                className={cn(
                  mark.kind === 'ghost' ? 'text-muted-foreground/35' : ACCENT_TEXT[accent],
                )}
              >
                <path d="M5 0 L10 6 L6.2 6 L6.2 10 L3.8 10 L3.8 6 L0 6 Z" fill="currentColor" />
              </svg>
            ) : mark ? (
              <span
                className={cn(
                  'rounded-[2px]',
                  mark.colour
                    ? mark.colour
                    : mark.kind === 'ghost'
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
          <p className="text-foreground text-xs font-medium">You choose both of these</p>
          <div className="flex gap-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="border-muted-foreground/50 text-muted-foreground flex items-center justify-center rounded-sm border border-dashed text-sm"
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

/* --------------------------------------------- figure sequences: catalogue */

/** Panel-by-panel progression — movement is far clearer as a strip than as ghosts. */
function RuleStrip({ panels, accent = 'figures' }: { panels: Mark[][]; accent?: Accent }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {panels.map((marks, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {i > 0 ? (
            <span className="text-muted-foreground/40 text-xs" aria-hidden>
              ›
            </span>
          ) : null}
          <MiniGrid marks={marks} accent={accent} cell={15} />
        </div>
      ))}
    </div>
  )
}

type Rule = { name: string; panels: Mark[][]; text: string; level: 'Low' | 'Medium' | 'High' }

const LEVEL_TONE = {
  Low: 'bg-success-tint text-success-fg',
  Medium: 'bg-warning-tint text-warning-fg',
  High: 'bg-danger-tint text-danger-fg',
} as const

const RULES: Rule[] = [
  {
    name: 'Straight line, with a bounce',
    level: 'Low',
    panels: [[{ r: 1, c: 2 }], [{ r: 1, c: 1 }], [{ r: 1, c: 0 }], [{ r: 1, c: 1 }]],
    text: 'Travels along one fixed row or column. At the edge it turns and comes back the way it came.',
  },
  {
    name: 'Diagonal, with a bounce',
    level: 'Low',
    panels: [[{ r: 2, c: 0 }], [{ r: 1, c: 1 }], [{ r: 0, c: 2 }], [{ r: 1, c: 1 }]],
    text: 'Reverses at a boundary and retraces the same diagonal. A diagonal mover can never switch to another movement type.',
  },
  {
    name: 'Along the outer border',
    level: 'Medium',
    panels: [[{ r: 0, c: 1 }], [{ r: 0, c: 2 }], [{ r: 0, c: 3 }], [{ r: 1, c: 3 }]],
    text: 'Runs around the perimeter, clockwise or counter-clockwise, turning at each corner instead of bouncing.',
  },
  {
    name: 'Repeating direction cycle',
    level: 'Medium',
    panels: [[{ r: 2, c: 2 }], [{ r: 2, c: 1 }], [{ r: 1, c: 1 }], [{ r: 1, c: 2 }]],
    text: 'Follows a fixed order of directions — left, up, right, down — tracing a small closed loop.',
  },
  {
    name: 'Rotation',
    level: 'Medium',
    panels: [
      [{ r: 1, c: 1, rotate: 0 }],
      [{ r: 1, c: 1, rotate: 90 }],
      [{ r: 1, c: 1, rotate: 180 }],
      [{ r: 1, c: 1, rotate: 270 }],
    ],
    text: 'A quarter turn each panel, clockwise or counter-clockwise. Only shapes with a visible facing rotate — a circle could not show it.',
  },
  {
    name: 'Colour cycle',
    level: 'Medium',
    panels: [
      [{ r: 1, c: 1, colour: 'bg-figures' }],
      [{ r: 1, c: 1, colour: 'bg-equations' }],
      [{ r: 1, c: 1, colour: 'bg-latin' }],
      [{ r: 1, c: 1, colour: 'bg-figures' }],
    ],
    text: 'Steps through a fixed order of colours and repeats. Colour is the fastest property to check, so use it to eliminate options first.',
  },
  {
    name: 'Accelerating movement — x + 1',
    level: 'High',
    panels: [[{ r: 0, c: 0 }], [{ r: 0, c: 1 }], [{ r: 0, c: 3 }]],
    text: 'One step, then two, then three. Read the gaps rather than the positions — that is what makes acceleration visible at a glance.',
  },
  {
    name: 'Accelerating rotation',
    level: 'High',
    panels: [
      [{ r: 1, c: 1, rotate: 0 }],
      [{ r: 1, c: 1, rotate: 90 }],
      [{ r: 1, c: 1, rotate: 270 }],
    ],
    text: 'Rotation accelerates the same way: one quarter turn, then two, then three.',
  },
]

/** Every movement rule in the subtest, in one place. */
export function MovementCatalogue() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {RULES.map((rule) => (
        <div key={rule.name} className="border-border bg-card space-y-3 rounded-xl border p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-medium">{rule.name}</h3>
            <span
              className={cn(
                'shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-medium',
                LEVEL_TONE[rule.level],
              )}
            >
              {rule.level}+
            </span>
          </div>
          <RuleStrip panels={rule.panels} />
          <p className="text-muted-foreground text-xs leading-relaxed">{rule.text}</p>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------ difficulty, per section */

type Ladder = { level: 'Low' | 'Medium' | 'High'; headline: string; points: string[] }

function DifficultyLadder({ rungs, note }: { rungs: Ladder[]; note: string }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {rungs.map((rung) => (
          <div key={rung.level} className="border-border bg-card space-y-3 rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-sm px-1.5 py-0.5 text-[10px] font-medium',
                  LEVEL_TONE[rung.level],
                )}
              >
                {rung.level}
              </span>
              <p className="text-sm font-medium">{rung.headline}</p>
            </div>
            <ul className="space-y-1.5">
              {rung.points.map((p) => (
                <li key={p} className="text-muted-foreground flex gap-2 text-xs leading-relaxed">
                  <span aria-hidden className="bg-muted-foreground/40 mt-1.5 size-1 shrink-0 rounded-full" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground border-border rounded-xl border border-dashed p-3 text-xs leading-relaxed">
        {note}
      </p>
    </div>
  )
}

const BANK_NOTE =
  'This describes the practice bank in this hub, where difficulty is generated to these rules. g.a.s.t. publishes exercises at three difficulty levels but does not publish what separates them, so treat this as a reliable guide to practising here rather than a specification of the real exam.'

export function FigureDifficulty() {
  return (
    <DifficultyLadder
      note={BANK_NOTE}
      rungs={[
        {
          level: 'Low',
          headline: 'One symbol, one rule',
          points: [
            'A single symbol on the grid',
            'Straight-line or diagonal movement only',
            'Constant step size — no acceleration',
            'No rotation and no colour change',
          ],
        },
        {
          level: 'Medium',
          headline: 'Two symbols, more rule types',
          points: [
            'Two symbols, each with its own independent rule',
            'Adds border travel and repeating direction cycles',
            'Rotation and colour cycles start appearing',
            'Step size still constant',
          ],
        },
        {
          level: 'High',
          headline: 'Three or four symbols, acceleration',
          points: [
            'Three or four symbols to track at once',
            'Every movement type is in play',
            'x + 1 acceleration on movement and on rotation',
            'Rotation and colour changes are common',
          ],
        },
      ]}
    />
  )
}

export function EquationDifficulty() {
  return (
    <DifficultyLadder
      note={BANK_NOTE}
      rungs={[
        {
          level: 'Low',
          headline: 'Two letters',
          points: [
            'Two equations, two unknowns',
            'One equation pins a letter directly',
            'One substitution finishes it',
          ],
        },
        {
          level: 'Medium',
          headline: 'Three letters',
          points: [
            'Three equations, three unknowns',
            'A combining equation ties the letters together',
            'Two or three substitutions to unwind',
          ],
        },
        {
          level: 'High',
          headline: 'Four letters',
          points: [
            'Four equations, four unknowns',
            'The combining equation spans every letter',
            'Brackets and sign handling become the risk',
          ],
        },
      ]}
    />
  )
}

export function LatinDifficulty() {
  return (
    <DifficultyLadder
      note={BANK_NOTE}
      rungs={[
        {
          level: 'Low',
          headline: '1 forced placement',
          points: [
            'The marked cell is settled straight from the givens',
            'Four letters already visible in its row and column',
            'No other cell needs filling',
          ],
        },
        {
          level: 'Medium',
          headline: '2 to 3 placements',
          points: [
            'One or two cells must be placed first',
            'Those cells are almost always in the marked row or column',
            'Then the marked cell is forced',
          ],
        },
        {
          level: 'High',
          headline: '4 or more placements',
          points: [
            'A longer chain, each placement unlocking the next',
            'Depth is computed by the solver, not assigned by feel',
            'Still solvable by exclusion alone — never guess',
          ],
        },
      ]}
    />
  )
}

/* ------------------------------------------------------------- registry */

export const DIAGRAMS = {
  'fs-anatomy': ItemAnatomy,
  'fs-movement': MovementTypes,
  'fs-bounce': BounceDiagram,
  'fs-catalogue': MovementCatalogue,
  'fs-difficulty': FigureDifficulty,
  'ls-constraint': ConstraintDiagram,
  'ls-difficulty': LatinDifficulty,
  'me-range': ValueRange,
  'me-chain': SolveChain,
  'me-difficulty': EquationDifficulty,
} as const

export type DiagramKind = keyof typeof DIAGRAMS
