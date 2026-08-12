import type { SectionId } from '@/lib/sections'

export type Difficulty = 'low' | 'medium' | 'high'

export const DIFFICULTIES: readonly Difficulty[] = ['low', 'medium', 'high']

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

/** Provenance for a generated item, so a stale bank is obvious. */
export type GeneratorStamp = {
  name: string
  version: string
  /** ISO date the solver last confirmed this item. */
  verifiedAt: string
}

/**
 * How well a question's mechanics trace to the official material. See
 * `content/question-authoring/DMAT_QUESTION_AUTHORING_SPEC.md` §0 — an inference
 * never gets promoted to a fact by being useful.
 */
export type DmatAlignment = 'officially_documented' | 'reasonable_extrapolation' | 'uncertain'

/**
 * A progressive nudge. Level 1 points at where to look, 2 narrows the search, 3
 * gives a procedural instruction. None of them may contain the answer —
 * `verify-bank` fails the build if one does.
 */
export type Hint = { level: 1 | 2 | 3; text: string }

/** A drawing instruction the section's solution renderer knows how to execute. */
export type SolutionVisual =
  // Figure Sequences
  | { type: 'fs-track'; symbolId: string; panels: number[] }
  | {
      type: 'fs-aspect'
      symbolId: string
      aspect: 'movement' | 'rotation' | 'colour' | 'boundary' | 'acceleration'
      panels: number[]
    }
  | { type: 'fs-predict'; panel: 4 | 5 }
  // Mathematical Equations
  | { type: 'me-equation'; equation: string; note?: string }
  | { type: 'me-values'; values: Record<string, number> }
  // Latin Squares
  | { type: 'ls-lines'; row?: number; col?: number; excluded?: string[] }
  | { type: 'ls-place'; cell: GridCell; letter: string; technique: LatinTechnique }
  | {
      type: 'ls-pair'
      line: { kind: 'row' | 'col'; index: number }
      letters: [string, string]
      cells: [GridCell, GridCell]
    }

export type SolutionStep = {
  /** Short imperative, e.g. "Track the triangle". */
  title: string
  detail: string
  visual?: SolutionVisual
}

/**
 * The structured solution. Present as five parts because a wall of prose does
 * not teach a search — see the spec, §7.6.
 */
export type Solution = {
  keyInsight: string
  steps: SolutionStep[]
  answer: string
  /** A faster route, or the transferable lesson. */
  takeaway: string
}

/** Measured, never assigned. Drives coverage analysis and future generation. */
export type QuestionMeta = {
  patternType: string[]
  skill: string
  dmatAlignment: DmatAlignment
  /** Reasoning steps required to reach the answer, by the subtest's own model. */
  reasoningDepth: number
  /** option key -> the error family that option encodes. */
  distractorTypes: Record<string, string>
  generationNotes?: string
}

type QuestionBase = {
  id: string
  section: SectionId
  difficulty: Difficulty
  /** Why the correct answer is correct. Required for every item. */
  explanation: string
  /**
   * optionId -> why that option is wrong. Must cover every incorrect option;
   * `verify-bank` fails the build otherwise.
   */
  distractorNotes: Record<string, string>
  generator: GeneratorStamp
  /**
   * The three below are optional so questions predating the Phase 3 upgrade keep
   * rendering. The UI falls back to `explanation` when `solution` is absent and
   * hides the hint affordance when `hints` is absent.
   */
  hints?: Hint[]
  /**
   * Named `walkthrough`, not `solution`: Mathematical Equations already uses
   * `solution` for the verified letter-to-value assignment.
   */
  walkthrough?: Solution
  meta?: QuestionMeta
}

// ---------------------------------------------------------- Figure Sequences

/**
 * Colours observed in the official materials. Kept as a closed set so the
 * renderer and the generator cannot disagree about what is paintable.
 */
export type FigureColour =
  | 'black'
  | 'white'
  | 'pink'
  | 'yellow'
  | 'green'
  | 'orange'
  | 'blue'

export type FigureShape =
  | 'square'
  | 'circle'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'arrow'
  | 'cross'

export type Rotation = 0 | 90 | 180 | 270

export type GridCell = { row: number; col: number }

export type FigureSymbol = {
  /** Stable across panels — this is what makes a symbol trackable. */
  id: string
  shape: FigureShape
  cell: GridCell
  rotation: Rotation
  colour: FigureColour
}

export type FigurePanel = { symbols: FigureSymbol[] }

export type Direction = 'up' | 'down' | 'left' | 'right'
export type DiagonalDirection = 'up-left' | 'up-right' | 'down-left' | 'down-right'

