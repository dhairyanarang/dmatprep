'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NAV, isActive, type NavLink } from '@/lib/nav'
import { cn } from '@/lib/utils'

const DOT: Record<NonNullable<NavLink['accent']>, string> = {
  figures: 'bg-figures',
  equations: 'bg-equations',
  latin: 'bg-latin',
}

/**
 * The navigation body, shared by the desktop sidebar and the mobile sheet.
 *
 * Group labels and links are deliberately far apart in the type hierarchy —
 * 11px uppercase at half weight versus 14px sentence case — because the labels
 * are signposts, not destinations, and previously read as clickable.
 */
export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col px-3 py-4" aria-label="Main">
      {NAV.map((group, i) => (
        // A rule between groups says "section break" the way indentation and
        // weight alone could not — the labels were still reading as controls.
        <div
          key={group.label}
          className={cn(i > 0 && 'border-sidebar-border mt-5 border-t pt-5')}
        >
          <p className="text-muted-foreground/55 mb-2 px-3 text-[10px] font-semibold tracking-[0.14em] uppercase select-none">
            {group.label}
          </p>

          <div className="flex flex-col gap-1">
            {group.links.map((link) => {
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

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex h-8 items-center gap-2 rounded-md px-3 text-sm transition-colors',
                    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                  )}
                >
                  {/* Active marker doubles as the section's colour cue. */}
                  {/* Acid lime marks the active nav row — one of the two roles
                      the accent is allowed to play. */}
                  {active && (
                    <span
                      aria-hidden
                      className="bg-primary absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full"
                    />
                  )}

                  {link.accent && (
                    <span
                      aria-hidden
                      className={cn(
                        'size-2 shrink-0 rounded-full transition-opacity',
                        DOT[link.accent],
                        active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100',
                      )}
                    />
                  )}

                  <span className="truncate">{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
