'use client'

import { countdownSuffix, daysUntil, formatDate } from '@/lib/dates/countdown'
import { useToday } from '@/lib/dates/use-today'

/**
 * Three elements only: what it is, how many days are left, and the date.
 *
 * Deliberately quieter than the recommended step below it — a countdown is
 * context, not an instruction, so it gets a plain card rather than a filled one.
 */
export function CountdownCard({
  label,
  date,
  unit,
}: {
  label: string
  date: string
  /** Reads under the numeral, e.g. "Days to Register". */
  unit: string
}) {
  const today = useToday()
  const days = today ? daysUntil(date, today) : null

  return (
    <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-5">
      <p className="text-eyebrow">{label}</p>
      <p className="flex items-baseline gap-2">
        <span className="text-countdown tabular-nums">{days === null ? '—' : Math.max(0, days)}</span>
        <span className="text-muted-foreground text-sm">
          {days === null || days > 0 ? unit : countdownSuffix(days ?? 0)}
        </span>
      </p>
      <p className="text-muted-foreground -mt-2 text-xs">{formatDate(date)}</p>
    </div>
  )
}
