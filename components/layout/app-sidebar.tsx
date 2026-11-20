import { NavList } from '@/components/layout/nav-list'
import { SidebarFooter } from '@/components/layout/sidebar-footer'
import { SidebarBrand } from '@/components/layout/sidebar-brand'

/**
 * Sticky, viewport-height sidebar — 240px on the cool plane, per the design.
 *
 * `h-svh` + `sticky` matter: without a height cap the aside stretches to the
 * whole page. `min-h-0` on the scrolling nav is the other half — a flex child
 * defaults to `min-height: auto` and refuses to shrink below its content.
 */
export function AppSidebar() {
  return (
    <aside className="bg-sidebar border-line2 hidden w-60 shrink-0 border-r lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col">
      <div className="border-line2 flex h-13 shrink-0 items-center gap-3 border-b pr-3 pl-4">
        <SidebarBrand />
      </div>

      <NavList className="min-h-0 flex-1 overflow-auto" />

      <SidebarFooter />
    </aside>
  )
}
