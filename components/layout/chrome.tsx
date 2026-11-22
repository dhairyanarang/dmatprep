'use client'

import { usePathname } from 'next/navigation'

import { AuthNotice } from '@/components/auth/auth-notice'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'

/**
 * Which shell a route gets: the product's, or the public site's.
 *
 * The application is a working tool — sidebar, top bar, the candidate's own
 * progress — and that chrome is right for every screen somebody uses while
 * preparing. It is wrong for the pages a stranger arrives on from a search
 * result, where a product sidebar full of zeroes answers none of the questions
 * that brought them.
 *
 * **Why a switch rather than route groups.** Moving every app route into an
 * `(app)/` group would have given each shell its own layout, which is the
 * textbook arrangement. It would also have renamed a dozen directories that
 * tests, imports and the mock routes all reference by path, for a layout
 * difference. The routes themselves are the product; this file is one small
 * seam and nothing else had to move for it.
 *
 * `usePathname` is available during server rendering, so the marketing HTML a
 * crawler receives genuinely has no sidebar in it — the switch is not a
 * client-side repaint.
 */
const PUBLIC_PREFIXES = ['/faq', '/guides', '/about', '/general-academic']

export function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  /**
   * An unknown path gets the PRODUCT shell, never the public one.
   *
   * `usePathname` can come back null while a route is being prerendered, and
   * the first version of this defaulted to '/' — which is a public route, so
   * every such page silently rendered without the sidebar. That cost
   * /checkout its independence statement, which a committed test caught
   * immediately. The product shell is the safe default because it is the one
   * carrying the disclaimer: being wrong in that direction adds chrome, being
   * wrong in the other direction drops a legal notice.
   */
  if (pathname && isPublicRoute(pathname)) {
    return (
      <div className="flex min-h-svh flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <AuthNotice />
        {/* No global footer inside the product. The independence statement is
            carried by the sidebar's one-line version, and in full by
            `PageDisclaimer` on the informational pages. The public site has a
            real footer because a visitor who arrived from a search result has
            not seen either. */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
