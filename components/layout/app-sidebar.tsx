import { NavList } from '@/components/layout/nav-list'
import { SidebarBrand } from '@/components/layout/sidebar-brand'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { ScrollArea } from '@/components/ui/scroll-area'

/**
 * Sticky, viewport-height sidebar.
 *
 * `h-svh` + `sticky` matter: without a height cap the aside stretches to the
 * whole page, so on a long page the footer lands 1500px down instead of at the
 * bottom of the screen. `min-h-0` on the scroll area is the other half — a flex
 * child defaults to `min-height: auto` and refuses to shrink below its content,
 * which pushes the footer out of view even once the height is capped.
 */
export function AppSidebar() {
  return (
    <aside className="bg-sidebar border-sidebar-border hidden w-64 shrink-0 border-r lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col">
      <div className="flex h-16 shrink-0 items-center px-4">
        <SidebarBrand />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <NavList />
      </ScrollArea>

      <div className="border-sidebar-border shrink-0 border-t p-3">
        <ThemeToggle />
      </div>
    </aside>
  )
}
