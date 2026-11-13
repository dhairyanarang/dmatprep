import { LayoutDashboard } from 'lucide-react'

import { NextStep } from '@/components/dashboard/next-step'
import { ProgressSnapshot } from '@/components/dashboard/progress-snapshot'
import { ExamLinks } from '@/components/exam/exam-links'
import { PageHeader } from '@/components/layout/page-header'
import { PageContainer } from '@/components/layout/page-shell'
import { CycleCountdowns } from '@/components/dashboard/cycle-countdowns'
import { getBankSize } from '@/lib/content/registry'
import { SECTIONS, type SectionId } from '@/lib/sections'

/**
 * Home, in the design's order: the two dates, the single recommended action,
 * progress, then the exam reference. Nothing else — no streaks, no charts, no
 * activity feed.
 */
export default function HomePage() {
  const bankSizes = Object.fromEntries(
    SECTIONS.map((s) => [s.id, getBankSize(s.id)]),
  ) as Record<SectionId, number>

  return (
    <div className="bg-[linear-gradient(180deg,rgba(2,89,100,0.12)_0px,rgba(2,89,100,0)_120px)]">
      <PageContainer className="stagger-enter flex flex-col gap-6 py-6">
        <PageHeader
          icon={LayoutDashboard}
          title="Home"
          description="View your performance at a glance"
        />

        <CycleCountdowns />

        <NextStep bankSizes={bankSizes} />

        <section className="flex flex-col gap-2.5">
          <h2 className="text-sm font-medium">Your Progress</h2>
          <ProgressSnapshot bankSizes={bankSizes} />
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className="text-sm font-medium">Know about the Exam</h2>
          <ExamLinks />
        </section>
      </PageContainer>
    </div>
  )
}
