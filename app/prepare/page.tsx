import { HubCard, HubSection } from '@/components/layout/hub'
import { PageShell } from '@/components/layout/page-shell'
import { getBankSize } from '@/lib/content/registry'
import { SECTION_ICON } from '@/lib/nav'
import { SECTIONS } from '@/lib/sections'

export const metadata = { title: 'Prepare' }

export default function PreparePage() {
  return (
    <PageShell
      description="Learn how each Core subtest works, then practise it untimed with hints and full solutions."
      wide
    >
      <div className="space-y-10">
        <HubSection title="Module A — the Core Module">
          <div className="grid gap-4 sm:grid-cols-3">
            {SECTIONS.map((section) => {
              const Icon = SECTION_ICON[section.id]
              return (
              <HubCard
                key={section.id}
                href={`/module-a/${section.id}`}
                title={section.title}
                description={section.oneLiner}
                meta={`${getBankSize(section.id)} questions`}
                action="Learn & practise"
                marker={<Icon className="text-brand size-5 shrink-0" aria-hidden />}
              />
              )
            })}
          </div>
        </HubSection>

        <HubSection title="Shorter sessions">
          <div className="grid gap-4 sm:grid-cols-2">
            <HubCard
              href="/practice/quick"
              title="Quick practice"
              description="Ten questions mixed across the three subtests, with hints and solutions as usual."
              meta="~10 min"
              action="Start"
            />
            <HubCard
              href="/study-plan"
              title="Study plan"
              description="A week-by-week route from now to exam day, with milestones you can tick off."
              action="Open the plan"
            />
          </div>
        </HubSection>

        <HubSection title="Module B — the Subject Module">
          <div className="border-border text-muted-foreground rounded-2xl border border-dashed p-5 text-sm leading-relaxed">
            The General Academic Module runs 90 minutes with four options per question. dMAT Prep
            does not cover it yet.
          </div>
        </HubSection>
      </div>
    </PageShell>
  )
}
