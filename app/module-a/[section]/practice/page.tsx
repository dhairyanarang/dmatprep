import { ComingSoon } from '@/components/layout/page-shell'
import { SECTION_BY_ID, SECTION_IDS, isSectionId } from '@/lib/sections'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }))
}

export async function generateMetadata({
  params,
}: PageProps<'/module-a/[section]/practice'>) {
  const { section } = await params
  if (!isSectionId(section)) return {}
  return { title: `${SECTION_BY_ID[section].title} — Practice` }
}

export default async function PracticePage({
  params,
}: PageProps<'/module-a/[section]/practice'>) {
  const { section } = await params
  if (!isSectionId(section)) notFound()

  return <ComingSoon note="The practice runner lands in phase 5." />
}
