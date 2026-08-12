import { KeyDates } from '@/components/dashboard/key-dates'
import { HubSection } from '@/components/layout/hub'
import { PageShell } from '@/components/layout/page-shell'
import { PlanView } from '@/components/study-plan/plan-view'

export const metadata = { title: 'Study plan' }

export default function StudyPlanPage() {
  return (
    <PageShell
      title="Study plan"
      description="Seven weeks to Saturday 26 September 2026. Optional — the home page recommends a next step whether you follow this or not."
    >
      <div className="space-y-10">
        <PlanView />

        {/* Moved off the home page: dates you add yourself are planning, and
            planning belongs next to the plan. */}
        <HubSection title="Your own dates">
          <KeyDates />
        </HubSection>
      </div>
    </PageShell>
  )
}
