import { ContentBlocks } from '@/components/content/content-blocks'
import { PageShell } from '@/components/layout/page-shell'
import { rules } from '@/content/exam/rules'

export const metadata = { title: 'Exam-Day Rules' }

export default function ExamRulesPage() {
  return (
    <PageShell
      title="Exam-Day Rules"
      description="Identification, arrival, prohibited items and conduct — the things that get you excluded if you get them wrong."
    >
      <ContentBlocks blocks={rules} />
    </PageShell>
  )
}
