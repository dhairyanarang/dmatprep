import fullMock from '@/content/access/full-mock.json'

import { getPublicQuestions, type PublicQuestion } from '@/lib/content/registry'
import { getPublicPack, type PublicGamPackFile } from '@/lib/gam/registry'
import { SECTION_BY_ID, SECTION_IDS, type SectionId } from '@/lib/sections'

/**
 * The Core + GAM sample sitting: Core, a break, then a SAMPLE of the General
 * Academic Module.
 *
 * Deliberately not called a full-length mock. The Core half is complete at 60
 * questions in the official shape; the General Academic half holds 10 of the
 * roughly 60 the real module carries, and every surface that shows this sitting
 * says so.
 *
 * Deliberately its own module rather than part of `lib/content/mocks.ts`. That
 * one resolves the four frozen Core mocks and must keep knowing nothing about
 * Module B — `lib/content/registry.ts` is forbidden from reaching into GAM
 * content, and a test asserts it. This module is the one place the two halves
 * are allowed to meet, and it meets them by composing the two existing
 * registries rather than merging their models.
 *
 * The two question models are genuinely different: Module A is standalone
 * questions keyed by section, Module B is source packs whose questions only
 * mean anything beside their source. They are not unified here either. The
 * sitting runs the Core half in the Core runner and the GAM half in the GAM
 * runner, one after the other, which is also how the real examination runs.
 */

const UNIT: Record<SectionId, string> = {
  'figure-sequences': 'series',
  'mathematical-equations': 'systems',
  'latin-squares': 'tasks',
}

export type FullMockStage = {
  sectionId: SectionId
  label: string
  unitNoun: string
  pool: PublicQuestion[]
  count: number
  questionIds: string[]
}

export const FULL_MOCK_ID = fullMock.id as string
export const FULL_MOCK_LABEL = fullMock.label as string

/** OFFICIAL — GAM PDF pp. 8, 18, 25. The Core half is complete, so this is exact. */
export const CORE_STAGE_MINUTES = fullMock.minutesPerCoreStage as number

/**
 * OURS, not official — and the distinction matters enough to keep in the type.
 *
 * The official module is 90 minutes (GAM PDF p. 34) for approximately 60
 * questions (d-mat.de FAQ), which is about 90 seconds each. We have 10
 * questions, so the stage runs 15 minutes at that rate. Giving 10 questions the
 * full 90 would have reproduced the module's length while destroying its pace,
 * which is the part every account of the real sitting calls the difficulty.
 */
export const GAM_MINUTES = fullMock.gamMinutes as number

/** OFFICIAL — GAM PDF p. 34. Kept because the fact holds even though we cannot fill it. */
export const OFFICIAL_GAM_MINUTES = fullMock.officialGamMinutes as number
/** OFFICIAL, approximate — d-mat.de FAQ. */
export const OFFICIAL_GAM_QUESTIONS_APPROX = fullMock.officialGamQuestionsApprox as number

/** OFFICIAL — GAM PDF p. 6, "about three hours with a break of 30 minutes". */
export const BREAK_MINUTES = fullMock.breakMinutes as number

/** What this sitting runs, as distinct from the real examination's 195 minutes. */
export const TOTAL_MINUTES = fullMock.totalMinutes as number

const SECTIONS = fullMock.sections as Record<string, string[]>

/** The three Core stages, in the documented subtest order. */
export function fullMockCoreStages(): FullMockStage[] {
  return SECTION_IDS.map((sectionId) => ({
    sectionId,
    label: SECTION_BY_ID[sectionId].title,
    unitNoun: UNIT[sectionId],
    // The whole section, not just this mock's twenty: the launcher also uses
    // the pool to rebuild a session that was interrupted mid-stage.
    pool: getPublicQuestions(sectionId),
    count: SECTIONS[sectionId]?.length ?? 0,
    questionIds: SECTIONS[sectionId] ?? [],
  }))
}

export const fullMockCoreSize = (): number =>
  SECTION_IDS.reduce((n, s) => n + (SECTIONS[s]?.length ?? 0), 0)

/**
 * The General Academic half, answer-free.
 *
 * Resolved from a FIXED list of pack ids rather than from "every active pack",
 * so adding a pack to the pilot does not silently change what this mock
 * contains. A mock whose content moves is not a mock.
 *
 * An id that no longer resolves is dropped rather than throwing: a pack can be
 * retired between builds, and a sitting that is one pack shorter is a better
 * outcome than a page that will not render.
 */
export function fullMockGamPacks(): PublicGamPackFile[] {
  return (fullMock.gamPackIds as string[])
    .map((id) => getPublicPack(id))
    .filter((f): f is PublicGamPackFile => Boolean(f))
}

export const fullMockGamSize = (): number =>
  fullMockGamPacks().reduce((n, f) => n + f.questions.length, 0)

/** Total questions across both modules — derived, never written down twice. */
export const fullMockSize = (): number => fullMockCoreSize() + fullMockGamSize()
