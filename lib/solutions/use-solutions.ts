'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { COMMERCE_ENABLED } from '@/lib/payments/config'
import type { SectionId } from '@/lib/sections'
import type { Question } from '@/lib/types/question'
import type { PublicQuestion } from '@/lib/content/registry'

/**
 * The other half of the question bank, fetched rather than shipped.
 *
 * Pages serve `getPublicQuestions`, which carries no answers. This fetches the
 * matching solutions from a static asset and merges them back, so every
 * component downstream — `isCorrect`, the feedback panel, the explanation sheet
 * — keeps working on a complete `Question` exactly as before. The split exists
 * at the page boundary and nowhere else.
 *
 * It starts the moment the component mounts, not when the candidate answers.
 * CLAUDE.md requires that answering never waits on the network, and it still
 * does not: by the time anyone has read a question and chosen an option, this
 * has long since resolved. The gate below is for the first paint, not for the
 * answer.
 *
 * Cached at module scope so switching sections or re-entering practice does not
 * refetch, and so two components mounting together share one request.
 */
const cache = new Map<SectionId, Promise<SolutionMap>>()
const premiumCache = new Map<SectionId, Promise<SolutionMap>>()

type SolutionEntry = Partial<Question> & {
  /** Figure Sequences keeps its key per image. */
  imageAnswers?: Record<string, string>
}
type SolutionMap = Record<string, SolutionEntry>

function load(section: SectionId): Promise<SolutionMap> {
  const existing = cache.get(section)
  if (existing) return existing

  const request = fetch(`/solutions/${section}.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`solutions for ${section}: HTTP ${r.status}`)
      return r.json() as Promise<SolutionMap>
    })
    .catch((error) => {
      // Drop the rejected promise so a later mount retries rather than being
      // stuck with a cached failure for the life of the tab.
      cache.delete(section)
      throw error
    })

  cache.set(section, request)
  return request
}

/**
 * The premium half, fetched from a route handler that checks an entitlement.
 *
 * Separate from `load` on purpose. The free half is a static asset with no
 * session and no failure mode worth worrying about; this one is authenticated,
 * can legitimately return 403, and must never prevent the free half from
 * rendering. A rejection here resolves to an empty map rather than throwing,
 * so a candidate without premium sees the free bank working normally instead of
 * an error.
 */
function loadPremium(section: SectionId): Promise<SolutionMap> {
  const existing = premiumCache.get(section)
  if (existing) return existing

  const request = fetch(`/api/content/solutions?section=${section}`, {
    credentials: 'same-origin',
  })
    .then((r) => (r.ok ? (r.json() as Promise<SolutionMap>) : {}))
    .catch(() => {
      premiumCache.delete(section)
      return {} as SolutionMap
    })

  premiumCache.set(section, request)
  return request
}

export type SolutionsState =
  | { ready: false; error: null }
  | { ready: false; error: Error }
  | { ready: true; error: null; hydrate: (questions: PublicQuestion[]) => Question[] }

/**
 * Loads the solutions for one or more sections and returns a merge function.
 *
 * Mixed sets pass every section they draw on, so one gate covers the whole
 * session rather than one per question.
 */
export function useSolutions(sections: SectionId[]): SolutionsState {
  const key = [...sections].sort().join(',')
  const [state, setState] = useState<{ maps: Record<string, SolutionMap> | null; error: Error | null }>({
    maps: null,
    error: null,
  })

  useEffect(() => {
    let live = true
    const wanted = key ? (key.split(',') as SectionId[]) : []
    Promise.all(
      wanted.map((s) =>
        // The free half decides whether the gate opens; the premium half is
        // merged over it when it arrives. With commerce disabled the public
        // asset already carries every active solution, so nothing is fetched.
        load(s).then(async (free) =>
          COMMERCE_ENABLED
            ? ([s, { ...free, ...(await loadPremium(s)) }] as const)
            : ([s, free] as const),
        ),
      ),
    )
      .then((pairs) => {
        if (live) setState({ maps: Object.fromEntries(pairs), error: null })
      })
      .catch((error: Error) => {
        if (live) setState({ maps: null, error })
      })
    return () => {
      live = false
    }
  }, [key])

  const maps = state.maps

  /**
   * Stable across renders, and that is load-bearing rather than tidy.
   *
   * This used to be a fresh arrow function inside a fresh object literal on
   * every render. `TimedLauncher` lists the returned value as a dependency of
   * the memo that plans a test, so "the plan is made once and then held" —
   * which its comment claims, and which the whole runner depends on — was not
   * true: the plan was rebuilt on every single render.
   *
   * It survived unnoticed because `planSession` is deterministic in its seed,
   * so rebuilding it produced the same twenty questions. Until the moment it
   * did not: the seed is derived from how many attempts and sessions have been
   * recorded, and submitting a test records twenty of the first and one of the
   * second. So on the render immediately after submission the plan changed,
   * the results screen was handed twenty questions the candidate had never
   * seen, and every one of them was reported as "Not answered" over a score of
   * zero — while the session stored underneath had the real figures.
   */
  const hydrate = useCallback(
    (questions: PublicQuestion[]): Question[] =>
      questions.map((q) => {
        const entry = maps?.[q.section]?.[q.id]
        if (!entry) return q as unknown as Question

        const merged = { ...q, ...entry } as Record<string, unknown>
        const answers = entry.imageAnswers
        if (q.kind === 'figure-sequence' && answers) {
          // `images` is present on the public record too — only the key inside
          // each image was stripped — so this puts it back image by image.
          const images = (q as unknown as { images: { label: string }[] }).images
          merged.images = images.map((image) => ({ ...image, correctOptionId: answers[image.label] }))
          delete merged.imageAnswers
        }
        return merged as unknown as Question
      }),
    [maps],
  )

  return useMemo<SolutionsState>(() => {
    if (state.error) return { ready: false, error: state.error }
    if (!maps) return { ready: false, error: null }
    return { ready: true, error: null, hydrate }
  }, [state.error, maps, hydrate])
}
