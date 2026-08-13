import { SECTION_BY_ID, isSectionId } from '@/lib/sections'

export type Crumb = {
  label: string
  /** Absent on the current page — the last crumb is never a link. */
  href?: string
}

/**
 * The trail for a path, derived rather than declared.
 *
 * Breadcrumbs are computed from the route plus the section metadata the app
 * already carries, so there is no second table of labels to keep in step with
 * the navigation. Route segments never surface: every label here is the same
 * human wording the sidebar and hub pages use.
 */

const PREPARE: Crumb = { label: 'Prepare', href: '/prepare' }
const TEST: Crumb = { label: 'Test', href: '/test' }
const EXAM: Crumb = { label: 'About the Exam', href: '/exam' }

/** Leaf pages whose trail is fixed. */
const STATIC: Record<string, Crumb[]> = {
  '/': [{ label: 'Home' }],
  '/prepare': [{ label: 'Prepare' }],
  '/test': [{ label: 'Test' }],
  '/review': [{ label: 'Review' }],
  '/exam': [{ label: 'About the Exam' }],
  '/study-plan': [PREPARE, { label: 'Study plan' }],
  '/practice/quick': [PREPARE, { label: 'Quick practice' }],
  '/practice/diagnostic': [TEST, { label: 'Diagnostic' }],
  '/practice/simulation': [TEST, { label: 'Module A mock' }],
  '/exam/format': [EXAM, { label: 'Format & structure' }],
  '/exam/rules': [EXAM, { label: 'Exam-day rules' }],
  '/exam/scoring': [EXAM, { label: 'Scoring & results' }],
  '/exam/logistics': [EXAM, { label: 'Dates & logistics' }],
  '/exam/checklist': [EXAM, { label: 'Pre-exam checklist' }],
  '/exam/sources': [EXAM, { label: 'Sources' }],
  '/module-b': [PREPARE, { label: 'Module B' }],
}

const SECTION_TABS: Record<string, string> = {
  overview: 'Overview',
  practice: 'Practice',
}

export function breadcrumbsFor(pathname: string): Crumb[] {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname
  const fixed = STATIC[path]
  if (fixed) return fixed

  const parts = path.split('/').filter(Boolean)

  // /module-a/<section>[/overview|/practice]
  const sectionSegment = parts[1] ?? ''
  if (parts[0] === 'module-a' && isSectionId(sectionSegment)) {
    const section = SECTION_BY_ID[sectionSegment]
    const tab = parts[2] ? SECTION_TABS[parts[2]] : null

    if (!tab) {
      return [PREPARE, { label: 'Module A', href: '/prepare' }, { label: section.title }]
    }
    return [
      PREPARE,
      { label: section.title, href: `/module-a/${sectionSegment}` },
      { label: tab },
    ]
  }

  // /practice/timed/<section>
  const timedSegment = parts[2] ?? ''
  if (parts[0] === 'practice' && parts[1] === 'timed' && isSectionId(timedSegment)) {
    const section = SECTION_BY_ID[timedSegment]
    return [TEST, { label: 'Timed practice', href: '/test' }, { label: section.title }]
  }

  return []
}

/** The current page's own label, for the heading above the trail. */
export function currentCrumb(pathname: string): string | null {
  const crumbs = breadcrumbsFor(pathname)
  return crumbs.length ? crumbs[crumbs.length - 1].label : null
}
