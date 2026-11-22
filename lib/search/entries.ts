import { guide as figureSequencesGuide } from '@/content/sections/figure-sequences/guide'
import { guide as latinSquaresGuide } from '@/content/sections/latin-squares/guide'
import { guide as mathematicalEquationsGuide } from '@/content/sections/mathematical-equations/guide'
import {
  CORE_MOCK_IDS,
  CORE_MOCK_SIZE,
  coreMockLabel,
} from '@/lib/content/mock-label'
import { INFO_LINKS } from '@/lib/nav'
import { SECTIONS, type SectionId } from '@/lib/sections'
import type { SectionGuide } from '@/lib/types/content'

/**
 * What global search can find.
 *
 * Derived from the content the app already ships — routes, the three section
 * guides and the study plan — so there is no second list of pages to keep in
 * step. The guide modules are imported directly rather than through
 * `lib/content/registry`, because that module also pulls in the three
 * questions.json banks and none of that belongs in the client bundle.
 *
 * Question-bank internals are deliberately not indexed: this is a navigation
 * tool, and a candidate searching for an answer they have not worked out yet
 * is not something the product should help with.
 */
export type SearchGroup = 'Go to' | 'Prepare' | 'Test' | 'The exam' | 'In the guides'

export type SearchEntry = {
  id: string
  title: string
  description?: string
  href: string
  group: SearchGroup
  /** Extra terms that should match but do not belong in the visible title. */
  keywords?: string[]
}

/** Slug used for heading anchors, matched by the guide renderer. */
export const headingSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const GUIDES: Record<SectionId, SectionGuide> = {
  'figure-sequences': figureSequencesGuide,
  'mathematical-equations': mathematicalEquationsGuide,
  'latin-squares': latinSquaresGuide,
}

const PAGES: SearchEntry[] = [
  { id: 'home', title: 'Home', description: 'What to do next', href: '/', group: 'Go to' },
  {
    id: 'prepare',
    title: 'Prepare',
    description: 'Learn and practise the three Core subtests',
    href: '/prepare',
    group: 'Go to',
  },
  {
    id: 'test',
    title: 'Test',
    description: 'Timed practice and the Module A mock',
    href: '/test',
    group: 'Go to',
  },
  {
    id: 'exam',
    title: 'About the Exam',
    description: 'Format, rules and dates',
    href: '/dashboard/exam',
    group: 'Go to',
  },

  {
    id: 'quick',
    title: 'Quick practice',
    description: '10 questions mixed across the three subtests',
    href: '/practice/quick',
    group: 'Prepare',
  },
  {
    id: 'mistakes',
    title: 'Your mistakes',
    description: 'Everything you answered wrong and have not since got right',
    href: '/practice/mistakes',
    group: 'Prepare',
    keywords: ['review', 'wrong', 'retry', 'missed'],
  },

  {
    id: 'diagnostic',
    title: 'Diagnostic',
    description: '15 questions, no clock — find where to start',
    href: '/practice/diagnostic',
    group: 'Test',
  },
  {
    id: 'mock',
    title: 'Open simulation',
    description: 'All three subtests back to back, 75 minutes, planned fresh each run',
    href: '/practice/simulation',
    group: 'Test',
    keywords: ['simulation', 'full test', 'module a mock'],
  },
  {
    id: 'information',
    title: 'Information',
    description: 'Who runs this, what it stores, and the terms',
    href: '/information',
    group: 'Go to',
    keywords: ['help', 'policy', 'legal', 'privacy', 'terms', 'contact', 'support'],
  },
  {
    id: 'pricing',
    title: 'Plans and pricing',
    description: 'What is free, what Pro adds, and what it costs',
    href: '/pricing',
    group: 'Go to',
    keywords: ['pro', 'buy', 'upgrade', 'price', 'cost', 'plans'],
  },
  {
    id: 'account',
    title: 'Account',
    description: 'Who you are, what is stored, and what this account can open',
    href: '/account',
    group: 'Go to',
    keywords: ['sign in', 'sign out', 'plan', 'membership', 'data', 'delete'],
  },

  {
    id: 'exam-format',
    title: 'Format & structure',
    description: 'The two modules and how the day is timed',
    href: '/dashboard/exam/format',
    group: 'The exam',
    keywords: ['core module', 'subject module', 'duration', '195 minutes'],
  },
  {
    id: 'exam-rules',
    title: 'Exam-day rules',
    description: 'What you may bring, and what counts as exclusion',
    href: '/dashboard/exam/rules',
    group: 'The exam',
    keywords: ['prohibited', 'id', 'passport', 'calculator', 'phone', 'notes'],
  },
  {
    id: 'exam-scoring',
    title: 'Scoring & results',
    description: 'The 0–200 scale, percentile rank and certificate',
    href: '/dashboard/exam/scoring',
    group: 'The exam',
    keywords: ['score', 'percentile', 'guessing', 'negative marking', 'certificate'],
  },
  {
    id: 'exam-logistics',
    title: 'Dates & logistics',
    description: 'Deadlines, the fee, test centres and eligibility',
    href: '/dashboard/exam/logistics',
    group: 'The exam',
    keywords: ['registration', 'fee', '150', 'deadline', 'test centre', 'eligibility', 'aps'],
  },
  {
    id: 'exam-checklist',
    title: 'Pre-exam checklist',
    description: 'Everything to settle before the day',
    href: '/dashboard/exam/checklist',
    group: 'The exam',
  },
  {
    id: 'privacy',
    title: 'Your data',
    description: 'What dMAT Prep stores, and where',
    href: '/privacy',
    group: 'Go to',
    keywords: ['privacy', 'account', 'delete', 'data'],
  },

  {
    id: 'exam-sources',
    title: 'Sources',
    description: 'Every claim against the official document behind it',
    href: '/dashboard/exam/sources',
    group: 'The exam',
    keywords: ['official', 'gast', 'aps india', 'provenance'],
  },
]

