import { NavList } from '@/components/layout/nav-list'
import { SidebarBrand } from '@/components/layout/sidebar-brand'
import { ScrollArea } from '@/components/ui/scroll-area'

/**
 * Sticky, viewport-height sidebar — 264px on a cool plane, per the design.
 *
 * `h-svh` + `sticky` matter: without a height cap the aside stretches to the
 * whole page. `min-h-0` on the scroll area is the other half — a flex child
 * defaults to `min-height: auto` and refuses to shrink below its content.
 */
export function AppSidebar() {
  return (
    <aside className="bg-sidebar border-sidebar-border hidden w-[264px] shrink-0 border-r lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col">
      <div className="border-sidebar-border flex h-16 shrink-0 items-center border-b px-4">
        <SidebarBrand />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <NavList />
      </ScrollArea>
    </aside>
  )
}
