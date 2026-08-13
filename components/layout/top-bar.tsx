'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Command, Search, UserRound } from 'lucide-react'

import { PageContainer } from '@/components/layout/page-shell'
import { SearchDialog } from '@/components/search/search-dialog'
import { breadcrumbsFor } from '@/lib/breadcrumbs'
import { NAV, isActive } from '@/lib/nav'
import { cn } from '@/lib/utils'

/**
 * The context bar: where you are on the left, search and account on the right.
 *
 * The row sits in the same `PageContainer` as the page below it. Without that
 * the bar spans the whole content area while the page is capped and centred, so
 * at 1920 the breadcrumb sat 320px left of the content and the search 258px
 * right of it — the "detached" search field.
 *
 * The design carries no separate page heading: the trail's last segment *is* the
 * page title, so it is the `<h1>`. One heading per page, and the title and the
 * breadcrumb cannot disagree.
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

  const owner = NAV.flatMap((g) => g.links).find((l) => isActive(pathname, l.href))
  const Icon = owner?.icon ?? Search

  return (
    <header className="border-sidebar-border bg-background shrink-0 border-b">
      <PageContainer className="flex h-16 items-center gap-3">
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
                  <span className="text-muted-foreground text-base tracking-tight">
                    {crumb.label}
                  </span>
                )}
                <span aria-hidden className="text-muted-foreground/60 text-base">
                  /
                </span>
              </li>
            ))}
            {current ? (
              <li className="min-w-0">
                {/* The current page is the heading, and is never a link. */}
                <h1
                  aria-current="page"
                  className="text-foreground truncate text-base font-semibold tracking-tight"
                >
                  {current.label}
                </h1>
              </li>
            ) : null}
          </ol>
        </nav>

        <div ref={triggerRef} className="flex shrink-0 items-center gap-2 sm:gap-3">
          <SearchTrigger onOpen={() => setSearchOpen(true)} />
          <ProfileButton />
        </div>
      </PageContainer>

      <SearchDialog open={searchOpen} onClose={closeSearch} />
    </header>
  )
}

/**
 * A button, not an input: it opens the palette rather than accepting typing in
 * place, so it must not look like a field you can type into on focus.
 * Collapses to an icon button below `md`, where the full field would crowd the
 * breadcrumb.
 */
function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-label="Search dMAT Prep"
        aria-keyshortcuts="Meta+K Control+K"
        className={cn(
          'border-border hidden items-center justify-between gap-2 rounded-xl border bg-[#f9fbfc] px-3 py-2.5 md:flex md:w-56 lg:w-72',
          'hover:border-foreground/20 focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none',
        )}
      >
        <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <Search className="size-4" aria-hidden />
          Search
        </span>
        <span
          aria-hidden
          className="text-muted-foreground flex items-center gap-0.5 rounded-sm bg-black/[0.04] px-1.5 py-0.5 text-xs"
        >
          <Command className="size-3" />K
        </span>
      </button>

      <button
        type="button"
        onClick={onOpen}
        aria-label="Search dMAT Prep"
        className="border-border bg-card text-foreground/70 hover:text-foreground hover:bg-muted focus-visible:ring-ring flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:outline-none md:hidden"
      >
        <Search className="size-4" aria-hidden />
      </button>
    </>
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
        'border-border bg-card text-foreground/70 flex size-9 shrink-0 items-center justify-center rounded-full border',
        'hover:text-foreground hover:bg-muted focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none',
      )}
    >
      <UserRound className="size-5" aria-hidden />
    </button>
  )
}
