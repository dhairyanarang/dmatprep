import cachePolicy from '@/content/gam/packs/gam-computational-sciences-cache-policy-001.json'
import finiteAutomata from '@/content/gam/packs/gam-computational-sciences-finite-automata-001.json'
import portTariff from '@/content/gam/packs/gam-economics-port-tariff-001.json'
import twoStageInspection from '@/content/gam/packs/gam-mathematics-two-stage-inspection-001.json'
import chargeInventory from '@/content/gam/packs/gam-natural-sciences-charge-inventory-001.json'
import lakeOxygen from '@/content/gam/packs/gam-natural-sciences-lake-oxygen-001.json'
import fixedPriceRights from '@/content/gam/packs/gam-business-administration-fixed-price-rights-001.json'
import codingAgreement from '@/content/gam/packs/gam-social-sciences-coding-agreement-001.json'
import twoStageSampling from '@/content/gam/packs/gam-social-sciences-two-stage-sampling-001.json'

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
  // Exam-alignment set, 22 November 2026 — ten questions across the topics
  // reported from the September 2026 sitting. `automated-pass` only: every
  // mechanical gate is green and no person has read them yet.
  fixedPriceRights,
  chargeInventory,
  finiteAutomata,
  twoStageSampling,
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

/* ------------------------------------------------------- the answer split */

/**
 * Fields that answer a GAM question, and must not reach a candidate who has
 * not submitted.
 *
 * Module A solved this by serving `getPublicQuestions` and fetching the
 * solution half as a static asset. GAM is split differently and more strictly,
 * because it can be: Module A marks each question as it is answered, so it
 * needs the key in the browser from the first paint. A GAM session is marked
 * only when it is submitted, so the key is fetched at that moment — from
 * `POST /api/module-b/mark` — and before it nothing that answers a question has
 * been sent at all.
 *
 * `computation` is here and it is easy to miss: `computation.expected` IS the
 * answer, in a field whose name does not say so. `supportSpans` quotes the
 * exact lines the key rests on, which hands over the reasoning even where it
 * does not hand over the letter. `hints` deliberately stay public — they are
 * pre-answer content by design, and the pack validator already rejects a hint
 * that contains its answer.
 */
export const GAM_SOLUTION_KEYS = [
  'correctOptionId',
  'explanation',
  'refutations',
  'supportSpans',
  'computation',
] as const

export type GamSolutionKey = (typeof GAM_SOLUTION_KEYS)[number]

/** A GAM question as a candidate first meets it: everything but the answer. */
export type PublicGamQuestion = Omit<GamQuestion, GamSolutionKey>

export type PublicGamPackFile = { pack: SourcePack; questions: PublicGamQuestion[] }

/** The reveal half of one question, keyed by question id. */
export type GamSolutionEntry = Pick<GamQuestion, GamSolutionKey>

function stripGamSolution(question: GamQuestion): PublicGamQuestion {
  const copy = { ...question } as Record<string, unknown>
  for (const key of GAM_SOLUTION_KEYS) delete copy[key]
  return copy as unknown as PublicGamQuestion
}

/**
 * The source pack, rebuilt field by field.
 *
 * An ALLOWLIST, not a strip, and the difference was load-bearing: three packs
 * carry `provenance.retiredQuestions`, each holding a retired question's full
 * record — key, explanation, refutations and all. That field is not in
 * `SourcePack` at all. It rides into the product through the
 * `as unknown as GamPackFile[]` cast above, so no type error and no
 * denylist of known answer fields would ever have caught it, and it was being
 * serialised into every page that showed the pack.
 *
 * Listing what the interface may have means the next undeclared field added to
 * a pack JSON stays out by default instead of leaking by default.
 */
function publicPack(pack: SourcePack): SourcePack {
  return {
    id: pack.id,
    domain: pack.domain,
    title: pack.title,
    blocks: pack.blocks,
    defines: pack.defines,
    provenance: {
      originality: pack.provenance.originality,
      draftedBy: pack.provenance.draftedBy,
      reviewStatus: pack.provenance.reviewStatus,
      reviewedBy: pack.provenance.reviewedBy,
      reviewedAt: pack.provenance.reviewedAt,
      notes: pack.provenance.notes,
    },
    contentHash: pack.contentHash,
  }
}

/** What the two runner pages serve. Never `getPacks()` — that carries answers. */
export const getPublicPacks = (): PublicGamPackFile[] =>
  ACTIVE.map((f) => ({ pack: publicPack(f.pack), questions: f.questions.map(stripGamSolution) }))

export const getPublicPack = (id: string): PublicGamPackFile | undefined => {
  const file = getPack(id)
  return file
    ? { pack: publicPack(file.pack), questions: file.questions.map(stripGamSolution) }
    : undefined
}

/**
 * The answer halves for the named packs, for the marking route only.
 *
 * Unknown pack ids are ignored rather than refused: the caller is a browser
 * reporting which packs it just sat, and an id that no longer exists is a
 * stale draft, not an attack worth a different status code.
 */
export function getGamSolutions(packIds: string[]): Record<string, GamSolutionEntry> {
  const wanted = new Set(packIds)
  const out: Record<string, GamSolutionEntry> = {}
  for (const file of ACTIVE) {
    if (!wanted.has(file.pack.id)) continue
    for (const q of file.questions) {
      out[q.id] = {
        correctOptionId: q.correctOptionId,
        explanation: q.explanation,
        refutations: q.refutations,
        supportSpans: q.supportSpans,
        computation: q.computation,
      }
    }
  }
  return out
}
