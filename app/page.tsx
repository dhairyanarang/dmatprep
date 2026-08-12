import Link from 'next/link'

import { ExamLine } from '@/components/dashboard/exam-line'
import { NextStep } from '@/components/dashboard/next-step'
import { ProgressSnapshot } from '@/components/dashboard/progress-snapshot'
import { PageShell } from '@/components/layout/page-shell'
import { getBankSize } from '@/lib/content/registry'
import { SECTIONS, type SectionId } from '@/lib/sections'

/**
 * Home answers one question — what should I do now — and then gets out of the
 * way. Everything else it used to carry (key dates, readiness, the full metric
 * set) moved to the page where it is actually being looked for.
 */
export default function HomePage() {
  const bankSizes = Object.fromEntries(
    SECTIONS.map((s) => [s.id, getBankSize(s.id)]),
  ) as Record<SectionId, number>

  return (
    <PageShell title="dMAT Prep" description={<ExamLine />} wide>
      <div className="space-y-8">
        <NextStep bankSizes={bankSizes} />

        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-base font-semibold tracking-tight">Your progress</h2>
            <Link
              href="/review"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Review and breakdown
            </Link>
          </div>
          <ProgressSnapshot bankSizes={bankSizes} />
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Or something shorter</h2>
          <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/practice/quick" className="hover:text-foreground transition-colors">
              Quick practice · 10 questions
            </Link>
            <Link href="/test" className="hover:text-foreground transition-colors">
              Timed practice · 25 min
            </Link>
            <Link href="/review" className="hover:text-foreground transition-colors">
              Review mistakes
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
