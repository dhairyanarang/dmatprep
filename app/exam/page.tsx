import { BookOpenCheck } from 'lucide-react'

import { StartHere } from '@/components/exam/start-here'
import { ExamDetailCards } from '@/components/exam/exam-detail-cards'
import { PageContainer } from '@/components/layout/page-shell'
import { PageHeader } from '@/components/layout/page-header'
import { SOURCES } from '@/content/exam/sources'

export const metadata = { title: 'About the Exam' }

export default function ExamPage() {
  return (
    // The wash is full-bleed across the content area, so it sits outside the
    // container the way the design has it. Fixed 120px rather than the design's
    // 14% — a percentage would stretch the gradient down a long page, and this
    // page is far taller than the frame it was drawn in.
    <div className="bg-[linear-gradient(180deg,rgba(2,89,100,0.12)_0px,rgba(2,89,100,0)_120px)]">
      <PageContainer className="flex flex-col gap-7 py-6">
        <PageHeader
          icon={BookOpenCheck}
          title="About the dMAT"
          description="Understand everything about this exam"
        />

        <section className="flex flex-col gap-2.5">
          <h2 className="text-sm font-medium">Start here</h2>
          <StartHere />
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className="text-sm font-medium">In detail</h2>
          <ExamDetailCards />
        </section>

        <p className="text-muted-foreground text-xs leading-relaxed">
          Everything here traces to g.a.s.t. or APS India — no third-party guides. Checked against
          the {SOURCES['gam-pdf'].asAt} preparatory materials.
        </p>
      </PageContainer>
    </div>
  )
}
