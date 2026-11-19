import { Mail } from 'lucide-react'

import { PageDisclaimer } from '@/components/layout/page-disclaimer'
import { PageHeader } from '@/components/layout/page-header'
import { PageContainer } from '@/components/layout/page-shell'
import { SupportEmail } from '@/components/support/support-link'
import { OPERATOR, SUPPORT_RESPONSE_AIM } from '@/content/legal/operator'

export const metadata = { title: 'Contact' }

/**
 * One address, and what we can actually help with.
 *
 * Deliberately short. The previous version led with a legal-identity table —
 * operator, registered address, grievance officer — which is information a
 * regulator wants and a stuck candidate does not. Those disclosures still
 * belong somewhere before launch; a support page is not it, and burying the
 * email under three rows of corporate detail helped nobody.
 */
export default function ContactPage() {
  const email = OPERATOR.contactEmail

  return (
    <div className="bg-[linear-gradient(180deg,rgba(2,89,100,0.12)_0px,rgba(2,89,100,0)_120px)]">
      <PageContainer className="stagger-enter flex flex-col gap-7 py-6">
        <PageHeader
          icon={Mail}
          title="Contact"
          description="One address, read by a person. Tell us what happened and we will sort it out."
        />

        <div className="max-w-3xl">
          <div className="border-border bg-card rounded-xl border p-5 sm:p-6">
            <p className="text-muted-foreground text-sm">Email us</p>
            <p className="mt-1.5 font-mono text-base break-all sm:text-lg">
              {email ? (
                <SupportEmail topic="Help with dMAT Prep" />
              ) : (
                <span className="text-muted-foreground">No support address is published yet.</span>
              )}
            </p>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              {SUPPORT_RESPONSE_AIM}
            </p>
          </div>

          <div className="mt-7 space-y-3">
            <h2 className="text-sm font-medium">What we can help with</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Anything about this site: a payment that did not unlock, a refund, a question that
              looks wrong, an account problem, or a mistake in something we have written about the
              examination.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-medium">What we cannot</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We are independent and have no connection to the examination authority. We cannot
              register you, change a booking, tell you your result, or rule on your eligibility —
              those go to g.a.s.t. or APS India directly.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Please do not send questions recalled from a live examination; we will not use them.
              And never send card numbers, UPI PINs, passwords or OTPs — we will never ask for
              them, and we do not need them to help.
            </p>
          </div>
        </div>

        <PageDisclaimer className="max-w-3xl" />
      </PageContainer>
    </div>
  )
}
