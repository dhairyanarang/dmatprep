import { redirect } from 'next/navigation'

import { SECTION_IDS } from '@/lib/sections'

export function generateStaticParams() {
  return SECTION_IDS.map((section) => ({ section }))
}

/** A bare section URL is never a dead end — send it to the overview. */
export default async function SectionIndex({ params }: PageProps<'/module-a/[section]'>) {
  const { section } = await params
  redirect(`/module-a/${section}/overview`)
}
