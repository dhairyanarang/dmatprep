import type { SubNavLink } from '@/components/layout/sub-nav'

/**
 * The exam reference exists at two URLs, and this is the one list behind both.
 *
 * `/exam` is the public website's examination pages — what somebody arriving
 * from a search result reads, and the URLs that are in the sitemap and carry
 * the canonicals. `/dashboard/exam` is the same reference inside the
 * application, reached from the sidebar, where a student who is mid-
 * preparation expects to stay in the product rather than be handed to the
 * marketing site.
 *
 * They are two routes over **one** set of page components, not two copies of
 * the content. The application's copy is `noindex`, and `/dashboard` is
 * already disallowed in robots.txt, so only the public tree is ever indexed.
 */
export const PUBLIC_EXAM_BASE = '/exam'
export const APP_EXAM_BASE = '/dashboard/exam'

/**
 * The sections, in reading order, at their canonical public URLs.
 *
 * Written as literal paths rather than built from a template, because
 * `scripts/test/navigation.test.mjs` scans the source for internal links to
 * prove every route is reachable and every link resolves. A computed
 * `${base}/checklist` is invisible to it, and the first version of this file
 * made the checklist look like a page nothing linked to — the test caught it.
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

/** The same sections under whichever base is asked for. */
export function examSections(base: string): SubNavLink[] {
  return base === PUBLIC_EXAM_BASE
    ? EXAM_SECTIONS
    : EXAM_SECTIONS.map((link) => ({ ...link, href: rebaseExamHref(link.href, base) }))
}

/**
 * Rewrite a canonical `/exam/...` link for whichever tree is rendering it.
 *
 * The page components are shared, so a link written as `/exam/format` inside
 * one of them is correct on the public site and wrong in the application —
 * it would walk the student out of the product. Everything inside the shared
 * components links through `ExamLink`, which calls this with the pathname.
 */
export function rebaseExamHref(href: string, context: string | null): string {
  const inApp = context === APP_EXAM_BASE || !!context?.startsWith(`${APP_EXAM_BASE}/`)
  if (!inApp) return href
  if (href === PUBLIC_EXAM_BASE) return APP_EXAM_BASE
  if (href.startsWith(`${PUBLIC_EXAM_BASE}/`)) {
    return `${APP_EXAM_BASE}${href.slice(PUBLIC_EXAM_BASE.length)}`
  }
  return href
}
