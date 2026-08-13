import { ConfidenceBadge } from '@/components/content/source-ref'
import { MilestoneTrack, ScoreScale, Section, Stat, StatGrid } from '@/components/exam/visuals'
import { PageShell } from '@/components/layout/page-shell'

export const metadata = { title: 'Scoring & Results' }

export default function ExamScoringPage() {
  return (
    <PageShell
      description="No pass, no fail — a score, a percentile, and a certificate that never expires."
      wide
    >
      <div className="space-y-10">
        <StatGrid>
          <Stat value="0–200" label="Score range, converted from correct answers" />
          <Stat value="100" label="The mean score" />
          <Stat value="∞" label="Certificate validity — indefinite" />
          <Stat value="12 Oct" label="Certificates available, 2026" />
        </StatGrid>

        <Section
          title="Where your score sits"
          description="The dMAT score is a conversion of the total number of correct answers onto a 0–200 scale, with the mean at 100. You also receive a percentile rank comparing you to other participants, and the total combines both modules."
        >
          <ScoreScale />
        </Section>

        <Section title="Always guess">
          <div className="border-success/25 bg-success-tint/40 rounded-2xl border p-5">
            <p className="text-sm leading-relaxed">
              The official instructions say so directly, in Figure Sequences, Latin Squares and the Subject Module:{' '}
              <span className="font-medium">
                if you do not know an answer, guess which answer might be correct.
              </span>
            </p>
            <div className="border-success/20 mt-4 border-t pt-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                There is no penalty for a wrong answer, so a blank costs exactly what a wrong guess
                costs — and a guess sometimes pays.
              </p>
              <ConfidenceBadge
                confidence="unconfirmed"
                note="No official source states this either way. It follows from the score being a conversion of the number of correct answers, and from g.a.s.t. instructing candidates to guess — but “no negative marking” is nowhere written down."
              />
            </div>
          </div>
        </Section>

        <Section title="Getting your result">
          <MilestoneTrack
            milestones={[
              { date: '26 Sep', label: 'You sit the exam', state: 'next' },
              { date: '12 Oct', label: 'Certificate available to download', state: 'future' },
              { date: 'Portal only', label: 'No result is sent by phone or email', state: 'future' },
              { date: 'Indefinite', label: 'The certificate never expires', state: 'future' },
            ]}
          />
        </Section>

        <Section title="What the score does not do">
          <div className="border-border bg-muted/50 rounded-2xl border p-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
              APS India is explicit: the dMAT does not replace document verification, does not
              establish formal eligibility, does not replace anabin, does not override recognition
              requirements, and does not compensate for a degree or institution that is not
              formally recognised. A strong score is not a substitute for meeting the ordinary
              requirements.
            </p>
          </div>
        </Section>

        <Section title="If something goes wrong on the day">
          <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
            If part of the exam cannot be evaluated because of a technical fault caused by g.a.s.t.,
            you have the right to retake the dMAT at one of the next exam dates.
          </p>
        </Section>
      </div>
    </PageShell>
  )
}
