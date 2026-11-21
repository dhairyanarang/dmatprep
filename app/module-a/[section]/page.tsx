import { notFound } from 'next/navigation'

import { HubCard } from '@/components/layout/hub'
import { getBankSize } from '@/lib/content/registry'
import { SECTION_BY_ID, SECTION_IDS, isSectionId } from '@/lib/sections'

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }))
}

export async function generateMetadata({ params }: PageProps<'/module-a/[section]'>) {
  const { section } = await params
  return isSectionId(section) ? { title: SECTION_BY_ID[section].title } : {}
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

  const meta = SECTION_BY_ID[section]

  return (
    <>
      {/*
        This screen lost its heading when the shared layout was thinned to a
        container: the heading moved to Learn the rules, and the landing — which
        is the first thing anyone opening a subtest sees — was left with two
        cards and no title at all. The breadcrumb named it, but a 14px crumb is
        not a page heading, and the document title fell back to the site's.
      */}
      <div className="mb-6">
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
    </>
  )
}
