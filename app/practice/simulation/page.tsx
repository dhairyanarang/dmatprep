import { PageShell } from '@/components/layout/page-shell'
import { TimedLauncher } from '@/components/practice/timed-launcher'
import { getQuestions } from '@/lib/content/registry'
import { SECTIONS } from '@/lib/sections'

export const metadata = { title: 'Module A mock' }

const UNIT: Record<string, string> = {
  'figure-sequences': 'series',
  'mathematical-equations': 'systems',
  'latin-squares': 'tasks',
}

export default function SimulationPage() {
  return (
    <PageShell
      title="Module A mock"
      description="The three Core subtests back to back, 25 minutes each, in the order the preparatory materials present them."
    >
      <TimedLauncher
        mode="simulation"
        title="Module A practice simulation"
        minutesPerStage={25}
        stages={SECTIONS.map((section) => ({
          sectionId: section.id,
          label: section.title,
          unitNoun: UNIT[section.id],
          pool: getQuestions(section.id),
          count: 20,
        }))}
      />
    </PageShell>
  )
}
