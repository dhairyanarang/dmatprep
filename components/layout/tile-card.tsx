import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

import { ArrowAffordance } from '@/components/ui/arrow-affordance'
import { cn } from '@/lib/utils'

/**
 * The card the design uses for every destination: an icon tile, a title, a line
 * of description, and a circled arrow when it goes somewhere.
 *
 * One component rather than a variant per page — Prepare, Test and the exam
 * reference all draw the same object, and the only real difference is whether
 * it is a link and which tone the tile takes.
 */
export function TileCard({
  href,
  icon: Icon,
  title,
  description,
  meta,
  tone = 'brand',
  className,
}: {
  /** Omit to render a static card — used for the Module B notice. */
  href?: string
  icon: LucideIcon
  title: string
  description?: string
  /** Small pill under the description, e.g. "10 mins". */
  meta?: string
  tone?: 'brand' | 'muted'
  className?: string
}) {
  const body = (
    <>
      <span
        aria-hidden
        className={cn(
          'flex shrink-0 items-center rounded-md p-2',
          tone === 'brand' ? 'bg-brand/8' : 'bg-muted',
        )}
      >
        <Icon className={cn('size-5', tone === 'brand' ? 'text-brand' : 'text-muted-foreground')} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-base leading-5 font-medium">{title}</span>
        {description ? (
          <span className="text-muted-foreground text-sm leading-5 font-medium">{description}</span>
        ) : null}
        {meta ? (
          <span className="bg-muted text-muted-foreground mt-1 w-fit rounded-md px-2 py-1 text-xs font-medium">
            {meta}
          </span>
        ) : null}
      </span>

      {href ? <ArrowAffordance className="mt-0.5" /> : null}
    </>
  )

  const shell = cn(
    'border-border bg-card flex items-start gap-3 rounded-2xl border p-4',
    href &&
      'group hover:border-brand/40 focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none',
    className,
  )

  if (!href) return <div className={shell}>{body}</div>

  return (
    <Link href={href} className={shell}>
      {body}
    </Link>
  )
}
