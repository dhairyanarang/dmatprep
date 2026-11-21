'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'

import { ExamChrome, ExamClock, TaskPanel } from '@/components/practice/exam-chrome'
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
  note,
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
  /**
   * One line about what makes this particular test what it is, shown on the
   * briefing card and nowhere else.
   *
   * It lives here rather than in the page's description because it is
   * pre-test context: once the clock is running it is noise competing with
   * the question, and a page-level description cannot take itself away.
   */
  note?: string
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
  const [flags, setFlags] = useState<Record<string, boolean>>(resume?.flags ?? {})
  const [confirming, setConfirming] = useState(false)

  /**
   * Milliseconds on each question, accumulated across visits.
   *
   * A ref rather than state: it changes on every navigation and nothing
   * renders from it during the test, so putting it in state would re-render
   * the runner for a number only the results screen ever reads.
   */
  const spent = useRef<Record<string, number>>({ ...(resume?.spent ?? {}) })
  /**
   * The timings as they stood at submission.
   *
   * Lifted out of the ref and into state at that moment, because the results
   * screen renders from them and a ref read during render is both a lint error
   * and a real bug waiting: the screen would not re-render if the number
   * changed under it. After submission it cannot change, which is exactly why
   * this is the right moment to freeze it.
   */
  const [finalSpent, setFinalSpent] = useState<Record<string, number> | undefined>(undefined)
  // Zero until the first question is shown; the effect below sets it. Reading
  // the clock during render is impure and React's lint rules refuse it.
  const shownAt = useRef(0)
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

  /**
   * Bank the time spent on the question being left.
   *
   * Keyed on the question's id, so jumping away and back adds to its total
   * rather than restarting it. The cleanup runs before the next effect, which
   * is what makes "the question being left" the right one.
   */
  const shownId = phase === 'running' ? question?.id : undefined
  useEffect(() => {
    if (!shownId) return
    const totals = spent.current
    const since = Date.now()
    shownAt.current = since
    return () => {
      const elapsed = Date.now() - since
      // A paint-order blip is not time spent; anything under a tick is noise.
      if (elapsed > 250) totals[shownId] = (totals[shownId] ?? 0) + elapsed
    }
  }, [shownId])

  const finish = useCallback(
    (timedOut: boolean) => {
      if (finishedRef.current) return
      finishedRef.current = true

      // The question on screen has not been left, so its effect cleanup has
      // not run yet. Bank it here or the last task always reports zero.
      const open = stages[stageIndex]?.questions[index]
      if (open && shownAt.current > 0) {
        const elapsed = Date.now() - shownAt.current
        if (elapsed > 250) spent.current[open.id] = (spent.current[open.id] ?? 0) + elapsed
      }

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
          // Includes the question on screen when Submit was pressed: its time
          // is banked below before this loop runs.
          durationMs: spent.current[q.id],
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
      setFinalSpent({ ...spent.current })
      recordSession(result)
      // The session is over: drop the restore point so returning to this route
      // offers a new test rather than a finished one.
      setActiveSession(null)
      setPhase('done')
    },
    [allQuestions, answers, index, mode, recordAttempt, recordSession, setActiveSession, stageIndex, stages],
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
      flags,
      spent: spent.current,
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
    flags,
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
        note={note}
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
    return (
      <SessionResults
        mode={mode}
        title={title}
        stages={stages}
        answers={answers}
        spent={finalSpent}
      />
    )
  }

  if (!question || !stage) return null

  const answeredInStage = stage.questions.filter(
    (q) => answers[q.id] && Object.keys(answers[q.id]).length > 0,
  ).length
  const atLastQuestion = index >= stage.questions.length - 1
  const atLastStage = stageIndex >= stages.length - 1

  const flagged = Boolean(flags[question.id])

  return (
    <ExamChrome
      title={title}
      part={
        stages.length > 1
          ? `Part ${stageIndex + 1} of ${stages.length} · ${stage.label}`
          : stage.label
      }
      clock={untimed ? null : <ExamClock remainingMs={remainingMs} label={stage.label} />}
      flagged={flagged}
      onToggleFlag={() =>
        setFlags((prev) => ({ ...prev, [question.id]: !prev[question.id] }))
      }
      onSubmit={() => setConfirming(true)}
      submitLabel={atLastStage ? 'Submit test' : 'Submit part'}
    >
      <section className="flex min-w-0 flex-[3_1_520px] flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground font-mono text-xs tracking-[0.06em] uppercase">
            Task {String(index + 1).padStart(2, '0')} / {stage.questions.length}
          </span>
          <span className="text-muted-foreground text-xs">
            {answeredInStage} answered · saved as you go
          </span>
        </div>

        {/* submitted is always false: no feedback is shown during the test. */}
        <QuestionView
          question={question}
          selection={answers[question.id] ?? {}}
          submitted={false}
          onSelect={select}
        />

        <div className="border-soft mt-auto flex items-center justify-between gap-3 border-t pt-5">
          <Button
            variant="outline"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            <ChevronLeft className="size-4" aria-hidden />
            Previous
          </Button>

          {atLastQuestion ? (
            <Button onClick={() => setConfirming(true)}>
              {atLastStage ? 'Submit test' : 'Finish this part'}
            </Button>
          ) : (
            <Button onClick={() => setIndex((i) => Math.min(stage.questions.length - 1, i + 1))}>
              Next
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </section>

      <TaskPanel
        count={stage.questions.length}
        current={index}
        answered={(i: number) => {
          const q = stage.questions[i]
          return Boolean(q && answers[q.id] && Object.keys(answers[q.id]).length > 0)
        }}
        flagged={(i: number) => {
          const q = stage.questions[i]
          return Boolean(q && flags[q.id])
        }}
        onJump={setIndex}
        unitNoun={stage.unitNoun}
      />

      {confirming ? (
        <SubmitConfirm
          label={atLastStage ? 'Submit the test' : `Submit ${stage.label}`}
          blank={stage.questions.length - answeredInStage}
          flagged={stage.questions.filter((q) => flags[q.id]).length}
          last={atLastStage}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false)
            if (atLastStage) finish(false)
            else if (breakAfterStage === stageIndex) setPhase('break')
            else nextStage()
          }}
        />
      ) : null}
    </ExamChrome>
  )
}

