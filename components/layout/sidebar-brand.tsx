'use client'

import Link from 'next/link'

import { nextCycle } from '@/content/exam/key-dates'
import { daysUntil } from '@/lib/dates/countdown'
import { useToday } from '@/lib/dates/use-today'
import { cn } from '@/lib/utils'



/**
 * Brand plus a live countdown. The date alone was static decoration; days
 * remaining is the one number worth having permanently on screen.
 */
export function SidebarBrand({ className }: { className?: string }) {
  const today = useToday()
  // Null once every announced sitting has passed — the countdown disappears
  // rather than running negative or pointing at a date nobody can sit.
  const sitting = today ? nextCycle(today) : null
  const days = sitting && today ? daysUntil(sitting.testDate, today) : null

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
        className="bg-foreground text-background flex size-9 shrink-0 items-center justify-center rounded-[9px] text-base font-semibold"
      >
        D
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
