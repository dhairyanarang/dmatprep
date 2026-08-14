import Link from 'next/link'
import {
  Calendar1,
  LayoutPanelTop,
  Link2,
  ListChecks,
  Scale,
  Tally5,
  type LucideIcon,
} from 'lucide-react'

import { ArrowAffordance } from '@/components/ui/arrow-affordance'

/**
 * The six exam reference pages, each with the one line that says what it
 * answers.
 *
 * Separate cards here rather than the single bordered block used on Home: this
 * is the page where the reference *is* the content, so each destination gets
 * room for a description. On Home it is a footnote and stays compact.
 */
const DETAILS: { href: string; title: string; description: string; icon: LucideIcon }[] = [
  {
    href: '/exam/format',
    title: 'Format & Structure',
    description: 'The two modules, the three Core subtests, and how the day is timed.',
    icon: LayoutPanelTop,
  },
  {
    href: '/exam/scoring',
    title: 'Scoring & Results',
    description: 'The 0–200 scale, the percentile rank, and when the certificate arrives.',
    icon: Tally5,
  },
  {
    href: '/exam/rules',
    title: 'Exam Day Rules',
    description: 'What you may bring, what counts as exclusion, and what happens if you break a rule.',
    icon: Scale,
  },
  {
    href: '/exam/logistics',
    title: 'Dates and Logistics',
    description: 'Deadlines, the fee, test centres, and who the requirement applies to.',
    icon: Calendar1,
  },
  {
    href: '/exam/checklist',
    title: 'Pre-exam checklist',
    description: 'Everything to settle before the day, official requirements kept apart from our advice.',
    icon: ListChecks,
  },
  {
    href: '/exam/sources',
    title: 'Sources',
    description: 'Every factual claim in dMAT Prep, listed against the official document behind it.',
    icon: Link2,
  },
]

export function ExamDetailCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {DETAILS.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group border-border bg-card hover:border-brand/40 focus-visible:ring-ring flex items-start gap-3 rounded-2xl border p-4 transition-[border-color,translate] duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none"
          >
            <span aria-hidden className="bg-brand/8 flex shrink-0 items-center rounded-md p-2">
              <Icon className="text-brand size-5" />
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-base leading-5 font-medium">{item.title}</span>
              <span className="text-muted-foreground text-sm leading-5 font-medium text-pretty">
                {item.description}
              </span>
            </span>

            <ArrowAffordance className="mt-0.5" />
          </Link>
        )
      })}
    </div>
  )
}
