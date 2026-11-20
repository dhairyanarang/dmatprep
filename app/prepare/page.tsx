import { CalendarRange, FlaskConical, Library, Zap } from 'lucide-react'

import { Recommendation } from '@/components/dashboard/recommendation'
import { PageHeader } from '@/components/layout/page-header'
import { PageContainer } from '@/components/layout/page-shell'
import { SectionHeading } from '@/components/layout/section-heading'
import { TileCard } from '@/components/layout/tile-card'
import { getBankSize } from '@/lib/content/registry'
import { getPacks, totalGamQuestions } from '@/lib/gam/registry'
import { SECTION_ICON } from '@/lib/nav'
import { SECTIONS, type SectionId } from '@/lib/sections'

export const metadata = { title: 'Prepare' }

export default function PreparePage() {
  const bankSizes = Object.fromEntries(
    SECTIONS.map((s) => [s.id, getBankSize(s.id)]),
  ) as Record<SectionId, number>
  // Sections no longer necessarily hold the same number of questions — retiring
  // an item changes one section's count — so report the total rather than
  // claiming "N each" off the first section.
  const totalQuestions = Object.values(bankSizes).reduce((a, b) => a + b, 0)
  const gamPacks = getPacks().length
  const gamQuestions = totalGamQuestions()

  return (
    <div className="page-wash">
      <PageContainer className="stagger-enter flex flex-col gap-7 py-6">
        <PageHeader
          icon={Library}
          title="Prepare"
          description="Learn how each Core subtest works, then practise it untimed with hints and full solutions."
        />

        <Recommendation bankSizes={bankSizes} intent="practice" />

        <SectionHeading title="Module A" meta={`${totalQuestions} questions`}>
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

        <SectionHeading title="Module B" meta={`${gamPacks} packs · ${gamQuestions} questions`}>
          <TileCard
            href="/module-b"
            icon={FlaskConical}
            title="General Academic Module"
            description="Source packs — a text with figures, tables or formulas — and the questions answered against them. Pilot material, not yet reviewed by a person."
            meta="90 mins in the exam"
          />
        </SectionHeading>
      </PageContainer>
    </div>
  )
}
