import Link from 'next/link'
import { ArrowRight, Clock, Compass, Layers, Timer, Zap } from 'lucide-react'

import { PageShell } from '@/components/layout/page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { SECTIONS } from '@/lib/sections'

export const metadata = { title: 'Practice & mocks' }

const UNIT: Record<string, string> = {
  'figure-sequences': '20 series of matrices',
  'mathematical-equations': '20 systems of equations',
  'latin-squares': '20 tasks',
}

export default function PracticeHubPage() {
  return (
    <PageShell
      title="Practice & mocks"
      description="Full-length practice under the clock. Timings and item counts follow the official preparatory materials; the question mix is ours."
      wide
    >
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-base font-semibold tracking-tight">Short sessions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex h-full flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Zap className="text-muted-foreground size-4" aria-hidden />
                  <h3 className="text-sm font-medium">Quick practice</h3>
                </div>
                <p className="text-muted-foreground flex-1 text-sm leading-relaxed">
                  10 questions mixed across the three subtests, about 10 minutes. Hints and full
                  solutions available.
                </p>
                <Link href="/practice/quick" className="inline-flex items-center gap-1 text-sm font-medium">
                  Start quick practice
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex h-full flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Compass className="text-muted-foreground size-4" aria-hidden />
                  <h3 className="text-sm font-medium">Diagnostic</h3>
                </div>
                <p className="text-muted-foreground flex-1 text-sm leading-relaxed">
                  15 questions, 5 per subtest, no clock and no hints — a starting point, not a
                  verdict.
                </p>
                <Link href="/practice/diagnostic" className="inline-flex items-center gap-1 text-sm font-medium">
                  Take the diagnostic
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold tracking-tight">One subtest at a time</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {SECTIONS.map((section) => (
              <Card key={section.id}>
                <CardContent className="flex h-full flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Timer className="text-muted-foreground size-4" aria-hidden />
                    <h3 className="text-sm font-medium">{section.title}</h3>
                  </div>
                  <p className="text-muted-foreground flex-1 text-sm leading-relaxed">
                    {UNIT[section.id]} in 25 minutes — an average of 75 seconds each.
                  </p>
                  <Link
                    href={`/practice/timed/${section.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium"
                  >
                    Start
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold tracking-tight">The whole Core Module</h2>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Layers className="text-muted-foreground size-4" aria-hidden />
                  <h3 className="text-sm font-medium">Module A simulation</h3>
                </div>
                <p className="text-muted-foreground mt-2 max-w-prose text-sm leading-relaxed">
                  All three subtests back to back, 25 minutes each, with the documented 30-minute
                  break before the Subject Module would begin. 60 questions, 75 minutes of testing.
                </p>
              </div>
              <Link
                href="/practice/simulation"
                className="inline-flex items-center gap-1 text-sm font-medium"
              >
                Start
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </CardContent>
          </Card>
        </section>

        <p className="text-muted-foreground flex items-start gap-2 text-xs leading-relaxed">
          <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          These are dMAT Prep practice mocks. 75 seconds per question is 25 minutes divided by 20 —
          a pacing guide, not a published per-question limit.
        </p>
      </div>
    </PageShell>
  )
}
