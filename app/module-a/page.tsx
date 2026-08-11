import Link from 'next/link'

import { PageShell } from '@/components/layout/page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SECTIONS } from '@/lib/sections'

export const metadata = { title: 'Module A — Core Module' }

export default function ModuleAPage() {
  return (
    <PageShell
      title="Module A — Core Module"
      description="Three subtests measuring general cognitive ability. Each runs 25 minutes for 20 items, sat back to back before the 30-minute break."
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Card key={section.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {section.oneLiner}
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <Link
                  href={`/module-a/${section.id}/learn`}
                  className="underline underline-offset-4"
                >
                  Learn
                </Link>
                <Link
                  href={`/module-a/${section.id}/tips`}
                  className="underline underline-offset-4"
                >
                  Tips
                </Link>
                <Link
                  href={`/module-a/${section.id}/practice`}
                  className="underline underline-offset-4"
                >
                  Practice
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  )
}
