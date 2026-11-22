import ExamOverview from '@/app/exam/page'
import { NOT_A_LANDING_PAGE } from '@/lib/seo'

/**
 * About the Exam, inside the application.
 *
 * The page component is the public one, imported rather than copied: one set
 * of facts, two routes. See `lib/exam-nav.ts` for why both exist.
 *
 * `noindex` because the public copy at `/exam` is the canonical, indexed
 * URL. `/dashboard` is also disallowed in robots.txt, so this is defence in
 * depth rather than the only control.
 */
export const metadata = { title: 'About the Exam', ...NOT_A_LANDING_PAGE }

export default ExamOverview
