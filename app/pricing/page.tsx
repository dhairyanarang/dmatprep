import { ArrowRight, Check, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { InfoPage } from '@/components/layout/info-page'
import { PremiumViewed } from '@/components/payments/premium-viewed'
import { PurchaseButton } from '@/components/payments/purchase-button'
import { SupportLink } from '@/components/support/support-link'
import freeSet from '@/content/access/free-set.json'
import { getBankSize } from '@/lib/content/registry'
import { COMMERCE_ENABLED, formatPrice } from '@/lib/payments/config'
import { SECTION_BY_ID, SECTION_IDS } from '@/lib/sections'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Pricing',
  description: 'What is free, what is paid, and what it costs',
}

/**
 * The pricing page, in the product's own visual language.
 *
 * Every number is derived from the bank rather than written down — this
 * repository has shipped a wrong hardcoded count once already.
 *
 * Two things are load-bearing and quiet. The page says plainly that the paid
 * questions have been public since August, because a buyer who discovers that
 * afterwards has been misled. And it names no feature that does not exist:
 * analytics, weak-area reports and adaptive practice are on a roadmap line,
 * never in the Pro feature list, per `docs/WEBSITE_READINESS.md` §1.
 */
function Row({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <li className="flex gap-2.5">
      <Check
        aria-hidden
        className={cn('mt-0.5 size-4 shrink-0', muted ? 'text-muted-foreground/50' : 'text-brand')}
      />
      <span className={cn('text-sm leading-5', muted ? 'text-muted-foreground' : 'text-foreground')}>
        {children}
      </span>
    </li>
  )
}

export default function PricingPage() {
  const rows = SECTION_IDS.map((id) => {
    const total = getBankSize(id)
    const free = (freeSet.sections as Record<string, string[]>)[id]?.length ?? 0
    return { id, label: SECTION_BY_ID[id].title, total, free, premium: total - free }
  })
  const totals = rows.reduce(
    (a, r) => ({ total: a.total + r.total, free: a.free + r.free, premium: a.premium + r.premium }),
    { total: 0, free: 0, premium: 0 },
  )
  const perSection = rows[0]?.free ?? 0

  return (
    <InfoPage
      icon={Sparkles}
      title="Pricing"
      description={
        COMMERCE_ENABLED
          ? 'One payment, once. Everything you can already use stays free.'
          : `Nothing is for sale yet — all ${totals.total} Core questions are free right now.`
      }
      wide
    >
      <PremiumViewed />

        <div className="grid items-start gap-4 lg:grid-cols-2">
          {/* ---------------------------------------------------------- Free */}
          <section className="border-border bg-card flex flex-col rounded-xl border p-5 sm:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-foreground text-base font-semibold">Free</h2>
              <span className="text-muted-foreground text-sm">No account needed</span>
            </div>

            <p className="text-foreground mt-4 text-2xl leading-8 font-semibold tracking-tight">
              {totals.free} questions
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {perSection} in each of the three Core subtests
            </p>

            <ul className="mt-5 flex flex-col gap-2.5">
              <Row>Complete explanations for every free question</Row>
              <Row>The same answer feedback as Pro — one practice runner, not a worse free one</Row>
              <Row>Progress, accuracy and your full attempt history</Row>
              <Row>Diagnostic and timed practice</Row>
              <Row>Every question type, at every difficulty</Row>
            </ul>

            <p className="text-muted-foreground mt-auto pt-6 text-xs leading-4">
              Free stays free. Nothing you can use today is being taken away.
            </p>
          </section>

          {/* ----------------------------------------------------------- Pro */}
          <section className="border-brand/30 bg-card relative flex flex-col rounded-xl border p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)] sm:p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-foreground flex items-center gap-2 text-base font-semibold">
                Pro
                {/* Gold, not blue. Blue means "do something"; gold means
                    "this is membership". A Pro badge in the action colour is
                    the exact confusion the two-colour rule exists to stop. */}
                <span className="bg-gold text-gold-dark rounded px-1.5 py-0.5 font-mono text-[10px] leading-4 font-semibold tracking-wide uppercase">
                  Lifetime
                </span>
              </h2>
              <span className="text-muted-foreground text-sm">Account required</span>
            </div>

            <p className="text-foreground mt-4 text-2xl leading-8 font-semibold tracking-tight">
              {formatPrice()}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Paid once, kept for good. No subscription, nothing charged again.
            </p>

            <ul className="mt-5 flex flex-col gap-2.5">
              <Row>
                <span className="text-foreground font-medium">
                  All {totals.total} Core questions
                </span>{' '}
                — {totals.premium} more than Free
              </Row>
              {rows.map((r) => (
                <Row key={r.id} muted>
                  {r.label} — {r.free} free, {r.premium} more with Pro
                </Row>
              ))}
              <Row>Full explanations and distractor notes on every one</Row>
              <Row>
                Full exam-day simulation — all three subtests, timed, drawing fresh questions
                each run
              </Row>
              <Row>Timed sets for any single subtest</Row>
              <Row>Lifetime access on this account — it never expires and never renews</Row>
            </ul>

            <div className="mt-6">
              <PurchaseButton />
            </div>
          </section>
        </div>

        {/* Said once, plainly, because finding it out afterwards is worse. */}
        <p className="text-muted-foreground text-sm leading-relaxed">
          The paid questions are not secret — they have been in a public code repository since
          August 2026. Pro buys them organised, explained and measured inside the tool that tracks
          your progress. Analytics, weak-area reports and adaptive practice are what we intend to
          build next; they are not part of Pro today.{' '}
          <Link className="hover:text-foreground underline underline-offset-2" href="/about">
            More about this resource
          </Link>
          .
        </p>

        <div className="border-border/70 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Purchase information" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {[
              { href: '/refunds', label: 'Refunds' },
              { href: '/terms', label: 'Terms' },
              { href: '/privacy', label: 'Your data' },
            ].map((l) => (
              <Link
                key={l.href}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 underline underline-offset-2"
                href={l.href}
              >
                {l.label}
                <ArrowRight aria-hidden className="size-3" />
              </Link>
            ))}
          </nav>
          <SupportLink className="sm:text-right" showAim={false} topic="Question about Pro" />
        </div>

    </InfoPage>
  )
}
