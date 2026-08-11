import { ComingSoon, PageShell } from '@/components/layout/page-shell'

export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      description="Countdowns, progress snapshot and quick links into practice."
      wide
    >
      <ComingSoon note="The dashboard lands in phase 8." />
    </PageShell>
  )
}
