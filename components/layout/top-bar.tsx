'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, UserRound } from 'lucide-react'

import { MobileNav } from '@/components/layout/mobile-nav'
import { SearchDialog } from '@/components/search/search-dialog'
import { breadcrumbsFor } from '@/lib/breadcrumbs'
import { COMMERCE_ENABLED } from '@/lib/payments/config'
import { useEntitlement } from '@/lib/payments/use-entitlement'
import { cn } from '@/lib/utils'

/**
 * The context bar: where you are on the left, search and account on the right.
 *
 * 52px, spanning the content area edge to edge — it is the shell's bar, not
 * the page's, so it does not sit inside the page's gutters.
 *
 * The trail is where you are, and nothing more. The page's own `<h1>` lives in
 * the page, where the design puts it, so a breadcrumb no longer has to serve
 * as a heading it is too small to be.
 */
export function TopBar() {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)

  // The shortcut the bar advertises has to actually work.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    // The dialog restores focus to whatever had it before, which is `body` when
    // it was opened by the shortcut. Put it back on the visible trigger so the
    // keyboard path ends where it started.
    const buttons = triggerRef.current?.querySelectorAll<HTMLButtonElement>('button')
    const visible = [...(buttons ?? [])].find((b) => b.offsetParent !== null)
    visible?.focus()
  }, [])

  const crumbs = breadcrumbsFor(pathname)
  const trail = crumbs.slice(0, -1)
  const current = crumbs[crumbs.length - 1]

  return (
    <header className="border-line2 bg-background sticky top-0 z-20 flex h-13 shrink-0 items-center gap-3 border-b pr-3 pl-4">
      <MobileNav />

      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden whitespace-nowrap"
      >
        {/* Home is always the first step back, with or without a trail. */}
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex shrink-0 items-center gap-1.5 rounded text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <Home className="size-[18px]" aria-hidden />
          <span className="hidden sm:inline">Home</span>
        </Link>

        {trail.map((crumb) => (
          <span key={crumb.label} className="hidden shrink-0 items-center gap-1.5 sm:flex">
            <Sep />
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-muted-foreground text-sm">{crumb.label}</span>
            )}
          </span>
        ))}

        {current ? (
          <>
            <Sep />
            <b className="truncate text-sm font-semibold" aria-current="page">
              {current.label}
            </b>
          </>
        ) : null}
      </nav>

      <div ref={triggerRef} className="flex shrink-0 items-center gap-2">
        <SearchTrigger onOpen={() => setSearchOpen(true)} />
        <AccountButton />
      </div>

      <SearchDialog open={searchOpen} onClose={closeSearch} />
    </header>
  )
}

function Sep() {
  return (
    <span aria-hidden className="text-[#a3a3a3]">
      /
    </span>
  )
}

/**
 * A button, not an input: it opens the palette rather than accepting typing in
 * place, so it must not look like a field you can type into on focus.
 * Collapses to a square icon button below `md`, where the full field would
 * crowd the breadcrumb.
 */
function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Search dMAT Prep"
      aria-keyshortcuts="Meta+K Control+K"
      className={cn(
        'border-border text-muted-foreground hover:border-line2 flex h-9 items-center gap-1.5 rounded-lg border bg-[rgba(243,242,240,0.6)] transition-colors',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        'w-9 justify-center md:w-56 md:justify-start md:pr-1.5 md:pl-2.5 lg:w-[309px]',
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <span className="hidden flex-1 text-left text-sm md:block">Search</span>
      <span
        aria-hidden
        className="text-muted-foreground hidden h-6 items-center rounded px-1.5 font-mono text-xs md:inline-flex"
        style={{ background: 'rgba(0,0,0,.04)' }}
      >
        ⌘K
      </span>
    </button>
  )
}

/**
 * The account shortcut, with a gold dot when the account holds Pro.
 *
 * A link rather than a popover: the sidebar's account row owns the menu, and
 * two menus for one thing is how a product starts contradicting itself.
 */
function AccountButton() {
  const entitlement = useEntitlement()
  const pro = COMMERCE_ENABLED && entitlement.ready && entitlement.access

  return (
    <Link
      href="/account"
      aria-label={pro ? 'Account — Pro' : 'Account'}
      className="border-border bg-card hover:bg-frame focus-visible:ring-ring relative grid size-9 place-items-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <UserRound className="size-5" aria-hidden />
      {pro ? (
        <span
          aria-hidden
          className="bg-gold border-background absolute -top-[3px] -right-[3px] size-2.5 rounded-full border-2"
        />
      ) : null}
    </Link>
  )
}
