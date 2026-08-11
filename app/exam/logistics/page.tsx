import { ContentBlocks } from '@/components/content/content-blocks'
import { PageShell } from '@/components/layout/page-shell'
import { logistics } from '@/content/exam/logistics'

export const metadata = { title: 'Dates & Logistics' }

export default function ExamLogisticsPage() {
  return (
    <PageShell
      title="Dates & Logistics"
      description="Deadlines, fee, test centres, and how the dMAT connects to the APS process."
    >
      <ContentBlocks blocks={logistics} />
    </PageShell>
  )
}
