'use client'

import Link from 'next/link'
import { ListChecks } from 'lucide-react'

import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import { SECTION_BY_ID } from '@/lib/sections'
import type { AttemptRecord } from '@/lib/types/progress'
import { cn } from '@/lib/utils'

/**
 * The last few questions answered, newest first.
 *
 * A log rather than a summary: it is the one place the product shows a
 * candidate their own working, and the ids are shown because they are what a
 * support message would have to quote.
 *
 * The Time column appears only when the attempt actually recorded a duration.
 * Practice records one; a timed sitting now does too, but older attempts
 * predate it, so the cell says nothing rather than claiming zero.
 */
export function RecentQuestions({ limit = 6 }: { limit?: number }) {
  const progress = useProgress()
  const ready = useProgressReady()

  const rows = [...progress.attempts]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit)

  return (
    <section className="panel">
      <div className="panel-h min-h-12">
        <h2 className="ptitle">Recent questions</h2>
        {rows.length > 0 ? (
          <Link href="/prepare" className="text-muted-foreground hover:text-foreground text-xs">
            Keep practising
          </Link>
        ) : null}
      </div>

      <div className="surface overflow-x-auto">
        {!ready ? (
          <div className="h-32" />
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <span
              aria-hidden
              className="bg-frame text-muted-foreground grid size-10 place-items-center rounded-xl"
            >
              <ListChecks className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">No questions yet</p>
              <p className="text-muted-foreground mx-auto mt-1 max-w-[380px] text-sm leading-relaxed text-balance">
                Every question you answer is logged here with its subtest, difficulty and result,
                so you can see what you actually did rather than only a score.
              </p>
            </div>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              <Link
                href="/practice/diagnostic"
                className="bg-brand text-brand-foreground hover:bg-brand-strong inline-flex h-9 items-center rounded-lg px-3.5 text-sm font-medium transition-colors"
              >
                Take the diagnostic
              </Link>
              <Link
                href="/prepare"
                className="border-border bg-card hover:bg-frame inline-flex h-9 items-center rounded-lg border px-3.5 text-sm font-medium transition-colors"
              >
                Browse the subtests
              </Link>
            </div>
          </div>
        ) : (
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr>
                <Th>Question</Th>
                <Th>Subtest</Th>
                <Th>Level</Th>
                <Th>Result</Th>
                <Th align="right">Time</Th>
                <Th align="right">When</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((attempt) => (
                <tr key={attempt.id} className="hover:bg-[#fafaf9] transition-colors">
                  <Td className="text-muted-foreground font-mono">{attempt.questionId}</Td>
                  <Td className="font-medium">{SECTION_BY_ID[attempt.sectionId]?.title}</Td>
                  <Td className="text-muted-foreground capitalize">{attempt.difficulty}</Td>
                  <Td>
                    <ResultPill attempt={attempt} />
                  </Td>
                  <Td align="right" className="font-mono tabular-nums">
                    {seconds(attempt) ?? '—'}
                  </Td>
                  <Td align="right" className="text-muted-foreground">
                    {when(attempt.at)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

function ResultPill({ attempt }: { attempt: AttemptRecord }) {
  const [label, tone] = attempt.correct
    ? (['Correct', 'bg-success-tint border-success/30 text-success-fg'] as const)
    : (['Wrong', 'bg-danger-tint border-danger/30 text-danger-fg'] as const)

  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-1.5 rounded-full border px-2 text-xs font-medium',
        tone,
      )}
    >
      <i
        aria-hidden
        className="block size-1.5 rounded-full"
        style={{ background: attempt.correct ? 'var(--success)' : 'var(--danger)' }}
      />
      {label}
    </span>
  )
}

function Th({ children, align }: { children: React.ReactNode; align?: 'right' }) {
  return (
    <th
      className={cn(
        'over border-soft border-b px-3.5 py-2.5 whitespace-nowrap',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  align,
  className,
}: {
  children: React.ReactNode
  align?: 'right'
  className?: string
}) {
  return (
    <td
      className={cn(
        'border-b border-[#f3f3f1] px-3.5 py-[11px] align-middle',
        align === 'right' && 'text-right',
        className,
      )}
    >
      {children}
    </td>
  )
}

function seconds(attempt: AttemptRecord): string | null {
  if (typeof attempt.durationMs !== 'number') return null
  const total = Math.round(attempt.durationMs / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function when(iso: string): string {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return ''
  const hours = (Date.now() - at.getTime()) / 3_600_000
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${Math.floor(hours)} h ago`
  if (hours < 24 * 6) return at.toLocaleDateString(undefined, { weekday: 'short' })
  return at.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
