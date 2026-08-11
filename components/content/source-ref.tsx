import { SOURCES } from '@/content/exam/sources'
import type { Confidence, SourceRef } from '@/lib/types/content'
import { cn } from '@/lib/utils'

const SHORT: Record<string, string> = {
  'gam-pdf': 'Prep materials',
  'dmat-home': 'd-mat.de',
  'dmat-india': 'd-mat.de (India)',
  'dmat-structure': 'd-mat.de (structure)',
  'dmat-terms': 'T&Cs',
  'dmat-preparation': 'd-mat.de (preparation)',
  'aps-dmat': 'APS India',
  'aps-fields': 'APS field list',
}

/** Inline citation chips. Deliberately quiet — present, but not shouting. */
export function SourceCitation({ sources }: { sources?: SourceRef[] }) {
  if (!sources?.length) return null

  return (
    <span className="ml-1.5 inline-flex flex-wrap gap-1 align-baseline">
      {sources.map((ref, i) => {
        const source = SOURCES[ref.id]
        return (
          <a
            key={`${ref.id}-${ref.page ?? i}`}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            title={`${source.title}${source.asAt ? ` (${source.asAt})` : ''}`}
            className="text-muted-foreground hover:text-foreground rounded border px-1 text-[10px] leading-4 transition-colors"
          >
            {SHORT[ref.id] ?? ref.id}
            {ref.page ? ` p.${ref.page}` : ''}
          </a>
        )
      })}
    </span>
  )
}

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
