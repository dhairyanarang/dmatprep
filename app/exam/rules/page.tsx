import { ComingSoon, PageShell } from '@/components/layout/page-shell'

export const metadata = { title: 'Exam-Day Rules' }

export default function ExamRulesPage() {
  return (
    <PageShell
      title="Exam-Day Rules"
      description="Identification, arrival, prohibited items and conduct — the things that get you excluded if you get them wrong."
    >
      <ComingSoon note="Reference content lands in phase 7." />
    </PageShell>
  )
}
