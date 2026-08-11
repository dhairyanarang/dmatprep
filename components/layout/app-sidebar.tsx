import Link from 'next/link'

import { NavList } from '@/components/layout/nav-list'
import { ScrollArea } from '@/components/ui/scroll-area'

export function AppSidebar() {
  return (
    <aside className="bg-sidebar hidden w-64 shrink-0 border-r lg:flex lg:flex-col">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">dMAT Prep</span>
          <span className="text-muted-foreground text-xs">26 September 2026</span>
        </Link>
      </div>

      <ScrollArea className="flex-1">
        <NavList />
      </ScrollArea>
    </aside>
  )
}
