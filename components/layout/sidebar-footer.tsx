import { InfoNav } from '@/components/layout/info-nav'
import { MembershipCard } from '@/components/layout/membership-card'

/**
 * The foot of the sidebar: information, membership, and the one line that has
 * to be on every page.
 *
 * Pinned below the scrolling navigation rather than inside it, so the
 * membership card is reachable without scrolling and the navigation can still
 * grow.
 *
 * **The independence line is load-bearing, not decoration.** The product used
 * to carry it in a global footer under every screen; moving the full statement
 * onto the informational pages would have removed it from practice, the
 * dashboard and the mocks entirely. One quiet sentence here keeps the claim on
 * every page — which is what `npm run release:check` asserts — while the
 * paragraphs live where someone would actually read them.
 */
export function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="border-sidebar-border flex shrink-0 flex-col gap-2 border-t px-3 py-3">
      <InfoNav onNavigate={onNavigate} />
      <MembershipCard onNavigate={onNavigate} />
      <p className="text-muted-foreground/80 px-0.5 text-[10px] leading-3.5 text-balance">
        An independent resource, not affiliated with, endorsed by, or sponsored by g.a.s.t. or
        APS India.
      </p>
    </div>
  )
}
