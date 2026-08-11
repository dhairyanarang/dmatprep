import { notFound } from 'next/navigation'

import { SectionTabs } from '@/components/layout/section-tabs'
import { SECTION_BY_ID, SECTION_IDS, isSectionId } from '@/lib/sections'

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

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="mb-6">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Module A · Core Module
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance">
          {meta.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-pretty">
          {meta.oneLiner}
        </p>
        <p className="text-muted-foreground mt-2 text-xs">
          In the exam: {meta.officialTiming.minutes} minutes for{' '}
          {meta.officialTiming.items} items.
        </p>
      </header>

      <SectionTabs sectionId={section} />

      <div className="pt-6">{children}</div>
    </div>
  )
}
