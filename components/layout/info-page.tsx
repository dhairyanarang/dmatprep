import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { PageDisclaimer } from '@/components/layout/page-disclaimer'
import { PageHeader } from '@/components/layout/page-header'
import { PageContainer } from '@/components/layout/page-shell'
import { cn } from '@/lib/utils'

/**
 * The frame every informational page uses.
 *
 * It exists because those pages had drifted into four different widths. Two
 * narrowed the `PageContainer` itself, which moves the page's left edge and
 * gutters and is what made them read as a separate website sitting inside the
 * app. The main pages never do that: the container is always full width, and
 * anything that reads better short is narrowed *inside* it.
 *
 * So the rule is one line of code rather than a convention to remember —
 * container full width, prose capped at the reading measure, and pages that
 * genuinely need the width (the pricing comparison) opt out with `wide`.
 */
export function InfoPage({
  icon,
  title,
  description,
  wide = false,
  disclaimer = true,
  children,
}: {
  icon: LucideIcon
  title: string
  description?: string
  /** Full container width, for layouts that compare things side by side. */
  wide?: boolean
  /** Omitted on /about, which IS the full statement. */
  disclaimer?: boolean
  children: ReactNode
}) {
  return (
    <div className="bg-[linear-gradient(180deg,rgba(2,89,100,0.12)_0px,rgba(2,89,100,0)_120px)]">
      <PageContainer className="stagger-enter flex flex-col gap-7 py-6">
        <PageHeader icon={icon} title={title} description={description} />

        <div className={cn('flex flex-col gap-7', !wide && 'max-w-3xl')}>{children}</div>

        {disclaimer ? <PageDisclaimer className={cn(!wide && 'max-w-3xl')} /> : null}
      </PageContainer>
    </div>
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
