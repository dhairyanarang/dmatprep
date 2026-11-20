import { ArrowRight, Check, CreditCard, RotateCcw, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

import { PageContainer } from '@/components/layout/page-shell'
import { ProBadge } from '@/components/layout/sidebar-brand'
import { PremiumViewed } from '@/components/payments/premium-viewed'
import { ProCta } from '@/components/payments/pro-cta'
import { SupportLink } from '@/components/support/support-link'
import freeSet from '@/content/access/free-set.json'
import { getCoreMocks, mockSize } from '@/lib/content/mocks'
import { getBankSize } from '@/lib/content/registry'
import { ACCESS_IS_LIFETIME, COMMERCE_ENABLED, formatPrice } from '@/lib/payments/config'
import { SECTION_BY_ID, SECTION_IDS } from '@/lib/sections'

export const metadata = {
  title: 'Plans and pricing',
  description: 'What is free, what is paid, and what it costs',
}

/**
 * Pricing, in the design's composition: a centred hero, two plan columns with
 * the paid one on its gold plane, then the three things a buyer actually
 * worries about, a comparison, and the questions.
 *
 * Every number is derived from the bank rather than written down — this
 * repository has shipped a wrong hardcoded count once already.
 *
 * Two things are load-bearing and quiet. The page says plainly that the paid
 * questions have been public since August, because a buyer who discovers that
 * afterwards has been misled. And it names no feature that does not exist:
 * analytics, weak-area reports, adaptive practice and the General Academic
 * Module are **not** in the Pro list, because none of them is part of it.
 */
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
  const mocks = getCoreMocks()
  const mockQuestions = mocks[0] ? mockSize(mocks[0]) : 0

  return (
    <PageContainer className="flex flex-1 flex-col items-stretch gap-11 pt-12 pb-16">
      <PremiumViewed />

      <section className="flex flex-col items-center gap-3 text-center">
        <span className="over">Plans</span>
        <h1 className="max-w-[720px] text-4xl leading-[42px] font-semibold tracking-[-0.03em] text-balance">
          {COMMERCE_ENABLED
            ? 'Practise free. Go Pro when the date gets real.'
            : `Everything is free while we are in beta.`}
        </h1>
        <p className="text-muted-foreground max-w-[620px] text-[15px] leading-[22px] text-pretty">
          {COMMERCE_ENABLED
            ? 'One payment, no subscription. Pro does not expire and never renews.'
            : `All ${totals.total} Core questions are open right now, with full explanations. Nothing is for sale yet.`}
        </p>
      </section>

      <section className="grid w-full gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr))]">
        {/* ------------------------------------------------------------ Free */}
        <article className="border-border flex flex-col gap-5 rounded-2xl border p-6">
          <div className="flex flex-col gap-1.5">
            <b className="text-base font-semibold">Free</b>
            <span className="flex items-baseline gap-1.5">
              <span className="font-mono text-4xl leading-10 font-medium">₹0</span>
              <span className="text-muted-foreground">forever</span>
            </span>
            <span className="text-muted-foreground">
              Learn every question type and see how you do.
            </span>
          </div>

          <span className="border-border bg-frame text-muted-foreground flex h-10 items-center justify-center rounded-lg border text-sm font-medium">
            {COMMERCE_ENABLED ? 'Your current plan' : 'Everything, for now'}
          </span>

          <ul className="flex flex-col gap-2.5">
            <Row>
              <b className="font-medium">{totals.free} practice questions</b> — {perSection} in each
              Core subtest
            </Row>
            <Row>Complete explanations and distractor notes on every one</Row>
            <Row>The same practice runner as Pro — not a worse free one</Row>
            <Row>Diagnostic, untimed practice and timed subtests, marked in full</Row>
            <Row>Progress, accuracy and your whole attempt history</Row>
          </ul>

          <p className="text-muted-foreground mt-auto pt-2 text-xs leading-4">
            Free stays free. Nothing you can use today is being taken away.
          </p>
        </article>

        {/* ------------------------------------------------------------- Pro */}
        <article className="border-gold relative flex flex-col gap-5 rounded-2xl border-[1.5px] bg-[linear-gradient(180deg,var(--gold-soft)_0%,#fff_40%)] p-6">
          <span className="bg-foreground text-background absolute -top-3 left-6 inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium">
            Everything, for one payment
          </span>

          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2">
              <b className="text-base font-semibold">Pro</b>
              <ProBadge />
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-mono text-4xl leading-10 font-medium">{formatPrice()}</span>
              <span className="text-[#6b4a00]">one time</span>
            </span>
            <span className="text-muted-foreground">
              {ACCESS_IS_LIFETIME
                ? 'Paid once, kept for good. It does not expire and never renews.'
                : 'Paid once.'}
            </span>
          </div>

          <ProCta bankSize={totals.total} />

          <ul className="flex flex-col gap-2.5">
            <li className="text-xs font-semibold text-[#6b4a00]">Everything in Free, plus</li>
            <Row brand>
              <b className="font-medium">All {totals.total} Core questions</b> — {totals.premium}{' '}
              more than Free
            </Row>
            <Row brand>
              <b className="font-medium">
                {mocks.length} fixed Core mock exams
              </b>{' '}
              — {mockQuestions} questions each, no question shared between them, and the same test
              every time you open it
            </Row>
            <Row brand>
              The open simulation and every timed subtest drawn from the whole bank rather than
              the free {perSection}
            </Row>
            <Row brand>Full explanations and distractor notes on every one</Row>
            <Row brand>Lifetime access on this account</Row>
          </ul>
        </article>
      </section>

      <section className="grid w-full gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr))]">
        <Reassurance
          icon={ShieldCheck}
          title="Refunds"
          body="Ask within the window in the refund policy and you get the full amount back."
          href="/refunds"
        />
        <Reassurance
          icon={RotateCcw}
          title="Never renews"
          body="No card kept for later, no subscription, no surprise charge."
        />
        <Reassurance
          icon={CreditCard}
          title="UPI, cards, netbanking"
          body="Handled by Razorpay. We never see or store your card details."
        />
      </section>

      <section className="panel w-full">
        <div className="panel-h">
          <h2 className="ptitle">What each plan opens</h2>
        </div>
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="over border-soft border-b px-4 py-3 text-left">Feature</th>
                <th className="over border-soft border-b px-4 py-3 text-right">Free</th>
                <th className="over border-soft border-b px-4 py-3 text-right">Pro</th>
              </tr>
            </thead>
            <tbody>
              <Compare feature="Core practice questions" free={String(totals.free)} pro={`All ${totals.total}`} />
              {rows.map((r) => (
                <Compare
                  key={r.id}
                  feature={r.label}
                  free={String(r.free)}
                  pro={String(r.total)}
                  muted
                />
              ))}
              <Compare feature="Explanations and distractor notes" free="Yes" pro="Yes" />
              <Compare feature="Timed subtests" free={`From the free ${perSection}`} pro="Whole bank" />
              <Compare feature="Fixed Core mock exams" free="—" pro={String(mocks.length)} />
              <Compare
                feature="General Academic Module"
                free="Pilot material, free"
                pro="Pilot material, free"
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* Said once, plainly, because finding it out afterwards is worse. */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Worth knowing before you buy</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The paid questions are not secret — they have been in a public code repository since
          August 2026. Pro buys them organised, explained and measured inside the tool that tracks
          your progress.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          The General Academic Module is <b className="text-foreground font-medium">not</b> part of
          Pro. It is pilot material that no person has yet reviewed, so it stays free and stays
          marked as pilot until it has been. Analytics, weak-area reports and adaptive practice are
          what we intend to build next; they are not part of Pro today.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          dMAT Prep is independent. Questions follow the published format and every one is checked
          by a solver, but they are not official test items.{' '}
          <Link className="hover:text-foreground underline underline-offset-2" href="/about">
            More about this resource
          </Link>
          .
        </p>
      </section>

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
    </PageContainer>
  )
}

