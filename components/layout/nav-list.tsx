'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NAV, isActive } from '@/lib/nav'
import { cn } from '@/lib/utils'

/**
 * The navigation body, shared by the desktop sidebar and the mobile sheet.
 *
 * Five destinations, each with a line saying what it is for. The group label is
 * gone because with one group it was labelling nothing, and the section colour
 * dots went with the section links they belonged to — those now live on the
 * Prepare page, next to the sections themselves.
 */
export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Main">
      {NAV.flatMap((group) => group.links).map((link) => {
        if (link.disabled) {
          return (
            <span
              key={link.href}
              aria-disabled="true"
              className="text-muted-foreground/50 flex h-8 items-center justify-between gap-2 rounded-md px-3 text-sm"
            >
              {link.label}
              <span className="bg-muted text-muted-foreground/70 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                Soon
              </span>
            </span>
          )
        }

        const active = isActive(pathname, link.href)
        // Highlighted for the whole branch, but only the exact match is "the
        // current page" — otherwise this and the breadcrumb both claim it, and
        // a screen reader is told the page is in two places at once.
        const isCurrentPage = pathname === link.href

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={isCurrentPage ? 'page' : undefined}
            className={cn(
              'group relative flex flex-col justify-center gap-0.5 rounded-md px-3 py-2 transition-colors',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
            )}
          >
            {/* Acid lime marks the active row — one of the two roles the accent
                is allowed to play. */}
            {active && (
              <span
                aria-hidden
                className="bg-primary absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full"
              />
            )}

            <span className={cn('truncate text-sm', active && 'font-medium')}>{link.label}</span>
            {link.hint ? (
              <span className="text-muted-foreground/70 truncate text-xs">{link.hint}</span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
