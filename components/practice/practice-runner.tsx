'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ReadingMeasure } from '@/components/layout/page-shell'
import { PracticeActionBar } from '@/components/practice/action-bar'
import { DifficultyBadge } from '@/components/practice/difficulty-badge'
import { FeedbackPanel } from '@/components/practice/feedback-panel'
import { HintPanel, HintTrigger } from '@/components/practice/hint-panel'
import { QuestionView } from '@/components/practice/question-view'
import { SectionProgress } from '@/components/practice/section-progress'
import { SetComplete } from '@/components/practice/set-complete'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useProgress, useProgressActions, useProgressReady } from '@/lib/progress/use-progress'
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
  questions: Question[]
  mode?: PracticeMode
  showProgress?: boolean
  showFilter?: boolean
}

/**
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

  const key = props.mode === 'quick' ? 'quick' : `practice:${props.sectionId ?? 'mixed'}`

  if (!ready) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    )
  }

  const saved = progress.practiceDrafts[key]
  const known = new Set(props.questions.map((q) => q.id))
  // A draft written before the bank was regenerated points at questions that no
  // longer exist. Better to start clean than to restore a broken position.
  const draft = saved && saved.questionIds.every((id) => known.has(id)) ? saved : null

  return <PracticeSession {...props} draftKey={key} initialDraft={draft} />
}

function PracticeSession({
  sectionId,
  questions,
  mode = 'practice',
  showProgress = true,
  showFilter = true,
  draftKey,
  initialDraft,
}: RunnerProps & { draftKey: string; initialDraft: PracticeDraft | null }) {
  const progress = useProgress()
  const { recordAttempt, recordExposure, setPracticeDraft, clearPracticeDraft } =
    useProgressActions()

  const [filter, setFilter] = useState<Filter>(initialDraft?.filter ?? 'all')
  const [index, setIndex] = useState(initialDraft?.index ?? 0)
  /**
   * What has been done to each question, keyed by question id.
   *
   * This is the single source of truth for selection, hints and whether an
   * answer has been committed. It used to be three pieces of state describing
   * the current question only, which cannot survive a Back button: stepping back
   * has to restore the answer that was actually given, and stepping forward
   * again has to find it still there. Keying by question id also means a change
   * of difficulty filter cannot strand an answer, and — the part that matters —
   * a question already committed stays committed, so no attempt is ever recorded
   * against it twice.
   */
  const [answers, setAnswers] = useState<Record<string, PracticeAnswer>>(() => {
    if (!initialDraft) return {}
    const seeded = { ...(initialDraft.answered ?? {}) }
    // A draft written before this field existed still knows about the question
    // it was left on; keep it rather than dropping the learner's place.
    const current = initialDraft.questionIds[initialDraft.index]
    if (current && !seeded[current]) {
      seeded[current] = {
        selection: initialDraft.selection ?? {},
        hintsUsed: initialDraft.hintsUsed ?? 0,
        submitted: initialDraft.submitted ?? false,
      }
    }
    return seeded
  })
  const [finished, setFinished] = useState(false)
  // Set in an effect, not during render: Date.now() is impure and the React
  // Compiler rejects it in the render path.
  const startedAt = useRef<number>(0)
  useEffect(() => {
    startedAt.current = Date.now()
  }, [index, filter])

  // State rather than a ref: it decides what renders, and the React Compiler
  // rightly refuses a ref read in the render path.
  const [restoredOrder, setRestoredOrder] = useState<string[] | null>(
    initialDraft?.questionIds ?? null,
  )

  const pool = useMemo(() => {
    const filtered =
      filter === 'all' ? questions : questions.filter((q) => q.difficulty === filter)

    // A restored run keeps the order it had, so "question 7 of 45" still means
    // the question it meant before the reload.
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

  const question = pool[index]
  const current = (question && answers[question.id]) || UNANSWERED
  const selection = current.selection
  const submitted = current.submitted
  const hintsUsed = current.hintsUsed

  const patchCurrent = useCallback(
    (patch: Partial<PracticeAnswer>) => {
      if (!question) return
      setAnswers((prev) => ({
        ...prev,
        [question.id]: { ...UNANSWERED, ...prev[question.id], ...patch },
      }))
    },
    [question],
  )

  /**
   * The restore point, written on every change.
   *
   * Cheap — one small object into localStorage — and it is the whole reason a
   * mid-question reload costs nothing.
   */
  useEffect(() => {
    setPracticeDraft({
      key: draftKey,
      questionIds: pool.map((q) => q.id),
      index,
      selection,
      hintsUsed,
      submitted,
      filter,
      answered: answers,
      updatedAt: new Date().toISOString(),
    })
  }, [draftKey, pool, index, selection, hintsUsed, submitted, filter, answers, setPracticeDraft])

  /**
   * Move to another question in the run, forwards or back.
   *
   * The order is pinned on the first move. `pool` sorts unseen questions first,
   * so letting it recompute mid-run would reshuffle the deck under the learner
   * and "question 7 of 45" would stop meaning the question it meant a moment
   * ago — which a Back button would make immediately visible.
   */
  const goTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= pool.length || nextIndex === index) return
      setRestoredOrder((prev) => prev ?? pool.map((q) => q.id))
      setFinished(false)
      setIndex(nextIndex)
    },
    [pool, index],
  )

  /**
   * Commit the answer. Called the moment the last required option is chosen,
   * not from a separate confirm button.
   *
   * Takes the selection as an argument rather than reading it from state: the
   * click that completes the answer is the click that commits it, and the state
   * update from that same click has not landed yet.
   */
  const commit = useCallback(
    (sel: Selection) => {
      if (!question || submitted) return
      patchCurrent({ selection: sel, submitted: true })
      recordAttempt({
        questionId: question.id,
        sectionId: question.section,
        difficulty: question.difficulty,
        mode,
        correct: isCorrect(question, sel),
        selection: sel,
        at: new Date().toISOString(),
        durationMs: Date.now() - startedAt.current,
        hintsUsed: Math.min(hintsUsed, 3) as 0 | 1 | 2 | 3,
      })
      // Answered, so it is spent — from the practice pool, and only that one.
      recordExposure(
        [{ questionId: question.id, sectionId: question.section }],
        exposureContextOf(mode),
      )
    },
    [question, submitted, patchCurrent, recordAttempt, recordExposure, hintsUsed, mode],
  )

  const handleSelect = useCallback(
    (key: string, optionId: string) => {
      if (!question || submitted) return
      const next = { ...selection, [key]: optionId }
      patchCurrent({ selection: next })
      // Choosing is answering. A single-answer question commits on the click; a
      // Figure Sequences item waits until both panels have been chosen, because
      // until then the answer is not yet an answer.
      if (Object.keys(next).length >= requiredSelectionCount(question)) commit(next)
    },
    [question, submitted, selection, patchCurrent, commit],
  )

  const handleFilter = useCallback((value: Filter) => {
    setFilter(value)
    setFinished(false)
    setIndex(0)
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

  if (!question) {
    return (
      <div className="space-y-4">
        <FilterBar filter={filter} onChange={handleFilter} />
        <p className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          No {filter} questions in this section.
        </p>
      </div>
    )
  }

  const answered = Object.keys(selection).length >= requiredSelectionCount(question)
  const correct = submitted && isCorrect(question, selection)
  const atEnd = index >= pool.length - 1

  if (finished && sectionId) {
    return (
      <SetComplete
        sectionId={sectionId}
        questions={pool}
        answered={pool.length}
        onRestart={() => {
          clearPracticeDraft(draftKey)
          setAnswers({})
          setRestoredOrder(null)
          setFinished(false)
          setIndex(0)
        }}
      />
    )
  }

  return (
    <div className="space-y-5">
      {showProgress && sectionId ? (
        <SectionProgress sectionId={sectionId} bankSize={questions.length} />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            Question {index + 1} of {pool.length}
          </span>
          <DifficultyBadge difficulty={question.difficulty} />
        </div>
        {showFilter ? <FilterBar filter={filter} onChange={handleFilter} /> : null}
      </div>

      <Card>
        <CardContent className="pt-6">
          <ReadingMeasure>
            {/* Keyed on the question, so moving on fades the next one in instead
                of swapping it under the eye — the only signal that the page has
                changed at all when two questions look alike. */}
            <div
              key={question.id}
              className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150"
            >
              <QuestionView
                question={question}
                selection={selection}
                submitted={submitted}
                onSelect={handleSelect}
              />
            </div>
          </ReadingMeasure>
        </CardContent>
      </Card>

      {!submitted && question.hints?.length ? (
        <HintPanel
          hints={question.hints}
          revealed={hintsUsed}
          onReveal={(n) => patchCurrent({ hintsUsed: n })}
        />
      ) : null}

      {submitted && (
        <FeedbackPanel
          question={question}
          selection={selection}
          correct={correct}
          hintsUsed={hintsUsed}
        />
      )}

      <PracticeActionBar
        secondary={
          <>
            {index > 0 ? (
              <Button variant="ghost" onClick={() => goTo(index - 1)}>
                Back
              </Button>
            ) : null}
            {!submitted && question.hints?.length && hintsUsed === 0 ? (
              <HintTrigger onReveal={() => patchCurrent({ hintsUsed: 1 })} />
            ) : null}
            {!submitted && !answered ? (
              <p className="text-muted-foreground text-sm">
                {requiredSelectionCount(question) === 2
                  ? 'Choose an option for both images.'
                  : 'Choose an option.'}
              </p>
            ) : null}
          </>
        }
        /* No confirm step: the answer is committed by the choice itself, so the
           only forward action left is the one that moves on. */
        primary={
          !submitted ? null : atEnd ? (
            <Button onClick={() => setFinished(true)}>Finish this set</Button>
          ) : (
            <Button onClick={() => goTo(index + 1)}>Next question</Button>
          )
        }
      />
    </div>
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
