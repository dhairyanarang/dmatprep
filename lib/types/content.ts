import type { SourceId } from '@/content/exam/sources'

/**
 * How well supported a claim is.
 *
 * - `official`  — stated outright in an official source.
 * - `inferred`  — a sound conclusion from official sources, but not stated.
 * - `unconfirmed` — no official source found either way.
 *
 * Anything not `official` renders with a visible badge and its reasoning. This
 * is the mechanism that keeps a plausible guess from reading as fact.
 */
export type Confidence = 'official' | 'inferred' | 'unconfirmed'

export type SourceRef = {
  id: SourceId
  /** Page in the cited PDF, where applicable. */
  page?: number
}

export type Claim = {
  text: string
  sources?: SourceRef[]
  confidence?: Confidence
  /** Required in practice whenever confidence is not `official`. */
  note?: string
}

/**
 * Named diagrams. Content declares *what* to show; the diagram component owns
 * *how*, so the content layer stays data-only.
 */
export type DiagramKind =
  | 'fs-anatomy'
  | 'fs-movement'
  | 'fs-bounce'
  | 'fs-catalogue'
  | 'fs-difficulty'
  | 'ls-constraint'
  | 'ls-difficulty'
  | 'me-range'
  | 'me-chain'
  | 'me-difficulty'

export type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'stats'; items: { value: string; unit?: string; label: string }[] }
  | { type: 'diagram'; kind: DiagramKind; title?: string; description?: string }
  | { type: 'cards'; title?: string; items: { title: string; text: string }[] }
  | ({ type: 'prose' } & Claim)
  | { type: 'rules'; title?: string; items: Claim[] }
  | { type: 'steps'; title?: string; items: string[] }
  | { type: 'callout'; variant: 'note' | 'warning' | 'unconfirmed'; title?: string; text: string }
  | { type: 'quote'; text: string; sources: SourceRef[] }
  /** Renders a real item from the question bank through the real renderers. */
  | { type: 'example'; questionId: string; caption?: string }

export type LearnPage = {
  intro: string
  blocks: ContentBlock[]
}

export type Tip = {
  title: string
  body: string
}

export type TipsPage = {
  intro: string
  /** Optional diagrams and cards rendered above the strategy list. */
  blocks?: ContentBlock[]
  strategies: Tip[]
  mistakes: Tip[]
  dos: string[]
  donts: string[]
}
