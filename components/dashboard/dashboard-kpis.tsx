'use client'

import Link from 'next/link'

import { Kpi } from '@/components/dashboard/kpi'
import { nextCycle } from '@/content/exam/key-dates'
import { daysUntil, formatDate } from '@/lib/dates/countdown'
import { useToday } from '@/lib/dates/use-today'
import { COMMERCE_ENABLED } from '@/lib/payments/config'
import { FREE_TOTAL } from '@/lib/payments/free-quota'
import { useEntitlement } from '@/lib/payments/use-entitlement'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import type { SectionId } from '@/lib/sections'

/**
 * The four figures worth having above the fold.
 *
 * Every one is derived — from the committed exam dates, or from this
 * candidate's own attempts. None of them is stored, so none of them can drift
 * from the pages that show the same thing in more detail.
 */
export function DashboardKpis({ bankSizes }: { bankSizes: Record<SectionId, number> }) {
  const progress = useProgress()
  const ready = useProgressReady()
  const today = useToday()
  const entitlement = useEntitlement()

  // Null once every announced sitting has passed — better to show nothing than
  // to count down to a date nobody can sit.
  const sitting = today ? nextCycle(today) : null
  const days = sitting && today ? daysUntil(sitting.testDate, today) : null

  const attempts = progress.attempts
  const answered = new Set(attempts.map((a) => a.questionId)).size
  const correct = attempts.filter((a) => a.correct).length
  const accuracy = attempts.length ? correct / attempts.length : null

  const bankTotal = Object.values(bankSizes).reduce((a, b) => a + b, 0)
  // Without an entitlement the markable pool IS the free set, so that is what
  // the denominator has to be — counting against the whole bank would tell
  // someone they had barely started when they had used most of what they have.
  const locked = COMMERCE_ENABLED && entitlement.ready && !entitlement.access
  const available = locked ? FREE_TOTAL : bankTotal

  const streak = ready ? streakDays(attempts.map((a) => a.at)) : 0
  const week = ready ? weekActivity(attempts.map((a) => a.at)) : Array(7).fill(false)

  return (
    <section className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr))]">
      <Kpi
        label="Days to your exam"
        value={days === null ? '—' : Math.max(0, days)}
        foot={
          sitting ? (
            <span>Sitting on {formatDate(sitting.testDate)}</span>
          ) : (
            <span>No sitting announced</span>
          )
        }
      />

      <Kpi
        label={locked ? 'Free questions used' : 'Questions practised'}
        value={ready ? answered : '—'}
        suffix={`of ${available}`}
        progress={available ? answered / available : 0}
        foot={
          <>
            <span>{Math.max(0, available - answered)} to go</span>
            <Link
              href={locked ? '/pricing' : '/prepare'}
              className="text-foreground font-semibold"
            >
              {locked ? 'Go Pro' : 'Practise'}
            </Link>
          </>
        }
      />

      <Kpi
        label="Correct so far"
        value={accuracy === null ? '—' : `${Math.round(accuracy * 100)}%`}
        foot={
          <span>
            {attempts.length === 0
              ? 'Answer a question to start this'
              : `Across ${attempts.length} ${attempts.length === 1 ? 'answer' : 'answers'}`}
          </span>
        }
      />

      <Kpi
        label="Streak"
        value={streak}
        suffix={streak === 1 ? 'day' : 'days'}
        foot={
          <span className="flex gap-1" aria-label="This week">
            {week.map((on, i) => (
              <i
                key={i}
                aria-hidden
                className="block h-1.5 w-[18px] rounded-full"
                style={{ background: on ? 'var(--brand)' : 'var(--border)' }}
              />
            ))}
          </span>
        }
      />
    </section>
  )
}

/** Consecutive days ending today or yesterday on which anything was answered. */
function streakDays(timestamps: string[]): number {
  if (timestamps.length === 0) return 0
  const days = new Set(
    timestamps
      .map((iso) => new Date(iso))
      .filter((d) => !Number.isNaN(d.getTime()))
      .map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()),
  )

  const now = new Date()
  const dayMs = 86_400_000
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  // A streak is not broken until a whole day has been missed, so if nothing has
  // been answered today it is still counted from yesterday.
  if (!days.has(cursor)) cursor -= dayMs

  let streak = 0
  while (days.has(cursor)) {
    streak++
    cursor -= dayMs
  }
  return streak
}

/** Sunday-first flags for the current week. */
function weekActivity(timestamps: string[]): boolean[] {
  const now = new Date()
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
  const dayMs = 86_400_000
  return Array.from({ length: 7 }, (_, i) => {
    const start = startOfWeek.getTime() + i * dayMs
    return timestamps.some((iso) => {
      const at = Date.parse(iso)
      return at >= start && at < start + dayMs
    })
  })
}
