'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NAV, isActive, type NavLink } from '@/lib/nav'
import { cn } from '@/lib/utils'

/**
 * The navigation body, shared by the desktop sidebar and the mobile sheet.
 *
 * The active row is a raised white card on the sidebar's cool plane with the
 * label in brand blue — the design's only use of colour here. Everything else
 * stays plain, so the highlight reads as position rather than emphasis.
 *
 * Two groups, because the destinations are not all the same kind of thing:
 * Home, Prepare and Test are the daily loop, while About the Exam and
 * Information are reference you consult and leave. Information used to be a
 * disclosure here that unfolded into six links; it is a section with its own
 * landing page now, so it is simply a row like the others.
 */
export function NavList({
  onNavigate,
  className,
}: {
  onNavigate?: () => void
  className?: string
}) {
  const pathname = usePathname()

  return (
    <nav className={cn('flex flex-col gap-4 px-3 py-4', className)} aria-label="Main">
      {NAV.map((group, groupIndex) => (
        <div key={group.label} className="flex flex-col gap-2">
          {groupIndex > 0 ? <div aria-hidden className="bg-line2 mb-2 h-px" /> : null}
          {/* A group heading, not an eyebrow: 12px semibold in the text colour,
              because it labels a region rather than decorating one. */}
          <h2 className="text-foreground px-0.5 text-xs leading-[14px] font-semibold">
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
        'flex h-[38px] items-center gap-[9px] rounded-lg border px-2.5',
        'transition-[background-color,border-color,color] duration-150 ease-out',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        active
          ? 'bg-card border-border text-foreground font-semibold'
          : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-[#ecebe8]',
      )}
    >
      <Icon className="size-[18px] shrink-0" aria-hidden />
      <span className="truncate text-sm leading-5">{link.label}</span>
    </Link>
  )
}
