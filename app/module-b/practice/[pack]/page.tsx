import { notFound } from 'next/navigation'

import { GamPackRunner } from '@/components/gam/pack-runner'
import { getPack, getPackIds } from '@/lib/gam/registry'

export function generateStaticParams() {
  return getPackIds().map((pack) => ({ pack }))
}

export async function generateMetadata({ params }: PageProps<'/module-b/practice/[pack]'>) {
  const { pack } = await params
  const file = getPack(pack)
  return file ? { title: `${file.pack.title} — Module B` } : {}
}

export default async function GamPackPracticePage({
  params,
}: PageProps<'/module-b/practice/[pack]'>) {
  const { pack } = await params
  const file = getPack(pack)
  if (!file) notFound()

  return <GamPackRunner files={[file]} mode="practice" storageKey={`gam:practice:${pack}`} />
}
