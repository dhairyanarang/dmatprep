import { LatestUpdate } from '@/components/exam/latest-update'
import { StartHere } from '@/components/exam/start-here'
import { ExamDetailCards } from '@/components/exam/exam-detail-cards'
import { SubPage } from '@/components/layout/sub-nav'
import { SOURCES } from '@/content/exam/sources'

export const metadata = { title: 'About the Exam' }

export default function ExamPage() {
  return (
    <SubPage
      title="About the dMAT"
      description="Everything here traces to g.a.s.t. or APS India. Pick a section on the left, or start with the questions below."
    >
      <LatestUpdate />

      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-semibold">Start here</h2>
        <StartHere />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-semibold">In detail</h2>
        <ExamDetailCards />
      </section>

      <p className="text-muted-foreground text-xs leading-relaxed">
        No third-party guides are used anywhere. Checked against the {SOURCES['gam-pdf'].asAt}{' '}
        preparatory materials.
      </p>
    </SubPage>
  )
}
