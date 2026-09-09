import cachePolicy from '@/content/gam/packs/gam-computational-sciences-cache-policy-001.json'
import portTariff from '@/content/gam/packs/gam-economics-port-tariff-001.json'
import twoStageInspection from '@/content/gam/packs/gam-mathematics-two-stage-inspection-001.json'
import lakeOxygen from '@/content/gam/packs/gam-natural-sciences-lake-oxygen-001.json'
import codingAgreement from '@/content/gam/packs/gam-social-sciences-coding-agreement-001.json'

import type { GamPackFile, GamQuestion, SourcePack } from '@/lib/types/gam'

/**
 * Single lookup point for GAM content.
 *
 * Deliberately not `lib/content/registry.ts`. Module A is a bank of standalone
 * questions keyed by section; GAM is a set of source packs whose questions only
 * mean anything next to their source. Forcing the second shape into the first is
 * what the authoring spec exists to prevent, so the two registries stay apart.
 *
 * The packs are validated by `scripts/gam/verify-packs.mjs`; the cast here only
 * gives the app the narrow types a JSON import cannot infer.
 */
const FILES = [
  twoStageInspection,
  lakeOxygen,
  portTariff,
  codingAgreement,
  cachePolicy,
] as unknown as GamPackFile[]

/**
 * A retired pack is kept in the repository as the record of why it was retired
 * (spec §5.10). It is not content, and nothing in the product may reach it.
 *
 * Retired packs are not imported at all — a JSON import is bundled whether or
 * not anything renders it, and there are five of them. The filter stays as the
 * second lock: if a pack listed above is ever retired, it drops out here rather
 * than reaching the interface while someone remembers to edit the list.
 */
const isRetired = (file: GamPackFile) => file.pack.provenance.reviewStatus === 'rejected'

const ACTIVE = FILES.filter((f) => !isRetired(f))

/**
 * How far a pack has got through the gates, in the product's words.
 *
 * The gates themselves live in `scripts/gam/lib/review.mjs` and are the
 * authority. This is the label the interface is allowed to show, and it exists
 * so that "passed validation" can never be rendered as "checked by a person".
 */
export type PackReadiness = 'pilot' | 'reviewed'

export const readinessOf = (pack: SourcePack): PackReadiness =>
  pack.provenance.reviewStatus === 'human-reviewed' ? 'reviewed' : 'pilot'

export const getPacks = (): GamPackFile[] => ACTIVE

export const getPack = (id: string): GamPackFile | undefined =>
  ACTIVE.find((f) => f.pack.id === id)

export const getPackIds = (): string[] => ACTIVE.map((f) => f.pack.id)

export const getPackQuestions = (id: string): GamQuestion[] => getPack(id)?.questions ?? []

export const totalGamQuestions = (): number =>
  ACTIVE.reduce((n, f) => n + f.questions.length, 0)

/** Every active question, pack by pack, for a session that runs the whole set. */
export const allPackQuestions = (): { pack: SourcePack; questions: GamQuestion[] }[] =>
  ACTIVE.map((f) => ({ pack: f.pack, questions: f.questions }))

/**
 * OFFICIAL (GAM PDF p. 34): the subject module runs for 90 minutes in total.
 * Everything else about how a session behaves here is product behaviour.
 */
export const GAM_TOTAL_MINUTES = 90
