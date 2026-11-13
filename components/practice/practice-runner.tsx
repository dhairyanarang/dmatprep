'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ReadingMeasure } from '@/components/layout/page-shell'
import { DifficultyBadge } from '@/components/practice/difficulty-badge'
import { ExplanationSheet } from '@/components/practice/explanation-sheet'
import { FeedbackSummary } from '@/components/practice/feedback-panel'
import { HintPanel, HintTrigger } from '@/components/practice/hint-panel'
import { QuestionView } from '@/components/practice/question-view'
import { SectionProgress } from '@/components/practice/section-progress'
import { SetComplete } from '@/components/practice/set-complete'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { PublicQuestion } from '@/lib/content/registry'
import { useProgress, useProgressActions, useProgressReady } from '@/lib/progress/use-progress'
import { useSolutions } from '@/lib/solutions/use-solutions'
import type { SectionId } from '@/lib/sections'
import {
  answeredCorrectly,
  exposureContextOf,
  type PracticeAnswer,
  type PracticeDraft,
  type PracticeMode,
} from '@/lib/types/progress'
import {
  DIFFICULTIES,
  isCorrect,
  requiredSelectionCount,
  type Difficulty,
  type Question,
  type Selection,
} from '@/lib/types/question'

type Filter = Difficulty | 'all'

/** A question nobody has touched yet. Module scope so it is referentially stable. */
const UNANSWERED: PracticeAnswer = { selection: {}, hintsUsed: 0, submitted: false }

type RunnerProps = {
  /** Absent for a mixed session; each attempt is filed under its own question's section. */
  sectionId?: SectionId
  /** Answer-free records as the page serves them; solutions are fetched and merged below. */
  questions: PublicQuestion[]
  mode?: PracticeMode
  showProgress?: boolean
  showFilter?: boolean
}

/**
 * Practice is the whole bank on one page.
 *
 * It used to be one question at a time behind a Check answer button and a Next
 * question button, which is the shape an exam has and the wrong shape for
 * study: two clicks of ceremony per item, and no way to look at the question
 * before or after. Now every question matching the filter is on the page, an
 * answer is committed by choosing it, and moving on is scrolling.
 *
 * Practice restores itself rather than asking.
 *
 * A mock is a commitment worth confirming before you resume it; an untimed
 * practice run is not. Coming back should simply put you where you were, on the
 * question you were on, with the hints you had already opened — the way closing
 * a book and opening it again does.
 *
 * The draft is read after hydration, which is why this waits a paint: reading
 * `localStorage` during the first render is what produces hydration mismatches.
 */
export function PracticeRunner(props: RunnerProps) {
  const ready = useProgressReady()
  const progress = useProgress()

  // The page served these without their answers. Fetch the other half and merge
  // it back, so everything below this line sees complete questions exactly as it
  // always has. See lib/solutions/use-solutions.ts.
  const sections = useMemo(
    () => [...new Set(props.questions.map((q) => q.section))],
    [props.questions],
  )
  const solutions = useSolutions(sections)

  const key = props.mode === 'quick' ? 'quick' : `practice:${props.sectionId ?? 'mixed'}`

  if (solutions.error) {
    return (
      <div className="border-border bg-card rounded-2xl border p-5">
        <p className="text-sm">
          The answers and explanations for this section could not be loaded, so practice would not
          be able to mark your work. Check your connection and reload the page.
        </p>
      </div>
    )
  }

  if (!ready || !solutions.ready) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    )
  }

  const questions = solutions.hydrate(props.questions)
  const saved = progress.practiceDrafts[key]
  const known = new Set(questions.map((q) => q.id))
  // A draft written before the bank was regenerated points at questions that no
  // longer exist. Better to start clean than to restore a broken position.
  const draft = saved && saved.questionIds.every((id) => known.has(id)) ? saved : null

  return <PracticeSession {...props} questions={questions} draftKey={key} initialDraft={draft} />
}

