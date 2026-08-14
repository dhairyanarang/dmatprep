import { Info, TestTubeDiagonal } from 'lucide-react'

import { Recommendation } from '@/components/dashboard/recommendation'
import { PageHeader } from '@/components/layout/page-header'
import { PageContainer } from '@/components/layout/page-shell'
import { SectionHeading } from '@/components/layout/section-heading'
import { TileCard } from '@/components/layout/tile-card'
import { getBankSize } from '@/lib/content/registry'
import { SECTION_ICON } from '@/lib/nav'
import { SECTIONS, type SectionId } from '@/lib/sections'

export const metadata = { title: 'Test' }

/** The noun each subtest's own official instructions use for its 20 items. */
const UNIT: Record<SectionId, string> = {
  'figure-sequences': '20 series of matrices',
  'mathematical-equations': '20 systems of equations',
  'latin-squares': '20 tasks',
}

export default function TestPage() {
  const perSection = getBankSize(SECTIONS[0].id)
  const bankSizes = Object.fromEntries(
    SECTIONS.map((s) => [s.id, getBankSize(s.id)]),
  ) as Record<SectionId, number>

  return (
    <div className="bg-[linear-gradient(180deg,rgba(2,89,100,0.12)_0px,rgba(2,89,100,0)_120px)]">
      <PageContainer className="stagger-enter flex flex-col gap-7 py-6">
        <PageHeader icon={TestTubeDiagonal} title="Test" description="Practice under the clock." />

        <Recommendation bankSizes={bankSizes} intent="test" />

        <SectionHeading title="Module A" meta={`${perSection} questions each`}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((section) => (
              <TileCard
                key={section.id}
                href={`/practice/timed/${section.id}`}
                icon={SECTION_ICON[section.id]}
                title={section.title}
                description={`${UNIT[section.id]} in 25 minutes`}
              />
            ))}
          </div>

          <TileCard
            className="mt-4"
            href="/practice/simulation"
            icon={Info}
            title="Full simulation mock"
            description="All three Core subtests back to back, in the order the official materials present them. 60 questions, 75 minutes."
          />
        </SectionHeading>

        <SectionHeading title="Module B">
          <TileCard
            icon={Info}
            tone="muted"
            title="Coming soon"
            description="The General Academic Module runs 90 minutes with four options per question. dMAT Prep does not cover it yet."
          />
        </SectionHeading>

        <p className="text-muted-foreground text-xs leading-relaxed">
          These are dMAT Prep practice simulations, not official dMAT papers, and interface
          behaviour may differ from the real test platform. 75 seconds per question is 25 minutes
          divided by 20 — a pacing guide, not a published limit.
        </p>
      </PageContainer>
    </div>
  )
}
