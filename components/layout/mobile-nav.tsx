'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'

import { NavList } from '@/components/layout/nav-list'
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
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4 backdrop-blur lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        {/* Base UI composes via `render`, not Radix's `asChild`. */}
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </Button>
          }
        />

        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="h-14 justify-center border-b px-6">
            <SheetTitle className="text-sm font-semibold">dMAT Prep</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto">
            <NavList onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/" className="text-sm font-semibold">
        dMAT Prep
      </Link>
    </header>
  )
}