function PracticeSession({
  sectionId,
  questions,
  mode = 'practice',
  showProgress = true,
  showFilter = true,
  draftKey,
  initialDraft,
}: Omit<RunnerProps, 'questions'> & {
  /** Hydrated by `PracticeRunner` above: solutions merged back in. */
  questions: Question[]
  draftKey: string
  initialDraft: PracticeDraft | null
}) {
  const progress = useProgress()
  const { recordAttempt, recordExposure, setPracticeDraft, clearPracticeDraft } =
    useProgressActions()

  const [filter, setFilter] = useState<Filter>(initialDraft?.filter ?? 'all')
  /**
   * What has been done to each question, keyed by question id.
   *
   * The single source of truth for selection, hints and whether an answer has
   * been committed. Keying by id rather than by position is what lets every
   * question be on the page at once and still restore correctly, and it is what
   * guarantees a question already committed stays committed — so no attempt is
   * ever recorded against one twice.
   */
  const [answers, setAnswers] = useState<Record<string, PracticeAnswer>>(() => {
    if (!initialDraft) return {}
    const seeded = { ...(initialDraft.answered ?? {}) }
    // A draft written before this field existed knows only the question it was
    // left on; keep that rather than dropping the learner's work.
    const current = initialDraft.questionIds[initialDraft.index]
    if (current && !seeded[current] && initialDraft.submitted) {
      seeded[current] = {
        selection: initialDraft.selection ?? {},
        hintsUsed: initialDraft.hintsUsed ?? 0,
        submitted: true,
      }
    }
    return seeded
  })

  /** The question whose working is open in the side panel, if any. */
  const [detailId, setDetailId] = useState<string | null>(null)

  /**
   * Time is measured between commits rather than from when a question was first
   * shown, because on a page where everything is visible there is no moment a
   * question "starts". The gap between one answer and the next is what the
   * learner actually spent on it, scrolling included.
   */
  const lastCommitAt = useRef<number>(0)
  useEffect(() => {
    lastCommitAt.current = Date.now()
  }, [])

  const [restoredOrder, setRestoredOrder] = useState<string[] | null>(
    initialDraft?.questionIds ?? null,
  )

  const pool = useMemo(() => {
    const filtered =
      filter === 'all' ? questions : questions.filter((q) => q.difficulty === filter)

    // A restored run keeps the order it had, so a question stays where it was
    // on the page across a reload.
    if (restoredOrder) {
      const byId = new Map(filtered.map((q) => [q.id, q]))
      const kept = restoredOrder.map((id) => byId.get(id)).filter((q): q is Question => !!q)
      if (kept.length === filtered.length) return kept
    }

    // Unseen questions first, so repeat sessions don't replay the same items.
    const done = sectionId ? answeredCorrectly(progress, sectionId) : new Set<string>()
    return [...filtered].sort((a, b) => Number(done.has(a.id)) - Number(done.has(b.id)))
    // `progress` is deliberately excluded: re-sorting mid-session would shuffle
    // the deck under the candidate's feet after every answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, filter, sectionId, restoredOrder])

  const answeredCount = pool.reduce((n, q) => n + (answers[q.id]?.submitted ? 1 : 0), 0)

  /**
   * The restore point, written on every change.
   *
   * `index`, `selection`, `hintsUsed` and `submitted` describe one question and
   * no longer mean anything to this view, but they are still written, and they
   * point at the first unanswered question. A draft saved here therefore opens
   * in the right place in a build that predates the scrolling page.
   */
  useEffect(() => {
    const nextUp = Math.max(
      0,
      pool.findIndex((q) => !answers[q.id]?.submitted),
    )
    const at = pool[nextUp]
    const legacy = (at && answers[at.id]) || UNANSWERED
    setPracticeDraft({
      key: draftKey,
      questionIds: pool.map((q) => q.id),
      index: nextUp,
      selection: legacy.selection,
      hintsUsed: legacy.hintsUsed,
      submitted: legacy.submitted,
      filter,
      answered: answers,
      updatedAt: new Date().toISOString(),
    })
  }, [draftKey, pool, answers, filter, setPracticeDraft])

  const patch = useCallback((questionId: string, next: Partial<PracticeAnswer>) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...UNANSWERED, ...prev[questionId], ...next },
    }))
  }, [])

  /**
   * Commit the answer. Called the moment the last required option is chosen,
   * never from a button.
   *
   * Takes the selection as an argument rather than reading it back from state:
   * the click that completes the answer is the click that commits it, and that
   * click's state update has not landed yet.
   */
  const commit = useCallback(
    (question: Question, sel: Selection, hintsUsed: number) => {
      patch(question.id, { selection: sel, submitted: true })
      const now = Date.now()
      recordAttempt({
        questionId: question.id,
        sectionId: question.section,
        difficulty: question.difficulty,
        mode,
        correct: isCorrect(question, sel),
        selection: sel,
        at: new Date(now).toISOString(),
        durationMs: Math.max(0, now - lastCommitAt.current),
        hintsUsed: Math.min(hintsUsed, 3) as 0 | 1 | 2 | 3,
      })
      lastCommitAt.current = now
      // Answered, so it is spent — from the practice pool, and only that one.
      recordExposure(
        [{ questionId: question.id, sectionId: question.section }],
        exposureContextOf(mode),
      )
      // Past the first answer the order is fixed, so nothing reshuffles under a
      // page the learner is part-way down.
      setRestoredOrder((prev) => prev ?? pool.map((q) => q.id))
    },
    [patch, recordAttempt, recordExposure, mode, pool],
  )

  const handleSelect = useCallback(
    (question: Question, key: string, optionId: string) => {
      const current = answers[question.id] ?? UNANSWERED
      if (current.submitted) return
      const next = { ...current.selection, [key]: optionId }
      patch(question.id, { selection: next })
      // Choosing is answering. A single-answer question commits on the click; a
      // Figure Sequences item waits until both panels have been chosen, because
      // until then the answer is not yet an answer.
      if (Object.keys(next).length >= requiredSelectionCount(question)) {
        commit(question, next, current.hintsUsed)
      }
    },
    [answers, patch, commit],
  )

  const handleFilter = useCallback((value: Filter) => {
    setFilter(value)
    // The filter changes which questions are in play, so the pinned order goes
    // with it. Answers are kept: they are keyed by question id, so a question
    // met under one filter is still answered under another.
    setRestoredOrder(null)
  }, [])

  if (questions.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
        No questions in this bank yet.
      </p>
    )
  }

  const detail = detailId ? pool.find((q) => q.id === detailId) : undefined
  const detailAnswer = (detail && answers[detail.id]) || UNANSWERED

  return (
    <div className="space-y-5">
      {showProgress && sectionId ? (
        <SectionProgress sectionId={sectionId} bankSize={questions.length} />
      ) : null}

      {/* Sticky so the count and the filter stay reachable however far down the
          bank the learner has scrolled. */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <span className="text-muted-foreground text-sm tabular-nums">
          {answeredCount} / {pool.length} answered
        </span>
        {showFilter ? <FilterBar filter={filter} onChange={handleFilter} /> : null}
      </div>

      {pool.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No {filter} questions in this section.
        </p>
      ) : null}

      {/* Slightly more air between questions than between the page's own
          furniture above, so the column reads as a list of separate things. */}
      <div className="space-y-6">
        {pool.map((question, i) => (
          <QuestionCard
            key={question.id}
            question={question}
            position={i + 1}
            answer={answers[question.id] ?? UNANSWERED}
            onSelect={handleSelect}
            onReveal={(n) => patch(question.id, { hintsUsed: n })}
            onSeeMore={() => setDetailId(question.id)}
          />
        ))}
      </div>

      {pool.length > 0 && answeredCount === pool.length && sectionId ? (
        <SetComplete
          sectionId={sectionId}
          questions={pool}
          answered={pool.length}
          onRestart={() => {
            clearPracticeDraft(draftKey)
            setAnswers({})
            setRestoredOrder(null)
            window.scrollTo({ top: 0 })
          }}
        />
      ) : null}

      <ExplanationSheet
        question={detail ?? null}
        selection={detailAnswer.selection}
        hintsUsed={detailAnswer.hintsUsed}
        position={detail ? pool.findIndex((q) => q.id === detail.id) + 1 : 0}
        onClose={() => setDetailId(null)}
      />
    </div>
  )
}

