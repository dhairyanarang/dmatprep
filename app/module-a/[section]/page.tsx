import { notFound } from 'next/navigation'

import { HubCard } from '@/components/layout/hub'
import { getBankSize } from '@/lib/content/registry'
import { SECTION_BY_ID, SECTION_IDS, isSectionId } from '@/lib/sections'

/** The noun each subtest's own official instructions use for its 20 items. */
const UNIT: Record<string, string> = {
  'figure-sequences': '20 series of matrices',
  'mathematical-equations': '20 systems of equations',
  'latin-squares': '20 tasks',
}

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }))
}

/**
 * The subtest landing: three ways in, no wall of explanation.
 *
 * The rules are worth reading, but making them the first thing on the page
 * stopped anyone who already knew the format from getting to a question.
 */
export default async function SectionIndex({ params }: PageProps<'/module-a/[section]'>) {
  const { section } = await params
  if (!isSectionId(section)) notFound()

  const meta = SECTION_BY_ID[section]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <HubCard
        href={`/module-a/${section}/overview`}
        title="Learn the rules"
        description={`What the task tests, every rule it can use, and worked examples.`}
        action="Read the overview"
      />
      <HubCard
        href={`/module-a/${section}/practice`}
        title="Practice"
        description="Untimed, with progressive hints and a full visual solution after every answer."
        meta={`${getBankSize(section)} questions`}
        action="Start practising"
      />
      <HubCard
        href={`/practice/timed/${section}`}
        title="Timed practice"
        description={`${UNIT[section]} in ${meta.officialTiming.minutes} minutes, no hints.`}
        meta={`${meta.officialTiming.minutes} min`}
        action="Start the test"
      />
    </div>
  )
}
