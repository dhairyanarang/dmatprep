import { ComingSoon, PageShell } from '@/components/layout/page-shell'

export const metadata = { title: 'Scoring & Results' }

export default function ExamScoringPage() {
  return (
    <PageShell
      title="Scoring & Results"
      description="How the 0–200 score and percentile rank work, and what the certificate means."
    >
      <ComingSoon note="Reference content lands in phase 7." />
    </PageShell>
  )
}
