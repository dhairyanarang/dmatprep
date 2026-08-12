import { SOURCES } from '@/content/exam/sources'
import { cn } from '@/lib/utils'

/**
 * Where a statement comes from.
 *
 * The dMAT was first sat in September 2026, so a student has no way to tell our
 * study advice from g.a.s.t.'s rules by reading alone. This marks the four kinds
 * apart — but only where the distinction changes what someone should do. Tagging
 * every sentence would make the tags invisible.
 */
export type Provenance = 'official' | 'recommendation' | 'derived' | 'unconfirmed'

const STYLE: Record<Provenance, string> = {
  // Status colours, per the two documented deviations in DESIGN.md.
  official: 'bg-success-tint text-success-fg',
  unconfirmed: 'bg-danger-tint text-danger-fg',
  // Derived and advice stay neutral: they are qualifications, not warnings.
  derived: 'bg-muted text-muted-foreground',
  recommendation: 'bg-muted text-muted-foreground',
}

const LABEL: Record<Provenance, string> = {
  official: 'Official',
  recommendation: 'dMAT Prep advice',
  derived: 'Derived',
  unconfirmed: 'Unconfirmed',
}

const EXPLAINER: Record<Provenance, string> = {
  official: 'Stated by g.a.s.t. or APS India.',
  recommendation: 'Our study guidance, not an exam rule.',
  derived: 'Calculated from official figures.',
  unconfirmed: 'Not confirmed by any official source.',
}

export function ProvenanceTag({
  kind,
  className,
}: {
  kind: Provenance
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center rounded px-2 text-[11px] font-medium tracking-wide uppercase',
        STYLE[kind],
        className,
      )}
      title={EXPLAINER[kind]}
    >
      {LABEL[kind]}
    </span>
  )
}

/**
 * A statement with its provenance, and — for official ones — the document and
 * the date it was last checked, so the audit trail is one glance away without
 * cluttering the sentence.
 */
export function SourcedFact({
  kind,
  children,
  sourceId,
  note,
}: {
  kind: Provenance
  children: React.ReactNode
  sourceId?: keyof typeof SOURCES
  note?: string
}) {
  const source = sourceId ? SOURCES[sourceId] : null

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <ProvenanceTag kind={kind} />
        <span className="text-sm leading-relaxed">{children}</span>
      </div>
      {note ? <p className="text-muted-foreground text-xs leading-relaxed">{note}</p> : null}
      {source ? (
        <p className="text-muted-foreground text-xs">
          {source.title} · {source.publisher}
          {source.asAt ? ` · checked against the ${source.asAt} version` : ''}
        </p>
      ) : null}
    </div>
  )
}

/** The legend, shown once per page that uses the tags. */
export function ProvenanceKey({ kinds }: { kinds: Provenance[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2">
      {kinds.map((kind) => (
        <li key={kind} className="flex items-center gap-2">
          <ProvenanceTag kind={kind} />
          <span className="text-muted-foreground text-xs">{EXPLAINER[kind]}</span>
        </li>
      ))}
    </ul>
  )
}
