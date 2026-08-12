import Link from 'next/link'

import { CountdownCard } from '@/components/dashboard/countdown-card'
import { KeyDates } from '@/components/dashboard/key-dates'
import { ProgressSnapshot } from '@/components/dashboard/progress-snapshot'
import { PageShell } from '@/components/layout/page-shell'
import { FIXED_DATES } from '@/content/exam/key-dates'
import { getBankSize } from '@/lib/content/registry'
import { SECTIONS, type SectionId } from '@/lib/sections'

export default function DashboardPage() {
  const bankSizes = Object.fromEntries(
    SECTIONS.map((s) => [s.id, getBankSize(s.id)]),
  ) as Record<SectionId, number>

  return (
    <PageShell title="Dashboard" wide>
      <div className="space-y-8">
        <section className="grid gap-4 sm:grid-cols-2">
          {FIXED_DATES.map((entry) => (
            <CountdownCard
              key={entry.id}
              label={entry.label}
              date={entry.date}
              kind={entry.id === 'exam-date' ? 'exam' : 'deadline'}
            />
          ))}
        </section>

        <section className="space-y-4">
          <SectionHeading title="Practice" />
          <ProgressSnapshot bankSizes={bankSizes} />
        </section>

        <section className="space-y-4">
          <SectionHeading title="Dates" href="/study-plan" linkLabel="Study plan" />
          <KeyDates />
        </section>
      </div>
    </PageShell>
  )
}

function SectionHeading({
  title,
  href,
  linkLabel,
}: {
  title: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {href && linkLabel ? (
        <Link
          href={href}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  )
}
