'use client'

import Link from 'next/link'

import { FIXED_DATES } from '@/content/exam/key-dates'
import { daysUntil } from '@/lib/dates/countdown'
import { useToday } from '@/lib/dates/use-today'
import { cn } from '@/lib/utils'

const EXAM = FIXED_DATES.find((d) => d.id === 'exam-date')!

/**
 * Brand plus a live countdown. The date alone was static decoration; days
 * remaining is the one number worth having permanently on screen.
 */
export function SidebarBrand({ className }: { className?: string }) {
  const today = useToday()
  const days = today ? daysUntil(EXAM.date, today) : null

  return (
    <Link
      href="/"
      className={cn(
        'flex items-center gap-3 rounded-md transition-opacity hover:opacity-80',
        className,
      )}
    >
      <span
        aria-hidden
        // Neutral, not acid lime — the accent belongs to the primary action.
        className="bg-foreground text-background flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold"
      >
        d
      </span>

      <span className="min-w-0">
        <span className="block text-sm leading-5 font-semibold">dMAT Prep</span>
        <span className="text-muted-foreground block text-xs leading-4 tabular-nums">
          {days === null ? ' ' : days > 0 ? `${days} days to exam` : 'Exam day'}
        </span>
      </span>
    </Link>
  )
}
