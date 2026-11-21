import { notFound } from 'next/navigation'

import { PageShell } from '@/components/layout/page-shell'
import { TimedLauncher } from '@/components/practice/timed-launcher'
import { getCoreMock, getCoreMocks, mockSize, mockStages } from '@/lib/content/mocks'

/**
 * One of the four fixed Core mocks.
 *
 * Statically generated, one route per mock, because the question list is a
 * committed fact rather than something computed per visit.
 */
export function generateStaticParams() {
  return getCoreMocks().map((m) => ({ mock: m.id }))
}

export async function generateMetadata({ params }: PageProps<'/test/mock/[mock]'>) {
  const { mock } = await params
  const found = getCoreMock(mock)
  return { title: found ? found.label : 'Core mock' }
}

export default async function CoreMockPage({ params }: PageProps<'/test/mock/[mock]'>) {
  const { mock } = await params
  const found = getCoreMock(mock)
  if (!found) notFound()

  const stages = mockStages(found)

  return (
    <PageShell wide>
      {/* The exam runners are a takeover with their own chrome, so there is no
            visible page title to carry the h1. Every page needs one all the
            same: without it a screen reader lands here with nothing above the
            sidebar's section headings. */}
      <h1 className="sr-only">{found.label}</h1>
      <TimedLauncher
        mode="simulation"
        title={found.label}
        note={`A fixed set of ${mockSize(found)} questions in a fixed order — the same test every time you open it, so two attempts can be compared. It shares no question with the other three mocks.`}
        minutesPerStage={25}
        stages={stages}
      />
    </PageShell>
  )
}
