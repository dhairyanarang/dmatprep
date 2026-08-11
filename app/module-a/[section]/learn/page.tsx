import { ComingSoon } from '@/components/layout/page-shell'
import { SECTION_BY_ID, SECTION_IDS, isSectionId } from '@/lib/sections'
import { notFound } from 'next/navigation'

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

  return <ComingSoon note="Learn content is authored in phase 6." />
}
