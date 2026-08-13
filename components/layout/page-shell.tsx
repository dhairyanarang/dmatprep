import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * The one container that decides horizontal alignment, everywhere.
 *
 * Width and gutters come from the design: at its 1280px frame the content
 * column is 1016px wide with 24px padding, so that is the cap. Pages that read
 * better narrow constrain their *content* inside this, which keeps the left
 * edge and the gutters fixed while the line length changes.
 */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1016px] px-4 sm:px-6', className)}>{children}</div>
  )
}

/**
 * Standard page frame.
 *
 * There is no `title` prop: the design carries no page heading in the content
 * area, because the breadcrumb's last segment is the page title and is rendered
 * as the `<h1>` in the top bar.
 */
export function PageShell({
  description,
  actions,
  wide = false,
  children,
}: {
  description?: ReactNode
  actions?: ReactNode
  /** Full container width for grid-heavy pages; otherwise a reading measure. */
  wide?: boolean
  children?: ReactNode
}) {
  return (
    <PageContainer className="py-6">
      {description || actions ? (
        <div className={cn('mb-6 flex items-start justify-between gap-4', !wide && 'max-w-3xl')}>
          {description ? (
            <div className="text-muted-foreground text-sm leading-5 text-pretty">{description}</div>
          ) : (
            <span />
          )}
          {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
        </div>
      ) : null}

      <div className={cn(!wide && 'max-w-3xl')}>{children}</div>
    </PageContainer>
  )
}

/** Placeholder for routes whose content lands in a later phase. */
export function ComingSoon({ note }: { note: string }) {
  return (
    <div className="text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm">
      {note}
    </div>
  )
}
