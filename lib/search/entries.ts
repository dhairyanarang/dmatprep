import { guide as figureSequencesGuide } from '@/content/sections/figure-sequences/guide'
import { guide as latinSquaresGuide } from '@/content/sections/latin-squares/guide'
import { guide as mathematicalEquationsGuide } from '@/content/sections/mathematical-equations/guide'
import { STUDY_PLAN } from '@/content/study-plan/plan'
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
    id: 'review',
    title: 'Review',
    description: 'Mistakes and progress',
    href: '/review',
    group: 'Go to',
    keywords: ['readiness', 'accuracy', 'progress'],
  },
  {
    id: 'exam',
    title: 'About the Exam',
    description: 'Format, rules and dates',
    href: '/exam',
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
    id: 'study-plan',
    title: 'Study plan',
    description: 'Week by week to exam day',
    href: '/study-plan',
    group: 'Prepare',
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
    title: 'Module A mock',
    description: 'All three subtests back to back, 75 minutes',
    href: '/practice/simulation',
    group: 'Test',
    keywords: ['simulation', 'full test'],
  },

  {
    id: 'exam-format',
    title: 'Format & structure',
    description: 'The two modules and how the day is timed',
    href: '/exam/format',
    group: 'The exam',
    keywords: ['core module', 'subject module', 'duration', '195 minutes'],
  },
  {
    id: 'exam-rules',
    title: 'Exam-day rules',
    description: 'What you may bring, and what counts as exclusion',
    href: '/exam/rules',
    group: 'The exam',
    keywords: ['prohibited', 'id', 'passport', 'calculator', 'phone', 'notes'],
  },
  {
    id: 'exam-scoring',
    title: 'Scoring & results',
    description: 'The 0–200 scale, percentile rank and certificate',
    href: '/exam/scoring',
    group: 'The exam',
    keywords: ['score', 'percentile', 'guessing', 'negative marking', 'certificate'],
  },
  {
    id: 'exam-logistics',
    title: 'Dates & logistics',
    description: 'Deadlines, the fee, test centres and eligibility',
    href: '/exam/logistics',
    group: 'The exam',
    keywords: ['registration', 'fee', '150', 'deadline', 'test centre', 'eligibility', 'aps'],
  },
  {
    id: 'exam-checklist',
    title: 'Pre-exam checklist',
    description: 'Everything to settle before the day',
    href: '/exam/checklist',
    group: 'The exam',
  },
  {
    id: 'exam-sources',
    title: 'Sources',
    description: 'Every claim against the official document behind it',
    href: '/exam/sources',
    group: 'The exam',
    keywords: ['official', 'gast', 'aps india', 'provenance'],
  },
]

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

function planEntries(): SearchEntry[] {
  return STUDY_PLAN.map((week) => ({
    id: week.id,
    title: `Week ${week.weekNumber}: ${week.focus}`,
    description: week.summary,
    href: '/study-plan',
    group: 'Prepare' as const,
    keywords: ['study plan', 'schedule'],
  }))
}

export const SEARCH_ENTRIES: SearchEntry[] = [
  ...PAGES,
  ...sectionEntries(),
  ...guideEntries(),
  ...planEntries(),
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
