import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'

import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ stats */

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
}

export function Stat({
  value,
  unit,
  label,
  tone,
}: {
  value: string
  unit?: string
  label: string
  tone?: 'figures' | 'equations' | 'latin' | 'default'
}) {
  const accent =
    tone === 'figures'
      ? 'text-figures'
      : tone === 'equations'
        ? 'text-equations'
        : tone === 'latin'
          ? 'text-latin'
          : 'text-foreground'

  return (
    <div className="border-border bg-card rounded-2xl border p-4">
      <p className="flex items-baseline gap-1">
        <span className={cn('text-2xl leading-none font-semibold tabular-nums', accent)}>
          {value}
        </span>
        {unit ? <span className="text-muted-foreground text-xs">{unit}</span> : null}
      </p>
      <p className="text-muted-foreground mt-2 text-xs">{label}</p>
    </div>
  )
}

/* --------------------------------------------------------------- schedule */

export type Segment = {
  label: string
  minutes: number
  tone: 'figures' | 'equations' | 'latin' | 'break' | 'subject'
  /** Optional second line — only tall blocks have room for it. */
  note?: string
}

/**
 * The hue is an edge rail and a tint, never the text colour: acid-on-light and
 * white-on-teal both fail contrast, and this component has to work in both
 * themes. Foreground text on a tint always passes.
 */
const SEGMENT_STYLE: Record<Segment['tone'], string> = {
  figures: 'border-figures bg-figures-tint',
  equations: 'border-equations bg-equations-tint',
  latin: 'border-latin bg-latin-tint',
  break: 'border-border border-dashed bg-transparent',
  subject: 'border-foreground/40 bg-muted',
}

/**
 * The exam day drawn to scale, running downwards like a calendar day.
 *
 * Each block's height is proportional to its real duration, so the 90-minute
 * subject module visibly dominates the three 25-minute subtests. Vertical
 * rather than horizontal because a full-width block has room for its own name
 * and duration — a to-scale horizontal bar leaves a 25-minute segment about
 * 40px wide on a phone, which forces the labels out into a legend.
 */
export function DaySchedule({ segments }: { segments: Segment[] }) {
  return (
    <ol className="flex h-[22rem] flex-col gap-1">
      {segments.map((s) => (
        <li key={s.label} style={{ flexGrow: s.minutes, flexBasis: 0 }} className="min-h-0">
          <div
            className={cn(
              // Top-aligned, so every block reads as "this is where it starts"
              // rather than floating its label in the middle of 90 minutes.
              'flex h-full flex-col justify-start rounded-md rounded-l-sm border-l-2 px-3 py-2',
              SEGMENT_STYLE[s.tone],
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span
                className={cn(
                  'text-[13px] font-medium',
                  s.tone === 'break' ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                {s.label}
              </span>
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                {s.minutes} min
              </span>
            </div>
            {s.note ? (
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{s.note}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}

/* -------------------------------------------------------------- milestones */

export type Milestone = { date: string; label: string; state?: 'past' | 'next' | 'future' }

/** Dated milestones on a single track — the shape of the run-up at a glance. */
export function MilestoneTrack({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-4">
      {milestones.map((m) => (
        <li key={m.label} className="relative">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn(
                'size-2.5 shrink-0 rounded-full',
                m.state === 'past'
                  ? 'bg-muted-foreground/40'
                  : m.state === 'next'
                    ? 'bg-primary'
                    : 'border-muted-foreground/40 border bg-transparent',
              )}
            />
            <span className="bg-border h-px flex-1" aria-hidden />
          </div>
          <p className="mt-3 text-sm font-medium tabular-nums">{m.date}</p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{m.label}</p>
        </li>
      ))}
    </ol>
  )
}

/* ------------------------------------------------------------ score scale */

/** The 0–200 scale with the mean marked, rather than three sentences about it. */
export function ScoreScale() {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="relative">
        <div className="bg-muted h-2 w-full rounded-full" />
        <div
          className="bg-foreground absolute top-0 h-2 w-px"
          style={{ left: '50%' }}
          aria-hidden
        />
        <div
          className="border-background bg-primary absolute -top-1 size-4 -translate-x-1/2 rounded-full border-2"
          style={{ left: '50%' }}
          aria-hidden
        />
      </div>

      <div className="text-muted-foreground mt-3 flex justify-between text-xs tabular-nums">
        <span>0</span>
        <span className="text-foreground font-medium">100 · mean</span>
        <span>200</span>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- lists */

export function AllowedList({
  title,
  items,
  allowed,
}: {
  title: string
  items: string[]
  allowed: boolean
}) {
  const Icon = allowed ? Check : X
  return (
    <div
      className={cn(
        'space-y-3 rounded-2xl border p-4',
        allowed ? 'border-success/25 bg-success-tint/40' : 'border-danger/25 bg-danger-tint/40',
      )}
    >
      <h3 className={cn('text-sm font-semibold', allowed ? 'text-success-fg' : 'text-danger-fg')}>
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed">
            <Icon
              className={cn('mt-1 size-3.5 shrink-0', allowed ? 'text-success-fg' : 'text-danger-fg')}
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ChipGrid({ items, label }: { items: string[]; label: string }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label={label}>
      {items.map((item) => (
        <li
          key={item}
          className="border-border bg-card text-muted-foreground rounded-md border px-2.5 py-1 text-xs"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

/* --------------------------------------------------------------- section */

export function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}
