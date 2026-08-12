'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'

import { PracticeActionBar } from '@/components/practice/action-bar'
import { DifficultyBadge } from '@/components/practice/difficulty-badge'
import { FeedbackPanel } from '@/components/practice/feedback-panel'
import { HintPanel, HintTrigger } from '@/components/practice/hint-panel'
import { QuestionView } from '@/components/practice/question-view'
import { SectionProgress } from '@/components/practice/section-progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProgress, useProgressActions } from '@/lib/progress/use-progress'
import type { SectionId } from '@/lib/sections'
import { answeredCorrectly } from '@/lib/types/progress'
import {
  DIFFICULTIES,
  isCorrect,
  requiredSelectionCount,
  type Difficulty,
  type Question,
  type Selection,
} from '@/lib/types/question'

type Filter = Difficulty | 'all'

export function PracticeRunner({
  sectionId,
  questions,
}: {
  sectionId: SectionId
  questions: Question[]
}) {
  const progress = useProgress()
  const { recordAttempt } = useProgressActions()

  const [filter, setFilter] = useState<Filter>('all')
  const [index, setIndex] = useState(0)
  const [selection, setSelection] = useState<Selection>({})
  const [submitted, setSubmitted] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  // Set in an effect, not during render: Date.now() is impure and the React
  // Compiler rejects it in the render path.
  const startedAt = useRef<number>(0)
  useEffect(() => {
    startedAt.current = Date.now()
  }, [index, filter])

  const pool = useMemo(() => {
    const filtered =
      filter === 'all' ? questions : questions.filter((q) => q.difficulty === filter)

    // Unseen questions first, so repeat sessions don't replay the same items.
    const done = answeredCorrectly(progress, sectionId)
    return [...filtered].sort((a, b) => Number(done.has(a.id)) - Number(done.has(b.id)))
    // `progress` is deliberately excluded: re-sorting mid-session would shuffle
    // the deck under the candidate's feet after every answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, filter, sectionId])

  const question = pool[index]

  const advance = useCallback((nextIndex: number) => {
    setIndex(nextIndex)
    setSelection({})
    setSubmitted(false)
    setHintsUsed(0)
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
      sectionId,
      difficulty: question.difficulty,
      correct,
      selection,
      at: new Date().toISOString(),
      durationMs: Date.now() - startedAt.current,
      hintsUsed: Math.min(hintsUsed, 3) as 0 | 1 | 2 | 3,
    })
  }, [question, selection, submitted, recordAttempt, sectionId, hintsUsed])

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

  return (
    <div className="space-y-5">
      <SectionProgress sectionId={sectionId} bankSize={questions.length} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            Question {index + 1} of {pool.length}
          </span>
          <DifficultyBadge difficulty={question.difficulty} />
        </div>
        <FilterBar filter={filter} onChange={handleFilter} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <QuestionView
            question={question}
            selection={selection}
            submitted={submitted}
            onSelect={handleSelect}
          />
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
          submitted ? (
            atEnd ? (
              <Button variant="outline" size="sm" onClick={() => advance(0)}>
                <RotateCcw className="size-4" aria-hidden />
                Start again
              </Button>
            ) : null
          ) : (
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
          ) : (
            <Button onClick={() => advance(index + 1)} disabled={atEnd}>
              {atEnd ? 'End of this set' : 'Next question'}
            </Button>
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
