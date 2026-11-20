import Link from 'next/link'
import { ChevronRight, Info } from 'lucide-react'

import { INFO_LINKS } from '@/lib/nav'

/**
 * The informational pages, collapsed by default at the foot of the sidebar.
 *
 * Built on `<details>` rather than a JS collapsible, for the same reasons
 * `components/content/disclosure.tsx` is: it needs no client boundary, it is
 * keyboard operable and announced for free, and — the reason that matters
 * here — **the links are in the DOM whether or not it is open**. Nothing about
 * their discoverability depends on React having hydrated.
 *
 * Collapsed by default because none of these is a destination. They are what
 * you look for once, deliberately.
 */
export function InfoNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <details className="group">
      <summary className="text-muted-foreground hover:text-foreground flex h-[38px] cursor-pointer list-none items-center gap-[9px] rounded-lg border border-transparent px-2.5 text-sm transition-colors duration-150 hover:bg-[#ecebe8]">
        <Info className="size-[18px] shrink-0" aria-hidden />
        <span className="flex-1 leading-5">Information</span>
        <ChevronRight
          aria-hidden
          className="text-muted-foreground size-3.5 shrink-0 transition-transform duration-150 ease-out group-open:rotate-90"
        />
      </summary>

      <nav aria-label="Information" className="mt-0.5 flex flex-col pb-1 pl-[27px]">
        {INFO_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className="text-muted-foreground hover:text-foreground rounded-md px-2.5 py-1.5 text-xs leading-4 transition-colors duration-150 hover:bg-[#ecebe8]"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </details>
  )
}
