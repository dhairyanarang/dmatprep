import type { Confidence } from '@/lib/types/content'
import { cn } from '@/lib/utils'

/**
 * Inline citations were removed from the reading experience — they broke up
 * every paragraph. The `sources` data is still carried on each claim and still
 * drives /exam/sources, so the audit trail is intact; it just isn't rendered
 * against the prose any more.
 */

const CONFIDENCE_STYLE: Record<Exclude<Confidence, 'official'>, string> = {
  inferred: 'bg-warning-tint text-warning-fg',
  unconfirmed: 'bg-danger-tint text-danger-fg',
}

const CONFIDENCE_LABEL: Record<Exclude<Confidence, 'official'>, string> = {
  inferred: 'Inferred, not officially stated',
  unconfirmed: 'Not officially confirmed',
}

/**
 * Marks a claim that isn't stated outright by g.a.s.t. or APS. Nothing here
 * should ever be mistaken for an official rule.
 */
export function ConfidenceBadge({
  confidence,
  note,
}: {
  confidence?: Confidence
  note?: string
}) {
  if (!confidence || confidence === 'official') return null

  return (
    <span className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
      <span
        className={cn(
          'inline-flex h-5 items-center rounded px-2 text-[11px] font-medium tracking-wide uppercase',
          CONFIDENCE_STYLE[confidence],
        )}
      >
        {CONFIDENCE_LABEL[confidence]}
      </span>
      {note ? <span className="text-muted-foreground text-xs">{note}</span> : null}
    </span>
  )
}
