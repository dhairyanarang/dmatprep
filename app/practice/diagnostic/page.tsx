import { PageShell } from '@/components/layout/page-shell'
import { TimedLauncher } from '@/components/practice/timed-launcher'
import { getQuestions } from '@/lib/content/registry'
import { SECTIONS } from '@/lib/sections'

export const metadata = { title: 'Diagnostic' }

const UNIT: Record<string, string> = {
  'figure-sequences': 'series',
  'mathematical-equations': 'systems',
  'latin-squares': 'tasks',
}

export default function DiagnosticPage() {
  return (
    <PageShell
      description="Fifteen questions — five from each Core subtest — to find where to start. No clock, no hints."
    >
      <TimedLauncher
        mode="diagnostic"
        title="dMAT Prep diagnostic"
        minutesPerStage={0}
        untimed
        stages={SECTIONS.map((section) => ({
          sectionId: section.id,
          label: section.title,
          unitNoun: UNIT[section.id],
          pool: getQuestions(section.id),
          count: 5,
        }))}
      />
    </PageShell>
  )
}
