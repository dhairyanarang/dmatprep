'use client'

import { Card, CardContent } from '@/components/ui/card'
import { countdownSuffix, daysUntil, formatDate } from '@/lib/dates/countdown'
import { useToday } from '@/lib/dates/use-today'
import { cn } from '@/lib/utils'

export function CountdownCard({
  label,
  date,
  description,
}: {
  label: string
  date: string
  description?: string
}) {
  const today = useToday()
  const days = today ? daysUntil(date, today) : null

  const urgent = days !== null && days >= 0 && days <= 14
  const past = days !== null && days < 0

  return (
    <Card className={cn(urgent && 'border-amber-600/50')}>
      <CardContent className="space-y-1 pt-6">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>

        <p className="flex items-baseline gap-2">
          {days === null ? (
            <span className="text-muted-foreground/40 text-3xl font-semibold tabular-nums">––</span>
          ) : days === 0 ? null : (
            <span
              className={cn(
                'text-3xl font-semibold tabular-nums',
                urgent && 'text-amber-700 dark:text-amber-400',
                past && 'text-muted-foreground',
              )}
            >
              {Math.abs(days)}
            </span>
          )}
          <span
            className={cn(
              'text-muted-foreground text-sm',
              days === 0 && 'text-3xl font-semibold text-amber-700 dark:text-amber-400',
            )}
          >
            {days === null ? 'days' : countdownSuffix(days)}
          </span>
        </p>

        <p className="text-sm font-medium">{formatDate(date)}</p>
        {description ? (
          <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
