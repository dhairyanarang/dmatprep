import { ArrowUpRight } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * The circled arrow the design puts in the corner of every navigable card.
 *
 * Decorative: the whole card is the link, so this carries no label and is hidden
 * from assistive technology rather than announcing a second, phantom control.
 */
export function ArrowAffordance({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'border-border text-foreground/70 flex size-[22px] shrink-0 items-center justify-center rounded-full border transition-colors',
        'group-hover:border-brand group-hover:text-brand',
        className,
      )}
    >
      <ArrowUpRight className="size-3.5" />
    </span>
  )
}
