import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * The design's KPI: a framed card holding an inset white surface, with a
 * footer sitting on the frame below it.
 *
 * The number is mono at 28px because these are figures to be compared down a
 * row, and a proportional font makes four of them line up badly.
 */
export function Kpi({
  label,
  value,
  suffix,
  progress,
  muted = false,
  foot,
  className,
}: {
  label: string
  value: ReactNode
  /** Small grey tail, e.g. "of 384". */
  suffix?: ReactNode
  /** 0–1. Renders the rail only when supplied. */
  progress?: number | null
  /**
   * Nothing has been measured yet, so the figure is a placeholder rather than
   * a result. Drawn quieter, because a bold em dash reads as a value.
   */
  muted?: boolean
  foot?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('bg-frame border-border flex flex-col rounded-xl border p-1', className)}>
      <div className="surface flex flex-col gap-2.5 px-3.5 py-3">
        <span className="over">{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              'font-mono text-[28px] leading-8 font-medium tracking-[-0.02em] tabular-nums',
              muted && 'text-muted-foreground/50',
            )}
          >
            {value}
          </span>
          {suffix ? <span className="text-muted-foreground text-[13px]">{suffix}</span> : null}
        </div>
        {typeof progress === 'number' ? (
          <div className="rail">
            <i style={{ width: `${Math.max(0, Math.min(100, Math.round(progress * 100)))}%` }} />
          </div>
        ) : null}
      </div>
      {foot ? (
        <div className="text-muted-foreground flex min-h-[30px] items-center justify-between gap-1.5 px-2.5 text-xs">
          {foot}
        </div>
      ) : null}
    </div>
  )
}
