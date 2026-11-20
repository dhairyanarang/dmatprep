import { Shuffle, Timer } from 'lucide-react'

import { Panel, PageShell } from '@/components/layout/page-shell'
import { TileCard } from '@/components/layout/tile-card'
import { MockTiles } from '@/components/test/mock-tiles'
import { PastAttempts } from '@/components/test/past-attempts'
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
  const totalQuestions = Object.values(bankSizes).reduce((a, b) => a + b, 0)

  // Ids travel to the client so a past sitting can be recognised. They are the
  // public half only — the question records themselves are not sent, and the
  // answers are not in the bundle at all.
  const mocks = getCoreMocks().map((m) => ({
    id: m.id,
    label: m.label,
    number: m.number,
    size: mockSize(m),
    questionIds: SECTION_IDS.flatMap((s) => m.sections[s] ?? []),
    shape: SECTION_IDS.map((s) => ({
      label: s,
      count: m.sections[s]?.length ?? 0,
    })),
  }))

  // The lookup that lets a stored session name itself. Sorted ids, because a
  // session records them in the order they were taken.
  const mockLabels = Object.fromEntries(
    mocks.map((m) => [[...m.questionIds].sort().join(','), m.label]),
  )

  return (
    <PageShell
      title="Test"
      description="Exam rules apply: one clock per part, no hints, and no answers until you submit."
      wide
    >
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Core mock exams</h2>
          <span className="text-muted-foreground text-xs">
            Each a fixed set in a fixed order, sharing no question with the others
          </span>
        </div>
        <MockTiles mocks={mocks} />
      </section>

      <Panel title={`Timed sets · 20 tasks in 25 min`} meta={`${totalQuestions} questions in the bank`}>
        {SECTIONS.map((section) => {
          const Icon = SECTION_ICON[section.id]
          return (
            <a key={section.id} href={`/practice/timed/${section.id}`} className="listrow px-4">
              <span
                aria-hidden
                className="bg-brand-50 text-brand grid size-9 shrink-0 place-items-center rounded-lg"
              >
                <Icon className="size-[18px]" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <b className="text-sm font-semibold">{section.title}</b>
                <span className="text-muted-foreground text-xs">
                  {UNIT[section.id]}, chosen fresh each time from what you have not seen
                </span>
              </span>
              <span className="bg-brand text-brand-foreground flex h-[30px] shrink-0 items-center rounded-[7px] px-2.5 text-[13px] font-medium">
                Start
              </span>
            </a>
          )
        })}

        <a href="/practice/simulation" className="listrow px-4">
          <span
            aria-hidden
            className="bg-brand-50 text-brand grid size-9 shrink-0 place-items-center rounded-lg"
          >
            <Shuffle className="size-[18px]" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <b className="text-sm font-semibold">Open simulation</b>
            <span className="text-muted-foreground text-xs">
              All three subtests back to back, planned fresh every run — never twice the same
              test, so two runs cannot be compared the way two sittings of a fixed mock can
            </span>
          </span>
          <span className="border-border bg-card flex h-[30px] shrink-0 items-center rounded-[7px] border px-2.5 text-[13px] font-medium">
            Start
          </span>
        </a>
      </Panel>

      <PastAttempts mockLabels={mockLabels} />

      <Panel title="Module B · General Academic">
        <TileCard
          href="/module-b/timed"
          icon={Timer}
          title="General Academic Module"
          description={`Every source pack end to end under the module's official 90-minute clock, with answers held until you submit. ${totalGamQuestions()} questions against the roughly 60 g.a.s.t. says the real module holds — a timed run, not a full-length paper. Pilot material, not yet reviewed by a person.`}
          meta={`${GAM_TOTAL_MINUTES} mins`}
          className="border-0 shadow-none"
        />
      </Panel>

      <p className="text-muted-foreground text-xs leading-relaxed">
        These are dMAT Prep practice simulations, not official dMAT papers, and interface
        behaviour may differ from the real test platform. 75 seconds per question is 25 minutes
        divided by 20 — a pacing guide, not a published limit.
      </p>
    </PageShell>
  )
}
