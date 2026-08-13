'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'

import { NavList } from '@/components/layout/nav-list'
import { SidebarBrand } from '@/components/layout/sidebar-brand'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-40 flex h-16 items-center gap-2 border-b px-4 backdrop-blur lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        {/* Base UI composes via `render`, not Radix's `asChild`. */}
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Open navigation">
              <Menu className="size-5" />
            </Button>
          }
        />

        <SheetContent side="left" className="bg-sidebar flex w-72 flex-col p-0">
          <SheetHeader className="h-16 shrink-0 justify-center border-b px-4">
            <SheetTitle className="text-left">
              <SidebarBrand />
            </SheetTitle>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <NavList onNavigate={() => setOpen(false)} />
          </div>

        </SheetContent>
      </Sheet>

      <SidebarBrand />
    </header>
  )
}
