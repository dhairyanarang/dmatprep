import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { PageShell } from '@/components/layout/page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { getBankSize } from '@/lib/content/registry'
import { SECTION_ACCENT } from '@/lib/nav'
import { SECTIONS } from '@/lib/sections'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Module A — Core Module' }

const DOT = { figures: 'bg-figures', equations: 'bg-equations', latin: 'bg-latin' } as const

export default function ModuleAPage() {
  return (
    <PageShell
      title="Module A — Core Module"
      description="Three subtests of general cognitive ability, sat back to back. Each runs 25 minutes for 20 items."
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => {
          const accent = SECTION_ACCENT[section.id]

          return (
            <Card key={section.id} className="[--card-spacing:--spacing(5)]">
              <CardContent className="flex h-full flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span aria-hidden className={cn('size-2 rounded-full', DOT[accent])} />
                  <h2 className="text-sm font-medium">{section.title}</h2>
                </div>

                <p className="text-muted-foreground flex-1 text-sm leading-relaxed">
                  {section.oneLiner}
                </p>

                <div className="flex items-center justify-between gap-3 border-t pt-4 text-sm">
                  <div className="flex gap-4">
                    <Link
                      href={`/module-a/${section.id}/learn`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Learn
                    </Link>
                    <Link
                      href={`/module-a/${section.id}/tips`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Tips
                    </Link>
                  </div>

                  <Link
                    href={`/module-a/${section.id}/practice`}
                    className="inline-flex items-center gap-1 font-medium"
                  >
                    Practise
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="text-muted-foreground mt-6 text-xs">
        {SECTIONS.reduce((n, s) => n + getBankSize(s.id), 0)} practice questions across the three
        sections, every one verified against a solver before it shipped.
      </p>
    </PageShell>
  )
}
