'use client'

import Link from 'next/link'

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
          <p className="text-muted-foreground p-6 text-center text-sm">
            Nothing answered yet. Every question you try shows up here.
          </p>
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
