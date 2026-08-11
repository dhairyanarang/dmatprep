import { ComingSoon, PageShell } from '@/components/layout/page-shell'

export const metadata = { title: 'Dates & Logistics' }

export default function ExamLogisticsPage() {
  return (
    <PageShell
      title="Dates & Logistics"
      description="Deadlines, fee, test centres, and how the dMAT connects to the APS process."
    >
      <ComingSoon note="Reference content lands in phase 7." />
    </PageShell>
  )
}
