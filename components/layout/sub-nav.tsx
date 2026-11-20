'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

export type SubNavLink = { href: string; label: string }

/**
 * An internal sidebar for a section that has several pages.
 *
 * About the Exam and Information are both "one subject, several documents",
 * and both used to be reached by hunting — one through a grid of cards you
 * had to come back to Home to see again, the other through a dropdown in the
 * sidebar that hid the policies behind a click nobody makes twice. This puts
 * the whole set on screen and keeps it there while you read.
 *
 * Links, not tabs: every destination keeps its own URL, so a direct link, the
 * back button and a bookmark all behave exactly as they did.
 *
 * On a narrow screen it becomes a horizontally scrolling strip above the
 * content rather than a column beside it — a 200px column on a 390px phone
 * leaves nothing for the document.
 */
export function SubNav({
  label,
  links,
  aside,
}: {
  label: string
  links: SubNavLink[]
  /** Optional card under the list, e.g. a support prompt. */
  aside?: React.ReactNode
}) {
  const pathname = usePathname()
  const strip = useRef<HTMLDivElement>(null)

  /**
   * Bring the current page into view in the mobile strip.
   *
   * On a phone the list scrolls sideways, and the page you are reading is
   * frequently past the right edge — so the strip opened showing the first
   * three items and no indication that you were on the sixth. `nearest` keeps
   * it still when the item is already visible, which is every time on a
   * laptop.
   */
  useEffect(() => {
    const active = strip.current?.querySelector('[aria-current="page"]')
    active?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }, [pathname])

  return (
    <nav
      aria-label={label}
      className="flex min-w-0 shrink-0 flex-col gap-0.5 lg:sticky lg:top-[68px] lg:w-[200px]"
    >
      <span className="over hidden px-2.5 pb-2 lg:block">{label}</span>

      <div
        ref={strip}
        className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
      >
        {links.map((link) => {
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-9 shrink-0 items-center rounded-lg border px-2.5 text-sm whitespace-nowrap transition-colors',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                active
                  ? 'border-border bg-card text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-[#ecebe8]',
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </div>

      {aside ? <div className="mt-5 hidden lg:block">{aside}</div> : null}
    </nav>
  )
}

/**
 * The two-column frame a `SubNav` sits in: nav beside content on a laptop,
 * stacked on a phone.
 */
export function SubNavLayout({
  nav,
  children,
}: {
  nav: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-6 lg:flex-row lg:gap-10">
      {nav}
      <div className="flex min-w-0 flex-1 flex-col gap-6">{children}</div>
    </div>
  )
}

/**
 * A page inside a `SubNavLayout`.
 *
 * It renders the heading and the content and nothing else — the container,
 * the gutters and the page entrance all belong to the layout. A page that
 * brought its own `PageContainer` inside one would double every gutter and
 * start a second staggered entrance inside the first.
 */
export function SubPage({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl leading-8 font-semibold tracking-[-0.015em]">{title}</h1>
          {description ? (
            <p className="text-muted-foreground mt-1 max-w-prose text-sm leading-5 text-pretty">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </>
  )
}
