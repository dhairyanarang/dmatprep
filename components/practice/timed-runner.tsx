'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

import { PracticeActionBar } from '@/components/practice/action-bar'
import { QuestionView } from '@/components/practice/question-view'
import { SessionResults } from '@/components/practice/session-results'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useProgressActions } from '@/lib/progress/use-progress'
import type { SectionId } from '@/lib/sections'
import type { PracticeMode, SessionResult } from '@/lib/types/progress'
import { isCorrect, type Question, type Selection } from '@/lib/types/question'
import { cn } from '@/lib/utils'

export type TimedStage = { sectionId: SectionId; label: string; unitNoun: string; questions: Question[] }

/**
 * Exam-mode runner: timed, with no hints, no per-question feedback and no
 * walkthrough until the whole thing is submitted.
 *
 * Those are the documented constraints — 25 minutes per subtest, no notes, and
 * results only afterwards. Everything else about the real interface is unknown,
 * so nothing here claims to reproduce it: moving between questions and skipping
 * are dMAT Prep affordances, not statements about the exam.
 */
export function TimedRunner({
  mode,
  title,
  stages,
  minutesPerStage,
  breakAfterStage,
  untimed = false,
}: {
  mode: PracticeMode
  title: string
  stages: TimedStage[]
  minutesPerStage: number
  /** Index after which the documented 30-minute break falls, if any. */
  breakAfterStage?: number
  /** The diagnostic runs under assessment rules but without a clock. */
  untimed?: boolean
}) {
  const { recordAttempt, recordSession } = useProgressActions()

  const [phase, setPhase] = useState<'brief' | 'running' | 'break' | 'done'>('brief')
  const [stageIndex, setStageIndex] = useState(0)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Selection>>({})
  const [endsAt, setEndsAt] = useState(0)
  const [now, setNow] = useState(0)
  const startedAt = useRef(0)
  const finishedRef = useRef(false)

  const stage = stages[stageIndex]
  const question = stage?.questions[index]
  const allQuestions = useMemo(() => stages.flatMap((s) => s.questions), [stages])

  const remainingMs = Math.max(0, endsAt - now)

  const finish = useCallback(
    (timedOut: boolean) => {
      if (finishedRef.current) return
      finishedRef.current = true

      let correct = 0
      let answered = 0
      for (const q of allQuestions) {
        const selection = answers[q.id]
        if (!selection || Object.keys(selection).length === 0) continue
        answered++
        const ok = isCorrect(q, selection)
        if (ok) correct++
        recordAttempt({
          questionId: q.id,
          sectionId: q.section,
          difficulty: q.difficulty,
          correct: ok,
          selection,
          mode,
          at: new Date().toISOString(),
          hintsUsed: 0,
        })
      }

      const result: SessionResult = {
        id: `${mode}-${Date.now()}`,
        mode,
        sections: [...new Set(stages.map((s) => s.sectionId))],
        at: new Date().toISOString(),
        durationMs: Date.now() - startedAt.current,
        timedOut,
        total: allQuestions.length,
        answered,
        correct,
        questionIds: allQuestions.map((q) => q.id),
      }
      recordSession(result)
      setPhase('done')
    },
    [allQuestions, answers, mode, recordAttempt, recordSession, stages],
  )

  const expire = useCallback(() => {
    if (stageIndex < stages.length - 1) {
      setStageIndex((i) => i + 1)
      setIndex(0)
      setPhase(breakAfterStage === stageIndex ? 'break' : 'running')
      setEndsAt(Date.now() + minutesPerStage * 60_000)
    } else {
      finish(true)
    }
  }, [stageIndex, stages.length, breakAfterStage, minutesPerStage, finish])

  /**
   * One ticking clock for the whole session, and the only place the clock can
   * end a stage. Both the tick and the expiry run inside the interval callback
   * rather than the effect body — updating state synchronously while an effect
   * is running would re-render before the browser has painted.
   */
  useEffect(() => {
    if (phase !== 'running' || endsAt === 0 || untimed) return
    const id = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= endsAt) {
        window.clearInterval(id)
        expire()
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [phase, endsAt, expire, untimed])

  // A reload mid-test loses the session, so make it deliberate.
  useEffect(() => {
    if (phase !== 'running') return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [phase])

  const start = useCallback(() => {
    startedAt.current = Date.now()
    setEndsAt(untimed ? 0 : Date.now() + minutesPerStage * 60_000)
    setNow(Date.now())
    setPhase('running')
  }, [minutesPerStage, untimed])

  const select = useCallback(
    (key: string, optionId: string) => {
      if (!question) return
      setAnswers((prev) => ({
        ...prev,
        [question.id]: { ...(prev[question.id] ?? {}), [key]: optionId },
      }))
    },
    [question],
  )

  const nextStage = useCallback(() => {
    setStageIndex((i) => i + 1)
    setIndex(0)
    setEndsAt(Date.now() + minutesPerStage * 60_000)
    setPhase('running')
  }, [minutesPerStage])

  if (phase === 'brief') {
    return (
      <Brief
        title={title}
        stages={stages}
        minutesPerStage={minutesPerStage}
        untimed={untimed}
        onStart={start}
      />
    )
  }

  if (phase === 'break') {
    return (
      <Card>
        <CardContent className="space-y-4 text-center">
          <h2 className="text-lg font-semibold">Break</h2>
          <p className="text-muted-foreground mx-auto max-w-prose text-sm leading-relaxed">
            The preparatory materials describe a 30-minute break between the modules. Take as long
            as you need here — this timer is not part of the test.
          </p>
          <Button onClick={nextStage}>Start {stages[stageIndex]?.label}</Button>
        </CardContent>
      </Card>
    )
  }

  if (phase === 'done') {
    return <SessionResults mode={mode} title={title} stages={stages} answers={answers} />
  }

  if (!question || !stage) return null

  const answeredInStage = stage.questions.filter(
    (q) => answers[q.id] && Object.keys(answers[q.id]).length > 0,
  ).length
  const atLastQuestion = index >= stage.questions.length - 1
  const atLastStage = stageIndex >= stages.length - 1

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{stage.label}</p>
          <p className="text-muted-foreground text-xs">
            {stages.length > 1 ? `Part ${stageIndex + 1} of ${stages.length} · ` : ''}
            {answeredInStage} of {stage.questions.length} {stage.unitNoun} answered
          </p>
        </div>
        {untimed ? null : <TimerChip remainingMs={remainingMs} />}
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground mb-4 text-sm">
            {stage.unitNoun === 'systems' ? 'System' : stage.unitNoun === 'tasks' ? 'Task' : 'Series'}{' '}
            {index + 1} of {stage.questions.length}
          </p>
          {/* submitted is always false: no feedback is shown during the test. */}
          <QuestionView
            question={question}
            selection={answers[question.id] ?? {}}
            submitted={false}
            onSelect={select}
          />
        </CardContent>
      </Card>

      <QuestionStrip
        questions={stage.questions}
        answers={answers}
        current={index}
        onJump={setIndex}
      />

      <PracticeActionBar
        secondary={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            <ChevronLeft className="size-4" aria-hidden />
            Previous
          </Button>
        }
        primary={
          atLastQuestion ? (
            atLastStage ? (
              <Button onClick={() => finish(false)}>Submit test</Button>
            ) : (
              <Button onClick={() => (breakAfterStage === stageIndex ? setPhase('break') : nextStage())}>
                Finish this part
              </Button>
            )
          ) : (
            <Button onClick={() => setIndex((i) => Math.min(stage.questions.length - 1, i + 1))}>
              Next
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          )
        }
      />
    </div>
  )
}

function TimerChip({ remainingMs }: { remainingMs: number }) {
  const totalSeconds = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const low = remainingMs <= 120_000

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-1.5 tabular-nums',
        low ? 'border-danger/40 bg-danger-tint/50' : 'border-border bg-card',
      )}
      role="timer"
      aria-live="off"
      aria-label={`${minutes} minutes ${seconds} seconds remaining`}
    >
      <Clock className={cn('size-4', low ? 'text-danger-fg' : 'text-muted-foreground')} aria-hidden />
      <span className="font-mono text-sm font-medium">
        {minutes}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  )
}

