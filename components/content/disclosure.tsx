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
  children,
  className,
}: {
  summary: string
  /** Short right-aligned counter, e.g. "6 steps". */
  hint?: string
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <details
      open={defaultOpen}
      className={cn('group border-border bg-card rounded-xl border', className)}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-3',
          'hover:bg-muted/50 focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none',
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        <ChevronRight
          className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-90"
          aria-hidden
        />
        <span className="flex-1 text-sm font-medium">{summary}</span>
        {hint ? <span className="text-muted-foreground text-xs tabular-nums">{hint}</span> : null}
      </summary>
      <div className="border-border border-t px-4 py-4">{children}</div>
    </details>
  )
}
