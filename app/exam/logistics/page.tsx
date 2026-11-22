import { AllowedList, ChipGrid, MilestoneTrack, Section, Stat, StatGrid } from '@/components/exam/visuals'
import { SubPage } from '@/components/layout/sub-nav'
import { canonical } from '@/lib/seo'

export const metadata = {
  title: 'Dates & Logistics',
  description:
    'dMAT dates for 2027, the application deadlines, the test fee and how registration and payment are handled — with the official source for each.',
  alternates: { canonical: canonical('/exam/logistics') },
}
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

/**
 * APS India's list, which is the longer of the two and the one that governs.
 *
 * d-mat.de still prints three groups; APS India published five on 5 November
 * 2026, adding Tourism/Travel/Hospitality and a rule for integrated and
 * dual-degree programmes. The two official sources disagree, and the g.a.s.t.
 * FAQ itself says APS India decides eligibility — so the broader list is the
 * safer one to show. The disagreement is shown to the candidate rather than
 * resolved for them; see the note below the table.
 */
const FIELDS = [
  ['Engineering and Technology', 'Every B.Tech and B.Eng, whatever the specialisation, plus other Engineering degrees under any name — BS Research, B.Voc or a B.Sc. on an Engineering track.'],
  ['Commerce, Accounting, Finance, Economics', 'Including the specialisations APS India classifies into this group.'],
  ['Business, Management', 'Where the official degree title places it in this group.'],
  ['Tourism, Travel and Hospitality', 'Added by APS India on 5 November 2026 as a category of its own. It does not appear on the g.a.s.t. list.'],
  ['Integrated and dual-degree programmes', 'Required if any component or major field falls in one of the groups above. Also APS India only.'],
] as const

export default function ExamLogisticsPage() {
  return (
    <SubPage
      title="Dates & logistics"
      description="Deadlines, fee, centres, and how the dMAT connects to the APS process."
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
            <div className="border-border bg-card rounded-2xl border p-4">
              <p className="text-sm font-medium">Within 14 days</p>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                You may revoke the contract and be refunded in full.
              </p>
            </div>
            <div className="border-border bg-card rounded-2xl border p-4">
              <p className="text-sm font-medium">Before the deadline</p>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                Deregistering is refunded minus an administrative fee of up to 15%.
              </p>
            </div>
            <div className="border-danger/25 bg-danger-tint/40 rounded-2xl border p-4">
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
          description="Master’s applicants targeting the summer semester 2027 intake or later, whose previous degree falls in one of these groups. This is APS India’s list, which is longer than the one on d-mat.de."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map(([title, detail]) => (
              <div key={title} className="border-border bg-card rounded-2xl border p-4">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>

          <div className="border-border bg-muted/50 rounded-2xl border p-4">
            <p className="text-sm font-medium">The field list is guidance, not a closed list</p>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              APS India states its list is not exhaustive. The official degree title, branch, major,
              honours subject or specialisation on your documents is what decides — and a name
              containing “Engineering” or “Management” is not sufficient on its own. If your degree
              sits on a boundary, APS India advises taking the dMAT rather than risking a delay.
            </p>
          </div>

          <div className="border-border bg-muted/50 rounded-2xl border p-4">
            <p className="text-sm font-medium">The two official sources do not agree, and we have not picked one for you</p>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              g.a.s.t. lists three groups on its dMAT in India page — Engineering; Commerce,
              Accounting, Finance, Economics; and Business / Management. APS India lists five,
              adding Tourism, Travel and Hospitality and a rule for integrated and dual-degree
              programmes, in a revision dated 5 November 2026. Both were read on 14 November 2026.
              The list above is APS India’s, because the g.a.s.t. FAQ says eligibility is determined
              by APS India — but if your field appears on only one of them, check with APS India
              before assuming you are exempt.
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
            <div className="border-border bg-card space-y-3 rounded-2xl border p-4">
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
    </SubPage>
  )
}
