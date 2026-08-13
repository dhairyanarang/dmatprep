import { HubCard, HubSection } from '@/components/layout/hub'
import { StartHere } from '@/components/exam/start-here'
import { PageShell } from '@/components/layout/page-shell'
import { SOURCES } from '@/content/exam/sources'

export const metadata = { title: 'The exam' }

const PAGES = [
  {
    href: '/exam/format',
    title: 'Format & structure',
    description: 'The two modules, the three Core subtests, and how the day is timed.',
  },
  {
    href: '/exam/rules',
    title: 'Exam-day rules',
    description: 'What you may bring, what counts as exclusion, and what happens if you break a rule.',
  },
  {
    href: '/exam/scoring',
    title: 'Scoring & results',
    description: 'The 0–200 scale, the percentile rank, and when the certificate arrives.',
  },
  {
    href: '/exam/logistics',
    title: 'Dates & logistics',
    description: 'Deadlines, the fee, test centres, and who the requirement applies to.',
  },
  {
    href: '/exam/checklist',
    title: 'Pre-exam checklist',
    description: 'Everything to settle before the day, official requirements kept apart from our advice.',
  },
  {
    href: '/exam/sources',
    title: 'Sources',
    description: 'Every factual claim in dMAT Prep, listed against the official document behind it.',
  },
]

export default function ExamPage() {
  return (
    <PageShell
      description="Start with the short answers. Every detail behind them is one click away, with its official source."
      wide
    >
      <div className="space-y-10">
        <HubSection title="Start here">
          <StartHere />
        </HubSection>

        <HubSection title="In detail">
          <div className="grid gap-4 sm:grid-cols-2">
            {PAGES.map((page) => (
              <HubCard key={page.href} {...page} />
            ))}
          </div>
        </HubSection>

        <p className="text-muted-foreground text-xs leading-relaxed">
          Everything here traces to g.a.s.t. or APS India — no third-party guides. Checked against
          the {SOURCES['gam-pdf'].asAt} preparatory materials.
        </p>
      </div>
    </PageShell>
  )
}
