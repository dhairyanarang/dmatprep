import type { Metadata } from 'next'
import Link from 'next/link'

import { Prose, Section, SectionHead } from '@/components/site/primitives'
import { canonical, social } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'About dMAT Prep',
  description:
    'Who built dMAT Prep and why, how its questions are verified, and the limits of what an independent preparation tool can tell you about a new examination.',
  alternates: { canonical: canonical('/about') },
  ...social({
    title: 'About dMAT Prep',
    description:
      'An independent practice tool for the dMAT, built by a candidate. How it is made, and what it does not claim.',
    path: '/about',
  }),
}

export default function AboutPage() {
  return (
    <>
      <div className="border-border border-b">
        <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-10 sm:px-6 sm:pt-16">
          <h1 className="text-[30px] leading-tight font-semibold tracking-tight text-balance sm:text-[36px]">
            About dMAT Prep
          </h1>
          <p className="text-muted-foreground mt-4 text-[16px] leading-7">
            An independent practice tool for the Digital Master Assessment Test, built because
            there was almost nothing to practise on.
          </p>
        </div>
      </div>

      <Section>
        <div className="mx-auto max-w-3xl">
          <Prose>
            <h2>Why it exists</h2>
            <p>
              The dMAT was announced in 2026 and first sat on 26 September that year. If you were
              preparing for it in those first months, you had the official preparatory material —
              a few dozen sample tasks — and very little else. Everything beyond that was the same
              handful of facts restated across consultancy blogs, some of it contradictory and
              some of it simply wrong.
            </p>
            <p>
              dMAT Prep was built by one candidate preparing for the same examination, for the
              obvious reason: there was no way to get the hundreds of repetitions the Core Module
              rewards. It is free to start because that was the problem worth solving.
            </p>

            <h2>How the questions are made</h2>
            <p>
              Every question here is original and generated against the task formats the official
              material describes. None of it is copied, adapted or reconstructed from official
              material, which is both a legal requirement and the only way a bank this size could
              exist.
            </p>
            <p>
              Nothing is published until a program has proved it. Equation systems are searched
              exhaustively across every permitted value and published only if exactly one solution
              exists. Figure sequences are re-simulated against the documented rule space and
              rejected if the four shown matrices allow more than one continuation — which is a
              stricter test than checking that the intended answer works, and it is how two
              genuinely ambiguous items were caught before anyone saw them. Latin squares are
              verified by exhaustive completion of the marked cell.
            </p>
            <p>
              A language model writes the prose — explanations, hints, the note on each wrong
              option. It is never the authority on whether an answer is correct. Every logical and
              mathematical claim is decided by code, and the explanations are re-checked against
              the question rather than trusted.
            </p>

            <h2>How we handle facts about the examination</h2>
            <p>
              The rule we work to is that no claim about the dMAT is made from memory. Each one
              traces to a page on the official websites, and the{' '}
              <Link href="/exam/sources">sources page</Link> records which page and when it was
              read.
            </p>
            <p>
              Where the official sources disagree, we show both rather than choosing. There are
              currently two such points: how long the examination runs, and which degree subjects
              are affected. Both matter, and resolving them quietly would be inventing an answer.
            </p>
            <p>
              Where something is not public, we say so. The number of answer options in one Core
              subtest, for instance, is not stated anywhere official — our format is an informed
              inference, and questions that depend on it are labelled that way rather than
              presented as settled.
            </p>

            <h2>What this is not</h2>
            <p>
              It is not official. dMAT Prep is not affiliated with, endorsed by, sponsored by or
              approved by g.a.s.t., the TestDaF-Institut or APS India. <strong>dMAT</strong> is a
              registered word mark belonging to g.a.s.t., used here only to name the examination
              this tool helps you prepare for.
            </p>
            <p>
              It contains no real examination questions. Reproducing test items is prohibited by
              the terms candidates agree to at registration, and anyone offering you real dMAT
              questions is either mistaken or breaking them.
            </p>
            <p>
              It makes no promises about your result. No score guarantee, no success rate, no
              claim that practising here improves an outcome. The examination has been sat once
              and there is no evidence for any such claim — from us or from anybody else.
            </p>

            <h2>Mistakes</h2>
            <p>
              Some of what is here will be wrong, and the useful thing is to hear about it. If you
              find an incorrect answer, a misleading explanation or a fact that has gone stale,{' '}
              <Link href="/contact">tell us</Link> and it will be fixed and the change recorded.
            </p>
          </Prose>
        </div>
      </Section>

      <Section tinted>
        <div className="mx-auto max-w-3xl">
          <SectionHead
            title="Start where it is useful"
            lead="A 150-question sample across the three Core subtests, free and without an account."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/prepare"
              className="bg-brand text-brand-foreground hover:bg-brand-strong inline-flex h-10 items-center rounded-md px-4 text-[14px] font-medium transition-colors duration-150"
            >
              Start practising
            </Link>
            <Link
              href="/faq"
              className="border-border hover:bg-frame inline-flex h-10 items-center rounded-md border px-4 text-[14px] font-medium transition-colors duration-150"
            >
              Read the FAQ
            </Link>
          </div>
        </div>
      </Section>
    </>
  )
}
