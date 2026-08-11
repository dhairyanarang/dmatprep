import { format } from '@/content/exam/format'
import { logistics } from '@/content/exam/logistics'
import { rules } from '@/content/exam/rules'
import { scoring } from '@/content/exam/scoring'
import type { SourceId } from '@/content/exam/sources'
import { getLearn } from '@/lib/content/registry'
import { SECTIONS } from '@/lib/sections'
import type { Confidence, ContentBlock } from '@/lib/types/content'

export type LedgerEntry = {
  text: string
  page?: number
  confidence?: Confidence
  note?: string
  /** Page the claim appears on, for "where did I read this". */
  where: string
  href: string
}

/**
 * Pull every sourced claim out of a page's blocks.
 *
 * The ledger is derived from the content itself rather than maintained by hand,
 * so it cannot drift out of date as content changes.
 */
function claimsIn(blocks: ContentBlock[], where: string, href: string) {
  const out: { sources: { id: SourceId; page?: number }[]; entry: Omit<LedgerEntry, 'page'> }[] = []

  const push = (
    text: string,
    sources: { id: SourceId; page?: number }[] | undefined,
    confidence?: Confidence,
    note?: string,
  ) => {
    if (!sources?.length && !confidence) return
    out.push({ sources: sources ?? [], entry: { text, confidence, note, where, href } })
  }

  for (const block of blocks) {
    switch (block.type) {
      case 'prose':
        push(block.text, block.sources, block.confidence, block.note)
        break
      case 'quote':
        push(block.text, block.sources)
        break
      case 'rules':
        for (const item of block.items) push(item.text, item.sources, item.confidence, item.note)
        break
      default:
        break
    }
  }

  return out
}

const PAGES: { blocks: ContentBlock[]; where: string; href: string }[] = [
  { blocks: format, where: 'Format & Structure', href: '/exam' },
  { blocks: rules, where: 'Exam-Day Rules', href: '/exam/rules' },
  { blocks: scoring, where: 'Scoring & Results', href: '/exam/scoring' },
  { blocks: logistics, where: 'Dates & Logistics', href: '/exam/logistics' },
  ...SECTIONS.map((section) => ({
    blocks: getLearn(section.id).blocks,
    where: `${section.title} — Learn`,
    href: `/module-a/${section.id}/learn`,
  })),
]

export function buildLedger() {
  const bySource = new Map<SourceId, LedgerEntry[]>()
  const flagged: LedgerEntry[] = []

  for (const page of PAGES) {
    for (const { sources, entry } of claimsIn(page.blocks, page.where, page.href)) {
      for (const ref of sources) {
        const list = bySource.get(ref.id) ?? []
        list.push({ ...entry, page: ref.page })
        bySource.set(ref.id, list)
      }
      if (entry.confidence && entry.confidence !== 'official') {
        flagged.push({ ...entry })
      }
    }
  }

  return { bySource, flagged, totalClaims: PAGES.reduce((n, p) => n + claimsIn(p.blocks, '', '').length, 0) }
}
