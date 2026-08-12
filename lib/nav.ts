import type { SectionId } from '@/lib/sections'

/** Section hue, used for the section dot and section page accents. */
export const SECTION_ACCENT: Record<SectionId, 'figures' | 'equations' | 'latin'> = {
  'figure-sequences': 'figures',
  'mathematical-equations': 'equations',
  'latin-squares': 'latin',
}

export type NavLink = {
  href: string
  label: string
  /** One line under the label — what the destination is for. */
  hint?: string
  /** Renders as a non-interactive "coming soon" entry. */
  disabled?: boolean
}

export type NavGroup = {
  label: string
  links: NavLink[]
}

/**
 * Five destinations, not thirteen.
 *
 * The sidebar used to list every page in the product, which made the menu the
 * hardest screen to read. It now carries only the top of the mental model —
 * where am I going — and each hub page lists what is inside it. Everything that
 * disappeared from here is exactly one click deeper, never gone.
 */
export const NAV: NavGroup[] = [
  {
    label: 'dMAT Prep',
    links: [
      { href: '/', label: 'Home', hint: 'What to do next' },
      { href: '/prepare', label: 'Prepare', hint: 'Learn and practise' },
      { href: '/test', label: 'Test', hint: 'Timed practice and mocks' },
      { href: '/review', label: 'Review', hint: 'Mistakes and progress' },
      { href: '/exam', label: 'The exam', hint: 'Format, rules, dates' },
    ],
  },
]

/** Which top-level destination a path belongs to. */
const OWNS: Record<string, (path: string) => boolean> = {
  '/': (path) => path === '/',
  // Everything about learning a subtest lives under Prepare, whatever its URL.
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
