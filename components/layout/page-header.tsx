import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * A page's heading block: the title as the `<h1>`, with one line of
 * orientation under it.
 *
 * It used to lead with a raised icon tile. The design does not: a page has one
 * heading, set in the page's own type, and the icon beside it was decoration
 * that pushed the title down to 18px to make room. The `icon` prop is still
 * accepted so every caller did not have to change at once, and is ignored.
 *
 * Distinct from the breadcrumb in the top bar, which says *where you are*;
 * this says *what this page is for*.
 */
export function PageHeader({
  title,
  description,
  className,
}: {
  /** Accepted and unused — see above. */
  icon?: LucideIcon
  title: string
  description?: string
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <h1 className="text-2xl leading-8 font-semibold tracking-[-0.015em]">{title}</h1>
      {description ? (
        <p className="text-muted-foreground mt-1 max-w-prose text-sm leading-5 text-pretty">
          {description}
        </p>
      ) : null}
    </div>
  )
}
