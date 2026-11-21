import { notFound } from 'next/navigation'

import { HubCard } from '@/components/layout/hub'
import { getBankSize } from '@/lib/content/registry'
import { SECTION_IDS, isSectionId } from '@/lib/sections'

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }))
}

/**
 * The subtest landing: two ways in, no wall of explanation.
 *
 * The rules are worth reading, but making them the first thing on the page
 * stopped anyone who already knew the format from getting to a question.
 *
 * It offered a third card, "Timed practice", pointing at
 * `/practice/timed/<section>`. That was a second front door to a room the
 * Test section already owns: the same route is listed there under "Timed
 * sets", beside the four fixed mocks. Two entry points to one experience is
 * how a product grows a duplicate. The ROUTE is untouched and still reached
 * from Test — only this card is gone.
 */
export default async function SectionIndex({ params }: PageProps<'/module-a/[section]'>) {
  const { section } = await params
  if (!isSectionId(section)) notFound()

  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
    </div>
  )
}
