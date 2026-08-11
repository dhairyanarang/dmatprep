import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Standard page frame: one measure, one rhythm, on every route.
 * `wide` opts into a roomier column for grid-heavy pages (practice, dashboard).
 */
export function PageShell({
  title,
  description,
  actions,
  wide = false,
  children,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  wide?: boolean
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 lg:py-10',
        wide ? 'max-w-6xl' : 'max-w-3xl',
      )}
    >
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
          {description ? (
            <div className="text-muted-foreground mt-2 text-sm leading-relaxed text-pretty">
              {description}
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </header>

      {children}
    </div>
  )
}

/** Placeholder for routes whose content lands in a later phase. */
export function ComingSoon({ note }: { note: string }) {
  return (
    <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
      {note}
    </div>
  )
}
