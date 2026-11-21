/**
 * Module B — Subject Module (General Academic Module) content model.
 *
 * See `content/question-authoring/DMAT_GAM_AUTHORING_SPEC.md`. The unit of
 * content here is a **source pack**, not a question: the official material
 * describes "a combination of a typical subject-related problem (input) and
 * corresponding single-choice questions" (GAM PDF p. 6).
 *
 * These types deliberately do NOT extend the Module A `Question` union. That
 * union assumes a code-derivable answer and a seeded generator stamp, and
 * neither holds for authored prose. Keeping them separate is what stops Module
 * A's correctness guarantee being implicitly and wrongly claimed here.
 *
 * Nothing renders these yet — the pilot is content plus validation only.
 */
import type { Difficulty, Hint } from '@/lib/types/question'

/** Exactly the eight areas named on GAM PDF p. 34. No others may be added. */
export const GAM_DOMAINS = [
  'mathematics',
  'computational-sciences',
  'natural-sciences',
  'engineering',
  'business-administration',
  'economics',
  'social-sciences',
  'humanities',
] as const

export type GamDomain = (typeof GAM_DOMAINS)[number]

/* ------------------------------------------------------------ source blocks */

/** A drawable figure, described as state. No image assets, ever. */
export type GamFigureSpec =
  | {
      type: 'line-chart'
      xLabel: string
      yLabel: string
      series: { id: string; label: string; points: [number, number][] }[]
      /**
       * Two shapes, both attested.
       *
       * `at` pins a note to a coordinate. Without it the note is prose about
       * the chart — `scripts/gam/sets/small-packs-2026-09-08.mjs` writes the
       * lake-oxygen readings that way on purpose, so the numbers are part of
       * the source and not only part of the picture, and
       * `scripts/gam/lib/validate.mjs` reads `label`/`detail` for every
       * annotation regardless of type. `at` was required here while the
       * authoring side never set it, which is why the renderer crashed on the
       * one active pack that has a chart.
       */
      annotations?: { at?: [number, number]; label: string; detail?: string }[]
    }
  | {
      type: 'schematic'
      /** Left-to-right or top-to-bottom parts, e.g. the layers of a wall. */
      parts: { id: string; label: string; detail?: string }[]
      annotations?: { label: string; detail?: string }[]
    }

/**
 * Every block carries a stable id. That id is the anchor for dependency
 * tracking — the official solutions cite the source the same way ("see
 * paragraphs 1 and 2", GAM PDF p. 57).
 */
export type SourceBlock =
  | { kind: 'heading'; id: string; text: string }
  | { kind: 'paragraph'; id: string; text: string }
  | { kind: 'list'; id: string; ordered: boolean; items: string[] }
  | {
      kind: 'formula'
      id: string
      latex: string
      caption?: string
      legend?: { symbol: string; meaning: string }[]
    }
  | { kind: 'table'; id: string; caption: string; columns: string[]; rows: string[][] }
  | { kind: 'figure'; id: string; caption: string; spec: GamFigureSpec }

/* ---------------------------------------------------------------- questions */

/** Abstracted from the 27 official sample questions. INFERENCE, not official. */
export type GamReasoningType =
  | 'retrieve'
  | 'read-exhibit'
  | 'apply-formula'
  | 'qualitative-inference'
  | 'comparative'
  | 'sensitivity'
  | 'generalisation'
  | 'classify-scenario'

export type GamDistractorFamily =
  | 'misapplied-formula'
  | 'swapped-quantities'
  | 'wrong-direction-of-effect'
  | 'right-concept-wrong-scope'
  | 'plausible-but-unstated'
  | 'contradicts-source'
  | 'arithmetic-slip'

export type GamOption = { id: string; text: string }

export type GamQuestion = {
  id: string
  packId: string
  stem: string
  /** Official: a question may carry its own figure, table or formula (p. 34). */
  stemBlocks?: SourceBlock[]
  /** Exactly four — enforced by the validator, not just by this tuple. */
  options: [GamOption, GamOption, GamOption, GamOption]
  correctOptionId: string
  reasoning: GamReasoningType

  /** Source blocks the answer genuinely requires. Never empty. */
  dependsOn: string[]
  /** Verbatim spans backing the answer; each quote must occur in its block. */
  supportSpans: { blockId: string; quote: string }[]
  /** Machine-checkable arithmetic, where the answer is computable. */
  computation?: { expression: string; expected: number; unit?: string }

  explanation: string
  /** Why each wrong option is wrong, cited to a block that rules it out. */
  refutations: Record<string, { blockId: string; family: GamDistractorFamily; reason: string }>
  hints: [Hint, Hint, Hint]

  difficulty: Difficulty
  meta: {
    stepCount: number
    blockSpan: number
    transferDistance: 0 | 1 | 2
    requiresExhibit: boolean
  }
}

/* -------------------------------------------------------------------- packs */

/**
 * Human review is a gate, not a label. `automated-pass` means every mechanical
 * validator succeeded and nothing more; only a person may move a pack to
 * `human-reviewed`, and only a `human-reviewed` pack is production-ready.
 */
export type GamReviewStatus = 'draft' | 'automated-pass' | 'human-reviewed' | 'rejected'

export type SourcePack = {
  id: string
  domain: GamDomain
  title: string
  blocks: SourceBlock[]
  /** Terms this pack defines, so the outside-knowledge gate can tell them apart. */
  defines: string[]
  provenance: {
    originality: 'original'
    draftedBy: string
    reviewStatus: GamReviewStatus
    reviewedBy?: string
    reviewedAt?: string
    notes?: string
  }
  /** Over pack + questions, so a silent edit is detectable. */
  contentHash?: string
}

export type GamPackFile = {
  pack: SourcePack
  questions: GamQuestion[]
}