function Row({ children, brand = false }: { children: React.ReactNode; brand?: boolean }) {
  return (
    <li className="flex gap-2.5 text-sm leading-5">
      <Check
        aria-hidden
        className={`mt-0.5 size-4 shrink-0 ${brand ? 'text-brand' : 'text-foreground'}`}
      />
      <span>{children}</span>
    </li>
  )
}

function Reassurance({
  icon: Icon,
  title,
  body,
  href,
}: {
  icon: typeof ShieldCheck
  title: string
  body: string
  href?: string
}) {
  const content = (
    <>
      <Icon aria-hidden className="text-muted-foreground size-4 shrink-0" />
      <span className="flex flex-col gap-1">
        <b className="text-sm font-semibold">{title}</b>
        <span className="text-muted-foreground text-[13px] leading-[19px]">{body}</span>
      </span>
    </>
  )
  const className =
    'border-border bg-card flex items-start gap-3 rounded-xl border p-4 transition-colors'

  return href ? (
    <Link href={href} className={`${className} hover:border-foreground/25`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  )
}

function Compare({
  feature,
  free,
  pro,
  muted = false,
}: {
  feature: string
  free: string
  pro: string
  muted?: boolean
}) {
  return (
    <tr className="transition-colors hover:bg-[#fafaf9]">
      <td
        className={`border-b border-[#f3f3f1] px-4 py-3 ${muted ? 'text-muted-foreground pl-8 text-[13px]' : ''}`}
      >
        {feature}
      </td>
      <td className="text-muted-foreground border-b border-[#f3f3f1] px-4 py-3 text-right font-mono text-[13px] tabular-nums">
        {free}
      </td>
      <td className="border-b border-[#f3f3f1] px-4 py-3 text-right font-mono text-[13px] font-medium tabular-nums">
        {pro}
      </td>
    </tr>
  )
}
