'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'

import { NavList } from '@/components/layout/nav-list'
import { SidebarFooter } from '@/components/layout/sidebar-footer'
import { SidebarBrand } from '@/components/layout/sidebar-brand'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

/**
 * The sidebar as a drawer, below `lg`.
 *
 * It is a control inside the top bar rather than a second header of its own.
 * Two stacked bars — one carrying the brand, one the breadcrumb — cost 128px
 * of a phone screen before any content, and the design has one.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Base UI composes via `render`, not Radix's `asChild`. */}
      <SheetTrigger
        render={
          <button
            type="button"
            aria-label="Open navigation"
            className="border-border bg-card hover:bg-frame focus-visible:ring-ring grid size-[30px] shrink-0 place-items-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:outline-none lg:hidden"
          >
            <Menu className="size-4" />
          </button>
        }
      />

      <SheetContent side="left" className="bg-sidebar flex w-[264px] flex-col p-0">
        <SheetHeader className="border-line2 h-13 shrink-0 justify-center border-b px-4">
          <SheetTitle className="text-left">
            <SidebarBrand />
          </SheetTitle>
        </SheetHeader>

        <NavList className="min-h-0 flex-1 overflow-y-auto" onNavigate={() => setOpen(false)} />

        <SidebarFooter onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
