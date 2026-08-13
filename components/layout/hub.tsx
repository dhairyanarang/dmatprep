import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * The one card shape every hub page uses.
 *
 * Hubs exist so the sidebar can stay at five entries: each one lists what is
 * inside it, in the same shape, so moving between them costs no re-reading.
 */
export function HubCard({
  href,
  title,
  description,
  meta,
  marker,
  action = 'Open',
}: {
  href: string
  title: string
  description: string
  /** Short right-aligned fact — counts, durations. */
  meta?: string
  /** Section colour dot, where the destination is a Core subtest. */
  marker?: ReactNode
  action?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group border-border bg-card flex flex-col gap-2 rounded-2xl border p-5 transition-colors',
        'hover:bg-muted/40 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
      )}
    >
      <div className="flex items-center gap-2">
        {marker}
        <h3 className="text-sm font-medium">{title}</h3>
        {meta ? (
          <span className="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">{meta}</span>
        ) : null}
      </div>

      <p className="text-muted-foreground flex-1 text-sm leading-relaxed">{description}</p>

      <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium">
        {action}
        <ArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  )
}

export function HubSection({
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
