import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { PageDisclaimer } from '@/components/layout/page-disclaimer'
import { SubPage } from '@/components/layout/sub-nav'
import { cn } from '@/lib/utils'

/**
 * The frame every informational page uses.
 *
 * It exists because those pages had drifted into four different widths, and
 * two of them narrowed the page container itself — which moves the left edge
 * and the gutters, and is what made them read as a separate website sitting
 * inside the app.
 *
 * The container, the gutters and the page entrance now belong to the
 * Information layout, which also supplies the internal sidebar. This supplies
 * the heading, the reading measure and the disclaimer, and nothing else.
 */
export function InfoPage({
  title,
  description,
  wide = false,
  disclaimer = true,
  children,
}: {
  /** Accepted and unused: the section's sidebar carries the identity now. */
  icon?: LucideIcon
  title: string
  description?: string
  /** Full container width, for layouts that compare things side by side. */
  wide?: boolean
  /** Omitted on /about, which IS the full statement. */
  disclaimer?: boolean
  children: ReactNode
}) {
  return (
    <SubPage title={title} description={description}>
      <div className={cn('flex flex-col gap-7', !wide && 'max-w-3xl')}>{children}</div>
      {disclaimer ? <PageDisclaimer className={cn(!wide && 'max-w-3xl')} /> : null}
    </SubPage>
  )
}

/** A titled block inside an informational page. */
export function InfoSection({
  title,
  children,
  className,
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-3', className)}>
      {title ? <h2 className="text-foreground text-base font-semibold">{title}</h2> : null}
      {children}
    </section>
  )
}
