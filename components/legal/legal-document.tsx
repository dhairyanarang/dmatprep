import type { LucideIcon } from 'lucide-react'

import { InfoPage } from '@/components/layout/info-page'
import {
  OPERATOR,
  OPERATOR_FIELD_LABELS,
  type OperatorDetails,
} from '@/content/legal/operator'
import type { LegalBlock, LegalDocument } from '@/content/legal/documents'

/**
 * Renders a published legal document, with its gaps visible rather than hidden.
 *
 * The rule has not changed — an unsupplied fact is never silently dropped and
 * never invented — but what counts as a gap now is. It used to be any unfilled
 * operator field, which meant a document mentioning only the support address
 * still carried a red "not yet in force" banner listing five details it never
 * used. That is noise, and noise trains people to ignore the warning.
 *
 * So the banner is driven by the tokens the document ACTUALLY contains. Write
 * `{legalName}` into a document and it starts warning again the moment that
 * value is missing.
 *
 * Details a document does not mention are not thereby unnecessary: the ones
 * still outstanding are recorded in `docs/LEGAL_READINESS.md` for a decision,
 * not quietly dropped because a page stopped referencing them.
 */

const TOKEN = /\{([a-zA-Z]+)\}/g

function tokensIn(document: LegalDocument): (keyof OperatorDetails)[] {
  const text = document.blocks
    .map((b) => (b.type === 'list' ? b.items.join(' ') : b.text))
    .join(' ')
  return [...new Set([...text.matchAll(TOKEN)].map((m) => m[1]))].filter(
    (k): k is keyof OperatorDetails => k in OPERATOR,
  )
}

function substitute(text: string, details: OperatorDetails) {
  return text.split(/(\{[a-zA-Z]+\})/g).map((part, index) => {
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
    return <h2 className="text-foreground mt-4 text-base font-semibold">{block.text}</h2>
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
  const missing = tokensIn(document).filter((k) => !details[k])

  return (
    <InfoPage icon={icon} title={document.title} description={document.description}>
      {missing.length > 0 ? (
        <div
          role="status"
          className="border-destructive/30 bg-destructive/5 space-y-2 rounded-xl border p-4"
        >
          <p className="text-foreground text-sm font-semibold">
            This document is not yet in force.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            It is awaiting {missing.map((k) => OPERATOR_FIELD_LABELS[k]).join(', ')}, which only
            the operator can supply. Nothing is being sold while this notice is visible.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {document.blocks.map((block, index) => (
          <Block key={`${block.type}-${index}`} block={block} details={details} />
        ))}
      </div>
    </InfoPage>
  )
}

/**
 * Keep an incomplete document out of search results.
 *
 * Scoped to the document, like the banner: a page whose every reference
 * resolves is publishable, whatever other operator details remain unsupplied.
 */
export function legalRobots(document: LegalDocument, details: OperatorDetails = OPERATOR) {
  const missing = tokensIn(document).filter((k) => !details[k])
  return missing.length > 0 ? { robots: { index: false, follow: false } } : {}
}
