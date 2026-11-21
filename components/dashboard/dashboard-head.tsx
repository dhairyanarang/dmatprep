'use client'

import Link from 'next/link'
import { CalendarDays, Play } from 'lucide-react'

import { ProBadge } from '@/components/layout/sidebar-brand'
import { nextCycle } from '@/content/exam/key-dates'
import { useAuth } from '@/lib/auth/use-auth'
import { formatDate } from '@/lib/dates/countdown'
import { useToday } from '@/lib/dates/use-today'
import { COMMERCE_ENABLED } from '@/lib/payments/config'
import { useEntitlement } from '@/lib/payments/use-entitlement'
import { recommendNext, sectionSignals } from '@/lib/practice/insights'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import type { SectionId } from '@/lib/sections'

/**
 * The greeting and the one action the whole page is arguing for.
 *
 * The name is used only when there is one: a guest is greeted by what they are
 * doing rather than by a name the product has invented for them. The date line
 * is today's date and nothing more — the design shows "Week 3 of your 6-week
 * plan" there, and the product has no plan to be on week 3 of.
 *
 * Not signed in and not started are different situations and get different
 * words. A new account with no history needs a first step; a guest with no
 * history needs that *and* to know where their work is being kept, because
 * nothing has told them yet and clearing the browser would take it.
 */
export function DashboardHead({ bankSizes }: { bankSizes: Record<SectionId, number> }) {
  const auth = useAuth()
  const today = useToday()
  const progress = useProgress()
  const ready = useProgressReady()
  const entitlement = useEntitlement()

  const pro = COMMERCE_ENABLED && entitlement.ready && entitlement.access
  const first = auth.user?.name?.split(' ')[0]
  const sitting = today ? nextCycle(today) : null

  const signals = sectionSignals(progress, bankSizes)
  const recommendation = recommendNext(signals)
  const untried = ready && progress.attempts.length === 0

  const action = untried
    ? { href: '/practice/diagnostic', label: 'Take the diagnostic' }
    : { href: `/module-a/${recommendation.sectionId}/practice`, label: 'Start practising' }

  return (
    <section className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 text-2xl leading-8 font-semibold tracking-[-0.015em]">
          {first ? `Welcome back, ${first}` : 'Your preparation'}
          {pro ? <ProBadge className="h-5 px-[7px] text-[11px]" /> : null}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {today
            ? today.toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })
            : ' '}
          {untried && auth.status === 'guest' ? (
            <>
              {' · '}
              <span>
                Your work saves in this browser.{' '}
                <Link href="/account" className="text-foreground font-medium underline underline-offset-2">
                  Sign in
                </Link>{' '}
                to keep it across devices.
              </span>
            </>
          ) : null}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/exam/logistics"
          className="border-border bg-card hover:bg-frame inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors"
        >
          <CalendarDays aria-hidden className="size-4" />
          {sitting ? `Exam on ${formatDate(sitting.testDate)}` : 'Exam dates'}
        </Link>
        <Link
          href={action.href}
          className="bg-brand text-brand-foreground hover:bg-brand-strong inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors"
        >
          <Play aria-hidden className="size-3.5 fill-current" />
          {action.label}
        </Link>
      </div>
    </section>
  )
}
