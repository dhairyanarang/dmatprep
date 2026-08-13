'use client'


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

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-5">
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">
              dMAT Prep {mode === 'simulation' ? 'simulation' : 'practice mock'}
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

      {mode === 'diagnostic' ? <StartingPoint graded={graded} stages={stages} /> : null}

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
        <ButtonLink href="/">Back to preparation</ButtonLink>
        <ButtonLink variant="outline" href="/practice">
          Another test
        </ButtonLink>
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
