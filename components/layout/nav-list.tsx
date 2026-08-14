'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NAV, isActive } from '@/lib/nav'
import { cn } from '@/lib/utils'

/**
 * The navigation body, shared by the desktop sidebar and the mobile sheet.
 *
 * The active row is a raised white card on the sidebar's cool plane with the
 * label in brand teal — the design's only use of colour here. Everything else
 * stays plain, so the highlight reads as position rather than emphasis.
 */
export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-2 px-3 py-4" aria-label="Main">
      {NAV.flatMap((group) => group.links).map((link) => {
        const Icon = link.icon
        const active = isActive(pathname, link.href)
        // Only the exact match is "the current page" — otherwise this and the
        // breadcrumb both claim it.
        const isCurrentPage = pathname === link.href

        if (link.disabled) {
          return (
            <span
              key={link.href}
              aria-disabled="true"
              className="text-muted-foreground/60 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm"
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {link.label}
            </span>
          )
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={isCurrentPage ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-2',
              // The active row gains a background, a radius and a shadow at once;
              // transitioning only colour left the shadow popping in ahead of it.
              'transition-[background-color,box-shadow,color] duration-150 ease-out',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground rounded-lg shadow-[0_4px_3px_rgba(0,0,0,0.06)]'
                : 'hover:bg-sidebar-accent/60 rounded-md',
            )}
          >
            <Icon
              className={cn(
                'size-5 shrink-0 transition-colors duration-150',
                active ? 'text-brand' : 'text-foreground/70',
              )}
              aria-hidden
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span
                className={cn(
                  'truncate text-sm leading-5',
                  active ? 'text-brand font-semibold' : 'text-foreground',
                )}
              >
                {link.label}
              </span>
              {link.hint ? (
                <span className="text-muted-foreground truncate text-xs leading-4">
                  {link.hint}
                </span>
              ) : null}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
