import { notFound } from 'next/navigation'

import { ContentBlocks } from '@/components/content/content-blocks'
import { getLearn } from '@/lib/content/registry'
import { SECTION_BY_ID, SECTION_IDS, isSectionId } from '@/lib/sections'

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }))
}

export async function generateMetadata({
  params,
}: PageProps<'/module-a/[section]/learn'>) {
  const { section } = await params
  if (!isSectionId(section)) return {}
  return { title: `${SECTION_BY_ID[section].title} — Learn` }
}

export default async function LearnPage({ params }: PageProps<'/module-a/[section]/learn'>) {
  const { section } = await params
  if (!isSectionId(section)) notFound()

  const learn = getLearn(section)

  return (
    <article className="space-y-6">
      <p className="text-sm leading-relaxed text-pretty">{learn.intro}</p>
      <ContentBlocks blocks={learn.blocks} sectionId={section} />
    </article>
  )
}
