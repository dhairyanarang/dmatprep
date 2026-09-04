'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CircleCheck, FileText, Timer } from 'lucide-react'

import { GamResults } from '@/components/gam/results'
import { SourcePackView } from '@/components/gam/source-pack-view'
import { PageContainer } from '@/components/layout/page-shell'
import { OptionButton } from '@/components/practice/option-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useGamActions,
  useGamProgress,
  useGamReady,
  type GamDraft,
  type GamMode,
} from '@/lib/gam/progress'
import type { GamPackFile, GamQuestion, SourcePack } from '@/lib/types/gam'

type Props = {
  files: GamPackFile[]
  mode: GamMode
  /** Absolute session length in minutes; timed sessions only. */
  minutes?: number
  storageKey: string
}

type Flat = { pack: SourcePack; question: GamQuestion; indexInPack: number; packSize: number }

/**
 * The GAM runner.
 *
 * The shape that makes this different from Module A's runner: a question is
 * never shown alone. The source sits beside it for the whole session, and moving
 * between the questions of a pack does not move the source — because in the exam
 * the candidate reads one text and answers several questions against it.
 *
 * Answers are held until the session is submitted rather than marked one at a
 * time. Module A marks immediately because it is teaching a technique; GAM is a
 * subject module where the questions of a pack inform each other, so marking one
 * would give away its siblings.
 */
export function GamPackRunner({ files, mode, minutes, storageKey }: Props) {
  const ready = useGamReady()
  if (!ready) {
    return (
      <PageContainer className="space-y-4 py-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72 w-full" />
      </PageContainer>
    )
  }
  return <Runner files={files} mode={mode} minutes={minutes} storageKey={storageKey} />
}

