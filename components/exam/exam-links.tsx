import Link from 'next/link'
import { Calendar1, Info, LayoutPanelTop, Link2, Scale, Tally5 } from 'lucide-react'

import { ArrowAffordance } from '@/components/ui/arrow-affordance'

/**
 * The exam reference pages as one bordered block rather than six competing
 * cards — the design groups them into a single grid so they read as a list of
 * places to look, not as six things demanding attention.
 */
const LINKS = [
  { href: '/exam/format', label: 'About dMAT', icon: Info },
  { href: '/exam/format', label: 'Format & Structure', icon: LayoutPanelTop },
  { href: '/exam/scoring', label: 'Scoring & Results', icon: Tally5 },
  { href: '/exam/logistics', label: 'Dates and Logistics', icon: Calendar1 },
  { href: '/exam/rules', label: 'Exam Day Rules', icon: Scale },
  { href: '/exam/sources', label: 'Sources', icon: Link2 },
]

export function ExamLinks() {
  return (
    <div className="border-border grid overflow-hidden rounded-3xl border sm:grid-cols-2">
      {LINKS.map((item, i) => {
        const Icon = item.icon
        return (
          <Link
            key={item.label}
            href={item.href}
            className={[
              'group hover:bg-muted/50 focus-visible:ring-ring flex items-center justify-between gap-3 p-6 transition-colors focus-visible:ring-2 focus-visible:outline-none',
              // Interior hairlines only — the block's own border is the outside.
              i % 2 === 0 ? 'sm:border-r' : '',
              i < LINKS.length - 2 ? 'border-b' : 'max-sm:border-b max-sm:last:border-b-0',
            ].join(' ')}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Icon className="text-foreground/70 size-5 shrink-0" aria-hidden />
              <span className="truncate text-sm font-medium">{item.label}</span>
            </span>
            <ArrowAffordance />
          </Link>
        )
      })}
    </div>
  )
}
