import Link from 'next/link'

import { Disclosure } from '@/components/content/disclosure'

/**
 * The five questions someone actually arrives with, answered in a line each.
 *
 * Short answer first, detail behind a disclosure, and the page holding the full
 * claim one link away. Nothing is asserted here that the verified content system
 * does not already carry — this is a different door into the same facts, not a
 * second copy of them.
 */
const ANSWERS: { q: string; a: React.ReactNode; more?: React.ReactNode }[] = [
  {
    q: 'What is the dMAT?',
    a: (
      <>
        A digital admissions test from g.a.s.t., first sat on 26 September 2026. Two parts: a Core
        Module of three cognitive subtests, and a Subject Module.
      </>
    ),
    more: (
      <>
        The Core Module runs 25 minutes per subtest; the Subject Module runs 90. All tasks are
        single-choice. <Link href="/exam/format">Format &amp; structure</Link> has the full
        breakdown, including where the two official sources disagree on total duration.
      </>
    ),
  },
  {
    q: 'Do I need to sit it?',
    a: (
      <>
        It applies to Master&rsquo;s applicants in Engineering; Commerce, Accounting, Finance or
        Economics; and Business or Management, targeting summer semester 2027 or later.
      </>
    ),
    more: (
      <>
        APS India is explicit that the list is guidance and not exhaustive, and that the official
        degree title decides. Exemptions cover pre-29 June 2026 APS registrations, existing
        certificate holders, Bachelor&rsquo;s and PhD applicants, and confirmed exchange programmes.{' '}
        <Link href="/exam/logistics">Dates &amp; logistics</Link> lists them.
      </>
    ),
  },
  {
    q: 'What is Module A?',
    a: (
      <>
        The Core Module: Figure Sequences, Mathematical Equations and Latin Squares, sat back to
        back at 25 minutes each. It tests reasoning, not subject knowledge.
      </>
    ),
  },
  {
    q: 'What can I practise here?',
    a: (
      <>
        All three Core subtests — 135 questions with worked visual solutions and progressive hints,
        plus timed practice and a full Module A mock. The Subject Module is not covered yet.
      </>
    ),
    more: (
      <>
        Every question is checked by a solver before it ships: unique answer, valid rules, and a
        named reason for each wrong option. Nothing is generated and published unverified.
      </>
    ),
  },
  {
    q: 'What should I do next?',
    a: (
      <>
        If you are new to the format, take the <Link href="/practice/diagnostic">diagnostic</Link> —
        fifteen questions, no clock — and it will point you at a section. Otherwise go straight to{' '}
        <Link href="/prepare">Prepare</Link>.
      </>
    ),
  },
]

export function StartHere() {
  return (
    <div className="space-y-2">
      {ANSWERS.map((entry) => (
        <Disclosure key={entry.q} summary={entry.q}>
          <div className="space-y-2 [&_a]:underline [&_a]:underline-offset-4">
            <p className="text-sm leading-relaxed">{entry.a}</p>
            {entry.more ? (
              <p className="text-muted-foreground text-sm leading-relaxed">{entry.more}</p>
            ) : null}
          </div>
        </Disclosure>
      ))}
    </div>
  )
}