/**
 * How a single symbol evolves from panel to panel. This drives generation AND
 * the written explanation, so the two cannot drift apart.
 *
 * Movement paths mirror the official rules (GAM PDF pp. 7-8): straight lines,
 * diagonals, travel along the outer border, or a repeating direction cycle.
 * A diagonal mover may never switch to another movement type.
 */
export type MovementRule =
  | {
      type: 'linear'
      axis: 'vertical' | 'horizontal'
      /** Fixed line the symbol travels along (row index for horizontal). */
      line: number
      direction: Direction
      step: number | 'x+1'
      boundary: 'bounce'
    }
  | {
      type: 'diagonal'
      direction: DiagonalDirection
      step: number | 'x+1'
      boundary: 'bounce'
    }
  | {
      type: 'border'
      direction: 'clockwise' | 'counter-clockwise'
      step: number | 'x+1'
    }
  | {
      type: 'direction-cycle'
      /** e.g. left, up, right, down, repeating. */
      directions: Direction[]
      step: number
    }
  | { type: 'static' }

export type RotationRule =
  | { type: 'none' }
  | { type: 'rotate'; direction: 'cw' | 'ccw'; degrees: 90 | 180 | 270; accelerating?: boolean }

export type ColourRule =
  | { type: 'constant' }
  /**
   * Cycles through the listed colours, one step per panel. `accelerating`
   * advances by x+1 instead, which needs three colours to be readable — with
   * two it lands on the same alternation an ordinary cycle gives.
   */
  | { type: 'cycle'; colours: FigureColour[]; accelerating?: boolean }

export type SymbolRule = {
  movement: MovementRule
  rotation: RotationRule
  colour: ColourRule
}

export type FigureOptionId = 'matrix1' | 'matrix2' | 'matrix3'

export type FigureImageChoice = {
  /** image1 = the 5th matrix, image2 = the 6th. */
  label: 'image1' | 'image2'
  options: { id: FigureOptionId; panel: FigurePanel }[]
  correctOptionId: FigureOptionId
}

export type FigureSequenceQuestion = QuestionBase & {
  kind: 'figure-sequence'
  section: 'figure-sequences'
  grid: { rows: number; cols: number }
  /** The four matrices shown to the candidate. */
  given: FigurePanel[]
  /** Exactly two: the 5th and 6th matrices. */
  images: [FigureImageChoice, FigureImageChoice]
  /** symbolId -> the rule it follows. */
  rules: Record<string, SymbolRule>
}

// ------------------------------------------------------ Mathematical Equations

export type MathEquationsQuestion = QuestionBase & {
  kind: 'math-equations'
  section: 'mathematical-equations'
  /** Display strings, e.g. "3 × C = A". */
  equations: string[]
  variables: string[]
  /** The letter the question asks for. */
  asked: string
  options: { id: string; value: number }[]
  correctOptionId: string
  /** Full verified assignment for every letter. */
  solution: Record<string, number>
  solutionSteps: string[]
}

// ------------------------------------------------------------- Latin Squares

/**
 * Both techniques the official solution paths demonstrate. A naked single asks
 * which letter a cell must take; pair elimination asks which cell a letter must
 * occupy. Four of the six official solutions lead with the latter.
 */
export type LatinTechnique = 'naked-single' | 'pair-elimination'

export type EliminationStep = {
  cell: GridCell
  letter: string
  reason: string
  /** Absent on questions generated before the technique split existed. */
  technique?: LatinTechnique
}

export type LatinSquaresQuestion = QuestionBase & {
  kind: 'latin-square'
  section: 'latin-squares'
  size: number
  letters: string[]
  /** null = empty cell. The target cell is also null. */
  grid: (string | null)[][]
  target: GridCell
  options: { id: string; letter: string }[]
  correctOptionId: string
  solutionSteps: EliminationStep[]
  /**
   * Forced placements required before the target is determined. This is the
   * difficulty metric — measured by the solver, never assigned by feel.
   */
  forcedPlacementDepth: number
}

// ------------------------------------------------------------------- Union

export type Question =
  | FigureSequenceQuestion
  | MathEquationsQuestion
  | LatinSquaresQuestion

export type QuestionOf<S extends SectionId> = Extract<Question, { section: S }>

/**
 * A figure item is answered with two selections; the others with one.
 * Keyed by image label for figures, and by the single key `answer` otherwise.
 */
export type Selection = Record<string, string>

/** An item counts correct only when every required selection is correct. */
export function isCorrect(question: Question, selection: Selection): boolean {
  if (question.kind === 'figure-sequence') {
    return question.images.every((img) => selection[img.label] === img.correctOptionId)
  }
  return selection.answer === question.correctOptionId
}

/** Total selections an item needs before it can be submitted. */
export function requiredSelectionCount(question: Question): number {
  return question.kind === 'figure-sequence' ? 2 : 1
}
