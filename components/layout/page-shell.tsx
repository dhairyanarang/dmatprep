import type { ReactNode } from 'react'

import { TopBar } from '@/components/layout/top-bar'
import { cn } from '@/lib/utils'

/**
 * The one container that decides horizontal alignment, everywhere.
 *
 * Pages used to set their own max-width — 6xl on the hubs, 4xl on the subtest
 * layout, 3xl on prose pages — so the left and right edges moved as you
 * navigated from Prepare into a section into practice. There is now a single
 * outer measure and a single set of gutters; a page that reads better narrow
 * constrains its *content* inside this, which keeps the left edge and the
 * gutters fixed while the line length changes.
 */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>
  )
}

/**
 * Standard page frame: context bar, then content.
 *
 * `wide` no longer changes the page's outer alignment — it only decides whether
 * the content runs the full width of the container or is held to a comfortable
 * reading measure.
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
  /** Full container width for grid-heavy pages; otherwise a reading measure. */
  wide?: boolean
  children?: ReactNode
}) {
  return (
    <PageContainer className="pb-10 lg:pb-12">
      <TopBar title={title} actions={actions} />

      <div className={cn(!wide && 'max-w-3xl')}>
        {description ? (
          <div className="text-muted-foreground mb-6 text-sm leading-relaxed text-pretty">
            {description}
          </div>
        ) : null}
        {children}
      </div>
    </PageContainer>
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
