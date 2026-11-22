import { notFound } from 'next/navigation'

import { GamPackRunner } from '@/components/gam/pack-runner'
import { getPack, getPackIds, getPublicPack } from '@/lib/gam/registry'
import { NOT_A_LANDING_PAGE } from '@/lib/seo'

export function generateStaticParams() {
  return getPackIds().map((pack) => ({ pack }))
}

export async function generateMetadata({ params }: PageProps<'/module-b/practice/[pack]'>) {
  const { pack } = await params
  const file = getPack(pack)
  return file
    ? { title: `${file.pack.title} — Module B`, ...NOT_A_LANDING_PAGE }
    : NOT_A_LANDING_PAGE
}

export default async function GamPackPracticePage({
  params,
}: PageProps<'/module-b/practice/[pack]'>) {
  const { pack } = await params
  // The stripped half. `getPack` still backs `generateMetadata` above, which
  // reads the title on the server and sends no question to the browser.
  const file = getPublicPack(pack)
  if (!file) notFound()

  return <GamPackRunner files={[file]} mode="practice" storageKey={`gam:practice:${pack}`} />
}
