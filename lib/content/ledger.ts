import { EXAM_CLAIMS } from '@/content/exam/claims'
import type { SourceId } from '@/content/exam/sources'
import { getGuide } from '@/lib/content/registry'
import { SECTIONS } from '@/lib/sections'
import type { Claim, Confidence, ContentBlock } from '@/lib/types/content'

export type LedgerEntry = {
  text: string
  page?: number
  confidence?: Confidence
  note?: string
  /** Where the claim appears, so a reader can go and check it in context. */
  where: string
  href: string
}

/**
 * The ledger is derived, never hand-maintained.
 *
 * Section overviews are block lists, so their claims are extracted by walking
 * the blocks. The exam reference pages are bespoke visual layouts, so their
 * claims live in `content/exam/claims.ts` — see the note there.
 */
function claimsFromBlocks(blocks: ContentBlock[]): Claim[] {
  const out: Claim[] = []

  for (const block of blocks) {
    switch (block.type) {
      case 'prose':
        out.push(block)
        break
      case 'quote':
        out.push({ text: block.text, sources: block.sources })
        break
      case 'rules':
        out.push(...block.items)
        break
      default:
        break
    }
  }

  return out
}

type Page = { where: string; href: string; claims: Claim[] }

function pages(): Page[] {
  return [
    ...EXAM_CLAIMS,
    ...SECTIONS.map((section) => ({
      where: `${section.title} — Overview`,
      href: `/module-a/${section.id}/overview`,
      claims: claimsFromBlocks(getGuide(section.id).blocks),
    })),
  ]
}

export function buildLedger() {
  const bySource = new Map<SourceId, LedgerEntry[]>()
  const flagged: LedgerEntry[] = []
  let totalClaims = 0

  for (const page of pages()) {
    for (const claim of page.claims) {
      if (!claim.sources?.length && !claim.confidence) continue
      totalClaims++

      const entry: LedgerEntry = {
        text: claim.text,
        confidence: claim.confidence,
        note: claim.note,
        where: page.where,
        href: page.href,
      }

      for (const ref of claim.sources ?? []) {
        const list = bySource.get(ref.id) ?? []
        list.push({ ...entry, page: ref.page })
        bySource.set(ref.id, list)
      }

      if (claim.confidence && claim.confidence !== 'official') flagged.push(entry)
    }
  }

  return { bySource, flagged, totalClaims }
}
