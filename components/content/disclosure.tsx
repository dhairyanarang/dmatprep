import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Progressive disclosure, built on `<details>`.
 *
 * Native rather than a JS component: it is keyboard operable and screen-reader
 * announced without any work, it needs no client boundary, and it cannot
 * hydrate out of sync — the open state lives in the DOM, not in React.
 */
export function Disclosure({
  summary,
  hint,
  defaultOpen = false,
  chevron = 'start',
  children,
  className,
}: {
  summary: ReactNode
  /** Short right-aligned counter, e.g. "6 steps". */
  hint?: string
  defaultOpen?: boolean
  /**
   * Where the affordance sits. Prose disclosures lead with it so the row reads
   * as expandable; list rows put it at the end, where a link's arrow would be.
   */
  chevron?: 'start' | 'end'
  children: ReactNode
  className?: string
}) {
  return (
    <details
      open={defaultOpen}
      className={cn('group border-border bg-card rounded-2xl border', className)}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center gap-2 rounded-2xl p-3 group-[.p-0]:p-4',
          'hover:bg-muted/50 focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none',
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        <ChevronRight
          className={cn(
            'text-muted-foreground size-5 shrink-0 transition-transform duration-[var(--duration-control)] ease-out group-open:rotate-90',
            chevron === 'end' && 'order-last',
          )}
          aria-hidden
        />
        <span className="min-w-0 flex-1 text-sm font-medium">{summary}</span>
        {hint ? <span className="text-muted-foreground text-xs tabular-nums">{hint}</span> : null}
      </summary>
      {/* Opacity and a 4px lift only. Animating the height of arbitrary content
          is where disclosures get janky, and the panel is already in flow by the
          time this runs — so it reads as connected to the chevron without the
          browser measuring anything. */}
      <div className="border-border motion-safe:group-open:animate-in motion-safe:group-open:fade-in-0 motion-safe:group-open:slide-in-from-top-1 border-t px-3 py-4 motion-safe:group-open:duration-200">
        {children}
      </div>
    </details>
  )
}
