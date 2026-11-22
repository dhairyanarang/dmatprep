import { notFound } from 'next/navigation'

import { PracticeRunner } from '@/components/practice/practice-runner'
import { getPublicQuestions } from '@/lib/content/registry'
import { SECTION_BY_ID, SECTION_IDS, isSectionId } from '@/lib/sections'
import { NOT_A_LANDING_PAGE } from '@/lib/seo'

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }))
}

export async function generateMetadata({ params }: PageProps<'/module-a/[section]/practice'>) {
  const { section } = await params
  if (!isSectionId(section)) return NOT_A_LANDING_PAGE
  return {
    title: `${SECTION_BY_ID[section].title} — Practice`,
    ...NOT_A_LANDING_PAGE,
  }
}

export default async function PracticePage({ params }: PageProps<'/module-a/[section]/practice'>) {
  const { section } = await params
  if (!isSectionId(section)) notFound()

  return (
    <>
      {/* Practice opens straight on the question controls by design, so there is
          no visible heading to carry the h1 — but the page still needs one. */}
      <h1 className="sr-only">{SECTION_BY_ID[section].title} practice</h1>
      <PracticeRunner sectionId={section} questions={getPublicQuestions(section)} />
    </>
  )
}
