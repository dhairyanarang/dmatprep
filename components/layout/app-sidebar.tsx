import { NavList } from '@/components/layout/nav-list'
import { SidebarBrand } from '@/components/layout/sidebar-brand'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AppSidebar() {
  return (
    <aside className="bg-sidebar border-sidebar-border hidden w-64 shrink-0 border-r lg:flex lg:flex-col">
      <div className="flex h-16 shrink-0 items-center px-4">
        <SidebarBrand />
      </div>

      <ScrollArea className="flex-1">
        <NavList />
      </ScrollArea>

      <div className="border-sidebar-border shrink-0 border-t p-3">
        <ThemeToggle />
      </div>
    </aside>
  )
}
