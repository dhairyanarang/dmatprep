import type { FigureColour, FigurePanel, FigureShape, FigureSymbol } from '@/lib/types/question'
import { cn } from '@/lib/utils'

/**
 * Colour is *content* here — explanations refer to "the blue square", and a
 * symbol may cycle black → pink → yellow. So these are fixed hues and the panel
 * keeps a light surface. The product ships one theme, and inverting the panel
 * would render the symbol the text calls "black" as white.
 */
const COLOUR_FILL: Record<FigureColour, string> = {
  black: '#18181b',
  white: '#ffffff',
  pink: '#ec4899',
  yellow: '#eab308',
  green: '#16a34a',
  orange: '#f97316',
  blue: '#2563eb',
}

const CELL = 100
const PAD = 6

/** Shape geometry for a cell centred at the origin, radius r. */
function shapePath(shape: FigureShape, r: number): string {
  switch (shape) {
    case 'square':
      return `M ${-r} ${-r} H ${r} V ${r} H ${-r} Z`
    case 'triangle':
      return `M 0 ${-r} L ${r} ${r * 0.85} L ${-r} ${r * 0.85} Z`
    case 'diamond':
      return `M 0 ${-r} L ${r} 0 L 0 ${r} L ${-r} 0 Z`
    case 'hexagon': {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2
        return `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`
      })
      return `M ${pts.join(' L ')} Z`
    }
    case 'arrow':
      // A chevron-tailed arrow pointing up: orientation must be unmistakable.
      return `M 0 ${-r} L ${r} 0 L ${r * 0.42} 0 L ${r * 0.42} ${r} L ${-r * 0.42} ${r} L ${-r * 0.42} 0 L ${-r} 0 Z`
    case 'cross': {
      const t = r * 0.36
      return `M ${-t} ${-r} H ${t} V ${-t} H ${r} V ${t} H ${t} V ${r} H ${-t} V ${t} H ${-r} V ${-t} H ${-t} Z`
    }
    // A right angle at the bottom-left, so the hypotenuse runs bottom-left to
    // top-right and a quarter turn is unmistakable. Deliberately similar to
    // `triangle` at a glance and clearly different once read — telling two
    // near-identical figures apart is part of the task.
    case 'right-triangle':
      return `M ${-r} ${-r} V ${r} H ${r} Z`
    // A lightning bolt. Strongly asymmetric in both axes, which is what makes
    // its orientation readable at 30px; the narrow waist keeps it from reading
    // as a blob when it is filled with a dark colour.
    case 'bolt': {
      const w = r * 0.62
      return [
        `M ${w * 0.55} ${-r}`,
        `L ${-w} ${r * 0.12}`,
        `L ${-w * 0.08} ${r * 0.12}`,
        `L ${-w * 0.62} ${r}`,
        `L ${w} ${-r * 0.2}`,
        `L ${w * 0.1} ${-r * 0.2}`,
        'Z',
      ].join(' ')
    }
    case 'circle':
    default:
      return ''
  }
}

function Symbol({ symbol }: { symbol: FigureSymbol }) {
  const cx = symbol.cell.col * CELL + CELL / 2
  const cy = symbol.cell.row * CELL + CELL / 2
  const r = CELL * 0.3
  const fill = COLOUR_FILL[symbol.colour]
  // White would vanish on a light panel; a dark outline keeps it legible.
  const stroke = symbol.colour === 'white' ? '#18181b' : 'none'

  const transform = `translate(${cx} ${cy}) rotate(${symbol.rotation})`

  return (
    <g transform={transform}>
      {symbol.shape === 'circle' ? (
        <circle r={r} fill={fill} stroke={stroke} strokeWidth={stroke === 'none' ? 0 : 3} />
      ) : (
        <path
          d={shapePath(symbol.shape, r)}
          fill={fill}
          stroke={stroke}
          strokeWidth={stroke === 'none' ? 0 : 3}
          strokeLinejoin="round"
        />
      )}
    </g>
  )
}

/** Screen-reader description, since the puzzle is otherwise pure geometry. */
export function describePanel(panel: FigurePanel): string {
  if (panel.symbols.length === 0) return 'Empty matrix.'
  return panel.symbols
    .map(
      (s) =>
        `${s.colour} ${s.shape} at row ${s.cell.row + 1}, column ${s.cell.col + 1}${
          s.rotation ? `, rotated ${s.rotation} degrees` : ''
        }`,
    )
    .join('; ')
}

