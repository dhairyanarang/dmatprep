import { notFound } from 'next/navigation'

import { PageContainer } from '@/components/layout/page-shell'
import { SECTION_IDS, isSectionId } from '@/lib/sections'

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }))
}

/**
 * The container, and nothing else.
 *
 * It used to own the subtest's heading, its description and an
 * Overview/Practice tab strip, which every screen below inherited whether it
 * wanted them or not. Practice did not: the two tabs were a second navigation
 * for a decision the landing page had already taken, and the heading block
 * pushed the first question most of a screen down. Both are gone, so the
 * heading now belongs to the screen that wants one — Learn the rules — and
 * Practice opens on the question control bar.
 *
 * The breadcrumb still names the subtest on both, so nothing lost its label.
 */
export default async function SectionLayout({
  children,
  params,
}: LayoutProps<'/module-a/[section]'>) {
  const { section } = await params
  if (!isSectionId(section)) notFound()

  return <PageContainer className="pt-6 pb-12">{children}</PageContainer>
}
