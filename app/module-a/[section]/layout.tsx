import { notFound } from 'next/navigation'

import { SectionTabs } from '@/components/layout/section-tabs'
import { SECTION_ACCENT } from '@/lib/nav'
import { SECTION_BY_ID, SECTION_IDS, isSectionId } from '@/lib/sections'
import { cn } from '@/lib/utils'

const EYEBROW = {
  figures: 'text-figures',
  equations: 'text-equations',
  latin: 'text-latin',
} as const

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }))
}

export default async function SectionLayout({
  children,
  params,
}: LayoutProps<'/module-a/[section]'>) {
  const { section } = await params
  if (!isSectionId(section)) notFound()

  const meta = SECTION_BY_ID[section]
  const accent = SECTION_ACCENT[section]

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="mb-6">
        <p
          className={cn(
            'text-xs font-semibold tracking-[0.08em] uppercase',
            EYEBROW[accent],
          )}
        >
          Module A · Core Module
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance">{meta.title}</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-pretty">
          {meta.oneLiner}
        </p>
        <p className="text-muted-foreground mt-3 text-xs">
          In the exam: {meta.officialTiming.minutes} minutes for {meta.officialTiming.items} items
        </p>
      </header>

      <SectionTabs sectionId={section} />

      <div className="pt-8">{children}</div>
    </div>
  )
}
