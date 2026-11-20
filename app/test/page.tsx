import { Shuffle, TestTubeDiagonal, Timer } from 'lucide-react'

import { Recommendation } from '@/components/dashboard/recommendation'
import { PageHeader } from '@/components/layout/page-header'
import { PageContainer } from '@/components/layout/page-shell'
import { SectionHeading } from '@/components/layout/section-heading'
import { TileCard } from '@/components/layout/tile-card'
import { MockTiles } from '@/components/test/mock-tiles'
import { getBankSize } from '@/lib/content/registry'
import { getCoreMocks, mockSize } from '@/lib/content/mocks'
import { SECTION_ICON } from '@/lib/nav'
import { GAM_TOTAL_MINUTES, totalGamQuestions } from '@/lib/gam/registry'
import { SECTIONS, SECTION_IDS, type SectionId } from '@/lib/sections'

export const metadata = { title: 'Test' }

/** The noun each subtest's own official instructions use for its 20 items. */
const UNIT: Record<SectionId, string> = {
  'figure-sequences': '20 series of matrices',
  'mathematical-equations': '20 systems of equations',
  'latin-squares': '20 tasks',
}

export default function TestPage() {
  const bankSizes = Object.fromEntries(
    SECTIONS.map((s) => [s.id, getBankSize(s.id)]),
  ) as Record<SectionId, number>
  // Sections no longer necessarily hold the same number of questions — retiring
  // an item changes one section's count — so report the total rather than
  // claiming "N each" off the first section.
  const totalQuestions = Object.values(bankSizes).reduce((a, b) => a + b, 0)

  // Ids travel to the client so a past sitting can be recognised. They are the
  // public half only — the question records themselves are not sent, and the
  // answers are not in the bundle at all.
  const mockQuestions = getCoreMocks()[0] ? mockSize(getCoreMocks()[0]) : 0
  const mocks = getCoreMocks().map((m) => ({
    id: m.id,
    label: m.label,
    number: m.number,
    size: mockSize(m),
    questionIds: SECTION_IDS.flatMap((s) => m.sections[s] ?? []),
  }))

  return (
    <div className="page-wash">
      <PageContainer className="stagger-enter flex flex-col gap-7 py-6">
        <PageHeader icon={TestTubeDiagonal} title="Test" description="Practice under the clock." />

        <Recommendation bankSizes={bankSizes} intent="test" />

        <SectionHeading
          title="Core mock exams"
          meta={`${mocks.length * mockQuestions} questions`}
          note="Each one a fixed set in a fixed order, sharing no question with the others. Sit one twice and the two scores can be compared, because it is the same test."
        >
          <MockTiles mocks={mocks} />
        </SectionHeading>

        <SectionHeading title="One subtest at a time" meta={`${totalQuestions} questions`}>
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
            icon={Shuffle}
            title="Open simulation"
            description="The same three-subtest shape as a mock, but planned fresh each time from whatever you have not seen. Repeatable, and never twice the same test — so it builds stamina rather than a comparable score."
            meta="60 questions · 75 mins"
          />
        </SectionHeading>

        <SectionHeading title="Module B">
          <TileCard
            href="/module-b/timed"
            icon={Timer}
            title="General Academic Module"
            description={`Every source pack end to end under the module's official 90-minute clock, with answers held until you submit. ${totalGamQuestions()} questions against the roughly 60 g.a.s.t. says the real module holds — a timed run, not a full-length paper. Pilot material, not yet reviewed by a person.`}
            meta={`${GAM_TOTAL_MINUTES} mins`}
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