/**
 * The one confirmation in the runner.
 *
 * Submitting a part cannot be undone, and the two things worth knowing before
 * you do it are how many tasks have no answer and how many you meant to come
 * back to. Both are counted, not estimated.
 */
function SubmitConfirm({
  label,
  blank,
  flagged,
  last,
  onCancel,
  onConfirm,
}: {
  label: string
  blank: number
  flagged: number
  last: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(10,10,10,0.42)] p-6"
      onClick={onCancel}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-confirm"
        onClick={(e) => e.stopPropagation()}
        className="bg-card flex w-full max-w-[420px] flex-col gap-3.5 rounded-2xl p-6 shadow-[0_24px_64px_rgba(10,10,10,0.28)]"
      >
        <h2 id="submit-confirm" className="text-lg font-semibold">
          {label}?
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {blank > 0
            ? `${blank} ${blank === 1 ? 'task has' : 'tasks have'} no answer`
            : 'Every task has an answer'}
          {flagged > 0 ? ` and ${flagged} ${flagged === 1 ? 'is' : 'are'} flagged` : ''}. You
          cannot come back to {last ? 'the test' : 'this part'} after submitting.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Keep working
          </Button>
          <Button onClick={onConfirm}>{last ? 'Submit test' : 'Submit part'}</Button>
        </div>
      </section>
    </div>
  )
}


function Brief({
  title,
  note,
  stages,
  minutesPerStage,
  untimed,
  onStart,
}: {
  title: string
  /** What is distinctive about THIS test, shown only before it starts. */
  note?: string
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
          {note ? (
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{note}</p>
          ) : null}
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
