import type { Metadata } from 'next'
import Link from 'next/link'

import { Prose, Section, SectionHead } from '@/components/site/primitives'
import { GAM_TOTAL_MINUTES, getPacks, readinessOf, totalGamQuestions } from '@/lib/gam/registry'
import { canonical, social } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'General Academic Module — what it asks, and how to practise it',
  description:
    'The second half of the dMAT: an academic text with figures, tables or formulas, and roughly 60 questions in 90 minutes. What is officially known, and the pilot practice packs available here.',
  alternates: { canonical: canonical('/general-academic') },
  ...social({
    title: 'dMAT General Academic Module — format and practice',
    description:
      'Roughly 60 questions in 90 minutes, answered against an academic source text. What the official material settles, and what it does not.',
    path: '/general-academic',
  }),
}

/**
 * The public page for Module B.
 *
 * It exists because the Core Module has three teaching pages and the second
 * half of the examination had none — a candidate searching for what the
 * General Academic Module actually asks found the practice launcher, which
 * assumes they already know.
 *
 * Two rules govern what it may say. Every factual claim about the examination
 * traces to an official source and is worded here independently; the audit
 * record for all of them is `content/exam/claims.ts`, surfaced at
 * /exam/sources. And every claim about *our own* packs is read from the
 * registry at build time, including how many a person has signed off — a
 * number this page must never round up.
 */
export default function GeneralAcademicPage() {
  const packs = getPacks()
  const reviewed = packs.filter(({ pack }) => readinessOf(pack) === 'reviewed').length
  const domains = [...new Set(packs.map(({ pack }) => pack.domain.replace(/-/g, ' ')))].sort()

  return (
    <>
      <div className="border-border border-b">
        <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-10 sm:px-6 sm:pt-16">
          <p className="text-muted-foreground font-mono text-[12px] tracking-wide uppercase">
            Module B
          </p>
          <h1 className="mt-3 text-[30px] leading-tight font-semibold tracking-tight text-balance sm:text-[36px]">
            The General Academic Module
          </h1>
          <p className="text-muted-foreground mt-4 text-[16px] leading-7">
            The longer half of the dMAT, and the one candidates know least about. It gives you an
            academic text and asks questions that depend on reading it — not on having studied the
            subject.
          </p>
        </div>
      </div>

      <Section>
        <div className="mx-auto max-w-3xl">
          <Prose>
            <h2>What it asks</h2>
            <p>
              Each task pairs an academic input text with a set of questions answered against it.
              The input may carry figures, tables or formulas, and the questions are designed so
              that the text contains what you need. The official preparatory material calls this
              part the Subject Module; the website and the FAQ call it the General Academic Module.
              They are the same ninety minutes.
            </p>
            <ul>
              <li>
                <strong>{GAM_TOTAL_MINUTES} minutes</strong> for the module as a whole — longer than
                the entire Core Module and its break combined.
              </li>
              <li>
                <strong>Approximately 60 questions.</strong> The official FAQ gives that as an
                average and says the actual number may be higher or lower, so treat it as a
                planning figure rather than a count.
              </li>
              <li>
                <strong>Four options, exactly one correct</strong>, and every question is
                single-choice.
              </li>
              <li>
                Subject matter may be drawn from mathematics, computational sciences, the natural
                sciences, engineering, business administration, economics, the social sciences and
                the humanities. The official list is explicitly open-ended.
              </li>
            </ul>
            <p>
              Each of those is sourced on{' '}
              <Link href="/exam/sources">our sources page</Link>, which records the official page it
              came from and the date it was read. The full structure of both modules, including the
              point where the two official sources disagree about the examination&rsquo;s total
              length, is set out on <Link href="/exam/format">the format page</Link>.
            </p>

            <h2>What the official material does not settle</h2>
            <p>
              There is no published breakdown of how the roughly sixty questions divide between
              texts, no stated number of tasks, and no per-task time limit. Anyone telling you
              otherwise is inferring it. The practical consequence is that the module rewards a
              reading pace you can hold for ninety minutes rather than a rehearsed allocation.
            </p>

            <h2>How to prepare for it</h2>
            <p>
              The Core Module rewards drilling, because its three task types are narrow and
              repeat. This module does not work that way: the subject matter is open-ended, so
              there is no syllabus to cover and no point attempting one. What transfers is the
              habit of answering strictly from a source under time pressure.
            </p>
            <ul>
              <li>
                Read the question before re-reading the passage, then go back for the one thing it
                asks about. Reading the whole text twice is the most common way to lose the clock.
              </li>
              <li>
                Separate what the text states from what you already believe. A plausible answer
                that the passage does not support is the characteristic wrong option in this kind
                of task.
              </li>
              <li>
                Practise reading a table or chart for a single value, and check the units and the
                row or column heading before you use it. Misreading an axis costs the same mark as
                not knowing the subject.
              </li>
              <li>
                Nothing may be written down at any point in the dMAT, so build the habit of holding
                an intermediate figure in your head rather than on paper.
              </li>
            </ul>

            <h2>What is available here</h2>
            <p>
              dMAT Prep has {packs.length} original source packs, carrying{' '}
              {totalGamQuestions()} linked questions in all, across {domains.join(', ')}. Each pack
              is a passage written for this hub — with its own tables, figures or formulas — and a
              set of questions that cannot be answered without reading it.
            </p>
            <p>
              This is a pilot set and the page would be dishonest if it pretended otherwise. The
              packs have cleared automated validation, a leakage check that confirms each question
              genuinely depends on its source, and an independent adjudication round in which a
              separate model answered every question without access to the answer key.{' '}
              <strong>
                {reviewed} of {packs.length} have been signed off by a person.
              </strong>{' '}
              Treat the remainder as practice material under review rather than as settled answers,
              and tell us if you find one that is wrong.
            </p>
            <p>
              None of it is official, none of it is drawn from real examination material, and the
              number above is read from the content itself each time this page is built, so it
              cannot drift from what has actually been reviewed.
            </p>
          </Prose>
        </div>
      </Section>

      <Section tinted>
        <div className="mx-auto max-w-3xl">
          <SectionHead
            title="Practise the General Academic packs"
            lead="Free, no account needed. The Core Module practice is separate and larger."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/module-b"
              className="bg-brand text-brand-foreground hover:bg-brand-strong inline-flex h-10 items-center rounded-md px-4 text-[14px] font-medium transition-colors duration-150"
            >
              Open the source packs
            </Link>
            <Link
              href="/exam/format"
              className="border-border hover:bg-frame inline-flex h-10 items-center rounded-md border px-4 text-[14px] font-medium transition-colors duration-150"
            >
              How the exam is structured
            </Link>
          </div>
        </div>
      </Section>
    </>
  )
}
