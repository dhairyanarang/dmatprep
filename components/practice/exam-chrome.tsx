'use client'

import { useEffect, type ReactNode } from 'react'
import { Flag, Timer } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * The exam takeover.
 *
 * A timed sitting is not a page in the app — it is the only thing happening,
 * and the design treats it that way: a dark bar with the clock in it, and the
 * navigation gone. Rendering it as a fixed overlay rather than a route group
 * keeps every URL and every resume path exactly where it was, and achieves the
 * same thing: nothing of the shell is reachable while the clock runs.
 *
 * Body scroll is locked for the same reason the sidebar is hidden — there is
 * nothing behind this worth scrolling to, and letting the page move underneath
 * is how a candidate loses the clock.
 */
export function ExamChrome({
  title,
  part,
  clock,
  flagged,
  onToggleFlag,
  onSubmit,
  submitLabel,
  children,
}: {
  title: string
  /** "Part 2 of 3 · Latin Squares", or just the subtest for a single part. */
  part: string
  clock?: ReactNode
  flagged: boolean
  onToggleFlag: () => void
  onSubmit: () => void
  submitLabel: string
  children: ReactNode
}) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div className="bg-background fixed inset-0 z-50 flex flex-col overflow-auto">
      <header className="bg-foreground text-background flex min-h-14 flex-wrap items-center gap-4 py-2 pr-4 pl-5">
        <div className="flex min-w-0 flex-[1_1_260px] items-center gap-2.5">
          <span
            aria-hidden
            className="bg-background text-foreground grid size-6 shrink-0 place-items-center rounded-[5px] text-[13px] font-semibold"
          >
            D
          </span>
          <b className="truncate text-sm font-semibold">{title}</b>
          <span className="text-[#8c8c8c]" aria-hidden>
            ·
          </span>
          <span className="truncate text-sm text-[#bdbdbd]">{part}</span>
        </div>

        {clock}

        <div className="flex flex-[1_1_260px] justify-end gap-2">
          <button
            type="button"
            onClick={onToggleFlag}
            aria-pressed={flagged}
            className={cn(
              'inline-flex h-[34px] items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors',
              'focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
              flagged
                ? 'border-warning bg-[#2b1d00] text-[var(--gold)]'
                : 'border-[#333] text-inherit hover:bg-[#262626]',
            )}
          >
            <Flag aria-hidden className="size-3.5" fill={flagged ? 'currentColor' : 'none'} />
            {flagged ? 'Flagged' : 'Flag'}
          </button>

          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex h-[34px] items-center rounded-lg border border-[#333] px-3 text-[13px] font-medium transition-colors hover:bg-[#262626] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            {submitLabel}
          </button>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-wrap items-start gap-6 px-4 py-7 sm:px-8">
        {children}
      </main>
    </div>
  )
}

/**
 * The clock, in the dark bar. It turns amber under five minutes, which is the
 * point at which guessing beats reading.
 */
export function ExamClock({ remainingMs, label }: { remainingMs: number; label: string }) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const low = remainingMs <= 300_000

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`${minutes} minutes ${seconds} seconds left in ${label}`}
      className={cn(
        'flex h-9 items-center gap-2 rounded-lg border px-3.5',
        low ? 'border-warning bg-[#3a1e00]' : 'border-[#333] bg-[#1a1a1a]',
      )}
    >
      <Timer aria-hidden className={cn('size-4', low ? 'text-[var(--gold)]' : 'text-[#9fb0ff]')} />
      <span className="font-mono text-lg font-medium tracking-[0.02em] tabular-nums">
        {minutes}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  )
}

/**
 * The task navigator: every question in the part, its state visible at a
 * glance, and all of them one click away.
 */
export function TaskPanel({
  count,
  current,
  answered,
  flagged,
  onJump,
  unitNoun,
}: {
  count: number
  current: number
  answered: (index: number) => boolean
  flagged: (index: number) => boolean
  onJump: (index: number) => void
  unitNoun: string
}) {
  const done = Array.from({ length: count }, (_, i) => answered(i)).filter(Boolean).length
  const flags = Array.from({ length: count }, (_, i) => flagged(i)).filter(Boolean).length

  return (
    <aside className="flex min-w-0 flex-[1_1_260px] flex-col gap-3">
      <section className="panel">
        <div className="panel-h min-h-10">
          <span className="ptitle">Tasks</span>
          <span className="text-muted-foreground text-xs">
            {done} answered{flags > 0 ? ` · ${flags} flagged` : ''}
          </span>
        </div>

        <div className="surface flex flex-col gap-3 p-3">
          <div
            role="group"
            aria-label={`Jump to ${unitNoun}`}
            className="grid grid-cols-5 gap-1.5"
          >
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onJump(i)}
                aria-label={`Task ${i + 1}, ${answered(i) ? 'answered' : 'not answered'}${
                  flagged(i) ? ', flagged' : ''
                }${i === current ? ', current' : ''}`}
                aria-current={i === current ? 'true' : undefined}
                className={cn(
                  'relative h-9 rounded-md border font-mono text-xs transition-colors',
                  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                  answered(i)
                    ? 'bg-brand border-brand text-brand-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-foreground',
                  i === current && 'border-foreground border-[1.5px]',
                )}
              >
                {String(i + 1).padStart(2, '0')}
                {flagged(i) ? (
                  <span
                    aria-hidden
                    className="bg-warning absolute top-[3px] right-[3px] size-1.5 rounded-full"
                  />
                ) : null}
              </button>
            ))}
          </div>

          <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
            <Legend swatch="bg-brand" label="Answered" />
            <Legend swatch="border-foreground border-[1.5px]" label="Current" />
            <Legend swatch="bg-warning rounded-full" label="Flagged" />
          </div>
        </div>
      </section>

      <p className="note">
        Stuck? Flag it and move on. A blank scores nothing, so guess before the clock ends.
      </p>
    </aside>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i aria-hidden className={cn('block size-2.5 rounded-[3px]', swatch)} />
      {label}
    </span>
  )
}