/**
 * One question, self-contained.
 *
 * `content-visibility` is the whole reason a hundred and seventy of these can
 * share a page: every card is in the DOM and reachable, but the browser skips
 * layout and paint for the ones off screen. The intrinsic size keeps the
 * scrollbar honest so the page does not jump as cards come into view.
 */
function QuestionCard({
  question,
  position,
  answer,
  onSelect,
  onReveal,
  onSeeMore,
}: {
  question: Question
  position: number
  answer: PracticeAnswer
  onSelect: (question: Question, key: string, optionId: string) => void
  onReveal: (next: number) => void
  onSeeMore: () => void
}) {
  const { selection, submitted, hintsUsed } = answer
  const answered = Object.keys(selection).length >= requiredSelectionCount(question)

  return (
    <Card
      id={`question-${question.id}`}
      // The one place this view departs from DESIGN.md, which separates surfaces
      // with hairline borders and never with shadows. On a page that is nothing
      // but a column of cards, a border alone leaves them reading as one ruled
      // sheet; the faintest lift is what makes each question a thing of its own.
      // `shadow-xs` and no more — the rule still does most of the work.
      className="scroll-mt-20 shadow-xs [contain-intrinsic-size:auto_36rem] [content-visibility:auto]"
    >
      {/* A header with a rule under it, so the eye can find the top of a
          question without reading anything. CardHeader already pads itself to
          the card's spacing when it carries a border. */}
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b">
        <span className="text-foreground text-sm font-medium tabular-nums">
          Question {position}
        </span>
        <DifficultyBadge difficulty={question.difficulty} />
      </CardHeader>

      <CardContent className="space-y-5">
        <ReadingMeasure>
          <QuestionView
            question={question}
            selection={selection}
            submitted={submitted}
            onSelect={(key, optionId) => onSelect(question, key, optionId)}
            compactOptions
          />
        </ReadingMeasure>

        {!submitted && question.hints?.length ? (
          <>
            <HintPanel hints={question.hints} revealed={hintsUsed} onReveal={onReveal} />
            <div className="flex flex-wrap items-center gap-2">
              {hintsUsed === 0 ? <HintTrigger onReveal={() => onReveal(1)} /> : null}
              {!answered ? (
                <p className="text-muted-foreground text-sm">
                  {requiredSelectionCount(question) === 2
                    ? 'Choose an option for both images.'
                    : 'Choose an option.'}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {submitted ? (
          <FeedbackSummary
            question={question}
            selection={selection}
            correct={isCorrect(question, selection)}
            hintsUsed={hintsUsed}
            onSeeMore={onSeeMore}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}

function FilterBar({ filter, onChange }: { filter: Filter; onChange: (value: Filter) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="difficulty-filter" className="text-muted-foreground text-sm">
        Difficulty
      </label>
      {/* Base UI hands back `value | null`; ignore the null clear. */}
      <Select value={filter} onValueChange={(value) => value && onChange(value)}>
        <SelectTrigger id="difficulty-filter" size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {DIFFICULTIES.map((d) => (
            <SelectItem key={d} value={d}>
              {d[0].toUpperCase() + d.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
