import { FileText, Timer } from 'lucide-react'

import { GamPilotNotice } from '@/components/gam/pilot-notice'
import { Panel, PageShell } from '@/components/layout/page-shell'
import { TileCard } from '@/components/layout/tile-card'
import { GAM_TOTAL_MINUTES, getPacks, totalGamQuestions } from '@/lib/gam/registry'
import { canonical } from '@/lib/seo'

export const metadata = {
  title: 'Module B — General Academic',
  description:
    'Pilot practice for the dMAT General Academic Module: original source packs with passages, tables and charts, and questions that depend on reading them.',
  alternates: { canonical: canonical('/module-b') },
}
export default function ModuleBPage() {
  const packs = getPacks()

  return (
    <PageShell
      title="Module B — General Academic"
      description="A source text with figures, tables or formulas, and a set of questions answered against it. Ninety minutes in the exam, four options per question, exactly one correct."
      wide
    >
      <GamPilotNotice />

      <Panel
        title="Source packs"
        meta={`${packs.length} packs · ${totalGamQuestions()} questions`}
        bodyClassName="p-1"
      >
        <div className="grid gap-1 sm:grid-cols-2">
          {packs.map(({ pack, questions }) => (
            <TileCard
              key={pack.id}
              href={`/module-b/practice/${pack.id}`}
              icon={FileText}
              title={pack.title}
              description={`${pack.domain.replace(/-/g, ' ')} — ${pack.blocks.length} source blocks, answered by ${questions.length} linked questions.`}
              meta={`${questions.length} questions`}
              className="border-0 shadow-none"
            />
          ))}
        </div>
      </Panel>

      <Panel title="Timed" bodyClassName="p-1">
        <TileCard
          href="/module-b/timed"
          icon={Timer}
          title="Timed session — every pack"
          description={`All ${getPacks().length} packs end to end under the module's official 90-minute clock, with answers held until you submit. It is ${totalGamQuestions()} questions; g.a.s.t. says the real module holds roughly 60, so this is a timed run at the real pace, not a full-length paper.`}
          meta={`${GAM_TOTAL_MINUTES} mins`}
          className="border-0 shadow-none"
        />
      </Panel>
    </PageShell>
  )
}
