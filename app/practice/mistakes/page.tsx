import { MistakesRunner } from '@/components/practice/mistakes-runner'
import { PageShell } from '@/components/layout/page-shell'
import { getPublicQuestions } from '@/lib/content/registry'
import { SECTION_IDS, type SectionId } from '@/lib/sections'
import type { PublicQuestion } from '@/lib/content/registry'

export const metadata = { title: 'Your mistakes' }

/**
 * Static, like every route. Which questions are mistakes is a fact about this
 * browser's history, so the filtering happens on the client; the page only
 * supplies the pools to filter.
 */
export default function MistakesPage() {
  const pools = Object.fromEntries(
    SECTION_IDS.map((id) => [id, getPublicQuestions(id)]),
  ) as Record<SectionId, PublicQuestion[]>

  return (
    <PageShell
      title="Your mistakes"
      description="Every question you answered wrong and have not since answered right, newest first. Get one right and it leaves the list."
      wide
    >
      <MistakesRunner pools={pools} />
    </PageShell>
  )
}
