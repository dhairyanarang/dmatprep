'use client'

import { useMemo, useState } from 'react'

import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import type { AttemptRecord } from '@/lib/types/progress'

type Range = 'daily' | 'weekly'

/**
 * How much was practised, and how much of it was right.
 *
 * Fourteen days or two weeks, stacked: the filled part of each column is what
 * was answered correctly, the pale part what was missed. It is built from
 * attempts, like every other figure in the product, so it cannot disagree with
 * the section pages.
 *
 * Columns are drawn as stacked cells rather than a scaled bar, which is what
 * the design does and what keeps the chart honest at small counts: one cell is
 * one question, so a two-question day cannot be stretched to look like a
 * twenty-question one.
 */
export function ActivityChart() {
  const progress = useProgress()
  const ready = useProgressReady()
  const [range, setRange] = useState<Range>('daily')

  const { columns, total, correct, unit, max } = useMemo(
    () => summarise(progress.attempts, range),
    [progress.attempts, range],
  )

  return (
    <section className="panel min-w-0 flex-[2_1_480px]">
      <div className="panel-h">
        <h2 className="ptitle">Questions per day</h2>
        <div
          role="radiogroup"
          aria-label="Range"
          className="bg-sidebar border-border inline-flex gap-0.5 rounded-lg border p-0.5"
        >
          {(['daily', 'weekly'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={range === value}
              onClick={() => setRange(value)}
              className={
                range === value
                  ? 'bg-card text-foreground h-7 rounded-md px-2.5 text-[13px] font-medium shadow-[0_1px_2px_rgba(10,10,10,0.08)]'
                  : 'text-muted-foreground hover:text-foreground h-7 rounded-md px-2.5 text-[13px] font-medium'
              }
            >
              {value === 'daily' ? 'Daily' : 'Weekly'}
            </button>
          ))}
        </div>
      </div>

      <div className="surface flex flex-1 flex-col gap-3.5 p-4">
        <div className="flex flex-wrap items-baseline gap-4">
          <span className="text-muted-foreground text-[13px]">
            {range === 'daily' ? 'Last 14 days' : 'Last 8 weeks'}
          </span>
          <span className="font-mono text-xl font-medium tabular-nums">
            {total}{' '}
            <span className="text-muted-foreground font-sans text-[13px]">
              {total === 1 ? 'question' : 'questions'} · {correct} correct
            </span>
          </span>
          <span className="text-muted-foreground ml-auto flex gap-3.5 text-xs">
            <Key colour="var(--brand)" label="Correct" />
            <Key colour="var(--brand-200)" label="Missed" />
          </span>
        </div>

        {!ready ? (
          <div className="h-[186px]" />
        ) : total === 0 ? (
          // The real chart, with the real number of columns, and nothing in
          // them — rather than a paragraph where a chart should be. It shows
          // the shape of what is coming and reads as a chart awaiting data
          // instead of a panel that failed to load.
          <div className="relative grid gap-2.5" style={{ gridTemplateColumns: '28px 1fr' }}>
            <div className="text-muted-foreground/60 flex h-[166px] flex-col justify-between text-right font-mono text-[10px]">
              <span>&nbsp;</span>
              <span>&nbsp;</span>
              <span>0</span>
            </div>
            <div
              aria-hidden
              className="grid items-end gap-1.5"
              style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` }}
            >
              {columns.map((column, i) => (
                <div key={column.label + i} className="flex flex-col items-center gap-2">
                  <div className="flex h-[166px] flex-col-reverse gap-1">
                    {Array.from({ length: 8 }, (_, k) => (
                      <span
                        key={k}
                        className="bg-soft block rounded-[3px]"
                        style={{ width: range === 'daily' ? 16 : 40, height: 17 }}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground/60 font-mono text-[10px]">
                    {column.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="absolute inset-0 grid place-items-center">
              <p className="bg-card/85 text-muted-foreground max-w-[260px] rounded-lg px-4 py-2.5 text-center text-sm backdrop-blur-[2px] text-balance">
                Answer your first question and this fills in from your own attempts.
              </p>
            </div>
          </div>
        ) : (
          <div
            role="img"
            aria-label={`${total} questions over the ${range === 'daily' ? 'last 14 days' : 'last 8 weeks'}, ${correct} correct`}
            className="grid gap-2.5"
            style={{ gridTemplateColumns: '28px 1fr' }}
          >
            <div className="text-muted-foreground flex h-[166px] flex-col justify-between text-right font-mono text-[10px] tabular-nums">
              <span>{max}</span>
              <span>{Math.round(max / 2)}</span>
              <span>0</span>
            </div>
            <div
              className="grid items-end gap-1.5"
              style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` }}
            >
              {columns.map((column, i) => (
                <div key={column.label + i} className="flex flex-col items-center gap-2">
                  <div className="flex h-[166px] flex-col-reverse gap-1">
                    {Array.from({ length: Math.ceil(max / unit) }, (_, k) => {
                      const filled = k * unit
                      const colour =
                        filled < column.correct
                          ? 'var(--brand)'
                          : filled < column.total
                            ? 'var(--brand-200)'
                            : 'var(--soft)'
                      return (
                        <span
                          key={k}
                          className="block rounded-[3px]"
                          // An explicit width, because the column is centred
                          // inside its label and a span with no intrinsic
                          // width collapses to nothing in a centred flex
                          // column — which is exactly what it did.
                          style={{
                            width: range === 'daily' ? 16 : 40,
                            height: 17,
                            background: colour,
                          }}
                        />
                      )
                    })}
                  </div>
                  <span
                    className={
                      i === columns.length - 1
                        ? 'text-foreground font-mono text-[10px]'
                        : 'text-muted-foreground font-mono text-[10px]'
                    }
                  >
                    {column.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function Key({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i aria-hidden className="block size-2 rounded-[2px]" style={{ background: colour }} />
      {label}
    </span>
  )
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/**
 * Buckets attempts into columns.
 *
 * Eight rows of cells, so `unit` is how many questions one cell stands for.
 * It is derived from the busiest column rather than fixed, which keeps a light
 * week legible and stops a heavy one running off the top.
 */
function summarise(attempts: AttemptRecord[], range: Range) {
  const spanDays = range === 'daily' ? 14 : 56
  const bucketDays = range === 'daily' ? 1 : 7
  const buckets = spanDays / bucketDays

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dayMs = 86_400_000

  const columns = Array.from({ length: buckets }, (_, i) => {
    const offset = buckets - 1 - i
    const end = startOfToday + dayMs - offset * bucketDays * dayMs
    const start = end - bucketDays * dayMs
    const label =
      range === 'daily'
        ? DAY_LABELS[new Date(start).getDay()]
        : offset === 0
          ? 'This wk'
          : `-${offset}w`
    return { start, end, label, total: 0, correct: 0 }
  })

  let total = 0
  let correct = 0
  for (const attempt of attempts) {
    const at = Date.parse(attempt.at)
    if (Number.isNaN(at)) continue
    const column = columns.find((c) => at >= c.start && at < c.end)
    if (!column) continue
    column.total++
    total++
    if (attempt.correct) {
      column.correct++
      correct++
    }
  }

  const peak = Math.max(1, ...columns.map((c) => c.total))
  const rows = 8
  const unit = Math.max(1, Math.ceil(peak / rows))
  const max = unit * rows

  return { columns, total, correct, unit, max }
}
