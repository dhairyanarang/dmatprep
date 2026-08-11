import { notFound } from 'next/navigation'

import { TipsView } from '@/components/content/tips-view'
import { getTips } from '@/lib/content/registry'
import { SECTION_BY_ID, SECTION_IDS, isSectionId } from '@/lib/sections'

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }))
}

export async function generateMetadata({ params }: PageProps<'/module-a/[section]/tips'>) {
  const { section } = await params
  if (!isSectionId(section)) return {}
  return { title: `${SECTION_BY_ID[section].title} — Tips & Tricks` }
}

export default async function TipsPage({ params }: PageProps<'/module-a/[section]/tips'>) {
  const { section } = await params
  if (!isSectionId(section)) notFound()

  return <TipsView tips={getTips(section)} />
}
