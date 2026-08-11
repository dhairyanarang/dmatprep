import { ComingSoon, PageShell } from '@/components/layout/page-shell'

export const metadata = { title: 'Study Plan' }

export default function StudyPlanPage() {
  return (
    <PageShell
      title="Study Plan"
      description="A week-by-week roadmap to 26 September 2026, with checkable milestones."
    >
      <ComingSoon note="The study plan lands in phase 8." />
    </PageShell>
  )
}
