'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

import { ReadingMeasure } from '@/components/layout/page-shell'
import { PracticeActionBar } from '@/components/practice/action-bar'
import { QuestionView } from '@/components/practice/question-view'
import { SessionResults } from '@/components/practice/session-results'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ResumeState } from '@/components/practice/resume-prompt'
import { useNow } from '@/lib/dates/use-today'
import { useProgressActions } from '@/lib/progress/use-progress'
import type { SectionId } from '@/lib/sections'
import { exposureContextOf, type PracticeMode, type SessionResult } from '@/lib/types/progress'
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
  route,
  stages,
  minutesPerStage,
  breakAfterStage,
  untimed = false,
  resume,
  onStarted,
}: {
  mode: PracticeMode
  title: string
  /** The route this session belongs to, stored so a resume lands back here. */
  route: string
  stages: TimedStage[]
  minutesPerStage: number
  /** Index after which the documented 30-minute break falls, if any. */
  breakAfterStage?: number
  /** The diagnostic runs under assessment rules but without a clock. */
  untimed?: boolean
  /** A session picked up again after a reload. */
  resume?: ResumeState
  /** Fired when a fresh session begins, so the launcher stops offering one. */
  onStarted?: () => void
}) {
  const { recordAttempt, recordSession, recordExposure, setActiveSession } = useProgressActions()

  const [phase, setPhase] = useState<'brief' | 'running' | 'break' | 'done'>(
    resume ? (resume.phase === 'break' ? 'break' : 'running') : 'brief',
  )
  const [stageIndex, setStageIndex] = useState(resume?.stageIndex ?? 0)
  const [index, setIndex] = useState(resume?.currentIndex ?? 0)
  const [answers, setAnswers] = useState<Record<string, Selection>>(resume?.answers ?? {})
  const [endsAt, setEndsAt] = useState(
    resume?.stageEndsAt ? new Date(resume.stageEndsAt).getTime() : 0,
  )
  /**
   * The clock is read from the shared ticker rather than kept locally.
   *
   * A local `now` starts at zero, and on a *resumed* session the first paint
   * happens before the first tick — so the remaining time rendered as
   * `endsAt - 0`, which is 29 million minutes. Reading a store that is already
   * initialised removes the window in which that is possible.
   */
  const now = useNow()
  const startedAt = useRef(resume ? new Date(resume.startedAt).getTime() : 0)
  const finishedRef = useRef(false)
  const sessionId = useRef(resume?.id ?? '')

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
          id: `${sessionId.current}:${q.id}`,
          questionId: q.id,
          sectionId: q.section,
          difficulty: q.difficulty,
          correct: ok,
          selection,
          mode,
          sessionId: sessionId.current,
          at: new Date().toISOString(),
          hintsUsed: 0,
        })
      }

      const result: SessionResult = {
        id: sessionId.current,
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
      // The session is over: drop the restore point so returning to this route
      // offers a new test rather than a finished one.
      setActiveSession(null)
      setPhase('done')
    },
    [allQuestions, answers, mode, recordAttempt, recordSession, setActiveSession, stages],
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
      if (Date.now() >= endsAt) {
        window.clearInterval(id)
        expire()
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [phase, endsAt, expire, untimed])

  /**
   * The restore point.
   *
   * Written on every answer and every move, so the worst a crash or a closed tab
   * can cost is the question currently on screen. The deadline is stored as an
   * absolute time rather than a remaining count: a count is meaningless once the
   * browser has been shut for ten minutes, whereas a deadline can still be
   * compared against the clock on the way back in.
   */
  useEffect(() => {
    // Never after the session has been submitted. Without this the restore point
    // can be written back *after* `finish` cleared it — the effect re-runs while
    // `phase` is still the value it had before submission — and the finished
    // test would be offered for resuming next time the page opened.
    if (finishedRef.current) return
    if (phase !== 'running' && phase !== 'break') return
    if (!sessionId.current) return

    setActiveSession({
      id: sessionId.current,
      mode,
      route,
      title,
      stages: stages.map((s) => ({
        sectionId: s.sectionId,
        label: s.label,
        unitNoun: s.unitNoun,
        questionIds: s.questions.map((q) => q.id),
      })),
      stageIndex,
      currentIndex: index,
      answers,
      phase: phase === 'break' ? 'break' : 'running',
      startedAt: new Date(startedAt.current).toISOString(),
      stageEndsAt: untimed || endsAt === 0 ? null : new Date(endsAt).toISOString(),
      minutesPerStage,
      untimed,
      updatedAt: new Date().toISOString(),
    })
  }, [
    answers,
    endsAt,
    index,
    minutesPerStage,
    mode,
    phase,
    route,
    setActiveSession,
    stageIndex,
    stages,
    title,
    untimed,
  ])

  /**
   * A session whose clock had already run out before the page came back.
   *
   * Submitted rather than resumed: the answers stand, the result is marked as
   * timed out, and nothing is silently thrown away.
   */
  useEffect(() => {
    if (!resume?.expired) return
    finish(true)
  }, [resume?.expired, finish])

  // The clock keeps running while the tab is away, so leaving still costs time
  // even though nothing is lost. Worth one confirmation.
  useEffect(() => {
    if (phase !== 'running' || untimed) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [phase, untimed])

  const start = useCallback(() => {
    const at = Date.now()
    startedAt.current = at
    sessionId.current = `${mode}-${at}`
    setEndsAt(untimed ? 0 : at + minutesPerStage * 60_000)
    setPhase('running')

    // A question shown under exam conditions is spent from the mock pool even
    // if it is never answered — it has been seen, and that is what exposure
    // means. Recorded once, at the start, rather than per question.
    recordExposure(
      allQuestions.map((q) => ({ questionId: q.id, sectionId: q.section })),
      exposureContextOf(mode),
    )
    onStarted?.()
  }, [allQuestions, minutesPerStage, mode, onStarted, recordExposure, untimed])

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
          <ReadingMeasure>
            <p className="text-muted-foreground mb-4 text-sm">
              {stage.unitNoun === 'systems'
                ? 'System'
                : stage.unitNoun === 'tasks'
                  ? 'Task'
                  : 'Series'}{' '}
              {index + 1} of {stage.questions.length}
            </p>
            {/* submitted is always false: no feedback is shown during the test. */}
            <QuestionView
              question={question}
              selection={answers[question.id] ?? {}}
              submitted={false}
              onSelect={select}
            />
          </ReadingMeasure>
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
            <li>
              · The clock keeps running if you leave the page — but your answers are saved, and
              reloading picks up where you left off.
            </li>
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
