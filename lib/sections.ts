/**
 * The three Core Module subtests ("Module A").
 *
 * Timing is official: each subtest is 25 minutes for 20 items.
 * Source: g.a.s.t. General Academic Module preparatory materials (04.08.2026),
 * pp. 8 (Figure Sequences), 18 (Mathematical Equations), 25 (Latin Squares).
 */

export const SECTION_IDS = [
  'figure-sequences',
  'mathematical-equations',
  'latin-squares',
] as const

export type SectionId = (typeof SECTION_IDS)[number]

export type SectionSummary = {
  id: SectionId
  title: string
  /** Compact label for tight spaces (mobile nav, stat tiles). */
  short: string
  /** One line describing the task, shown on overview and dashboard cards. */
  oneLiner: string
  officialTiming: { minutes: number; items: number }
}

export const SECTIONS: readonly SectionSummary[] = [
  {
    id: 'figure-sequences',
    title: 'Figure Sequences',
    short: 'Figures',
    oneLiner:
      'Continue a series of 4×4 matrices by working out how each symbol moves, turns and changes colour.',
    officialTiming: { minutes: 25, items: 20 },
  },
  {
    id: 'mathematical-equations',
    title: 'Mathematical Equations',
    short: 'Equations',
    oneLiner:
      'Solve a small system of equations where every letter is a whole number from 1 to 20.',
    officialTiming: { minutes: 25, items: 20 },
  },
  {
    id: 'latin-squares',
    title: 'Latin Squares',
    short: 'Latin Squares',
    oneLiner:
      'Work out the letter behind the question mark in a 5×5 grid where each letter appears once per row and column.',
    officialTiming: { minutes: 25, items: 20 },
  },
]

export const SECTION_BY_ID: Record<SectionId, SectionSummary> = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s]),
) as Record<SectionId, SectionSummary>

export function isSectionId(value: string): value is SectionId {
  return (SECTION_IDS as readonly string[]).includes(value)
}
