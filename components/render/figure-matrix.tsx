import type { FigureColour, FigurePanel, FigureShape, FigureSymbol } from '@/lib/types/question'
import { cn } from '@/lib/utils'

/**
 * Colour is *content* here — explanations refer to "the blue square", and a
 * symbol may cycle black → pink → yellow. So these are fixed hues and the panel
 * keeps a light surface in both themes: inverting for dark mode would make a
 * symbol the text calls "black" render white.
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
}: {
  panel: FigurePanel
  rows?: number
  cols?: number
  className?: string
  title?: string
}) {
  const width = cols * CELL
  const height = rows * CELL

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

      {panel.symbols.map((s) => (
        <Symbol key={s.id} symbol={s} />
      ))}
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
      <rect
        x={-PAD}
        y={-PAD}
        width={width + PAD * 2}
        height={height + PAD * 2}
        rx={8}
        fill="var(--figure-panel)"
      />
      <rect x={0} y={0} width={width} height={height} fill="none" stroke="var(--figure-frame)" strokeWidth={4} />
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={CELL * 1.1}
        fontWeight={600}
        fill="var(--figure-frame)"
      >
        ?
      </text>
    </svg>
  )
}
