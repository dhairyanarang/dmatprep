import type { Metadata } from 'next'
import Link from 'next/link'

import { FaqAccordion } from '@/components/site/faq-accordion'
import { FAQ, FAQ_COUNT } from '@/content/site/faq'
import { canonical, jsonLdProps, social } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'dMAT FAQ — dates, format, scoring and preparation',
  description:
    'Answers to common questions about the Digital Master Assessment Test: who has to take it, the 2027 dates and fee, how it is scored, what is allowed in the room, and how to prepare.',
  alternates: { canonical: canonical('/faq') },
  ...social({
    title: 'dMAT FAQ — dates, format, scoring and preparation',
    description:
      'Sourced answers to the questions candidates ask about the dMAT, with the official page each one came from.',
    path: '/faq',
  }),
}

/**
 * FAQPage structured data.
 *
 * Only the questions about the examination and this site are included, each
 * with its plain-text answer. Google's guidance is that the markup must match
 * what a visitor sees, so it is generated from the same content the page
 * renders rather than written separately — the two cannot drift apart.
 */
function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.flatMap((c) =>
      c.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a.join(' ') },
      })),
    ),
  }
}

export default function FaqPage() {
  return (
    <>
      <script {...jsonLdProps(faqJsonLd())} />

      <div className="border-border border-b">
        <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-10 sm:px-6 sm:pt-16">
          <p className="text-muted-foreground font-mono text-[12px] tracking-wide uppercase">
            {FAQ_COUNT} questions
          </p>
          <h1 className="mt-3 max-w-3xl text-[30px] leading-tight font-semibold tracking-tight text-balance sm:text-[38px]">
            Questions about the dMAT, answered
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-[15.5px] leading-7">
            Every answer about the examination names the official page it came from, so you can
            check it yourself. Where the official sources disagree — and on one point they do —
            both are shown. Where something is not public, the answer says so.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[200px_1fr] lg:gap-14">
          {/* On a wide screen the categories become a standing index; on a
              phone they collapse into ordinary in-page links above the list. */}
          <nav aria-label="Categories" className="lg:sticky lg:top-20 lg:self-start">
            <h2 className="text-muted-foreground text-[12px] font-medium tracking-wide uppercase">
              Sections
            </h2>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 lg:flex-col lg:gap-2">
              {FAQ.map((c) => (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    className="text-muted-foreground hover:text-foreground text-[14px] transition-colors duration-150"
                  >
                    {c.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0">
            {FAQ.map((c) => (
              <section key={c.id} id={c.id} className="scroll-mt-20 [&+&]:mt-14">
                <h2 className="text-[20px] font-semibold tracking-tight">{c.title}</h2>
                <p className="text-muted-foreground mt-1.5 text-[14.5px]">{c.blurb}</p>
                <div className="mt-5">
                  <FaqAccordion items={c.items} />
                </div>
              </section>
            ))}

            <div className="border-border bg-frame/40 mt-14 rounded-xl border p-6">
              <h2 className="text-[16.5px] font-semibold tracking-tight">
                Something still unanswered?
              </h2>
              <p className="text-muted-foreground mt-2 max-w-[60ch] text-[14.5px] leading-6">
                For anything about registration, fees, eligibility or results, the official
                sources are the only ones worth trusting. For anything about this site, get in
                touch.
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                <Link
                  href="/exam/sources"
                  className="text-brand hover:text-brand-strong text-[14px] font-medium underline-offset-4 hover:underline"
                >
                  Our sources
                </Link>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-foreground text-[14px] underline-offset-4 hover:underline"
                >
                  Contact
                </Link>
                <Link
                  href="/guides"
                  className="text-muted-foreground hover:text-foreground text-[14px] underline-offset-4 hover:underline"
                >
                  Preparation guides
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
