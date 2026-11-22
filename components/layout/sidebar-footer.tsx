import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { AccountRow } from '@/components/layout/account-row'
import { MembershipCard } from '@/components/layout/membership-card'
import { getBankSize } from '@/lib/content/registry'
import { SECTION_IDS } from '@/lib/sections'

/**
 * The foot of the sidebar: membership, who you are, and the one line that has
 * to be on every page.
 *
 * Pinned below the scrolling navigation rather than inside it, so both cards
 * are reachable without scrolling and the navigation can still grow. The
 * informational pages live up in the navigation, next to About the Exam.
 *
 * **The independence line is load-bearing, not decoration.** The product used
 * to carry it in a global footer under every screen; moving the full statement
 * onto the informational pages would have removed it from practice, the
 * dashboard and the mocks entirely. One quiet sentence here keeps the claim on
 * every page — which is what `npm run release:check` asserts — while the
 * paragraphs live where someone would actually read them.
 */
export function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  // Counted here, on the server. The card is a client component and must not
  // import the registry itself — that would put the whole question bank into
  // the bundle of every page that renders a sidebar, which is all of them.
  const bankSize = SECTION_IDS.reduce((n, id) => n + getBankSize(id), 0)

  return (
    <div className="flex shrink-0 flex-col gap-2.5 px-3 pt-2 pb-3">
      <MembershipCard onNavigate={onNavigate} bankSize={bankSize} />
      <AccountRow onNavigate={onNavigate} />
      {/*
        The way back to the public site.

        Deliberately here and not in `NAV`: that list is the product's five
        navigation rows and a test pins the count, because the sidebar must not
        grow quietly. This is not a sixth destination in the application — it
        is the exit — so it reads as a quiet line above the independence
        statement rather than as a nav row. It is in `SidebarFooter` so the
        mobile navigation gets it too, since that renders the same component.
      */}
      <Link
        href="/"
        onClick={onNavigate}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-brand -mx-0.5 flex items-center gap-1.5 rounded-md px-0.5 py-1 text-[11.5px] transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
      >
        Visit website
        <ArrowUpRight aria-hidden className="size-3 shrink-0" />
      </Link>
      <p className="text-muted-foreground/80 px-0.5 text-[10px] leading-3.5 text-balance">
        An independent resource, not affiliated with, endorsed by, or sponsored by g.a.s.t. or
        APS India.
      </p>
    </div>
  )
}
