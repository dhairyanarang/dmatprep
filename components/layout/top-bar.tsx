'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { ProfileButton } from '@/components/layout/profile-button'
import { breadcrumbsFor, currentCrumb } from '@/lib/breadcrumbs'
import { cn } from '@/lib/utils'

/**
 * The context bar every page opens with: where you are, then how you got here.
 *
 * The title is the dominant element and the trail sits under it at a quieter
 * weight — this is orientation, not a second navigation system, so the crumbs
 * are small and the sidebar stays the way you move around. The title defaults
 * to the last crumb, so a page and its breadcrumb cannot drift apart.
 */
export function TopBar({
  title,
  actions,
  className,
}: {
  /** Overrides the crumb-derived title, e.g. the home page. */
  title?: string
  actions?: ReactNode
  className?: string
}) {
  const pathname = usePathname()
  const crumbs = breadcrumbsFor(pathname)
  const heading = title ?? currentCrumb(pathname) ?? 'dMAT Prep'
  const trail = crumbs.slice(0, -1)

  return (
    <div className={cn('flex items-start justify-between gap-4 pt-6 pb-5 lg:pt-8', className)}>
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold tracking-tight">{heading}</h1>

        {crumbs.length > 1 ? (
          <nav aria-label="Breadcrumb" className="mt-1.5">
            <ol className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-xs">
              {trail.map((crumb) => (
                <li key={crumb.label} className="flex items-center gap-1.5">
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-foreground focus-visible:ring-ring rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                  <span aria-hidden className="text-muted-foreground/50">
                    /
                  </span>
                </li>
              ))}
              <li className="min-w-0">
                {/* The current page is never a link. */}
                <span aria-current="page" className="text-foreground/70 block truncate">
                  {crumbs[crumbs.length - 1].label}
                </span>
              </li>
            </ol>
          </nav>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {actions}
        <ProfileButton />
      </div>
    </div>
  )
}
