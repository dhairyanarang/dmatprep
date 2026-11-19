import { Check, Sparkles } from 'lucide-react'

import { PageHeader } from '@/components/layout/page-header'
import { PageContainer } from '@/components/layout/page-shell'
import { PremiumViewed } from '@/components/payments/premium-viewed'
import { PurchaseButton } from '@/components/payments/purchase-button'
import { SupportLink } from '@/components/support/support-link'
import freeSet from '@/content/access/free-set.json'
import { getBankSize } from '@/lib/content/registry'
import { COMMERCE_ENABLED, formatPrice } from '@/lib/payments/config'
import { SECTION_BY_ID, SECTION_IDS } from '@/lib/sections'

export const metadata = {
  title: 'Pricing',
  description: 'What is free, what is paid, and what it costs',
}

/**
 * The pricing page Razorpay requires before it will issue live API keys, and
 * the page a buyer deserves before spending anything.
 *
 * Every count on it is derived from the bank rather than written down, because
 * this repository has already shipped a wrong hardcoded count once. The honest
 * part is the second table: the features that justify the price do not exist
 * yet, so they are named as not-yet-built rather than listed as benefits.
 * `docs/WEBSITE_READINESS.md` §1 makes that the governing rule for all copy —
 * nothing is advertised before it is built.
 */
export default function PricingPage() {
  const rows = SECTION_IDS.map((id) => {
    const total = getBankSize(id)
    const free = (freeSet.sections as Record<string, string[]>)[id]?.length ?? 0
    return { id, label: SECTION_BY_ID[id].title, total, free, premium: total - free }
  })

  const totals = rows.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      free: acc.free + r.free,
      premium: acc.premium + r.premium,
    }),
    { total: 0, free: 0, premium: 0 },
  )

  return (
    <div className="bg-[linear-gradient(180deg,rgba(2,89,100,0.12)_0px,rgba(2,89,100,0)_120px)]">
      <PageContainer className="flex max-w-3xl flex-col gap-7 py-6">
        <PremiumViewed />
        <PageHeader
          icon={Sparkles}
          title="Pricing"
          description="What is free, what is paid, and exactly what you get"
        />

        {!COMMERCE_ENABLED ? (
          <div className="border-border bg-card rounded-xl border p-4">
            <p className="text-foreground text-sm font-semibold">Nothing is for sale yet.</p>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              All {totals.total} Core questions are free right now, with complete explanations and
              progress tracking, and no account needed. This page describes what paid access will
              be when it opens. If you are using dMAT Prep today, nothing is being taken away from
              you.
            </p>
          </div>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Free, always</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {totals.free} questions — {rows[0].free} in each of the three Core subtests — chosen to
            cover every question type we have, at every difficulty. Not a sample of the easy ones.
          </p>
          <ul className="text-muted-foreground space-y-1.5 text-sm leading-relaxed">
            {[
              'Complete explanations for every free question, never withheld',
              'The same answer feedback as paid — there is one practice runner, not a worse free one',
              'Progress tracking, accuracy and your full attempt history',
              'Diagnostic and timed practice',
              'No account required',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <Check aria-hidden className="text-foreground mt-0.5 size-4 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">
            Paid access — {formatPrice()}, one time
          </h2>

          <div className="border-border overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-card text-muted-foreground">
                <tr>
                  <th className="p-3 text-left font-medium">Subtest</th>
                  <th className="p-3 text-right font-medium">Free</th>
                  <th className="p-3 text-right font-medium">Paid adds</th>
                  <th className="p-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-border border-t">
                    <td className="p-3">{r.label}</td>
                    <td className="p-3 text-right font-mono">{r.free}</td>
                    <td className="p-3 text-right font-mono">{r.premium}</td>
                    <td className="text-muted-foreground p-3 text-right font-mono">{r.total}</td>
                  </tr>
                ))}
                <tr className="border-border bg-card border-t font-medium">
                  <td className="p-3">Total</td>
                  <td className="p-3 text-right font-mono">{totals.free}</td>
                  <td className="p-3 text-right font-mono">{totals.premium}</td>
                  <td className="p-3 text-right font-mono">{totals.total}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed">
            Every paid question carries the same complete explanation and notes on each wrong
            option. Paid access is attached to your account and does not expire.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">What paid access is not</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We would rather say this than have you find out afterwards.
          </p>
          <ul className="text-muted-foreground space-y-2 text-sm leading-relaxed">
            <li>
              <strong className="text-foreground">The paid questions are not secret.</strong> They
              have been in a public code repository since August 2026 and anyone can find them.
              What you are paying for is having them organised, explained and measured inside a
              tool that tracks your progress — convenience, not exclusivity.
            </li>
            <li>
              <strong className="text-foreground">
                Analytics, weak-area reports, pacing insight and adaptive practice do not exist
                yet.
              </strong>{' '}
              They are what we intend to build next. They are not part of what you are buying
              today, and we will not list them as features until they are real.
            </li>
            <li>
              <strong className="text-foreground">Module B is not included.</strong> Its questions
              have passed automated checks but nobody has signed them off, so they are neither sold
              nor offered as a sample.
            </li>
            <li>
              <strong className="text-foreground">No result is guaranteed.</strong> The real
              examination may differ in content, difficulty and structure.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Buying</h2>
          <PurchaseButton />
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Questions before you buy?</h2>
          <SupportLink topic="Question about Premium" />
        </section>
      </PageContainer>
    </div>
  )
}
