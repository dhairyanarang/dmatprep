import { ContentBlocks } from '@/components/content/content-blocks'
import { PageShell } from '@/components/layout/page-shell'
import { format } from '@/content/exam/format'

export const metadata = { title: 'Format & Structure' }

export default function ExamFormatPage() {
  return (
    <PageShell
      title="Format & Structure"
      description="What the dMAT consists of, how long each part runs, and how the day is shaped."
    >
      <ContentBlocks blocks={format} />
    </PageShell>
  )
}
