'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { InfoNav } from '@/components/layout/info-nav'
import { NAV, isActive, type NavLink } from '@/lib/nav'
import { cn } from '@/lib/utils'

/**
 * The navigation body, shared by the desktop sidebar and the mobile sheet.
 *
 * The active row is a raised white card on the sidebar's cool plane with the
 * label in brand blue — the design's only use of colour here. Everything else
 * stays plain, so the highlight reads as position rather than emphasis.
 *
 * Two groups, because the four destinations are not four of the same thing:
 * Home, Prepare and Test are the daily loop, and About the Exam is reference.
 * The informational pages hang off the end of that second group rather than
 * sitting in the sidebar's footer, so the two halves of "what is this and how
 * does the exam work" are adjacent instead of at opposite ends of the panel.
 */
export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-5 px-3 py-4" aria-label="Main">
      {NAV.map((group, groupIndex) => (
        <div key={group.label} className="flex flex-col gap-1">
          <h2 className="text-muted-foreground px-2.5 pb-1 text-[11px] leading-4 font-medium tracking-wide uppercase">
            {group.label}
          </h2>

          {group.links.map((link) => (
            <NavRow
              key={link.href}
              link={link}
              active={isActive(pathname, link.href)}
              // Only the exact match is "the current page" — otherwise this and
              // the breadcrumb both claim it.
              current={pathname === link.href}
              onNavigate={onNavigate}
            />
          ))}

          {/* Only under the last group: these are reference pages, and that is
              the reference group. */}
          {groupIndex === NAV.length - 1 ? <InfoNav onNavigate={onNavigate} /> : null}
        </div>
      ))}
    </nav>
  )
}

function NavRow({
  link,
  active,
  current,
  onNavigate,
}: {
  link: NavLink
  active: boolean
  current: boolean
  onNavigate?: () => void
}) {
  const Icon = link.icon

  if (link.disabled) {
    return (
      <span
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
      href={link.href}
      onClick={onNavigate}
      aria-current={current ? 'page' : undefined}
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
          <span className="text-muted-foreground truncate text-xs leading-4">{link.hint}</span>
        ) : null}
      </span>
    </Link>
  )
}
