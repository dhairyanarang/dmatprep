import { LatestUpdate } from '@/components/exam/latest-update'
import { StartHere } from '@/components/exam/start-here'
import { SubPage } from '@/components/layout/sub-nav'
import { SOURCES } from '@/content/exam/sources'
import { canonical } from '@/lib/seo'

export const metadata = {
  title: 'About the Exam',
  description:
    'What the Digital Master Assessment Test is, who sits it in Germany, how it is structured and scored — summarised from the official sources, with each one named.',
  alternates: { canonical: canonical('/exam') },
}
export default function ExamPage() {
  return (
    <SubPage
      title="About the dMAT"
      description="Everything here traces to g.a.s.t. or APS India, and names the page it was read from. Pick a section on the left, or start with the questions below."
    >
      <LatestUpdate />

      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-semibold">Start here</h2>
        <StartHere />
      </section>

      <p className="text-muted-foreground text-xs leading-relaxed">
        No third-party guides are used anywhere. Checked against the {SOURCES['gam-pdf'].asAt}{' '}
        preparatory materials.
      </p>
    </SubPage>
  )
}
