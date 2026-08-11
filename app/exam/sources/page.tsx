import { ComingSoon, PageShell } from '@/components/layout/page-shell'

export const metadata = { title: 'Sources' }

export default function ExamSourcesPage() {
  return (
    <PageShell
      title="Sources"
      description="Every factual claim in this hub, with the official document it came from — and an explicit note wherever something could not be confirmed."
    >
      <ComingSoon note="The source ledger is generated from content in phase 7." />
    </PageShell>
  )
}
