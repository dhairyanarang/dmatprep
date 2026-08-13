'use client'

import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'

import { ResumePrompt, type ResumeState } from '@/components/practice/resume-prompt'
import { TimedRunner, type TimedStage } from '@/components/practice/timed-runner'
import { Card, CardContent } from '@/components/ui/card'
import { useProgress, useProgressActions, useProgressReady } from '@/lib/progress/use-progress'
import { planSession, recentSessionIds } from '@/lib/practice/selection'
import type { SectionId } from '@/lib/sections'
import {
  exposedIn,
  exposureContextOf,
  type ActiveSession,
  type PracticeMode,
  type ProgressState,
} from '@/lib/types/progress'
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
 * fact about this candidate's history and nothing else.
 *
 * It also owns *restoring* one. A session that was interrupted is rebuilt from
 * the ids it was originally planned with rather than re-planned, so resuming
 * shows the same twenty questions in the same order — a fresh plan would be a
 * different test wearing the old one's name.
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
  const { setActiveSession } = useProgressActions()
  const route = usePathname()

  /**
   * Once this mount has taken charge of a session, the store stops being
   * consulted. It has to: the runner writes its restore point on every answer,
   * and re-reading it here would put the resume prompt back on screen in the
   * middle of the test it had just handed over.
   */
  const [taken, setTaken] = useState<{ resume?: ResumeState; stages?: TimedStage[] } | null>(null)

  /**
   * The plan is made once and then held.
   *
   * Not merely an optimisation: the runner writes its restore point on every
   * answer, which re-renders this component, and a freshly-built plan each time
   * would hand the runner a new `stages` array — whose identity is a dependency
   * of the very effect that wrote the restore point. That is an infinite loop,
   * and this is where it is cut.
   */
  const planned = useMemo(() => {
    const built = buildStages(progress, stages, mode)
    return {
      built,
      // Held inside the memo as well: a `.map()` in the render body would hand
      // the runner a new array on every render and defeat the whole point.
      stages: built.map((s) => s.stage),
      shortfall: built.reduce((n, s) => n + s.shortfall, 0),
    }
  },
    // `progress` is read when the plan is made and deliberately not tracked
    // afterwards; `ready` is what says the read is worth making.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, stages, mode],
  )

  if (!ready) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">Preparing your test…</p>
        </CardContent>
      </Card>
    )
  }

  // Only this route's own session is offered here: a half-finished Latin Squares
  // mock must not surface on the full simulation page.
  const saved =
    !taken && progress.activeSession?.route === route ? progress.activeSession : null
  const restored = saved ? restore(saved, stages) : null

  if (saved && restored) {
    return (
      <ResumePrompt
        session={saved}
        stages={restored}
        onResume={(resume) => setTaken({ resume, stages: restored })}
        onDiscard={() => {
          setActiveSession(null)
          setTaken({})
        }}
      />
    )
  }
  // A saved session whose questions are no longer in the bank — regenerated,
  // most likely — cannot be resumed, so it is dropped rather than half-restored.

  if (taken?.resume && taken.stages) {
    return (
      <TimedRunner
        mode={mode}
        title={title}
        route={route}
        stages={taken.stages}
        minutesPerStage={minutesPerStage}
        breakAfterStage={breakAfterStage}
        untimed={untimed}
        resume={taken.resume}
      />
    )
  }

  const { built, stages: plannedStages, shortfall } = planned

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
        <div className="border-warning/35 bg-warning-tint/50 rounded-2xl border p-4">
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
        route={route}
        stages={plannedStages}
        minutesPerStage={minutesPerStage}
        breakAfterStage={breakAfterStage}
        untimed={untimed}
        onStarted={() => setTaken({})}
      />
    </div>
  )
}

/** Rebuild the exact stages a saved session was planned with. */
function restore(session: ActiveSession, specs: StageSpec[]): TimedStage[] | null {
  const byId = new Map(specs.flatMap((s) => s.pool).map((q) => [q.id, q]))

  const stages: TimedStage[] = []
  for (const stage of session.stages) {
    const questions = stage.questionIds.map((id) => byId.get(id)).filter((q): q is Question => !!q)
    if (questions.length !== stage.questionIds.length) return null
    stages.push({
      sectionId: stage.sectionId,
      label: stage.label,
      unitNoun: stage.unitNoun,
      questions,
    })
  }
  return stages.length ? stages : null
}

/**
 * What counts as spent, for this kind of test.
 *
 * A mock draws only on questions it has not itself used: practice and the
 * diagnostic are tracked in their own contexts, so working through the bank in
 * practice no longer quietly empties the mock pool. Attempts are folded in as
 * well, which is what keeps a question answered in practice from turning up in
 * a mock as though it were new.
 */
function seenForTest(
  progress: ProgressState,
  mode: PracticeMode,
): { seen: Set<string>; softSeen: Set<string> } {
  const context = exposureContextOf(mode)

  const seen = exposedIn(progress, context)
  const softSeen = new Set<string>()

  for (const entry of progress.exposure) {
    if (entry.context !== context) softSeen.add(entry.questionId)
  }
  for (const a of progress.attempts) {
    if (exposureContextOf(a.mode) === context) seen.add(a.questionId)
    else softSeen.add(a.questionId)
  }

  return { seen, softSeen }
}

function buildStages(
  progress: ProgressState,
  specs: StageSpec[],
  mode: PracticeMode = 'simulation',
): { stage: TimedStage; shortfall: number }[] {
  const { seen, softSeen } = seenForTest(progress, mode)
  const avoid = recentSessionIds(progress)
  const seed = progress.attempts.length * 31 + progress.sessions.length * 7 + 1

  return specs.map((spec, i) => {
    const plan = planSession({
      pool: spec.pool,
      count: spec.count,
      seen,
      softSeen,
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
