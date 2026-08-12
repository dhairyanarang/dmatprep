import { HubCard, HubSection } from '@/components/layout/hub'
import { PageShell } from '@/components/layout/page-shell'
import { SECTIONS } from '@/lib/sections'

export const metadata = { title: 'Test' }

/** The noun each subtest's own official instructions use for its 20 items. */
const UNIT: Record<string, string> = {
  'figure-sequences': '20 series of matrices',
  'mathematical-equations': '20 systems of equations',
  'latin-squares': '20 tasks',
}

export default function TestPage() {
  return (
    <PageShell
      title="Test"
      description="Practice under the clock. Timings and item counts follow the official preparatory materials; the questions are ours."
      wide
    >
      <div className="space-y-10">
        <HubSection
          title="Timed practice"
          description="One subtest at a time — 25 minutes, no hints, results at the end."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {SECTIONS.map((section) => (
              <HubCard
                key={section.id}
                href={`/practice/timed/${section.id}`}
                title={section.title}
                description={`${UNIT[section.id]} in 25 minutes.`}
                meta="25 min"
                action="Start"
              />
            ))}
          </div>
        </HubSection>

        <HubSection title="Full simulation">
          <HubCard
            href="/practice/simulation"
            title="Module A mock"
            description="All three Core subtests back to back, in the order the official materials present them. 60 questions, 75 minutes."
            meta="75 min"
            action="Start the mock"
          />
        </HubSection>

        <p className="text-muted-foreground text-xs leading-relaxed">
          These are dMAT Prep practice simulations, not official dMAT papers, and interface
          behaviour may differ from the real test platform. 75 seconds per question is 25 minutes
          divided by 20 — a pacing guide, not a published limit.
        </p>
      </div>
    </PageShell>
  )
}
