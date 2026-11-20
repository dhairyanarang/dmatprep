import { LayoutDashboard } from 'lucide-react'

import { NextStep } from '@/components/dashboard/next-step'
import { ProgressSnapshot } from '@/components/dashboard/progress-snapshot'
import { ExamLinks } from '@/components/exam/exam-links'
import { PageHeader } from '@/components/layout/page-header'
import { PageDisclaimer } from '@/components/layout/page-disclaimer'
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
    <div className="page-wash">
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
        {/* The full statement, on the page every first-time visitor lands on.
            Every other route carries the one-line version in the sidebar. */}
        <PageDisclaimer />
      </PageContainer>
    </div>
  )
}
