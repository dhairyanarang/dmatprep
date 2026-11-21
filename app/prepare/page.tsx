import { FlaskConical, Zap } from 'lucide-react'

import { Panel, PageShell } from '@/components/layout/page-shell'
import { SubtestCard } from '@/components/prepare/subtest-card'
import { TileCard } from '@/components/layout/tile-card'
import { getBankSize } from '@/lib/content/registry'
import { getPacks, totalGamQuestions } from '@/lib/gam/registry'
import { SECTIONS, type SectionId } from '@/lib/sections'

export const metadata = { title: 'Prepare' }

/**
 * Prepare, in the design's composition: one framed card per Core subtest, two
 * to a row, each carrying its own coverage and its own access line.
 *
 * Module B keeps a card of its own and stays plainly marked as pilot material.
 * It is deliberately NOT presented as part of the paid offering: nothing in it
 * has been through human review, so it is not something to sell.
 */
export default function PreparePage() {
  const bankSizes = Object.fromEntries(
    SECTIONS.map((s) => [s.id, getBankSize(s.id)]),
  ) as Record<SectionId, number>
  const totalQuestions = Object.values(bankSizes).reduce((a, b) => a + b, 0)
  const gamPacks = getPacks().length
  const gamQuestions = totalGamQuestions()

  return (
    <PageShell
      title="Prepare"
      description="Learn how each Core subtest works, then practise it untimed with hints and full solutions."
      wide
    >
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(330px,100%),1fr))]">
        {SECTIONS.map((section, i) => (
          <SubtestCard
            key={section.id}
            sectionId={section.id}
            title={section.title}
            oneLiner={section.oneLiner}
            bankSize={bankSizes[section.id]}
            index={i}
          />
        ))}
      </div>

      <Panel title="Shorter sessions" meta={`${totalQuestions} questions in the bank`} bodyClassName="p-1">
        <div className="grid gap-1 sm:grid-cols-2">
          <TileCard
            href="/practice/quick"
            icon={Zap}
            title="Quick practice"
            description="10 questions mixed across the three subtests, with hints and solutions as usual."
            meta="10 mins"
            className="border-0 shadow-none"
          />
        </div>
      </Panel>

      <Panel title="Module B · General Academic" meta={`${gamPacks} packs · ${gamQuestions} questions`}>
        <TileCard
          href="/module-b"
          icon={FlaskConical}
          title="General Academic Module"
          description="Source packs — a text with figures, tables or formulas — and the questions answered against them. Pilot material, not yet reviewed by a person, and not part of the paid offering."
          meta="90 mins in the exam"
          className="border-0 shadow-none"
        />
      </Panel>
    </PageShell>
  )
}