/** Jump-to grid, so a skipped question can be found again without hunting. */
function QuestionStrip({
  questions,
  answers,
  current,
  onJump,
}: {
  questions: Question[]
  answers: Record<string, Selection>
  current: number
  onJump: (index: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Jump to question">
      {questions.map((q, i) => {
        const done = answers[q.id] && Object.keys(answers[q.id]).length > 0
        return (
          <button
            key={q.id}
            type="button"
            onClick={() => onJump(i)}
            aria-label={`Question ${i + 1}${done ? ', answered' : ', not answered'}${i === current ? ', current' : ''}`}
            aria-current={i === current ? 'true' : undefined}
            className={cn(
              'size-9 rounded-md border text-xs font-medium tabular-nums transition-colors',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              i === current
                ? 'border-foreground/40 bg-accent text-foreground'
                : done
                  ? 'border-border bg-muted text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
            )}
          >
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}

function Brief({
  title,
  stages,
  minutesPerStage,
  untimed,
  onStart,
}: {
  title: string
  stages: TimedStage[]
  minutesPerStage: number
  untimed?: boolean
  onStart: () => void
}) {
  const total = stages.reduce((n, s) => n + s.questions.length, 0)

  return (
    <Card>
      <CardContent className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {untimed ? (
              `${total} questions across the three Core subtests, with no clock. Answer what you can — skipping is fine, and it will still tell you where you stand.`
            ) : (
              <>
                {stages.length === 1
                  ? `${stages[0].questions.length} ${stages[0].unitNoun} in ${minutesPerStage} minutes.`
                  : `${stages.length} parts, ${minutesPerStage} minutes each — ${total} questions in total.`}{' '}
                That works out at an average of{' '}
                {Math.round((minutesPerStage * 60) / (total / stages.length))} seconds each, which is
                a pacing guide rather than a limit on any one question.
              </>
            )}
          </p>
        </div>

        <ul className="text-muted-foreground space-y-2 text-sm">
          <li>· No hints, and no answers or explanations until you submit.</li>
          <li>· You can skip a question, jump to another, and come back.</li>
          {untimed ? null : (
            <li>· The clock keeps running if you leave the page, and reloading loses the test.</li>
          )}
          <li>· Practise the way you will sit it: no notes, no calculator.</li>
        </ul>

        <div className="border-warning/35 bg-warning-tint/50 flex gap-3 rounded-2xl border p-4">
          <AlertTriangle className="text-warning-fg mt-px size-4 shrink-0" aria-hidden />
          <p className="text-muted-foreground text-sm leading-relaxed">
            This is a{' '}
            <span className="text-foreground">
              dMAT Prep {untimed ? 'diagnostic' : 'practice simulation'}
            </span>
            . {untimed ? 'It is not' : 'The timing and item counts follow the official preparatory materials, but it is not'}{' '}
            an official dMAT assessment, and interface behaviour may differ from the official test
            platform.
          </p>
        </div>

        <Button onClick={onStart}>{untimed ? 'Start the diagnostic' : 'Start the test'}</Button>
      </CardContent>
    </Card>
  )
}
