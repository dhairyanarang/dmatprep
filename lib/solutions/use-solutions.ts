'use client'

import { useEffect, useState } from 'react'

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
    Promise.all(wanted.map((s) => load(s).then((m) => [s, m] as const)))
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

  if (state.error) return { ready: false, error: state.error }
  if (!state.maps) return { ready: false, error: null }
  const maps = state.maps

  return {
    ready: true,
    error: null,
    hydrate: (questions) =>
      questions.map((q) => {
        const entry = maps[q.section]?.[q.id]
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
  }
}
