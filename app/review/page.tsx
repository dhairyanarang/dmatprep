import { PageShell } from '@/components/layout/page-shell'
import { ReviewList } from '@/components/practice/review-list'
import { getQuestions } from '@/lib/content/registry'
import { SECTIONS } from '@/lib/sections'

export const metadata = { title: 'Review mistakes' }

export default function ReviewPage() {
  const questions = SECTIONS.flatMap((section) => getQuestions(section.id))

  return (
    <PageShell
      title="Review mistakes"
      description="Questions you answered wrong, or answered right only after a hint."
      wide
    >
      <ReviewList questions={questions} />
    </PageShell>
  )
}
