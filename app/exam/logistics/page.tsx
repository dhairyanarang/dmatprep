import { AllowedList, ChipGrid, MilestoneTrack, Section, Stat, StatGrid } from '@/components/exam/visuals'
import { PageShell } from '@/components/layout/page-shell'

export const metadata = { title: 'Dates & Logistics' }

const CENTRES = [
  'Ahmedabad',
  'Bengaluru',
  'Bhopal',
  'Chandigarh',
  'Chennai',
  'Kolkata',
  'Mananthavady',
  'Mumbai',
  'New Delhi',
  'Pune',
  'Kathmandu (Nepal)',
]

const FIELDS = [
  ['Engineering', 'B.E., B.Tech and equivalents where the official branch is an Engineering field.'],
  ['Commerce, Accounting, Finance, Economics', 'Including the specialisations APS India classifies into this group.'],
  ['Business, Management', 'Where the official degree title places it in this group.'],
] as const

export default function ExamLogisticsPage() {
  return (
    <PageShell
      title="Dates & Logistics"
      description="Deadlines, fee, centres, and how the dMAT connects to the APS process."
      wide
    >
      <div className="space-y-10">
        <StatGrid>
          <Stat value="€150" label="Paid to g.a.s.t. on registration, not to APS India" />
          <Stat value="11" label="Test centres — 10 in India, 1 in Nepal" />
          <Stat value="15 Sep" label="Registration closes, 2026" />
          <Stat value="26 Sep" label="Exam day, 2026 — the first ever sitting" />
        </StatGrid>

        <Section title="The run-up">
          <MilestoneTrack
            milestones={[
              { date: '29 Jun', label: 'Registration opened', state: 'past' },
              { date: '15 Sep', label: 'Registration closes — the hard deadline', state: 'next' },
              { date: '26 Sep', label: 'Exam day', state: 'future' },
              { date: '12 Oct', label: 'Certificates available', state: 'future' },
            ]}
          />
        </Section>

        <Section
          title="Fee and refunds"
          description="Payment is electronic; paying at the test centre is allowed only in exceptional cases."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border-border bg-card rounded-xl border p-4">
              <p className="text-sm font-medium">Within 14 days</p>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                You may revoke the contract and be refunded in full.
              </p>
            </div>
            <div className="border-border bg-card rounded-xl border p-4">
              <p className="text-sm font-medium">Before the deadline</p>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                Deregistering is refunded minus an administrative fee of up to 15%.
              </p>
            </div>
            <div className="border-danger/25 bg-danger-tint/40 rounded-xl border p-4">
              <p className="text-danger-fg text-sm font-medium">After the deadline</p>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                No refund — for late deregistration, non-attendance, or discontinuing the exam.
              </p>
            </div>
          </div>
        </Section>

        <Section
          title="Test centres"
          description="Registration is handled through the g.a.s.t. participant portal at gast.de, not through APS India."
        >
          <ChipGrid label="Test centres" items={CENTRES} />
        </Section>

        <Section
          title="Who has to take it"
          description="Master’s applicants targeting the summer semester 2027 intake or later, whose previous degree falls in one of three field groups."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {FIELDS.map(([title, detail]) => (
              <div key={title} className="border-border bg-card rounded-xl border p-4">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>

          <div className="border-border bg-muted/50 rounded-xl border p-4">
            <p className="text-sm font-medium">The field list is guidance, not a closed list</p>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              APS India states its list is not exhaustive. The official degree title, branch, major,
              honours subject or specialisation on your documents is what decides — and a name
              containing “Engineering” or “Management” is not sufficient on its own.
            </p>
          </div>
        </Section>

        <Section title="Exemptions">
          <div className="grid gap-4 sm:grid-cols-2">
            <AllowedList
              allowed={false}
              title="You do not need the dMAT if"
              items={[
                'You completed APS online registration before 29 June 2026',
                'You shipped complete APS documents before 29 June 2026',
                'You already hold an APS certificate',
                'You are a Bachelor’s or PhD applicant',
                'You are on a confirmed exchange, double-degree or partnership programme',
              ]}
            />
            <div className="border-border bg-card space-y-3 rounded-xl border p-4">
              <h3 className="text-sm font-semibold">How it fits with APS</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The certificate accompanies your APS application documents and the result is
                reflected on the APS certificate. It is an additional element in the APS
                documentation — it does not replace document verification, does not establish
                formal eligibility, does not replace anabin, and does not override recognition
                requirements.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </PageShell>
  )
}
