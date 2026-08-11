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
    <PageShell
      title="Dashboard"
      description="Time remaining, where your practice stands, and a way into each section."
      wide
    >
      <div className="space-y-10">
        <section className="grid gap-4 sm:grid-cols-2">
          {FIXED_DATES.map((entry) => (
            <CountdownCard
              key={entry.id}
              label={entry.label}
              date={entry.date}
              description={entry.description}
            />
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Practice</h2>
            <Link
              href="/module-a"
              className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
            >
              All of Module A
            </Link>
          </div>
          <ProgressSnapshot bankSizes={bankSizes} />
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Dates</h2>
            <Link
              href="/study-plan"
              className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
            >
              Study plan
            </Link>
          </div>
          <KeyDates />
        </section>
      </div>
    </PageShell>
  )
}
