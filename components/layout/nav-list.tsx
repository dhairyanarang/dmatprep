'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NAV, isActive } from '@/lib/nav'
import { cn } from '@/lib/utils'

/**
 * The navigation body, shared by the desktop sidebar and the mobile sheet.
 * `onNavigate` lets the sheet close itself on selection.
 */
export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-6 px-3 py-4" aria-label="Main">
      {NAV.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground/80 uppercase">
            {group.label}
          </p>

          {group.links.map((link) => {
            if (link.disabled) {
              return (
                <span
                  key={link.href}
                  aria-disabled="true"
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground/60"
                >
                  {link.label}
                  <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                    Soon
                  </span>
                </span>
              )
            }

            const active = isActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-2 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                  active
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
