'use client'

import Link from 'next/link'

import { FIXED_DATES } from '@/content/exam/key-dates'
import { countdownSuffix, daysUntil, formatDate } from '@/lib/dates/countdown'
import { useToday } from '@/lib/dates/use-today'
import { cn } from '@/lib/utils'

/**
 * The exam dates, as one line.
 *
 * They used to be two large cards at the top of the home page, which made the
 * first thing a student saw a countdown rather than something to do. The dates
 * matter, but they do not change, and the full set lives on Dates & logistics.
 */
export function ExamLine() {
  const today = useToday()

  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
      {FIXED_DATES.map((entry) => {
        const days = today ? daysUntil(entry.date, today) : null
        const urgent = days !== null && days >= 0 && days <= 14

        return (
          <span key={entry.id} className="flex items-baseline gap-1.5">
            <span>{entry.label}</span>
            <span className={cn('text-foreground font-medium', urgent && 'text-warning-fg')}>
              {formatDate(entry.date)}
            </span>
            {days !== null ? (
              <span className="tabular-nums">
                ({days} {countdownSuffix(days)})
              </span>
            ) : null}
          </span>
        )
      })}
      <Link
        href="/exam/logistics"
        className="hover:text-foreground ml-auto text-xs underline underline-offset-4 transition-colors"
      >
        All dates
      </Link>
    </div>
  )
}
