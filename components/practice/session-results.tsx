'use client'


import { SaveProgressInvite } from '@/components/auth/save-progress-invite'
import { Disclosure } from '@/components/content/disclosure'
import { ResultBanner } from '@/components/practice/result-banner'
import { SolutionViewer } from '@/components/practice/solution-viewer'
import { Kpi } from '@/components/dashboard/kpi'
import { PaceChart } from '@/components/practice/pace-chart'
import type { TimedStage } from '@/components/practice/timed-runner'
import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent } from '@/components/ui/card'
import type { PracticeMode } from '@/lib/types/progress'
import { isCorrect, type Difficulty, type Question, type Selection } from '@/lib/types/question'

/**
 * The result screen. The summary stays compact — score, coverage, pace — and
 * everything else is opt-in, because the first thing wanted after 25 minutes is
 * the number, not twenty walkthroughs.
 */
export function SessionResults({
  mode,
  title,
  stages,
  answers,
  spent,
}: {
  mode: PracticeMode
  title: string
  stages: TimedStage[]
  answers: Record<string, Selection>
  /** Milliseconds on each question, keyed by id. Absent before timing existed. */
  spent?: Record<string, number>
}) {
  const questions = stages.flatMap((s) => s.questions)
  const graded = questions.map((q) => {
    const selection = answers[q.id] ?? {}
    const answered = Object.keys(selection).length > 0
    return { question: q, selection, answered, correct: answered && isCorrect(q, selection) }
  })

  const answered = graded.filter((g) => g.answered).length
  const correct = graded.filter((g) => g.correct).length
  const accuracy = answered ? correct / answered : 0

  const byDifficulty = (['low', 'medium', 'high'] as const).map((difficulty) => {
    const rows = graded.filter((g) => g.question.difficulty === difficulty)
    return {
      difficulty,
      total: rows.length,
      correct: rows.filter((r) => r.correct).length,
    }
  })

  const byPattern = patternBreakdown(graded)

  // Per-subtest, and only when there is more than one. A single-subtest test
  // would just restate the total in a second place.
  const bySection =
    stages.length > 1
      ? stages.map((stage) => {
          const rows = graded.filter((g) => g.question.section === stage.sectionId)
          return {
            id: stage.sectionId,
            label: stage.label,
            total: rows.length,
            correct: rows.filter((r) => r.correct).length,
            blank: rows.filter((r) => !r.answered).length,
          }
        })
      : []

  const missed = graded.filter((g) => g.answered && !g.correct)

  // The slowest part is the one worth charting; with one part there is no
  // choice to make. Nothing is charted at all when no time was recorded.
  const paceStage = stages.length
    ? [...stages].sort((a, b) => stageMs(spent, b) - stageMs(spent, a))[0]
    : null
  const paceLabel = paceStage?.label ?? ''
  const paceTasks = (paceStage?.questions ?? []).map((q) => ({
    seconds: typeof spent?.[q.id] === 'number' ? Math.round(spent[q.id] / 1000) : null,
    answered: Object.keys(answers[q.id] ?? {}).length > 0,
  }))

  const missedCount = graded.filter((g) => g.answered && !g.correct).length

  return (
    <div className="flex flex-col gap-5">
      {/* The score, at the size the result deserves. */}
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="over mb-1.5">
            {/* Name the thing that was actually sat. This said "practice mock"
                for a diagnostic, directly above a card headed "dMAT Prep
                diagnostic" — two labels for one sitting, on one screen. */}
            {title} ·{' '}
            {mode === 'diagnostic'
              ? 'diagnostic'
              : mode === 'simulation'
                ? 'simulation'
                : 'timed set'}
          </p>
          <h2 className="flex items-baseline gap-2.5">
            <span className="font-mono text-5xl leading-[52px] font-medium tracking-[-0.03em] tabular-nums">
              {correct}
            </span>
            <span className="text-muted-foreground text-xl font-medium">
              / {questions.length} correct
            </span>
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {missedCount > 0 ? (
            <ButtonLink href="/practice/mistakes" size="lg">
              Retry the {missedCount} {missedCount === 1 ? 'miss' : 'misses'}
            </ButtonLink>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr))]">
        <Kpi
          label="Answered"
          value={answered}
          suffix={`of ${questions.length}`}
          progress={questions.length ? answered / questions.length : 0}
          foot={<span>{questions.length - answered} left blank</span>}
        />
        <Kpi
          label="Accuracy"
          value={`${Math.round(accuracy * 100)}%`}
          foot={<span>On the {answered} you answered</span>}
        />
        <Kpi
          label="Time used"
          value={totalTime(spent, questions) ?? '—'}
          foot={<span>{averageTime(spent, questions) ?? 'Not measured'}</span>}
        />
      </section>

      <p className="text-muted-foreground text-xs leading-relaxed">
        This is a dMAT Prep indicator, not an official dMAT score or a prediction of one. The
        dMAT is reported on a 0–200 scale with a percentile rank, which nothing here can
        estimate.
      </p>

      {/* Where the score came from. A combined 47/60 says nothing about which
          subtest cost you the marks, and that is the first thing anyone wants
          after a full sitting. The diagnostic has its own, richer version of
          this below, so it is not drawn twice. */}
      {bySection.length > 0 && mode !== 'diagnostic' ? (
        <section className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr))]">
          {bySection.map((row) => (
            <Kpi
              key={row.id}
              label={row.label}
              value={row.correct}
              suffix={`/ ${row.total}`}
              progress={row.total ? row.correct / row.total : 0}
              foot={
                <>
                  <span>Time used</span>
                  <span className="font-mono tabular-nums">
                    {sectionTime(spent, stages, row.id) ?? '—'}
                    {row.blank > 0 ? ` · ${row.blank} blank` : ''}
                  </span>
                </>
              }
            />
          ))}
        </section>
      ) : null}

      {/* Pace, for the part that has the most to say about it. */}
      {paceTasks.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          <PaceChart tasks={paceTasks} label={paceLabel} />
        </div>
      ) : null}

      {mode === 'diagnostic' ? <StartingPoint graded={graded} stages={stages} /> : null}

      {/* Value first: the offer to save comes after there is something worth
          saving, never before the test. */}
      <SaveProgressInvite moment={mode === 'diagnostic' ? 'diagnostic' : 'mock'} />

      <Disclosure summary="How you did by difficulty" hint={`${byDifficulty.length} tiers`}>
        <ul className="space-y-2.5">
          {byDifficulty.map((row) => (
            <li key={row.difficulty} className="flex items-center justify-between gap-4 text-sm">
              <span className="capitalize">{row.difficulty}</span>
              <span className="text-muted-foreground tabular-nums">
                {row.correct} / {row.total}
              </span>
            </li>
          ))}
        </ul>
      </Disclosure>

      {byPattern.length > 0 && (
        <Disclosure summary="How you did by skill" hint={`${byPattern.length} patterns`}>
          <ul className="space-y-2.5">
            {byPattern.map((row) => (
              <li key={row.pattern} className="flex items-center justify-between gap-4 text-sm">
                <span className="font-mono text-xs">{row.pattern}</span>
                <span className="text-muted-foreground tabular-nums">
                  {row.correct} / {row.total}
                </span>
              </li>
            ))}
          </ul>
        </Disclosure>
      )}

      {/* Open by default, and first.
          `/review` was removed from the navigation on the grounds that mistakes
          are worth looking at at the end of a set rather than as a fifth
          destination. That only holds if they are actually IN FRONT of you
          here — buried inside "Review every question", three taps and twenty
          correct answers away, they were not. */}
      {missed.length > 0 ? (
        <Disclosure
          defaultOpen
          summary={`What you got wrong`}
          hint={`${missed.length} of ${answered}`}
        >
          <ol className="space-y-5">
            {missed.map((g) => (
              <li key={g.question.id} className="space-y-3">
                <p className="text-sm font-medium">
                  Question {questions.indexOf(g.question) + 1}
                </p>
                <ResultBanner
                  question={g.question}
                  selection={g.selection}
                  correct={false}
                  hintsUsed={0}
                />
                <SolutionViewer question={g.question} />
              </li>
            ))}
          </ol>
        </Disclosure>
      ) : null}

      <Disclosure summary="Review every question" hint={`${questions.length}`}>
        <ol className="space-y-5">
          {graded.map((g, i) => (
            <li key={g.question.id} className="space-y-3">
              <p className="text-sm font-medium">
                {i + 1}. {g.answered ? (g.correct ? 'Correct' : 'Incorrect') : 'Not answered'}
              </p>
              {g.answered ? (
                <ResultBanner
                  question={g.question}
                  selection={g.selection}
                  correct={g.correct}
                  hintsUsed={0}
                />
              ) : null}
              <SolutionViewer question={g.question} />
            </li>
          ))}
        </ol>
      </Disclosure>

      <div className="flex flex-wrap gap-2">
        {/* Where you actually are, not a generic home button. A diagnostic
            exists to point somewhere specific, so it hands over to Prepare;
            a timed test belongs to Test. Both links now name their destination
            and go straight there — "Another test" pointed at /practice, which
            only redirects to /test, so the label and the landing disagreed. */}
        {mode === 'diagnostic' ? (
          <>
            <ButtonLink href="/prepare">Start preparing</ButtonLink>
            <ButtonLink variant="outline" href="/test">
              Try a timed test
            </ButtonLink>
          </>
        ) : (
          <>
            <ButtonLink href="/test">Back to Test</ButtonLink>
            <ButtonLink variant="outline" href="/prepare">
              Practise untimed, with hints
            </ButtonLink>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * The diagnostic's own summary: where you are strongest and weakest, and what to
 * do first. Fifteen questions is enough to point somewhere and nothing more, so
 * the copy says exactly that and the path stays changeable.
 */
function StartingPoint({ graded, stages }: { graded: Graded[]; stages: TimedStage[] }) {
  const perSection = stages.map((stage) => {
    const rows = graded.filter((g) => g.question.section === stage.sectionId)
    const answered = rows.filter((r) => r.answered).length
    const correct = rows.filter((r) => r.correct).length
    return {
      sectionId: stage.sectionId,
      label: stage.label,
      total: rows.length,
      answered,
      correct,
      // Score over everything shown: an unanswered question is not a strength.
      score: rows.length ? correct / rows.length : 0,
    }
  })

  const ranked = [...perSection].sort((a, b) => b.score - a.score)
  const strongest = ranked[0]
  const weakest = ranked[ranked.length - 1]
  const overall = graded.filter((g) => g.correct).length / (graded.length || 1)
  const flat = strongest.score - weakest.score < 0.15

  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            dMAT Prep diagnostic
          </p>
          <h3 className="mt-1 text-base font-semibold tracking-tight">Your starting point</h3>
        </div>

        <ul className="space-y-2">
          {perSection.map((row) => (
            <li key={row.sectionId} className="flex items-center justify-between gap-4 text-sm">
              <span>{row.label}</span>
              <span className="text-muted-foreground tabular-nums">
                {row.correct} / {row.total}
              </span>
            </li>
          ))}
        </ul>

        <dl className="border-border space-y-2 border-t pt-4 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground shrink-0">Strongest</dt>
            <dd className="font-medium">{flat ? 'Fairly even across the three' : strongest.label}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground shrink-0">Weakest</dt>
            <dd className="font-medium">{flat ? 'No clear gap yet' : weakest.label}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground shrink-0">Overall</dt>
            <dd className="font-medium tabular-nums">{Math.round(overall * 100)}% correct</dd>
          </div>
        </dl>

        <div className="border-border bg-muted/50 rounded-2xl border p-4">
          <p className="text-sm font-medium">Start with {weakest.label}</p>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            {flat
              ? 'Nothing stands out from five questions each, so any section is a reasonable place to begin — this one only just came last.'
              : 'Five questions per section is a pointer, not a verdict. Nothing is locked in: practise whichever section you like, and the recommendation updates as you go.'}
          </p>
          <ButtonLink
            variant="outline"
            size="sm"
            className="mt-3"
            href={`/module-a/${weakest.sectionId}/practice`}
          >
            Practise {weakest.label}
          </ButtonLink>
        </div>
      </CardContent>
    </Card>
  )
}

function stageMs(spent: Record<string, number> | undefined, stage: TimedStage): number {
  if (!spent) return 0
  return stage.questions.reduce((n, q) => n + (spent[q.id] ?? 0), 0)
}

function clock(ms: number): string {
  const total = Math.round(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

function totalTime(
  spent: Record<string, number> | undefined,
  questions: Question[],
): string | null {
  if (!spent) return null
  const ms = questions.reduce((n, q) => n + (spent[q.id] ?? 0), 0)
  return ms > 0 ? clock(ms) : null
}

function averageTime(
  spent: Record<string, number> | undefined,
  questions: Question[],
): string | null {
  if (!spent) return null
  const seen = questions.filter((q) => typeof spent[q.id] === 'number')
  if (seen.length === 0) return null
  const ms = seen.reduce((n, q) => n + (spent[q.id] ?? 0), 0)
  return `${Math.round(ms / seen.length / 1000)}s a question on average`
}

function sectionTime(
  spent: Record<string, number> | undefined,
  stages: TimedStage[],
  sectionId: string,
): string | null {
  const stage = stages.find((s) => s.sectionId === sectionId)
  if (!stage || !spent) return null
  const ms = stageMs(spent, stage)
  return ms > 0 ? clock(ms) : null
}


type Graded = { question: Question; correct: boolean; answered: boolean; selection: Selection }

/** Accuracy per pattern, using the metadata the generators already record. */
function patternBreakdown(graded: Graded[]) {
  const map = new Map<string, { total: number; correct: number }>()
  for (const row of graded) {
    for (const pattern of row.question.meta?.patternType ?? []) {
      const entry = map.get(pattern) ?? { total: 0, correct: 0 }
      entry.total++
      if (row.correct) entry.correct++
      map.set(pattern, entry)
    }
  }
  return [...map.entries()]
    .map(([pattern, v]) => ({ pattern, ...v }))
    .sort((a, b) => a.correct / a.total - b.correct / b.total)
}

export type { Difficulty }
