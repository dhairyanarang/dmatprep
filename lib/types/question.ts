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
  /** Cycles through the listed colours, one step per panel. */
  | { type: 'cycle'; colours: FigureColour[] }

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

export type EliminationStep = {
  cell: GridCell
  letter: string
  reason: string
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
