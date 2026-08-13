'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Command, Search, UserRound } from 'lucide-react'

import { breadcrumbsFor } from '@/lib/breadcrumbs'
import { NAV, isActive } from '@/lib/nav'
import { cn } from '@/lib/utils'

/**
 * The context bar: where you are on the left, account controls on the right.
 *
 * The design carries no separate page heading — the trail's last segment *is*
 * the page title, set in semibold against muted parents. So it is the `<h1>`,
 * which keeps one heading per page and stops the title and the breadcrumb from
 * ever disagreeing.
 */
export function TopBar() {
  const pathname = usePathname()
  const crumbs = breadcrumbsFor(pathname)
  if (crumbs.length === 0) return null

  const trail = crumbs.slice(0, -1)
  const current = crumbs[crumbs.length - 1]

  // The icon of whichever top-level destination owns this route.
  const owner = NAV.flatMap((g) => g.links).find((l) => isActive(pathname, l.href))
  const Icon = owner?.icon ?? Search

  return (
    <header className="border-sidebar-border bg-background flex h-16 shrink-0 items-center gap-2.5 border-b px-4 py-3 sm:px-6">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1.5">
        <Icon className="text-muted-foreground hidden size-5 shrink-0 sm:block" aria-hidden />
        <ol className="flex min-w-0 items-center gap-1.5">
          {trail.map((crumb) => (
            <li key={crumb.label} className="hidden shrink-0 items-center gap-1.5 sm:flex">
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded text-base tracking-tight transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-muted-foreground text-base tracking-tight">{crumb.label}</span>
              )}
              <span aria-hidden className="text-muted-foreground/60 text-base">
                /
              </span>
            </li>
          ))}
          <li className="min-w-0">
            {/* The current page is the heading, and is never a link. */}
            <h1
              aria-current="page"
              className="text-foreground truncate text-base font-semibold tracking-tight"
            >
              {current.label}
            </h1>
          </li>
        </ol>
      </nav>

      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        <SearchAffordance />
        <ProfileButton />
      </div>
    </header>
  )
}

/**
 * Search is in the design but there is nothing to search yet — no index, no
 * backend. Shown at the right size so the bar is not redesigned later, and
 * labelled as unavailable rather than pretending to work.
 */
function SearchAffordance() {
  return (
    <button
      type="button"
      aria-disabled="true"
      aria-label="Search — not available yet"
      title="Search is not available yet."
      className={cn(
        'border-border hidden items-center justify-between gap-2 rounded-xl border bg-[#f9fbfc] px-3 py-2.5 md:flex md:w-64 lg:w-[309px]',
        'focus-visible:ring-ring cursor-default focus-visible:ring-2 focus-visible:outline-none',
      )}
    >
      <span className="text-muted-foreground flex items-center gap-1 text-sm">
        <Search className="size-4" aria-hidden />
        Search
      </span>
      <span
        aria-hidden
        className="text-muted-foreground flex items-center gap-0.5 rounded-sm bg-black/[0.04] px-1.5 py-1 text-sm"
      >
        <Command className="size-4" />+ F
      </span>
    </button>
  )
}

/** Placeholder for a future account. There is no auth and no backend. */
function ProfileButton() {
  return (
    <button
      type="button"
      aria-label="Account — not available yet"
      title="Accounts are not available yet. Your progress is saved in this browser."
      className={cn(
        'border-border bg-card text-foreground/70 flex shrink-0 items-center justify-center rounded-full border p-2.5',
        'hover:text-foreground hover:bg-muted focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none',
      )}
    >
      <UserRound className="size-5" aria-hidden />
    </button>
  )
}
