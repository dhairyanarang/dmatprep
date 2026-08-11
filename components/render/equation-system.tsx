import { cn } from '@/lib/utils'

/**
 * A system of equations, one per line. Monospaced so the operators and letters
 * line up vertically — with no scratch paper allowed, alignment is what makes a
 * system scannable at a glance.
 */
export function EquationSystem({
  equations,
  className,
}: {
  equations: string[]
  className?: string
}) {
  return (
    <ul
      className={cn('bg-muted/40 space-y-2 rounded-lg border p-4 font-mono text-base', className)}
      aria-label="System of equations"
    >
      {equations.map((equation) => (
        <li key={equation} className="tabular-nums">
          {equation}
        </li>
      ))}
    </ul>
  )
}
