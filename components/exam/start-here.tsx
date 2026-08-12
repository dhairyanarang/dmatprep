import Link from 'next/link'

import { Disclosure } from '@/components/content/disclosure'
import { ProvenanceTag } from '@/components/content/provenance'

/**
 * The eight questions a first-time reader actually arrives with, answered in a
 * sentence each and expandable for the rest.
 *
 * Every answer here restates facts already carried by the verified content
 * system — nothing new is asserted, and the links go to the page that holds the
 * full claim and its source.
 */
const ANSWERS: { q: string; a: React.ReactNode; more?: React.ReactNode }[] = [
  {
    q: 'What is the dMAT?',
    a: (
      <>
        A digital admissions test from g.a.s.t., first sat on 26 September 2026. It has two parts: a
        Core Module of three cognitive subtests, and a Subject Module.
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
        APS India is explicit that the affected-fields list is guidance and not exhaustive, and that
        the official degree title decides. Exemptions cover pre-29 June 2026 APS registrations,
        existing certificate holders, Bachelor&rsquo;s and PhD applicants, and confirmed exchange
        programmes. <Link href="/exam/logistics">Dates &amp; logistics</Link> has the full list.
      </>
    ),
  },
  {
    q: 'What is Module A?',
    a: (
      <>
        The Core Module — three subtests of general cognitive ability, sat back to back, 25 minutes
        each. This is what dMAT Prep covers.
      </>
    ),
  },
  {
    q: 'What are the three Core subtests?',
    a: (
      <>
        Figure Sequences (continue a series of 4×4 matrices), Mathematical Equations (solve a small
        system where every letter is a whole number from 1 to 20), and Latin Squares (find the
        missing letter in a 5×5 grid).
      </>
    ),
  },
  {
    q: 'How long is each one?',
    a: <>25 minutes for 20 items, in all three — 75 minutes of Core testing in total.</>,
    more: (
      <>
        75 seconds per item is 25 minutes divided by 20. It is an average to pace against, not a
        published per-question limit.
      </>
    ),
  },
  {
    q: 'What are the important dates?',
    a: (
      <>
        Registration closes <strong>15 September 2026</strong>. The exam is{' '}
        <strong>26 September 2026</strong>. Certificates are available from 12 October 2026.
      </>
    ),
  },
  {
    q: 'What do I need on exam day?',
    a: (
      <>
        The ID or passport you registered with — and nothing else on the desk. No phones, watches,
        calculators or notes at any point.
      </>
    ),
    more: (
      <>
        The <Link href="/exam/checklist">pre-exam checklist</Link> covers the whole list, and{' '}
        <Link href="/exam/rules">exam-day rules</Link> covers what counts as exclusion.
      </>
    ),
  },
  {
    q: 'Where does this information come from?',
    a: (
      <>
        Only g.a.s.t. (d-mat.de) and APS India. Every factual claim in dMAT Prep is listed against
        its source on the <Link href="/exam/sources">sources page</Link>.
      </>
    ),
    more: (
      <>
        Third-party dMAT guides are not cited anywhere here — several circulating ones contain wrong
        item counts. Where something is not confirmed by an official source, it is marked{' '}
        <ProvenanceTag kind="unconfirmed" /> rather than presented as a rule.
      </>
    ),
  },
]

export function StartHere() {
  return (
    <div className="space-y-2">
      {ANSWERS.map((entry) => (
        <Disclosure key={entry.q} summary={entry.q}>
          <div className="space-y-2">
            <p className="text-sm leading-relaxed">{entry.a}</p>
            {entry.more ? (
              <p className="text-muted-foreground text-sm leading-relaxed [&_a]:underline [&_a]:underline-offset-4">
                {entry.more}
              </p>
            ) : null}
          </div>
        </Disclosure>
      ))}
    </div>
  )
}
