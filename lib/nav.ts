import { SECTIONS } from '@/lib/sections'

export type NavLink = {
  href: string
  label: string
  /** Renders as a non-interactive "coming soon" entry. */
  disabled?: boolean
}

export type NavGroup = {
  label: string
  links: NavLink[]
}

/**
 * Single source of truth for both the desktop sidebar and the mobile sheet, so
 * the two can never drift apart.
 *
 * Practice is linked directly from the section list on the dashboard, which is
 * what keeps "reach Latin Squares practice" to one click from home.
 */
export const NAV: NavGroup[] = [
  {
    label: 'Overview',
    links: [
      { href: '/', label: 'Dashboard' },
      { href: '/study-plan', label: 'Study Plan' },
    ],
  },
  {
    label: 'The Exam',
    links: [
      { href: '/exam', label: 'Format & Structure' },
      { href: '/exam/rules', label: 'Exam-Day Rules' },
      { href: '/exam/scoring', label: 'Scoring & Results' },
      { href: '/exam/logistics', label: 'Dates & Logistics' },
      { href: '/exam/sources', label: 'Sources' },
    ],
  },
  {
    label: 'Module A — Core',
    links: [
      { href: '/module-a', label: 'Overview' },
      ...SECTIONS.map((s) => ({
        href: `/module-a/${s.id}/learn`,
        label: s.title,
      })),
    ],
  },
  {
    label: 'Module B — Subject',
    links: [{ href: '/module-b', label: 'General Academic', disabled: true }],
  },
]

/**
 * Marks a nav link active. Exact match for roots, prefix match for nested
 * routes so /module-a/latin-squares/practice still highlights its section.
 */
export function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  if (href === '/exam') return pathname === '/exam'
  if (href === '/module-a') return pathname === '/module-a'
  if (href.startsWith('/module-a/')) {
    const sectionRoot = href.split('/').slice(0, 3).join('/')
    return pathname.startsWith(sectionRoot)
  }
  return pathname === href || pathname.startsWith(href + '/')
}
