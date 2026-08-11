'use client'

import { CalendarClock, Flag } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { countdownSuffix, daysUntil, formatDate } from '@/lib/dates/countdown'
import { useToday } from '@/lib/dates/use-today'
import { cn } from '@/lib/utils'

const ICON = { deadline: CalendarClock, exam: Flag }

/**
 * Three elements only: what it is, how long is left, and the date.
 *
 * Card supplies its own symmetric padding through --card-spacing; adding `pt-*`
 * to CardContent is what previously made the top and bottom disagree.
 */
export function CountdownCard({
  label,
  date,
  kind,
}: {
  label: string
  date: string
  kind: 'deadline' | 'exam'
}) {
  const today = useToday()
  const days = today ? daysUntil(date, today) : null
  const Icon = ICON[kind]

  const urgent = days !== null && days >= 0 && days <= 14
  const past = days !== null && days < 0

  return (
    <Card className={cn('[--card-spacing:--spacing(5)]', urgent && 'ring-warning/40')}>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-md',
              urgent
                ? 'bg-warning-tint text-warning-fg'
                : kind === 'exam'
                  ? 'bg-figures-tint text-figures'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            <Icon className="size-3.5" />
          </span>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
        </div>

        <div>
          <p className="flex items-baseline gap-2">
            {days !== null && days !== 0 && (
              <span
                className={cn(
                  'text-4xl leading-none font-semibold tabular-nums',
                  urgent && 'text-warning-fg',
                  past && 'text-muted-foreground',
                )}
              >
                {Math.abs(days)}
              </span>
            )}
            <span
              className={cn(
                'text-muted-foreground text-sm',
                days === 0 && 'text-warning-fg text-4xl leading-none font-semibold',
                days === null && 'text-muted-foreground/40 text-4xl leading-none font-semibold',
              )}
            >
              {days === null ? '––' : countdownSuffix(days)}
            </span>
          </p>

          <p className="text-muted-foreground mt-2 text-sm">{formatDate(date)}</p>
        </div>
      </CardContent>
    </Card>
  )
}
