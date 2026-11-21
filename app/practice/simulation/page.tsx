import { PageShell } from '@/components/layout/page-shell'
import { TimedLauncher } from '@/components/practice/timed-launcher'
import { getPublicQuestions } from '@/lib/content/registry'
import { SECTIONS } from '@/lib/sections'

export const metadata = { title: 'Module A mock' }

const UNIT: Record<string, string> = {
  'figure-sequences': 'series',
  'mathematical-equations': 'systems',
  'latin-squares': 'tasks',
}

export default function SimulationPage() {
  return (
    <PageShell wide>
      {/* The exam runners are a takeover with their own chrome, so there is no
            visible page title to carry the h1. Every page needs one all the
            same: without it a screen reader lands here with nothing above the
            sidebar's section headings. */}
      <h1 className="sr-only">Open simulation</h1>
      <TimedLauncher
        mode="simulation"
        title="Open simulation"
        note="The three Core subtests back to back, in the order the preparatory materials present them. Planned fresh every time from what you have not seen — so it is never twice the same test, and two runs cannot be compared the way two sittings of a fixed mock can."
        minutesPerStage={25}
        stages={SECTIONS.map((section) => ({
          sectionId: section.id,
          label: section.title,
          unitNoun: UNIT[section.id],
          pool: getPublicQuestions(section.id),
          count: 20,
        }))}
      />
    </PageShell>
  )
}
