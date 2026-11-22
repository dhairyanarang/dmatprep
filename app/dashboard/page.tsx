import { ActivityChart } from '@/components/dashboard/activity-chart'
import { DashboardHead } from '@/components/dashboard/dashboard-head'
import { DashboardKpis } from '@/components/dashboard/dashboard-kpis'
import { RecentQuestions } from '@/components/dashboard/recent-questions'
import { TodayPlan } from '@/components/dashboard/today-plan'
import { PageDisclaimer } from '@/components/layout/page-disclaimer'
import { PageContainer } from '@/components/layout/page-shell'
import { getBankSize } from '@/lib/content/registry'
import { SECTIONS, type SectionId } from '@/lib/sections'
import { NOT_A_LANDING_PAGE } from '@/lib/seo'

export const metadata = {
  title: 'Your preparation',
  description: 'Your dMAT practice progress, what to do next, and the questions you have answered most recently.',
  // A personal dashboard has nothing for a search result to offer: it is the
  // same empty frame for every visitor who is not signed in, and the figures on
  // it belong to one candidate. Keeping it out of the index also stops it
  // competing with the landing page at `/`.
  ...NOT_A_LANDING_PAGE,
}

/**
 * Home, in the design's composition: greeting and the one action, four
 * figures, then activity beside what to do next, then the log.
 *
 * Every number on it is derived from this candidate's own attempts and the
 * committed exam dates. There is no sample data anywhere, which is why a new
 * visitor sees honest zeroes and an empty state rather than a demo.
 */
export default function HomePage() {
  const bankSizes = Object.fromEntries(
    SECTIONS.map((s) => [s.id, getBankSize(s.id)]),
  ) as Record<SectionId, number>

  return (
    <PageContainer className="stagger-enter flex flex-1 flex-col gap-5 pt-6 pb-12">
      <DashboardHead bankSizes={bankSizes} />

      <DashboardKpis bankSizes={bankSizes} />

      <div className="flex flex-wrap items-stretch gap-3">
        <ActivityChart />
        <TodayPlan bankSizes={bankSizes} />
      </div>

      <RecentQuestions />

      {/* The full statement, on the page every first-time visitor lands on.
          Every other route carries the one-line version in the sidebar. */}
      <PageDisclaimer />
    </PageContainer>
  )
}
