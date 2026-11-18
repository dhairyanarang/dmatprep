import { Mail } from 'lucide-react'

import { PageHeader } from '@/components/layout/page-header'
import { PageContainer } from '@/components/layout/page-shell'
import { legalRobots } from '@/components/legal/legal-document'
import {
  OPERATOR,
  OPERATOR_FIELD_LABELS,
  missingOperatorFields,
} from '@/content/legal/operator'

export const metadata = { title: 'Contact', ...legalRobots() }

/**
 * Who we are and how to reach us.
 *
 * Required twice over: the Consumer Protection (E-Commerce) Rules, 2020 oblige
 * an Indian seller to display its legal name, principal geographic address and
 * grievance officer prominently; and Razorpay withholds live API keys until a
 * Contact page exists.
 *
 * The 48-hour acknowledgement below is an operational commitment, not a
 * sentence. It needs a mailbox somebody reads on a schedule, which is why the
 * support address is one of the facts this page refuses to invent.
 */
function Value({ field }: { field: keyof typeof OPERATOR }) {
  const value = OPERATOR[field]
  if (value) return <span className="text-foreground">{value}</span>
  return (
    <mark className="bg-destructive/10 text-destructive rounded px-1 py-0.5 font-mono text-[0.8em]">
      [{OPERATOR_FIELD_LABELS[field]} required]
    </mark>
  )
}

export default function ContactPage() {
  const missing = missingOperatorFields()

  return (
    <div className="bg-[linear-gradient(180deg,rgba(2,89,100,0.12)_0px,rgba(2,89,100,0)_120px)]">
      <PageContainer className="flex max-w-3xl flex-col gap-6 py-6">
        <PageHeader
          icon={Mail}
          title="Contact"
          description="Who operates dMAT Prep, and how to reach us"
        />

        {missing.length > 0 ? (
          <div
            role="status"
            className="border-destructive/30 bg-destructive/5 space-y-2 rounded-xl border p-4"
          >
            <p className="text-foreground text-sm font-semibold">
              These details have not been supplied yet.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              They are facts about the operator that cannot be guessed, and inventing them would
              misrepresent a real person&rsquo;s obligations. Nothing is being sold until they are
              filled in.
            </p>
          </div>
        ) : null}

        <dl className="border-border divide-border divide-y rounded-xl border">
          {(
            [
              ['Operated by', 'legalName'],
              ['Address', 'address'],
              ['Email', 'contactEmail'],
              ['Grievance officer', 'grievanceOfficer'],
            ] as const
          ).map(([label, field]) => (
            <div key={field} className="flex flex-col gap-1 p-4 sm:flex-row sm:gap-6">
              <dt className="text-muted-foreground w-44 shrink-0 text-sm">{label}</dt>
              <dd className="text-sm">
                <Value field={field} />
              </dd>
            </div>
          ))}
        </dl>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">How quickly we reply</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We acknowledge any complaint within 48 hours and aim to resolve it within one month, as
            the Consumer Protection (E-Commerce) Rules, 2020 require. For a refund request, say
            when you bought and which account you used — that is the whole process.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">What we cannot help with</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We are an independent preparation resource and have no connection to the examination
            authority. We cannot register you for the examination, change a booking, tell you your
            result, or answer a question about your eligibility. Those go to g.a.s.t. or APS India
            directly.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Please do not send us questions recalled from a live examination. We will not use them,
            and sharing them may breach the examination&rsquo;s own terms, which bind you as a
            candidate.
          </p>
        </section>
      </PageContainer>
    </div>
  )
}
