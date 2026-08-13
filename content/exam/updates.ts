/**
 * Latest dMAT updates.
 *
 * A hand-maintained content file, not a database table and not a feed. That is
 * a deliberate choice for the public beta: an update surface that only a commit
 * can change cannot be published to by anyone, cannot be scraped into, and
 * cannot quietly start carrying something nobody verified. Adding an update is
 * a pull request, which is exactly the amount of ceremony a claim about someone
 * else's exam deserves.
 *
 * Rule zero applies here more than anywhere else in the product. Every entry
 * must carry the official source it came from, and that source must have been
 * fetched — not remembered. `d-mat.de` (g.a.s.t.) and `aps-india.de` only;
 * third-party dMAT guides are known to contain errors and are never cited, not
 * even to corroborate.
 *
 * If nothing has changed, this list is empty and the UI says so. There is no
 * placeholder copy: inventing an update would be worse than showing none.
 */

export type UpdateCategory =
  | 'official'
  | 'registration'
  | 'exam'
  | 'preparation'
  | 'module-b'
  | 'other'

export type DmatUpdate = {
  id: string
  title: string
  /** One or two sentences. The detail belongs at the source, not here. */
  summary: string
  /** ISO date the change was published by the source, not when we noticed it. */
  publishedAt: string
  sourceName: string
  sourceUrl: string
  category: UpdateCategory
  /** Optional: hide after this date, for things that stop being news. */
  expiresAt?: string
  status?: 'published' | 'draft'
}

export const CATEGORY_LABEL: Record<UpdateCategory, string> = {
  official: 'Official update',
  registration: 'Registration',
  exam: 'Exam',
  preparation: 'Preparation',
  'module-b': 'Module B',
  other: 'Update',
}

/**
 * Verified 13 Aug 2026 against d-mat.de/en and d-mat.de/en/dmat-in-india.
 * The registration and exam dates were unchanged on that check, and the
 * preparation PDF was still the 4 August build — so there is exactly one thing
 * here worth calling an update.
 */
export const UPDATES: DmatUpdate[] = [
  {
    id: 'gam-prep-materials-260804',
    title: 'Preparation materials for the General Academic Module were revised',
    summary:
      'g.a.s.t. published a new build of the General Academic Module preparatory materials, dated 4 August 2026. It is linked from the India page rather than the English preparation page.',
    publishedAt: '2026-08-04',
    sourceName: 'g.a.s.t. (d-mat.de)',
    sourceUrl:
      'https://www.d-mat.de/wp-content/uploads/2026/08/260804_dMAT_General-Academic-Module_Preparatoy-Materials_EN.pdf',
    category: 'preparation',
  },
]

/** The one update worth showing, or null when there is nothing new. */
export function latestUpdate(today: Date | null): DmatUpdate | null {
  const live = UPDATES.filter((u) => {
    if (u.status === 'draft') return false
    if (!u.expiresAt || !today) return true
    return new Date(u.expiresAt) >= today
  })

  return (
    live.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0] ?? null
  )
}
