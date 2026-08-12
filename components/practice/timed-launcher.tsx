'use client'

import { TimedRunner, type TimedStage } from '@/components/practice/timed-runner'
import { Card, CardContent } from '@/components/ui/card'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import { planSession, recentSessionIds } from '@/lib/practice/selection'
import type { SectionId } from '@/lib/sections'
import type { PracticeMode, ProgressState } from '@/lib/types/progress'
import type { Question } from '@/lib/types/question'

export type StageSpec = {
  sectionId: SectionId
  label: string
  unitNoun: string
  pool: Question[]
  count: number
}

/**
 * Builds the test on the client, because which questions count as unseen is a
 * fact about this browser's progress and nothing else.
 *
 * The seed is derived from the progress state rather than the clock: it is pure,
 * so it can be computed during render without upsetting the React Compiler, and
 * it still changes after every completed session, so a repeat test is a
 * different test.
 */
export function TimedLauncher({
  mode,
  title,
  stages,
  minutesPerStage,
  breakAfterStage,
  untimed = false,
}: {
  mode: PracticeMode
  title: string
  stages: StageSpec[]
  minutesPerStage: number
  breakAfterStage?: number
  untimed?: boolean
}) {
  const progress = useProgress()
  const ready = useProgressReady()

  if (!ready) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">Preparing your test…</p>
        </CardContent>
      </Card>
    )
  }

  const built = buildStages(progress, stages)
  const shortfall = built.reduce((n, s) => n + s.shortfall, 0)

  if (built.some((s) => s.stage.questions.length === 0)) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm">
            There are not enough questions in the bank to build this test yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {shortfall > 0 && (
        <div className="border-warning/35 bg-warning-tint/50 rounded-xl border p-4">
          <p className="text-sm font-medium">You have seen some of these questions before</p>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            The bank could not supply {shortfall} unseen{' '}
            {shortfall === 1 ? 'question' : 'questions'} for this test, so that many have been
            repeated from your earlier practice. Your score will read a little high as a result.
          </p>
        </div>
      )}

      <TimedRunner
        mode={mode}
        title={title}
        stages={built.map((s) => s.stage)}
        minutesPerStage={minutesPerStage}
        breakAfterStage={breakAfterStage}
        untimed={untimed}
      />
    </div>
  )
}

/** Seen means attempted, or shown inside any earlier timed session. */
function seenForTest(progress: ProgressState): Set<string> {
  const seen = new Set<string>()
  for (const a of progress.attempts) seen.add(a.questionId)
  for (const s of progress.sessions) for (const id of s.questionIds) seen.add(id)
  return seen
}

function buildStages(
  progress: ProgressState,
  specs: StageSpec[],
): { stage: TimedStage; shortfall: number }[] {
  const seen = seenForTest(progress)
  const avoid = recentSessionIds(progress)
  const seed = progress.attempts.length * 31 + progress.sessions.length * 7 + 1

  return specs.map((spec, i) => {
    const plan = planSession({
      pool: spec.pool,
      count: spec.count,
      seen,
      avoid,
      seed: seed + i * 101,
    })
    // Never offer the same question twice inside one sitting.
    for (const q of plan.questions) seen.add(q.id)

    return {
      stage: {
        sectionId: spec.sectionId,
        label: spec.label,
        unitNoun: spec.unitNoun,
        questions: plan.questions,
      },
      shortfall: plan.reused,
    }
  })
}
