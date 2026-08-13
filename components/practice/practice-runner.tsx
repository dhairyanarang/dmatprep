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
  const [selection, setSelection] = useState<Selection>(initialDraft?.selection ?? {})
  const [submitted, setSubmitted] = useState(initialDraft?.submitted ?? false)
  const [hintsUsed, setHintsUsed] = useState(initialDraft?.hintsUsed ?? 0)
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
      updatedAt: new Date().toISOString(),
    })
  }, [draftKey, pool, index, selection, hintsUsed, submitted, filter, setPracticeDraft])

  const advance = useCallback((nextIndex: number) => {
    setFinished(false)
    setIndex(nextIndex)
    setSelection({})
    setSubmitted(false)
    setHintsUsed(0)
    // Past this point the restored order no longer applies: the filter may have
    // changed the pool underneath it.
    setRestoredOrder(null)
  }, [])

  const handleSelect = useCallback(
    (key: string, optionId: string) => {
      if (submitted) return
      setSelection((prev) => ({ ...prev, [key]: optionId }))
    },
    [submitted],
  )

  const handleSubmit = useCallback(() => {
    if (!question || submitted) return
    const correct = isCorrect(question, selection)
    setSubmitted(true)
    recordAttempt({
      questionId: question.id,
      sectionId: question.section,
      difficulty: question.difficulty,
      mode,
      correct,
      selection,
      at: new Date().toISOString(),
      durationMs: Date.now() - startedAt.current,
      hintsUsed: Math.min(hintsUsed, 3) as 0 | 1 | 2 | 3,
    })
    // Answered, so it is spent — from the practice pool, and only that one.
    recordExposure(
      [{ questionId: question.id, sectionId: question.section }],
      exposureContextOf(mode),
    )
  }, [question, selection, submitted, recordAttempt, recordExposure, hintsUsed, mode])

  const handleFilter = useCallback(
    (value: Filter) => {
      setFilter(value)
      advance(0)
    },
    [advance],
  )

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
          advance(0)
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
        <HintPanel hints={question.hints} revealed={hintsUsed} onReveal={setHintsUsed} />
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
          submitted ? null : (
            <>
              {question.hints?.length && hintsUsed === 0 ? (
                <HintTrigger onReveal={() => setHintsUsed(1)} />
              ) : null}
              {!answered ? (
                <p className="text-muted-foreground text-sm">
                  {requiredSelectionCount(question) === 2
                    ? 'Choose an option for both images.'
                    : 'Choose an option.'}
                </p>
              ) : null}
            </>
          )
        }
        primary={
          !submitted ? (
            <Button onClick={handleSubmit} disabled={!answered}>
              Check answer
            </Button>
          ) : atEnd ? (
            <Button onClick={() => setFinished(true)}>Finish this set</Button>
          ) : (
            <Button onClick={() => advance(index + 1)}>Next question</Button>
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
