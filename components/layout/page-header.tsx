import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * The page header the design introduces: a raised icon tile beside a title and
 * one line of orientation.
 *
 * Distinct from the breadcrumb in the top bar, which says *where you are*; this
 * says *what this page is for*. Shared rather than written into the exam page,
 * because it is the shape any section landing should take.
 */
export function PageHeader({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <span
        aria-hidden
        className="border-border bg-card flex shrink-0 items-center rounded-lg border p-3 shadow-[0_4px_6px_rgba(0,0,0,0.06)]"
      >
        <Icon className="text-foreground size-6" />
      </span>

      <span className="flex min-w-0 flex-col gap-1.5">
        <span className="text-foreground text-lg leading-tight font-semibold tracking-tight">
          {title}
        </span>
        {description ? (
          <span className="text-muted-foreground text-sm leading-tight">{description}</span>
        ) : null}
      </span>
    </div>
  )
}
