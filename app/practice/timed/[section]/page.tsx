import { notFound } from 'next/navigation'

import { PageShell } from '@/components/layout/page-shell'
import { TimedLauncher } from '@/components/practice/timed-launcher'
import { getPublicQuestions } from '@/lib/content/registry'
import { SECTION_BY_ID, SECTION_IDS, isSectionId } from '@/lib/sections'

/** The noun each subtest's own official instructions use for its 20 items. */
const UNIT: Record<string, string> = {
  'figure-sequences': 'series',
  'mathematical-equations': 'systems',
  'latin-squares': 'tasks',
}

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }))
}

export async function generateMetadata({ params }: PageProps<'/practice/timed/[section]'>) {
  const { section } = await params
  if (!isSectionId(section)) return {}
  return { title: `${SECTION_BY_ID[section].title} — Timed practice` }
}

export default async function TimedSectionPage({ params }: PageProps<'/practice/timed/[section]'>) {
  const { section } = await params
  if (!isSectionId(section)) notFound()

  const meta = SECTION_BY_ID[section]

  return (
    <PageShell wide>
      {/* The exam runners are a takeover with their own chrome, so there is no
            visible page title to carry the h1. Every page needs one all the
            same: without it a screen reader lands here with nothing above the
            sidebar's section headings. */}
      <h1 className="sr-only">{`${meta.title} practice mock`}</h1>
      <TimedLauncher
        mode="timed"
        title={`${meta.title} practice mock`}
        note="One subtest under its own clock: 25 minutes, 20 questions, no hints. The questions are chosen fresh each time, favouring ones you have not seen."
        minutesPerStage={25}
        stages={[
          {
            sectionId: section,
            label: meta.title,
            unitNoun: UNIT[section],
            pool: getPublicQuestions(section),
            count: 20,
          },
        ]}
      />
    </PageShell>
  )
}
