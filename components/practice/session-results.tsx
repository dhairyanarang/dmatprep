'use client'


import { SaveProgressInvite } from '@/components/auth/save-progress-invite'
import { Disclosure } from '@/components/content/disclosure'
import { ResultBanner } from '@/components/practice/result-banner'
import { SolutionViewer } from '@/components/practice/solution-viewer'
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
}: {
  mode: PracticeMode
  title: string
  stages: TimedStage[]
  answers: Record<string, Selection>
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

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-5">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              {/* Name the thing that was actually sat. This said "practice mock"
                  for a diagnostic, directly above a card headed "dMAT Prep
                  diagnostic" — two labels for one sitting, on one screen. */}
              dMAT Prep{' '}
              {mode === 'diagnostic'
                ? 'diagnostic'
                : mode === 'simulation'
                  ? 'simulation'
                  : 'practice mock'}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{title}</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Metric value={`${correct}/${questions.length}`} label="Correct out of the full set" />
            <Metric
              value={`${Math.round(accuracy * 100)}%`}
              label={`Accuracy on the ${answered} you answered`}
            />
            <Metric
              value={String(questions.length - answered)}
              label="Left unanswered"
            />
          </div>

          <p className="text-muted-foreground text-xs leading-relaxed">
            This is a dMAT Prep indicator, not an official dMAT score or a prediction of one. The
            dMAT is reported on a 0–200 scale with a percentile rank, which nothing here can
            estimate.
          </p>
        </CardContent>
      </Card>

      {/* Where the score came from. A combined 47/60 says nothing about which
          subtest cost you the marks, and that is the first thing anyone wants
          after a full sitting. The diagnostic has its own, richer version of
          this below, so it is not drawn twice. */}
      {bySection.length > 0 && mode !== 'diagnostic' ? (
        <Card>
          <CardContent className="space-y-3.5">
            <h3 className="text-base font-semibold tracking-tight">By subtest</h3>
            <ul className="grid gap-3 sm:grid-cols-3">
              {bySection.map((row) => (
                <li key={row.id} className="border-border bg-muted/40 rounded-2xl border p-4">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    {row.label}
                  </p>
                  <p className="mt-2 text-2xl leading-none font-semibold tabular-nums">
                    {row.correct}
                    <span className="text-muted-foreground text-base font-medium">
                      {' '}
                      / {row.total}
                    </span>
                  </p>
                  <div
                    aria-hidden
                    className="bg-border mt-3 h-1 w-full overflow-hidden rounded-full"
                  >
                    <div
                      className="bg-brand h-full rounded-full"
                      style={{ width: `${row.total ? (row.correct / row.total) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground mt-2.5 text-xs">
                    {row.blank > 0 ? `${row.blank} left blank` : 'All answered'}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
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

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-border bg-muted/40 rounded-2xl border p-4">
      <p className="text-2xl leading-none font-semibold tabular-nums">{value}</p>
      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{label}</p>
    </div>
  )
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