export function FigureMatrix({
  panel,
  rows = 4,
  cols = 4,
  className,
  title,
  highlight,
  trail,
}: {
  panel: FigurePanel
  rows?: number
  cols?: number
  className?: string
  title?: string
  /**
   * Symbol ids to keep at full strength while the rest fade back. This is how a
   * solution step says "track only this one" — the instruction the guide gives
   * is unfollowable if every symbol competes for attention.
   */
  highlight?: string[]
  /** Cells the highlighted symbol has occupied, drawn as a faint path. */
  trail?: { row: number; col: number }[]
}) {
  const width = cols * CELL
  const height = rows * CELL
  const focusing = Boolean(highlight?.length)

  return (
    <svg
      viewBox={`${-PAD} ${-PAD} ${width + PAD * 2} ${height + PAD * 2}`}
      className={cn('h-auto w-full max-w-[160px] shrink-0', className)}
      role="img"
      aria-label={`${title ? `${title}. ` : ''}${describePanel(panel)}`}
    >
      <rect
        x={-PAD}
        y={-PAD}
        width={width + PAD * 2}
        height={height + PAD * 2}
        rx={8}
        fill="var(--figure-panel)"
      />

      {/* Interior grid lines, then a heavier outer frame. */}
      <g stroke="var(--figure-line)" strokeWidth={2}>
        {Array.from({ length: rows - 1 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={(i + 1) * CELL} x2={width} y2={(i + 1) * CELL} />
        ))}
        {Array.from({ length: cols - 1 }, (_, i) => (
          <line key={`v${i}`} x1={(i + 1) * CELL} y1={0} x2={(i + 1) * CELL} y2={height} />
        ))}
      </g>
      <rect x={0} y={0} width={width} height={height} fill="none" stroke="var(--figure-frame)" strokeWidth={4} />

      {trail?.map((cell, i) => (
        <rect
          key={`t${i}`}
          x={cell.col * CELL + 6}
          y={cell.row * CELL + 6}
          width={CELL - 12}
          height={CELL - 12}
          rx={6}
          fill="var(--figure-trail)"
        />
      ))}

      {panel.symbols.map((s) => {
        const focused = !focusing || highlight?.includes(s.id)
        return (
          <g key={s.id} opacity={focused ? 1 : 0.18}>
            {focusing && focused ? (
              <rect
                x={s.cell.col * CELL + 3}
                y={s.cell.row * CELL + 3}
                width={CELL - 6}
                height={CELL - 6}
                rx={8}
                fill="none"
                stroke="var(--figure-focus)"
                strokeWidth={5}
              />
            ) : null}
            <Symbol symbol={s} />
          </g>
        )
      })}
    </svg>
  )
}

/** The "?" placeholder standing in for a matrix the candidate must work out. */
export function FigureUnknown({
  rows = 4,
  cols = 4,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  const width = cols * CELL
  const height = rows * CELL

  return (
    <svg
      viewBox={`${-PAD} ${-PAD} ${width + PAD * 2} ${height + PAD * 2}`}
      className={cn('h-auto w-full max-w-[160px] shrink-0', className)}
      role="img"
      aria-label="Unknown matrix, to be determined"
    >
      {/*
        The prototype's `.fbox.q`: a dashed blue-200 outline over a very pale
        blue ground, with the mark itself in brand blue.

          .fbox.q { border:1.5px dashed var(--blue200); background:#F8F9FF }
          .fbox.q b { color: var(--blue) }

        It read as another grey panel before, which made the two cells the
        candidate has to supply look like two more cells they had been given.
      */}
      <rect
        x={-PAD}
        y={-PAD}
        width={width + PAD * 2}
        height={height + PAD * 2}
        rx={8}
        fill="var(--brand-50)"
        stroke="var(--brand-200)"
        strokeWidth={3}
        strokeDasharray="10 8"
      />
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={CELL * 1.1}
        fontWeight={600}
        fill="var(--brand)"
      >
        ?
      </text>
    </svg>
  )
}
