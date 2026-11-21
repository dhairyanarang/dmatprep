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
  const meta = SECTION_BY_ID[section]

  return (
    <article className="space-y-8">
      {/* The heading lives here now rather than in the layout, because this is
          the screen it describes. Practice does not want a paragraph of
          explanation above its first question. */}
      <div>
        <p className="over mb-1.5">Core Module · Module A</p>
        <h1 className="text-2xl leading-8 font-semibold tracking-[-0.015em]">{meta.title}</h1>
        <p className="text-muted-foreground mt-1 max-w-prose text-sm leading-5 text-pretty">
          {meta.oneLiner}{' '}
          <span className="whitespace-nowrap">
            In the exam: {meta.officialTiming.minutes} minutes for {meta.officialTiming.items}{' '}
            items.
          </span>
        </p>
      </div>

      <p className="max-w-prose text-sm leading-relaxed text-pretty">{guide.intro}</p>
      <ContentBlocks blocks={guide.blocks} sectionId={section} />
    </article>
  )
}
