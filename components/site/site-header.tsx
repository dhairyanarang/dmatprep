'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

import { SITE_NAV } from '@/content/site/nav'
import { cn } from '@/lib/utils'

/**
 * The public site's header.
 *
 * Deliberately not the product's top bar. That one carries a search field, a
 * breadcrumb and an account control, which are the right tools for somebody
 * already working. A visitor arriving from a search result needs to know what
 * this is and where to start, so the header carries the name, the sections and
 * one action.
 *
 * It is sticky because the public pages are long reads and the way back to
 * practice should never be a scroll away. It takes a border rather than a
 * shadow, which is the rule the rest of the product follows.
 */
export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // A route change closes the menu. Without this the panel stays open over the
  // new page and the first thing a visitor does on arriving is dismiss it.
  //
  // Adjusted during render rather than in an effect. Closing it from an effect
  // renders the new page with the menu still over it and then re-renders to
  // take it away, which React's own guidance calls out and the compiler lint
  // rejects. Comparing the path here means the menu is simply never open on a
  // page it was not opened on.
  const [openedOn, setOpenedOn] = useState(pathname)
  if (openedOn !== pathname) {
    setOpenedOn(pathname)
    setOpen(false)
  }

  // While the panel is open the page behind it must not scroll.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <header className="border-border bg-background/85 sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <span
            aria-hidden
            className="bg-foreground text-background grid size-7 place-items-center rounded-md text-[13px] font-semibold"
          >
            D
          </span>
          <span className="text-[15px] font-semibold tracking-tight">dMAT Prep</span>
        </Link>

        <nav aria-label="Site" className="ml-4 hidden items-center gap-1 md:flex">
          {SITE_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative rounded-md px-3 py-1.5 text-[14px] transition-colors duration-150',
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
                {/* The active marker is a rule under the label, not a filled
                    pill: one chromatic accent per view, and it belongs to the
                    button on the right. */}
                <span
                  aria-hidden
                  className={cn(
                    'bg-brand absolute inset-x-3 -bottom-px h-px origin-left transition-transform duration-150',
                    active ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/prepare"
            className="bg-brand text-brand-foreground hover:bg-brand-strong hidden h-8 items-center rounded-md px-3 text-[13.5px] font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none sm:flex"
          >
            Start practising
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="border-border text-muted-foreground hover:text-foreground grid size-8 place-items-center rounded-md border transition-colors duration-150 md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="site-menu" className="border-border bg-background border-t md:hidden">
          <nav aria-label="Site" className="mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6">
            {SITE_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-foreground/90 hover:bg-frame -mx-2 rounded-md px-2 py-2.5 text-[15px] transition-colors duration-150"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/prepare"
              className="bg-brand text-brand-foreground mt-2 mb-2 flex h-10 items-center justify-center rounded-md text-[14px] font-medium"
            >
              Start practising
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
