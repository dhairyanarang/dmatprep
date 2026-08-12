import { PageShell } from '@/components/layout/page-shell'
import { QuickLauncher } from '@/components/practice/quick-launcher'
import { getQuestions } from '@/lib/content/registry'
import { SECTION_IDS, type SectionId } from '@/lib/sections'
import type { Question } from '@/lib/types/question'

export const metadata = { title: 'Quick practice' }

export default function QuickPracticePage() {
  const pools = Object.fromEntries(
    SECTION_IDS.map((id) => [id, getQuestions(id)]),
  ) as Record<SectionId, Question[]>

  return (
    <PageShell
      title="Quick practice"
      description="Ten questions mixed across the three Core subtests — about ten minutes. Hints and full solutions are available, as in normal practice."
      wide
    >
      <QuickLauncher pools={pools} />
    </PageShell>
  )
}
