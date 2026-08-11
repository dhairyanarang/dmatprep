import { ContentBlocks } from '@/components/content/content-blocks'
import { PageShell } from '@/components/layout/page-shell'
import { scoring } from '@/content/exam/scoring'

export const metadata = { title: 'Scoring & Results' }

export default function ExamScoringPage() {
  return (
    <PageShell
      title="Scoring & Results"
      description="How the 0–200 score and percentile rank work, and what the certificate means."
    >
      <ContentBlocks blocks={scoring} />
    </PageShell>
  )
}
