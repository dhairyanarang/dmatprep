import { AlertTriangle } from 'lucide-react'

import { AllowedList, Section, Stat, StatGrid } from '@/components/exam/visuals'
import { PageShell } from '@/components/layout/page-shell'

export const metadata = { title: 'Exam-Day Rules' }

const CONDUCT = [
  ['Arrive before materials are distributed', 'Arrive after and you are not admitted. No exceptions.'],
  ['Bring the ID you registered with', 'It must match your online registration. Without it you are not admitted.'],
  ['Stay in the building', 'You may not leave for the duration, and may not leave the room until the module ends.'],
  ['Lavatories only at the designated breaks', 'And no cafeteria or canteen during them.'],
  ['No notes or reference books in breaks', 'Consulting them between modules counts as a violation.'],
  ['Never discuss exam content', 'Recording, sharing or posting it is prosecutable under the terms.'],
] as const

export default function ExamRulesPage() {
  return (
    <PageShell
      title="Exam-Day Rules"
      description="Most of these carry exclusion as the penalty, with no refund."
      wide
    >
      <div className="space-y-10">
        <StatGrid>
          <Stat value="1" label="Item allowed on your desk — your ID" />
          <Stat value="0" label="Notes, at any point in the exam" />
          <Stat value="0" label="Calculators — all arithmetic is mental" />
          <Stat value="0" label="Refund if you are excluded" />
        </StatGrid>

        <Section
          title="What comes in, what stays out"
          description="The prohibited list is specific and enforced at the door."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <AllowedList
              allowed
              title="Bring"
              items={[
                'A valid ID card or passport',
                'The same document you gave at registration',
                'Nothing else on the desk',
              ]}
            />
            <AllowedList
              allowed={false}
              title="Leave behind"
              items={[
                'Mobile phones and tablets',
                'Wristwatches, smartwatches, fitness watches',
                'Calculators and any other electronic device',
                'mp3 players',
                'Notes, notice paper and reference books',
              ]}
            />
          </div>
        </Section>

        <Section title="Conduct">
          <ul className="grid gap-3 sm:grid-cols-2">
            {CONDUCT.map(([title, detail]) => (
              <li key={title} className="border-border bg-card rounded-xl border p-4">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{detail}</p>
              </li>
            ))}
          </ul>
        </Section>

        <div className="border-warning/35 bg-warning-tint/50 flex gap-3 rounded-xl border p-4">
          <AlertTriangle className="text-warning-fg mt-px size-4 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-medium">Practise the way you will sit</p>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              Scratch paper is not merely unavailable — it is a prohibited aid. If you rehearse
              Latin Squares by sketching the grid, you are training a skill you cannot use.
              Everything in this hub is built to be solved by reading and mental tracking alone.
            </p>
          </div>
        </div>

        <Section title="If your phone rings">
          <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
            You are excluded from the examination. Devices must be switched off — not silenced —
            for the entire test. Exclusion also follows from using prohibited aids, copying,
            ignoring the administrator, falsified documents, or attempting to remove exam
            materials. In every case the fee is not refunded, and the Examination Board may deny
            admission to future sittings.
          </p>
        </Section>
      </div>
    </PageShell>
  )
}
