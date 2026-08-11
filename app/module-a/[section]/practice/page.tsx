import { notFound } from 'next/navigation'

import { PracticeRunner } from '@/components/practice/practice-runner'
import { getQuestions } from '@/lib/content/registry'
import { SECTION_BY_ID, SECTION_IDS, isSectionId } from '@/lib/sections'

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

  return <PracticeRunner sectionId={section} questions={getQuestions(section)} />
}
