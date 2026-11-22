import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

import { Prose, Section, SectionHead } from '@/components/site/primitives'
import { GAM_SECTION, HERO, HOW_IT_WORKS, PLANS, TRUST } from '@/content/site/landing'
import { CORE_SUBTESTS } from '@/content/site/nav'
import { getBankSize } from '@/lib/content/registry'
import { nextCycle } from '@/content/exam/key-dates'
import { FREE_TOTAL } from '@/lib/payments/free-quota'
import { SECTIONS } from '@/lib/sections'
import { canonical, jsonLdProps, organisationJsonLd, webSiteJsonLd } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'dMAT practice questions and mock exams',
  description:
    'Free practice for the Digital Master Assessment Test: Figure Sequences, Mathematical Equations and Latin Squares, with solver-checked questions, worked solutions and timed mock exams.',
  alternates: { canonical: canonical('/') },
  openGraph: {
    title: 'dMAT Prep — practice questions and mock exams',
    description:
      'Free, independent practice for the dMAT Core Module, with worked solutions and timed mocks.',
    url: canonical('/'),
  },
}

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

export default function LandingPage() {
  const total = SECTIONS.reduce((n, s) => n + getBankSize(s.id), 0)
  // Evaluated when the page is built, which is the right granularity: the
  // cycles change twice a year and every deploy re-renders this. Once both
  // announced sittings have passed it returns null and the figure says so
  // rather than counting down to a date that is behind us.
  const cycle = nextCycle(new Date())

  return (
    <>
      {/* Organisation and WebSite only. No Course, no AggregateRating, no
          affiliation — structured data that overstates is a liability, and a
          rating we do not have would be exactly that. */}
      <script {...jsonLdProps(organisationJsonLd)} />
      <script {...jsonLdProps(webSiteJsonLd)} />

      {/* ------------------------------------------------------------ hero */}
      <section className="border-border border-b">
        <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-12 sm:px-6 sm:pt-20 sm:pb-16">
          <p className="text-muted-foreground font-mono text-[12px] tracking-wide uppercase">
            {HERO.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-[32px] leading-[1.1] font-semibold tracking-tight text-balance sm:text-[44px]">
            {HERO.title}
          </h1>
          <p className="text-muted-foreground mt-5 max-w-2xl text-[16px] leading-7">
            {HERO.body}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={HERO.primary.href}
              className="bg-brand text-brand-foreground hover:bg-brand-strong group inline-flex h-11 items-center gap-2 rounded-md px-5 text-[14.5px] font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {HERO.primary.label}
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
              />
            </Link>
            <Link
              href={HERO.secondary.href}
              className="border-border hover:bg-frame inline-flex h-11 items-center rounded-md border px-5 text-[14.5px] font-medium transition-colors duration-150"
            >
              {HERO.secondary.label}
            </Link>
          </div>

          {/* Figures, as a rule-separated row rather than four identical cards.
              Each one is derived or sourced; none is rounded up for effect. */}
          <dl className="border-border mt-12 grid gap-px border-t sm:grid-cols-3">
            <Figure value={total.toLocaleString('en-GB')} label="practice questions">
              original, and each proved to have exactly one answer before publication
            </Figure>
            <Figure value={String(FREE_TOTAL)} label="free, without an account">
              50 from each Core subtest, with full solutions
            </Figure>
            <Figure
              value={cycle ? longDate(cycle.testDate) : 'To be announced'}
              label={cycle ? 'next announced sitting' : 'next sitting'}
            >
              {cycle
                ? `applications close ${longDate(cycle.registrationDeadline)}`
                : 'check the official site for the next cycle'}
            </Figure>
          </dl>
        </div>
      </section>

      {/* -------------------------------------------------------- subtests */}
      <Section>
        <SectionHead
          eyebrow="The Core Module"
          title="Three subtests, three quite different skills"
          lead="Each runs for 25 minutes and holds 20 items. Nothing may be written down, which changes how each one has to be approached."
        />
        <div className="border-border mt-10 grid gap-px border-t lg:grid-cols-3">
          {CORE_SUBTESTS.map((s) => (
            <article key={s.id} className="border-border flex flex-col gap-3 border-b py-7 lg:border-b-0 lg:px-6 lg:first:pl-0 lg:last:pr-0">
              <h3 className="text-[17px] font-semibold tracking-tight">{s.name}</h3>
              <p className="text-muted-foreground text-[14.5px] leading-6">{s.blurb}</p>
              <p className="text-muted-foreground mt-auto pt-2 font-mono text-[12px]">
                {getBankSize(s.id).toLocaleString('en-GB')} questions
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <Link
                  href={s.href}
                  className="text-brand hover:text-brand-strong text-[13.5px] font-medium underline-offset-4 hover:underline"
                >
                  Learn the rules
                </Link>
                <Link
                  href={s.practiceHref}
                  className="text-muted-foreground hover:text-foreground text-[13.5px] underline-offset-4 hover:underline"
                >
                  Practise now
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------- how it works */}
      <Section tinted>
        <SectionHead
          eyebrow="How practice works"
          title="Built to be used the week before, not just browsed"
        />
        <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span
                aria-hidden
                className="text-muted-foreground mt-0.5 shrink-0 font-mono text-[12px] tabular-nums"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="text-[15.5px] font-semibold tracking-tight">{step.title}</h3>
                <p className="text-muted-foreground mt-1.5 text-[14.5px] leading-6">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ------------------------------------------------------------ trust */}
      <Section>
        <SectionHead
          eyebrow="Why you can rely on it"
          title="The parts that are easy to fake, and how this one does not"
          lead="Preparation material for a new exam is worth exactly as much as its accuracy. These are the things that can be checked."
        />
        <div className="mt-10 grid gap-x-12 gap-y-9 sm:grid-cols-2">
          {TRUST.map((t) => (
            <div key={t.title}>
              <h3 className="text-[15.5px] font-semibold tracking-tight">{t.title}</h3>
              <p className="text-muted-foreground mt-1.5 text-[14.5px] leading-6">{t.body}</p>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-9 text-[13.5px]">
          <Link href="/exam/sources" className="text-foreground underline underline-offset-2">
            See every source behind our exam facts
          </Link>
        </p>
      </Section>

      {/* -------------------------------------------------------------- GAM */}
      <Section tinted>
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div>
            <SectionHead eyebrow="Module B" title={GAM_SECTION.title} />
            <Prose className="mt-5">
              <p>{GAM_SECTION.body}</p>
            </Prose>
            <Link
              href={GAM_SECTION.href}
              className="text-brand hover:text-brand-strong mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium underline-offset-4 hover:underline"
            >
              {GAM_SECTION.cta}
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </div>
          <aside className="border-border bg-card rounded-xl border p-5">
            <h3 className="text-[13px] font-medium tracking-wide uppercase">Where this stands</h3>
            <p className="text-muted-foreground mt-2 text-[14px] leading-6">{GAM_SECTION.caveat}</p>
          </aside>
        </div>
      </Section>

      {/* ------------------------------------------------------------ plans */}
      <Section>
        <SectionHead
          eyebrow="Access"
          title="Free is genuinely usable. Pro is one payment."
          lead="Nothing is time-limited and nothing renews. The free sample is a fixed set of questions, not a trial that expires."
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {[PLANS.free, PLANS.pro].map((plan, i) => (
            <div
              key={plan.name}
              className={
                i === 1
                  ? 'border-border bg-card rounded-xl border p-6'
                  : 'border-border rounded-xl border border-dashed p-6'
              }
            >
              <h3 className="text-[17px] font-semibold tracking-tight">{plan.name}</h3>
              <p className="text-muted-foreground mt-1 text-[14px]">{plan.price}</p>
              <ul className="mt-5 flex flex-col gap-2.5">
                {plan.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[14.5px] leading-6">
                    <Check aria-hidden className="text-brand mt-1 size-3.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-6 text-[13.5px]">
          <Link href="/pricing" className="text-foreground underline underline-offset-2">
            See what Pro costs and what it includes
          </Link>
        </p>
      </Section>

      {/* -------------------------------------------------------- final CTA */}
      <section className="border-border border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="max-w-2xl text-[26px] leading-tight font-semibold tracking-tight text-balance sm:text-[32px]">
            Start with one subtest and see how it goes
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl text-[15.5px] leading-7">
            No account, no email, no card. Your progress is kept in this browser until you decide
            you want it anywhere else.
          </p>
          <Link
            href="/prepare"
            className="bg-brand text-brand-foreground hover:bg-brand-strong group mt-7 inline-flex h-11 items-center gap-2 rounded-md px-5 text-[14.5px] font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Start practising
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
            />
          </Link>
        </div>
      </section>
    </>
  )
}

function Figure({
  value,
  label,
  children,
}: {
  value: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="border-border py-5 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0">
      <dt className="text-muted-foreground order-2 text-[13px]">{label}</dt>
      <dd className="order-1 text-[22px] leading-tight font-semibold tracking-tight tabular-nums sm:text-[24px]">
        {value}
      </dd>
      <dd className="text-muted-foreground mt-1.5 text-[13px] leading-5">{children}</dd>
    </div>
  )
}
