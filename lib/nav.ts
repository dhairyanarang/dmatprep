import {
  BookOpenCheck,
  ChartArea,
  LayoutDashboard,
  Library,
  TestTubeDiagonal,
  type LucideIcon,
} from 'lucide-react'

import type { SectionId } from '@/lib/sections'

/**
 * Section identity is carried by the icon, not by a hue.
 *
 * The design gives all three subtests the same brand teal and tells them apart
 * with distinct glyphs, which is what keeps the product from turning into a
 * multi-coloured dashboard.
 */
export const SECTION_ICON: Record<SectionId, LucideIcon> = {
  'figure-sequences': LayoutDashboard,
  'mathematical-equations': BookOpenCheck,
  'latin-squares': ChartArea,
}

export type NavLink = {
  href: string
  label: string
  /** One line under the label — what the destination is for. */
  hint?: string
  icon: LucideIcon
  /** Renders as a non-interactive "coming soon" entry. */
  disabled?: boolean
}

export type NavGroup = {
  label: string
  links: NavLink[]
}

/**
 * Five destinations, in the design's order and wording. Each hub page lists
 * what is inside it, so the sidebar never has to grow.
 */
export const NAV: NavGroup[] = [
  {
    label: 'dMAT Prep',
    links: [
      { href: '/', label: 'Home', hint: 'What to do next', icon: LayoutDashboard },
      { href: '/exam', label: 'About the Exam', hint: 'Format, rules and dates', icon: BookOpenCheck },
      { href: '/prepare', label: 'Prepare', hint: 'Learn and practice', icon: Library },
      { href: '/test', label: 'Test', hint: 'Timed practice and mocks', icon: TestTubeDiagonal },
      { href: '/review', label: 'Review', hint: 'Mistakes and progress', icon: ChartArea },
    ],
  },
]

/** Which top-level destination a path belongs to. */
const OWNS: Record<string, (path: string) => boolean> = {
  '/': (path) => path === '/',
  '/prepare': (path) =>
    path.startsWith('/prepare') ||
    path.startsWith('/module-a') ||
    path.startsWith('/module-b') ||
    path.startsWith('/study-plan') ||
    path.startsWith('/practice/quick'),
  '/test': (path) =>
    path.startsWith('/test') ||
    (path.startsWith('/practice') && !path.startsWith('/practice/quick')),
  '/review': (path) => path.startsWith('/review'),
  '/exam': (path) => path.startsWith('/exam'),
}

export function isActive(pathname: string, href: string): boolean {
  return OWNS[href]?.(pathname) ?? pathname === href
}
