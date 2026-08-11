'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { SectionId } from '@/lib/sections'
import { cn } from '@/lib/utils'

const TABS = [
  { segment: 'learn', label: 'Learn' },
  { segment: 'tips', label: 'Tips & Tricks' },
  { segment: 'practice', label: 'Practice' },
] as const

export function SectionTabs({ sectionId }: { sectionId: SectionId }) {
  const pathname = usePathname()

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
                'border-b-2 px-3 py-2.5 text-sm transition-colors',
                'focus-visible:ring-ring rounded-t-sm focus-visible:ring-2 focus-visible:outline-none',
                active
                  ? 'border-foreground text-foreground font-medium'
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
