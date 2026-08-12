import { ProgressPanel } from '@/components/dashboard/progress-panel'
import { HubSection } from '@/components/layout/hub'
import { PageShell } from '@/components/layout/page-shell'
import { ReviewList } from '@/components/practice/review-list'
import { getBankSize, getQuestions } from '@/lib/content/registry'
import { SECTIONS, type SectionId } from '@/lib/sections'

export const metadata = { title: 'Review' }

export default function ReviewPage() {
  const questions = SECTIONS.flatMap((section) => getQuestions(section.id))
  const bankSizes = Object.fromEntries(
    SECTIONS.map((s) => [s.id, getBankSize(s.id)]),
  ) as Record<SectionId, number>

  return (
    <PageShell
      title="Review"
      description="Where your preparation stands, and the questions worth a second look."
      wide
    >
      <div className="space-y-10">
        <HubSection title="Progress">
          <ProgressPanel bankSizes={bankSizes} />
        </HubSection>

        <HubSection
          title="Mistakes"
          description="Questions you answered wrong, or answered right only after a hint."
        >
          <ReviewList questions={questions} />
        </HubSection>
      </div>
    </PageShell>
  )
}
