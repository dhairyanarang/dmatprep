'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import type {
  GamSolutionEntry,
  PublicGamPackFile,
  PublicGamQuestion,
} from '@/lib/gam/registry'
import type { GamQuestion, SourcePack } from '@/lib/types/gam'

type Props = {
  files: PublicGamPackFile[]
  mode: GamMode
  /** Absolute session length in minutes; timed sessions only. */
  minutes?: number
  storageKey: string
}

type Flat = {
  pack: SourcePack
  question: PublicGamQuestion
  indexInPack: number
  packSize: number
}

/** The same row once the answer half has been merged back in. */
type MarkedFlat = Omit<Flat, 'question'> & { question: GamQuestion }

type GamSolutionMap = Record<string, GamSolutionEntry>

/**
 * Ask the server to mark this session.
 *
 * Called when the candidate submits and never before. The pages serve packs
 * with `correctOptionId`, `explanation`, `refutations`, `supportSpans` and
 * `computation` stripped out, so until this resolves the browser holds nothing
 * that answers a question — which is the whole point, and was not true while
 * `/module-b/timed` prerendered all nineteen keys into its own HTML.
 */
async function fetchGamSolutions(packIds: string[]): Promise<GamSolutionMap> {
  const response = await fetch('/api/module-b/mark', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ packIds }),
  })
  if (!response.ok) throw new Error(`mark: HTTP ${response.status}`)
  const body = (await response.json()) as { solutions?: GamSolutionMap }
  if (!body.solutions) throw new Error('mark: no solutions in response')
  return body.solutions
}

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

  /**
   * Submitted *in this mount*, as opposed to restored from a draft that was
   * already submitted. Only the former is a result worth recording — reopening
   * a finished session must not append a second attempt for every question,
   * which is what recording on `submitted` alone would do.
   */
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [solutions, setSolutions] = useState<GamSolutionMap | null>(null)
  const [markFailed, setMarkFailed] = useState(false)
  const [markAttempt, setMarkAttempt] = useState(0)
  const recorded = useRef(false)

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

  /**
   * Submitting is still synchronous, and that is deliberate.
   *
   * It has to be: the clock calls this at zero, and a submission that could
   * fail on a network request would be a timed session that ran out and then
   * lost the work. So this records the decision locally and immediately — the
   * draft is already persisted — and the marking happens afterwards, once the
   * answer key arrives. Nothing about the candidate's session depends on the
   * request succeeding; only the score does, and that can be retried.
   */
  const submit = useCallback(
    (ranOut: boolean) => {
      if (submitted) return
      setSubmitted(true)
      setTimedOut(ranOut)
      setJustSubmitted(true)
      persist({ submitted: true })
    },
    [persist, submitted],
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

  /* --- marking ---------------------------------------------------------- */

  /**
   * Fetch the answer key, once the session is over.
   *
   * Runs for a restored-and-already-submitted draft as well as for a fresh
   * submission, because the review screen needs the explanations either way.
   * `markAttempt` is in the dependency list so the retry button can re-run it.
   */
  useEffect(() => {
    if (!submitted || solutions) return
    let live = true
    fetchGamSolutions(files.map((f) => f.pack.id))
      .then((map) => {
        if (live) setSolutions(map)
      })
      .catch(() => {
        if (live) setMarkFailed(true)
      })
    return () => {
      live = false
    }
  }, [submitted, solutions, files, markAttempt])

  /** The session, with the answer half merged back in. */
  const marked = useMemo<MarkedFlat[] | null>(
    () =>
      solutions
        ? flat.map((f) => ({
            ...f,
            question: { ...f.question, ...solutions[f.question.id] } as GamQuestion,
          }))
        : null,
    [flat, solutions],
  )

  /**
   * Record the attempts, once, when the key is in hand.
   *
   * This used to happen inside `submit`, which could do it synchronously
   * because the answers were already in the page. The guard is a ref rather
   * than state so that re-running this effect — which the dependency list
   * makes possible — cannot record a second time.
   */
  useEffect(() => {
    if (!justSubmitted || !marked || recorded.current) return
    recorded.current = true

    const attempts = marked
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
      timedOut,
      total: marked.length,
      answered: attempts.length,
      correct: attempts.filter((a) => a.correct).length,
    })
  }, [
    answers,
    files,
    justSubmitted,
    marked,
    mode,
    recordAttempts,
    recordSession,
    session,
    storageKey,
    timedOut,
  ])

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
    // The answer key goes with it. Keeping it would mean a fresh session was
    // being sat by a browser that already held its answers.
    setJustSubmitted(false)
    setSolutions(null)
    setMarkFailed(false)
    recorded.current = false
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
    if (markFailed) {
      return (
        <PageContainer className="py-6">
          <Card className="mx-auto max-w-md">
            <CardContent className="space-y-4 pt-5">
              <h1 className="text-lg tracking-tight">We could not mark that session</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your answers are saved — all {answeredCount} of them — and nothing has been
                lost. The scoring needs a connection, so check yours and try again.
              </p>
              <Button
                onClick={() => {
                  setMarkFailed(false)
                  setMarkAttempt((n) => n + 1)
                }}
              >
                Try marking again
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      )
    }

    if (!marked) {
      return (
        <PageContainer className="space-y-4 py-6">
          <h1 className="text-lg tracking-tight">Marking your session…</h1>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-72 w-full" />
        </PageContainer>
      )
    }

    return (
      <GamResults
        flat={marked}
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
        <section className="panel lg:sticky lg:top-[68px] lg:max-h-[calc(100vh-88px)]">
          <div className="panel-h">
            <h2 className="ptitle">Source</h2>
            <span className="text-muted-foreground text-xs">Stays while you answer</span>
          </div>
          <div className="surface flex-1 overflow-y-auto p-4">
            <SourcePackView pack={current.pack} />
          </div>
        </section>

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
                  className={`size-7 rounded-[7px] border font-mono text-xs transition-colors duration-150 ${
                    answers[f.question.id]
                      ? 'border-brand bg-brand text-brand-foreground'
                      : 'border-line2 bg-card text-muted-foreground hover:border-foreground'
                  } ${at === index ? 'border-foreground border-[1.5px]' : ''}`}
                >
                  {f.indexInPack + 1}
                </button>
              )
            })}
            <span className="text-muted-foreground ml-1 text-xs">
              question {current.indexInPack + 1} of {current.packSize} in this source
            </span>
          </div>

          <article className="panel">
            <div className="panel-h min-h-[42px]">
              <span className="flex min-w-0 items-center gap-2">
                <span className="font-mono text-xs font-semibold tabular-nums">
                  Q{String(current.indexInPack + 1).padStart(2, '0')}
                </span>
                <span className="text-muted-foreground truncate font-mono text-xs">
                  {current.question.id}
                </span>
              </span>
              <span className="text-muted-foreground text-xs">Single choice</span>
            </div>

            <div className="surface flex flex-col gap-3.5 p-4">
              <p className="max-w-[560px] text-base leading-[22px] font-semibold">
                {current.question.stem}
              </p>
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
            </div>
          </article>

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
