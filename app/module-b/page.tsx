import { FileText, FlaskConical, Timer } from 'lucide-react'

import { GamPilotNotice } from '@/components/gam/pilot-notice'
import { PageHeader } from '@/components/layout/page-header'
import { PageContainer } from '@/components/layout/page-shell'
import { SectionHeading } from '@/components/layout/section-heading'
import { TileCard } from '@/components/layout/tile-card'
import { GAM_TOTAL_MINUTES, getPacks, totalGamQuestions } from '@/lib/gam/registry'

export const metadata = { title: 'Module B — General Academic' }

export default function ModuleBPage() {
  const packs = getPacks()

  return (
    <div className="bg-[linear-gradient(180deg,rgba(2,89,100,0.12)_0px,rgba(2,89,100,0)_120px)]">
      <PageContainer className="stagger-enter flex flex-col gap-7 py-6">
        <PageHeader
          icon={FlaskConical}
          title="Module B — General Academic"
          description="A source text with figures, tables or formulas, and a set of questions answered against it. Ninety minutes in the exam, four options per question, exactly one correct."
        />

        <GamPilotNotice />

        <SectionHeading
          title="Source packs"
          meta={`${packs.length} packs · ${totalGamQuestions()} questions`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {packs.map(({ pack, questions }) => (
              <TileCard
                key={pack.id}
                href={`/module-b/practice/${pack.id}`}
                icon={FileText}
                title={pack.title}
                description={`${pack.domain.replace(/-/g, ' ')} — ${pack.blocks.length} source blocks, answered by ${questions.length} linked questions.`}
                meta={`${questions.length} questions`}
              />
            ))}
          </div>
        </SectionHeading>

        <SectionHeading title="Timed">
          <TileCard
            href="/module-b/timed"
            icon={Timer}
            title="Timed session — every pack"
            description="All five packs end to end under the module's official 90-minute clock, with answers held until you submit. It is 17 questions; g.a.s.t. says the real module holds roughly 60, so this is a timed run at the real pace, not a full-length paper."
            meta={`${GAM_TOTAL_MINUTES} mins`}
          />
        </SectionHeading>
      </PageContainer>
    </div>
  )
}
