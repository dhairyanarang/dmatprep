import { ChartArea } from 'lucide-react'

import { SaveProgressInvite } from '@/components/auth/save-progress-invite'
import { ProgressPanel } from '@/components/dashboard/progress-panel'
import { PageHeader } from '@/components/layout/page-header'
import { PageContainer } from '@/components/layout/page-shell'
import { SectionHeading } from '@/components/layout/section-heading'
import { MistakeCount, ReviewList } from '@/components/practice/review-list'
import { getBankSize, getQuestions } from '@/lib/content/registry'
import { SECTIONS, type SectionId } from '@/lib/sections'

export const metadata = { title: 'Review' }

export default function ReviewPage() {
  const questions = SECTIONS.flatMap((section) => getQuestions(section.id))
  const bankSizes = Object.fromEntries(
    SECTIONS.map((s) => [s.id, getBankSize(s.id)]),
  ) as Record<SectionId, number>

  return (
    <div className="bg-[linear-gradient(180deg,rgba(2,89,100,0.12)_0px,rgba(2,89,100,0)_120px)]">
      <PageContainer className="flex flex-col gap-7 py-6">
        <PageHeader icon={ChartArea} title="Review" description="Your progress at a glance" />

        <SectionHeading title="Start here">
          <ProgressPanel bankSizes={bankSizes} />
        </SectionHeading>

        {/* The one place a guest sees the offer outside a result screen, and only
            once there is a history here substantial enough to be worth losing. */}
        <SaveProgressInvite moment="history" />

        <SectionHeading title="Mistakes" note={<MistakeCount questions={questions} />}>
          <ReviewList questions={questions} />
        </SectionHeading>
      </PageContainer>
    </div>
  )
}
