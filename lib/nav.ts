import {
  BookOpenCheck,
  FileText,
  Info,
  Mail,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Grid3x3,
  LayoutDashboard,
  LayoutGrid,
  Library,
  SquareFunction,
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
  'figure-sequences': LayoutGrid,
  'mathematical-equations': SquareFunction,
  'latin-squares': Grid3x3,
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
 * Four destinations, in the design's order and wording. Each hub page lists
 * what is inside it, so the sidebar never has to grow.
 *
 * Review was removed for the public beta. Its data model, its calculations and
 * its components all stay — mistakes now surface where they are actually
 * useful, at the end of a practice set, rather than as a fifth place to visit
 * that answered a question nobody had yet asked.
 */
export const NAV: NavGroup[] = [
  {
    label: 'dMAT Prep',
    links: [
      { href: '/', label: 'Home', hint: 'What to do next', icon: LayoutDashboard },
      { href: '/exam', label: 'About the Exam', hint: 'Format, rules and dates', icon: BookOpenCheck },
      { href: '/prepare', label: 'Prepare', hint: 'Learn and practice', icon: Library },
      { href: '/test', label: 'Test', hint: 'Timed practice and mocks', icon: TestTubeDiagonal },
    ],
  },
]

/**
 * The informational pages, in one list.
 *
 * These are not destinations — they are the pages a candidate needs once, to
 * check who runs this, what it costs, or how to get help. They used to live in
 * a large global footer under every screen, which put legal boilerplate below
 * practice questions and made the app feel like a brochure.
 *
 * The sidebar holds them in a collapsed `Information` group instead: one click
 * from anywhere, never in the way, and always present in the DOM so nothing
 * depends on the group being open.
 */
export const INFO_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/about', label: 'About this resource', icon: Info },
  { href: '/pricing', label: 'Pricing', icon: Sparkles },
  { href: '/terms', label: 'Terms', icon: FileText },
  { href: '/refunds', label: 'Refunds', icon: RotateCcw },
  { href: '/privacy', label: 'Your data', icon: ShieldCheck },
  { href: '/contact', label: 'Contact', icon: Mail },
]

/** The informational page a path is, if it is one. */
export function infoLinkFor(pathname: string) {
  return INFO_LINKS.find((l) => l.href === pathname)
}

/** Which top-level destination a path belongs to. */
const OWNS: Record<string, (path: string) => boolean> = {
  '/': (path) => path === '/',
  '/prepare': (path) =>
    path.startsWith('/prepare') ||
    path.startsWith('/module-a') ||
    // Module B's untimed practice sits under Prepare; its timed session does
    // not, for the same reason Module A's timed runs belong to Test.
    (path.startsWith('/module-b') && !path.startsWith('/module-b/timed')) ||
    path.startsWith('/study-plan') ||
    path.startsWith('/practice/quick'),
  '/test': (path) =>
    path.startsWith('/test') ||
    path.startsWith('/module-b/timed') ||
    (path.startsWith('/practice') && !path.startsWith('/practice/quick')),
  '/exam': (path) => path.startsWith('/exam'),
}

export function isActive(pathname: string, href: string): boolean {
  return OWNS[href]?.(pathname) ?? pathname === href
}
