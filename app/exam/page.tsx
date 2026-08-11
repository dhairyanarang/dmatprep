import { ComingSoon, PageShell } from '@/components/layout/page-shell'

export const metadata = { title: 'Format & Structure' }

export default function ExamFormatPage() {
  return (
    <PageShell
      title="Format & Structure"
      description="What the dMAT consists of, how long each part runs, and how the day is shaped."
    >
      <ComingSoon note="Reference content lands in phase 7." />
    </PageShell>
  )
}
