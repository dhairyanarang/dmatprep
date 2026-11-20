import { notFound } from 'next/navigation'

import { PageContainer } from '@/components/layout/page-shell'
import { SectionTabs } from '@/components/layout/section-tabs'
import { SECTION_BY_ID, SECTION_IDS, isSectionId } from '@/lib/sections'

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }))
}

/**
 * Uses the same container as every other page, so moving from Prepare into a
 * section and on into practice never shifts the content edges.
 *
 * The subtest's name is the page's `<h1>`, in the page. It used to be left to
 * the breadcrumb, which meant both of this section's screens opened with a
 * paragraph of description and no heading above it.
 */
export default async function SectionLayout({
  children,
  params,
}: LayoutProps<'/module-a/[section]'>) {
  const { section } = await params
  if (!isSectionId(section)) notFound()

  const meta = SECTION_BY_ID[section]

  return (
    <PageContainer className="pt-6 pb-12">
      <p className="over mb-1.5">Core Module · Module A</p>
      <h1 className="text-2xl leading-8 font-semibold tracking-[-0.015em]">{meta.title}</h1>
      <p className="text-muted-foreground mt-1 mb-4 max-w-prose text-sm leading-5 text-pretty">
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
