'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { SECTION_ACCENT } from '@/lib/nav'
import type { SectionId } from '@/lib/sections'
import { cn } from '@/lib/utils'

const TABS = [
  { segment: 'overview', label: 'Overview' },
  { segment: 'practice', label: 'Practice' },
] as const

const ACTIVE = {
  figures: 'border-figures text-foreground',
  equations: 'border-equations text-foreground',
  latin: 'border-latin text-foreground',
} as const

export function SectionTabs({ sectionId }: { sectionId: SectionId }) {
  const pathname = usePathname()
  const accent = SECTION_ACCENT[sectionId]

  // The section landing page offers the same three routes as cards; showing
  // tabs there too would be two navigations for one decision.
  if (pathname === `/module-a/${sectionId}`) return null

  return (
    <div className="border-b">
      <nav className="-mb-px flex gap-1" aria-label="Section">
        {TABS.map((tab) => {
          const href = `/module-a/${sectionId}/${tab.segment}`
          const active = pathname === href

          return (
            <Link
              key={tab.segment}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-10 items-center rounded-t-md border-b-2 px-3 text-sm transition-colors',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                active
                  ? `${ACTIVE[accent]} font-medium`
                  : 'text-muted-foreground hover:text-foreground border-transparent',
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
