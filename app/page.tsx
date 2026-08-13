import { CountdownCard } from '@/components/dashboard/countdown-card'
import { NextStep } from '@/components/dashboard/next-step'
import { ProgressSnapshot } from '@/components/dashboard/progress-snapshot'
import { ExamLinks } from '@/components/exam/exam-links'
import { PageContainer } from '@/components/layout/page-shell'
import { FIXED_DATES } from '@/content/exam/key-dates'
import { getBankSize } from '@/lib/content/registry'
import { SECTIONS, type SectionId } from '@/lib/sections'

/**
 * Home, in the design's order: the two dates, the single recommended action,
 * progress, then the exam reference. Nothing else — no streaks, no charts, no
 * activity feed.
 */
export default function HomePage() {
  const bankSizes = Object.fromEntries(
    SECTIONS.map((s) => [s.id, getBankSize(s.id)]),
  ) as Record<SectionId, number>

  const registration = FIXED_DATES.find((d) => d.id === 'registration-deadline')!
  const exam = FIXED_DATES.find((d) => d.id === 'exam-date')!

  return (
    <PageContainer className="flex flex-col gap-6 py-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <CountdownCard label="Registration closes" date={registration.date} unit="Days to Register" />
        <CountdownCard label="Exam day" date={exam.date} unit="Days to the Exam" />
      </div>

      <NextStep bankSizes={bankSizes} />

      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-medium">Your Progress</h2>
        <ProgressSnapshot bankSizes={bankSizes} />
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-medium">Know about the Exam</h2>
        <ExamLinks />
      </section>
    </PageContainer>
  )
}
