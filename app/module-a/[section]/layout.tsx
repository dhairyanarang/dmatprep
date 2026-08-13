import { notFound } from 'next/navigation'

import { PageContainer } from '@/components/layout/page-shell'
import { SectionTabs } from '@/components/layout/section-tabs'
import { TopBar } from '@/components/layout/top-bar'
import { SECTION_BY_ID, SECTION_IDS, isSectionId } from '@/lib/sections'

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }))
}

/**
 * Uses the same container as every other page, so moving from Prepare into a
 * section and on into practice never shifts the content edges. The title and
 * trail come from the shared top bar — the eyebrow that used to say
 * "Module A · Core Module" is now the breadcrumb, which says it once.
 */
export default async function SectionLayout({
  children,
  params,
}: LayoutProps<'/module-a/[section]'>) {
  const { section } = await params
  if (!isSectionId(section)) notFound()

  const meta = SECTION_BY_ID[section]

  return (
    <PageContainer className="pb-10 lg:pb-12">
      <TopBar />

      <p className="text-muted-foreground -mt-2 mb-4 max-w-prose text-sm leading-relaxed text-pretty">
        {meta.oneLiner}{' '}
        <span className="whitespace-nowrap">
          In the exam: {meta.officialTiming.minutes} minutes for {meta.officialTiming.items} items.
        </span>
      </p>

      <SectionTabs sectionId={section} />

      <div className="pt-8">{children}</div>
    </PageContainer>
  )
}
