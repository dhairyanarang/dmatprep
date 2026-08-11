import { PageShell } from '@/components/layout/page-shell'
import { PlanView } from '@/components/study-plan/plan-view'

export const metadata = { title: 'Study Plan' }

export default function StudyPlanPage() {
  return (
    <PageShell
      title="Study Plan"
      description="Seven weeks to Saturday 26 September 2026. Learn all three formats first, then one section a week, then speed, then taper."
    >
      <PlanView />
    </PageShell>
  )
}
