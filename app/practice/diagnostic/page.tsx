import { PageShell } from '@/components/layout/page-shell'
import { TimedLauncher } from '@/components/practice/timed-launcher'
import { getPublicQuestions } from '@/lib/content/registry'
import { SECTIONS } from '@/lib/sections'

export const metadata = { title: 'Diagnostic' }

const UNIT: Record<string, string> = {
  'figure-sequences': 'series',
  'mathematical-equations': 'systems',
  'latin-squares': 'tasks',
}

export default function DiagnosticPage() {
  return (
    <PageShell wide>
      {/* Same reason as the other runners: a takeover with its own chrome
            and no visible page title, which still needs an h1. */}
      <h1 className="sr-only">dMAT Prep diagnostic</h1>
      <TimedLauncher
        mode="diagnostic"
        title="dMAT Prep diagnostic"
        note="Fifteen questions — five from each Core subtest — to find where to start. No clock, no hints, and nothing here is locked in by how it goes."
        minutesPerStage={0}
        untimed
        stages={SECTIONS.map((section) => ({
          sectionId: section.id,
          label: section.title,
          unitNoun: UNIT[section.id],
          pool: getPublicQuestions(section.id),
          count: 5,
        }))}
      />
    </PageShell>
  )
}