function Runner({ files, mode, minutes, storageKey }: Props) {
  const progress = useGamProgress()
  const { recordAttempts, recordSession, saveDraft, clearDraft } = useGamActions()

  const flat = useMemo<Flat[]>(
    () =>
      files.flatMap((f) =>
        f.questions.map((question, i) => ({
          pack: f.pack,
          question,
          indexInPack: i,
          packSize: f.questions.length,
        })),
      ),
    [files],
  )

  const draft = progress.drafts[storageKey]

  /**
   * The session's clock and its resume decision, settled once.
   *
   * Both read the wall clock, which a render must not do — a component that
   * re-renders would otherwise keep moving its own deadline. A lazy initialiser
   * runs exactly once, which is the guarantee needed here, and the store has
   * already hydrated by the time this component mounts.
   */
  const [session, setSession] = useState(() => {
    const now = Date.now()
    const left = draft?.endsAt ? new Date(draft.endsAt).getTime() - now : 0
    return {
      startedAt: draft?.startedAt ?? new Date(now).toISOString(),
      endsAt: draft?.endsAt ?? (minutes ? new Date(now + minutes * 60_000).toISOString() : undefined),
      promptLeft: left,
      /**
       * A timed session asks before it resumes; untimed practice just restores.
       *
       * Module A's rule, and for the same reason: a session under a clock is a
       * commitment worth confirming, and a reload must never silently cost the
       * work or silently restart the timer. Practice is a book you close and
       * open again.
       */
      resumable: Boolean(
        draft &&
          !draft.submitted &&
          mode === 'timed' &&
          left > 0 &&
          Object.keys(draft.answers).length > 0,
      ),
    }
  })
  const [resolved, setResolved] = useState(!session.resumable)

  const [index, setIndex] = useState(() => Math.min(draft?.index ?? 0, flat.length - 1))
  const [answers, setAnswers] = useState<Record<string, string>>(() => draft?.answers ?? {})
  const [submitted, setSubmitted] = useState(() => draft?.submitted ?? false)
  const [timedOut, setTimedOut] = useState(false)

  const current = flat[index]
  const answeredCount = Object.keys(answers).length

  const persist = useCallback(
    (next: Partial<GamDraft>) => {
      saveDraft({
        key: storageKey,
        packIds: files.map((f) => f.pack.id),
        mode,
        index,
        answers,
        submitted,
        endsAt: session.endsAt,
        startedAt: session.startedAt,
        ...next,
      })
    },
    [answers, files, index, mode, saveDraft, session, storageKey, submitted],
  )

  const submit = useCallback(
    (ranOut: boolean) => {
      if (submitted) return
      setSubmitted(true)
      setTimedOut(ranOut)

      const attempts = flat
        .filter((f) => answers[f.question.id])
        .map((f) => ({
          packId: f.pack.id,
          questionId: f.question.id,
          chosenOptionId: answers[f.question.id],
          correct: answers[f.question.id] === f.question.correctOptionId,
          mode,
        }))
      recordAttempts(attempts)
      recordSession({
        id: `${storageKey}:${session.startedAt}`,
        mode,
        packIds: files.map((f) => f.pack.id),
        at: new Date().toISOString(),
        durationMs: Date.now() - new Date(session.startedAt).getTime(),
        timedOut: ranOut,
        total: flat.length,
        answered: attempts.length,
        correct: attempts.filter((a) => a.correct).length,
      })
      persist({ submitted: true })
    },
    [answers, files, flat, mode, persist, recordAttempts, recordSession, session, storageKey, submitted],
  )

  /* --- the clock ------------------------------------------------------- */
  const [remaining, setRemaining] = useState<number | null>(null)
  useEffect(() => {
    const deadline = session.endsAt
    if (!deadline || submitted || !resolved) return
    const tick = () => {
      const left = new Date(deadline).getTime() - Date.now()
      setRemaining(left)
      if (left <= 0) submit(true)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [resolved, session, submit, submitted])

  const choose = (optionId: string) => {
    if (submitted) return
    const next = { ...answers, [current.question.id]: optionId }
    setAnswers(next)
    persist({ answers: next })
  }

  const go = (to: number) => {
    const clamped = Math.max(0, Math.min(flat.length - 1, to))
    setIndex(clamped)
    persist({ index: clamped })
  }

  const restart = () => {
    clearDraft(storageKey)
    setAnswers({})
    setSubmitted(false)
    setIndex(0)
    const now = Date.now()
    setSession({
      startedAt: new Date(now).toISOString(),
      endsAt: minutes ? new Date(now + minutes * 60_000).toISOString() : undefined,
      promptLeft: 0,
      resumable: false,
    })
    setResolved(true)
  }

  if (!resolved && draft) {
    const left = session.promptLeft
    return (
      <PageContainer className="py-6">
        <Card className="mx-auto max-w-md">
          <CardContent className="space-y-4 pt-5">
            <h1 className="text-lg tracking-tight">You have a session in progress</h1>
            <p className="text-muted-foreground text-sm">
              {Object.keys(draft.answers).length} of {flat.length} questions answered, with{' '}
              <span className="font-mono">{formatClock(left)}</span> left on the clock. Resuming picks
              up where you left off; starting again discards those answers and resets the timer.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setResolved(true)}>Resume</Button>
              <Button variant="outline" onClick={restart}>
                Start again
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  if (submitted) {
    return (
      <GamResults
        flat={flat}
        answers={answers}
        timedOut={timedOut}
        onRestart={restart}
      />
    )
  }

  const packQuestions = flat.filter((f) => f.pack.id === current.pack.id)

  return (
    <PageContainer className="space-y-5 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <FileText className="size-3.5" />
            {current.pack.domain.replace(/-/g, ' ')}
          </p>
          <h1 className="text-lg tracking-tight">{current.pack.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {remaining !== null ? (
            <Badge variant="outline" className="gap-1.5 font-mono tabular-nums">
              <Timer className="size-3.5" />
              {formatClock(remaining)}
            </Badge>
          ) : null}
          <Button size="sm" onClick={() => submit(false)}>
            Submit
          </Button>
        </div>
      </header>

      <div className="space-y-2">
        <Progress value={(answeredCount / flat.length) * 100} />
        <p className="text-muted-foreground text-xs">
          {answeredCount} of {flat.length} answered
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* The source stays put while the questions of its pack are worked
            through — moving it would break the one thing GAM is testing. */}
        <Card className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <CardContent className="pt-5">
            <SourcePackView pack={current.pack} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {packQuestions.map((f) => {
              const at = flat.indexOf(f)
              return (
                <button
                  key={f.question.id}
                  type="button"
                  onClick={() => go(at)}
                  aria-current={at === index}
                  aria-label={`Question ${f.indexInPack + 1}${answers[f.question.id] ? ', answered' : ''}`}
                  className={`size-7 rounded-md border text-xs transition-colors duration-150 ${
                    at === index
                      ? 'border-foreground bg-accent'
                      : answers[f.question.id]
                        ? 'border-foreground/40'
                        : 'border-border text-muted-foreground'
                  }`}
                >
                  {f.indexInPack + 1}
                </button>
              )
            })}
            <span className="text-muted-foreground ml-1 text-xs">
              question {current.indexInPack + 1} of {current.packSize} in this source
            </span>
          </div>

          <Card>
            <CardContent className="space-y-4 pt-5">
              <p className="text-[15px] leading-relaxed">{current.question.stem}</p>
              <div className="grid gap-2">
                {current.question.options.map((option) => (
                  <OptionButton
                    key={option.id}
                    state={answers[current.question.id] === option.id ? 'selected' : 'idle'}
                    onSelect={() => choose(option.id)}
                    label={option.text}
                  >
                    <span className="text-muted-foreground font-mono text-xs uppercase">
                      {option.id}
                    </span>
                    <span className="text-sm">{option.text}</span>
                  </OptionButton>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => go(index - 1)} disabled={index === 0}>
              <ArrowLeft className="size-4" />
              Previous
            </Button>
            {index === flat.length - 1 ? (
              <Button size="sm" onClick={() => submit(false)}>
                <CircleCheck className="size-4" />
                Finish and see results
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => go(index + 1)}>
                Next
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
