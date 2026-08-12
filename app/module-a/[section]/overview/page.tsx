import { notFound } from 'next/navigation'

import { ContentBlocks } from '@/components/content/content-blocks'
import { getGuide } from '@/lib/content/registry'
import { SECTION_BY_ID, SECTION_IDS, isSectionId } from '@/lib/sections'

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }))
}

export async function generateMetadata({
  params,
}: PageProps<'/module-a/[section]/overview'>) {
  const { section } = await params
  if (!isSectionId(section)) return {}
  return { title: `${SECTION_BY_ID[section].title} — Overview` }
}

export default async function SectionOverviewPage({
  params,
}: PageProps<'/module-a/[section]/overview'>) {
  const { section } = await params
  if (!isSectionId(section)) notFound()

  const guide = getGuide(section)

  return (
    <article className="space-y-8">
      <p className="max-w-prose text-sm leading-relaxed text-pretty">{guide.intro}</p>
      <ContentBlocks blocks={guide.blocks} sectionId={section} />
    </article>
  )
}