/**
 * The four fixed mocks.
 *
 * Named from the constants in `lib/content/mock-label.ts` rather than read
 * from `content/access/core-mocks.json`: this module ships to the client on
 * every page, and the file carries all 240 question ids. A test asserts the
 * constants match the file.
 */
function mockEntries(): SearchEntry[] {
  return CORE_MOCK_IDS.map((id) => ({
    id,
    title: coreMockLabel(id) ?? id,
    description: `${CORE_MOCK_SIZE} questions, fixed — the same test every time`,
    href: `/test/mock/${id}`,
    group: 'Test' as const,
    keywords: ['mock', 'core mock', 'exam', 'full test'],
  }))
}

/**
 * The informational pages, from the same list the sidebar renders. One list,
 * so a page cannot be in the navigation and missing from search.
 */
/**
 * Extra terms that should find an informational page.
 *
 * Refunds used to be a page of their own. It is a section of the Terms now,
 * and someone searching the word still has to land on it — an empty result
 * for "refund" reads as "we have no policy", which is not what happened.
 */
const INFO_KEYWORDS: Record<string, string[]> = {
  '/terms': ['refund', 'refunds', 'cancel', 'licence', 'liability', 'payment'],
  '/privacy': ['data', 'delete', 'cookies', 'storage', 'gdpr'],
  '/contact': ['help', 'support', 'email', 'problem', 'stuck'],
  '/information': ['about', 'who runs this', 'independent', 'policies'],
}

function infoEntries(): SearchEntry[] {
  // Any page PAGES already describes properly keeps its richer entry — /privacy
  // has a description there that "Your data" alone does not carry, and two rows
  // for one page is worse than either.
  const described = new Set(PAGES.map((p) => p.href))
  return INFO_LINKS.filter((link) => !described.has(link.href)).map((link) => ({
    id: `info-${link.href.replace(/\//g, '')}`,
    title: link.label,
    href: link.href,
    group: 'Go to' as const,
    keywords: ['information', 'policy', 'legal', 'help', ...(INFO_KEYWORDS[link.href] ?? [])],
  }))
}

function sectionEntries(): SearchEntry[] {
  return SECTIONS.flatMap((section) => [
    {
      id: `${section.id}-overview`,
      title: section.title,
      description: section.oneLiner,
      href: `/module-a/${section.id}/overview`,
      group: 'Prepare' as const,
      keywords: ['module a', 'core module', 'learn', 'rules'],
    },
    {
      id: `${section.id}-practice`,
      title: `${section.title} practice`,
      description: 'Untimed, with hints and full solutions',
      href: `/module-a/${section.id}/practice`,
      group: 'Prepare' as const,
    },
    {
      id: `${section.id}-timed`,
      title: `${section.title} timed practice`,
      description: '25 minutes, 20 questions, no hints',
      href: `/practice/timed/${section.id}`,
      group: 'Test' as const,
    },
  ])
}

/** Every heading in the three section guides, deep-linked to its anchor. */
function guideEntries(): SearchEntry[] {
  return SECTIONS.flatMap((section) =>
    GUIDES[section.id].blocks
      .filter((block): block is Extract<typeof block, { type: 'heading' }> => block.type === 'heading')
      .map((block) => ({
        id: `${section.id}-${headingSlug(block.text)}`,
        title: block.text,
        description: section.title,
        href: `/module-a/${section.id}/overview#${headingSlug(block.text)}`,
        group: 'In the guides' as const,
      })),
  )
}


export const SEARCH_ENTRIES: SearchEntry[] = [
  ...PAGES,
  ...mockEntries(),
  ...infoEntries(),
  ...sectionEntries(),
  ...guideEntries(),
]

/**
 * Ranked matching. Deliberately simple — a title that starts with the query
 * beats one that merely contains it, which beats a description or keyword hit.
 * Nothing here needs fuzzy matching to find "Latin Squares".
 */
export function searchEntries(query: string, limit = 12): SearchEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const scored: { entry: SearchEntry; score: number }[] = []

  for (const entry of SEARCH_ENTRIES) {
    const title = entry.title.toLowerCase()
    const description = entry.description?.toLowerCase() ?? ''
    const keywords = entry.keywords?.join(' ').toLowerCase() ?? ''

    let score = 0
    if (title === q) score = 100
    else if (title.startsWith(q)) score = 80
    else if (title.includes(q)) score = 60
    else if (description.includes(q)) score = 40
    else if (keywords.includes(q)) score = 30
    // Every word matching somewhere still counts, so "figure practice" works.
    else if (q.split(/\s+/).every((w) => `${title} ${description} ${keywords}`.includes(w))) score = 20

    if (score > 0) scored.push({ entry, score })
  }

  return scored
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .slice(0, limit)
    .map((s) => s.entry)
}
