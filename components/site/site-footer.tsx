import Link from 'next/link'

import { CORE_SUBTESTS } from '@/content/site/nav'

/**
 * The public footer, and the place the independence statement is made in full.
 *
 * Inside the product that statement lives in the sidebar, where somebody
 * working through a practice set has already seen it. A visitor who landed on
 * an article from a search result has not, so it is spelled out here —
 * including the trademark attribution, because `dMAT` is a registered word
 * mark held by g.a.s.t. and using it to name the exam is nominative use, not a
 * claim of any relationship.
 */
const COLUMNS = [
  {
    title: 'Practise',
    links: [
      { href: '/prepare', label: 'All practice' },
      ...CORE_SUBTESTS.map((s) => ({ href: s.practiceHref, label: s.name })),
      { href: '/test', label: 'Mock exams' },
    ],
  },
  {
    title: 'The exam',
    links: [
      { href: '/exam', label: 'About the dMAT' },
      { href: '/exam/format', label: 'Format and structure' },
      { href: '/general-academic', label: 'General Academic Module' },
      { href: '/exam/scoring', label: 'Scoring and results' },
      { href: '/exam/rules', label: 'Exam-day rules' },
      { href: '/exam/sources', label: 'Where our facts come from' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { href: '/guides', label: 'Preparation guides' },
      { href: '/faq', label: 'Frequently asked questions' },
      { href: '/pricing', label: 'Free and Pro' },
      { href: '/about', label: 'About dMAT Prep' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/contact', label: 'Contact' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-border bg-frame/40 mt-20 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="bg-foreground text-background grid size-7 place-items-center rounded-md text-[13px] font-semibold"
              >
                D
              </span>
              <span className="text-[15px] font-semibold tracking-tight">dMAT Prep</span>
            </div>
            <p className="text-muted-foreground mt-3 max-w-xs text-[13.5px] leading-6">
              A free practice tool for the Digital Master Assessment Test, built by one
              candidate for the rest.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-[12px] font-medium tracking-wide uppercase">{col.title}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-muted-foreground hover:text-foreground text-[13.5px] transition-colors duration-150"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-border text-muted-foreground mt-10 border-t pt-6 text-[12.5px] leading-6">
          <p className="max-w-3xl">
            {/* This sentence is load-bearing and its wording is pinned by
                scripts/test/public-claims.test.mjs, which checks that every
                prerendered page carries it. Keep it identical to the sidebar
                and the full disclaimer; a reworded copy would pass a reader
                and fail the gate. */}
            dMAT Prep is an independent study tool. It is not affiliated with, endorsed by, or
            sponsored by g.a.s.t. (Gesellschaft für Akademische Studienvorbereitung und
            Testentwicklung e.&nbsp;V.), the TestDaF-Institut, or the Academic Evaluation
            Centre (APS) India, and nobody connected with the examination has reviewed or
            approved anything here. <span className="whitespace-nowrap">dMAT</span> is a
            registered word mark of g.a.s.t.; it is used only to name the examination this tool
            helps you prepare for.
          </p>
          <p className="mt-3 max-w-3xl">
            No official examination questions are reproduced anywhere on this site. Every
            practice question, explanation and diagram is written for dMAT Prep. Facts about the
            examination are summarised in our own words from the official sources listed on{' '}
            <Link href="/exam/sources" className="text-foreground underline underline-offset-2">
              the sources page
            </Link>
            . Always confirm dates, fees and requirements on the official websites before you
            rely on them.
          </p>
          <p className="mt-4">© {new Date().getFullYear()} dMAT Prep</p>
        </div>
      </div>
    </footer>
  )
}
