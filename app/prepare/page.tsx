import { CalendarRange, Info, Library, Zap } from 'lucide-react'

import { Recommendation } from '@/components/dashboard/recommendation'
import { PageHeader } from '@/components/layout/page-header'
import { PageContainer } from '@/components/layout/page-shell'
import { SectionHeading } from '@/components/layout/section-heading'
import { TileCard } from '@/components/layout/tile-card'
import { getBankSize } from '@/lib/content/registry'
import { SECTION_ICON } from '@/lib/nav'
import { SECTIONS, type SectionId } from '@/lib/sections'

export const metadata = { title: 'Prepare' }

export default function PreparePage() {
  const perSection = getBankSize(SECTIONS[0].id)
  const bankSizes = Object.fromEntries(
    SECTIONS.map((s) => [s.id, getBankSize(s.id)]),
  ) as Record<SectionId, number>

  return (
    <div className="bg-[linear-gradient(180deg,rgba(2,89,100,0.12)_0px,rgba(2,89,100,0)_120px)]">
      <PageContainer className="flex flex-col gap-7 py-6">
        <PageHeader
          icon={Library}
          title="Prepare"
          description="Learn how each Core subtest works, then practise it untimed with hints and full solutions."
        />

        <Recommendation bankSizes={bankSizes} intent="practice" />

        <SectionHeading title="Module A" meta={`${perSection} questions each`}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((section) => (
              <TileCard
                key={section.id}
                href={`/module-a/${section.id}`}
                icon={SECTION_ICON[section.id]}
                title={section.title}
                description={section.oneLiner}
              />
            ))}
          </div>
        </SectionHeading>

        <SectionHeading title="Shorter sessions">
          <div className="grid gap-4 sm:grid-cols-2">
            <TileCard
              href="/practice/quick"
              icon={Zap}
              title="Quick practice"
              description="10 questions mixed across the three subtests, with hints and solutions as usual."
              meta="10 mins"
            />
            <TileCard
              href="/study-plan"
              icon={CalendarRange}
              title="Study plan"
              description="A week-by-week route from now to exam day, with milestones you can tick off."
              meta="7 weeks"
            />
          </div>
        </SectionHeading>

        <SectionHeading title="Module B">
          <TileCard
            icon={Info}
            tone="muted"
            title="Coming soon"
            description="The General Academic Module runs 90 minutes with four options per question. dMAT Prep does not cover it yet."
          />
        </SectionHeading>
      </PageContainer>
    </div>
  )
}
