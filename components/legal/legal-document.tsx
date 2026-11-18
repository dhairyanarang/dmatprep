import type { LucideIcon } from 'lucide-react'

import { PageHeader } from '@/components/layout/page-header'
import { PageContainer } from '@/components/layout/page-shell'
import {
  OPERATOR,
  OPERATOR_FIELD_LABELS,
  missingOperatorFields,
  type OperatorDetails,
} from '@/content/legal/operator'
import type { LegalBlock, LegalDocument } from '@/content/legal/documents'

/**
 * Renders a published legal document, with its gaps visible rather than hidden.
 *
 * The one rule this component exists to enforce: an unsupplied fact is never
 * silently dropped and never invented. A missing legal name renders as a marked
 * placeholder, the page says at the top that it is not in force, and search
 * engines are told not to index it. `docs/legal/README.md` puts it bluntly — a
 * live page headed DRAFT is a liability, not a disclosure — and this is the
 * mechanism that stops one existing by accident.
 *
 * Fill `content/legal/operator.ts` and every notice disappears on its own.
 */

function substitute(text: string, details: OperatorDetails) {
  const parts = text.split(/(\{[a-zA-Z]+\})/g)
  return parts.map((part, index) => {
    const match = /^\{([a-zA-Z]+)\}$/.exec(part)
    if (!match) return part
    const key = match[1] as keyof OperatorDetails
    const value = details[key]
    if (value) return value
    return (
      <mark
        key={`${key}-${index}`}
        className="bg-destructive/10 text-destructive rounded px-1 py-0.5 font-mono text-[0.8em] not-italic"
      >
        [{OPERATOR_FIELD_LABELS[key] ?? key} required]
      </mark>
    )
  })
}

function Block({ block, details }: { block: LegalBlock; details: OperatorDetails }) {
  if (block.type === 'h') {
    return <h2 className="text-foreground mt-6 text-base font-semibold">{block.text}</h2>
  }
  if (block.type === 'note') {
    return (
      <p className="border-border bg-card text-foreground rounded-xl border p-4 text-sm leading-relaxed">
        {substitute(block.text, details)}
      </p>
    )
  }
  if (block.type === 'list') {
    return (
      <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
        {block.items.map((item) => (
          <li key={item}>{substitute(item, details)}</li>
        ))}
      </ul>
    )
  }
  return (
    <p className="text-muted-foreground text-sm leading-relaxed">
      {substitute(block.text, details)}
    </p>
  )
}

export function LegalDocumentPage({
  document,
  icon,
  details = OPERATOR,
}: {
  document: LegalDocument
  icon: LucideIcon
  details?: OperatorDetails
}) {
  const missing = missingOperatorFields(details)

  return (
    <div className="bg-[linear-gradient(180deg,rgba(2,89,100,0.12)_0px,rgba(2,89,100,0)_120px)]">
      <PageContainer className="flex max-w-3xl flex-col gap-5 py-6">
        <PageHeader icon={icon} title={document.title} description={document.description} />

        {missing.length > 0 ? (
          <div
            role="status"
            className="border-destructive/30 bg-destructive/5 space-y-2 rounded-xl border p-4"
          >
            <p className="text-foreground text-sm font-semibold">
              This document is not yet in force.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              It is awaiting {missing.length === 1 ? 'one detail' : `${missing.length} details`}{' '}
              that only the operator can supply, marked below. Nothing here has been reviewed by a
              lawyer. Nothing is being sold while this notice is visible.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Needed: {missing.map((k) => OPERATOR_FIELD_LABELS[k]).join(', ')}.
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Last updated: {details.lastUpdated}</p>
        )}

        <div className="space-y-3">
          {document.blocks.map((block, index) => (
            <Block key={`${block.type}-${index}`} block={block} details={details} />
          ))}
        </div>
      </PageContainer>
    </div>
  )
}

/**
 * Keep an incomplete document out of search results.
 *
 * Spread into a page's `metadata`. An unfinished Terms page being indexed is
 * the specific harm here: it would be found, quoted and relied on.
 */
export function legalRobots(details: OperatorDetails = OPERATOR) {
  return missingOperatorFields(details).length > 0
    ? { robots: { index: false, follow: false } }
    : {}
}
