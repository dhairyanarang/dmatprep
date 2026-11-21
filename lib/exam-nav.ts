import type { SubNavLink } from '@/components/layout/sub-nav'

/**
 * The exam reference, in reading order.
 *
 * One list, used by the internal sidebar and by the landing page's cards, so
 * a page cannot appear in one and be missing from the other.
 */
export const EXAM_SECTIONS: SubNavLink[] = [
  { href: '/exam', label: 'Overview' },
  { href: '/exam/format', label: 'Format & structure' },
  { href: '/exam/rules', label: 'Exam-day rules' },
  { href: '/exam/scoring', label: 'Scoring & results' },
  { href: '/exam/logistics', label: 'Dates & logistics' },
  { href: '/exam/checklist', label: 'Pre-exam checklist' },
  { href: '/exam/sources', label: 'Sources' },
]
