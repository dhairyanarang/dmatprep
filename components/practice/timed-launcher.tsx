'use client'

import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'

import { TestUnmarkable } from '@/components/practice/premium-locked'
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
import { hasSolution, type Question } from '@/lib/types/question'
import { useSolutions } from '@/lib/solutions/use-solutions'
import type { PublicQuestion } from '@/lib/content/registry'

export type StageSpec = {
  sectionId: SectionId
  label: string
  unitNoun: string
  /** Answer-free records; solutions are fetched and merged in the launcher. */
  pool: PublicQuestion[]
  count: number
  /**
   * A FIXED question list, in order — used by the four Core mocks.
   *
   * When present it replaces planning entirely: no shuffle, no ranking by what
   * has been seen, no seed. A mock has to be the same test every time it is
   * opened, or two attempts at "mock 2" are two different tests and comparing
   * their scores means nothing. The ids come from
   * `content/access/core-mocks.json`, which is generated once and committed.
   */
  questionIds?: string[]
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
  note,
  stages,
  minutesPerStage,
  breakAfterStage,
  untimed = false,
}: {
  mode: PracticeMode
  title: string
  /** Passed to the briefing card; see `TimedRunner`. */
  note?: string
  stages: StageSpec[]
  minutesPerStage: number
  breakAfterStage?: number
  untimed?: boolean
}) {
  const progress = useProgress()
  const ready = useProgressReady()
  const { setActiveSession } = useProgressActions()
  const route = usePathname()

  // The page served these pools without their answers. Merge the other half
  // back here, at the one point above everything that consumes a pool, so
  // planning, restoring and the runner all see complete questions as before.
  const sections = useMemo(() => [...new Set(stages.map((s) => s.sectionId))], [stages])
  const solutions = useSolutions(sections)
  const specs = useMemo(
    () =>
      solutions.ready
        ? stages.map((spec) => ({ ...spec, pool: solutions.hydrate(spec.pool) }))
        : null,
    [stages, solutions],
  )

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
    if (!specs) return null
    const built = buildStages(progress, specs, mode)
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
    [ready, specs, mode],
  )

  if (solutions.error) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm">
            The answers for this test could not be loaded, so it would not be able to mark your
            work. Check your connection and reload the page.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!ready || !specs || !planned) {
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
  const restored = saved ? restore(saved, specs) : null

  // Decided before anything else is offered — resume prompt included. A test
  // whose answers we were not given cannot be marked, and the timed runner
  // marks in one pass at the end with no notion of "unknown": every withheld
  // question would be counted wrong. See `TestUnmarkable`.
  const toRun = restored ?? planned.stages
  const total = toRun.reduce((n, s) => n + s.questions.length, 0)
  const withheld = toRun.reduce(
    (n, s) => n + s.questions.filter((q) => !hasSolution(q)).length,
    0,
  )
  if (withheld > 0) return <TestUnmarkable withheld={withheld} total={total} />

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
        note={note}
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
        note={note}
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
function restore(
  session: ActiveSession,
  specs: (Omit<StageSpec, 'pool'> & { pool: Question[] })[],
): TimedStage[] | null {
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
  specs: (Omit<StageSpec, 'pool'> & { pool: Question[] })[],
  mode: PracticeMode = 'simulation',
): { stage: TimedStage; shortfall: number }[] {
  const { seen, softSeen } = seenForTest(progress, mode)
  const avoid = recentSessionIds(progress)
  const seed = progress.attempts.length * 31 + progress.sessions.length * 7 + 1

  return specs.map((spec, i) => {
    // A fixed set short-circuits everything below. The order in the file IS
    // the order of the test, so nothing here may reorder or substitute: a
    // missing id surfaces as a shortfall rather than being quietly replaced,
    // because silently swapping a question would make the mock not the mock.
    if (spec.questionIds) {
      const byId = new Map(spec.pool.map((q) => [q.id, q]))
      const questions = spec.questionIds
        .map((id) => byId.get(id))
        .filter((q): q is Question => Boolean(q))
      for (const q of questions) seen.add(q.id)
      return {
        stage: {
          sectionId: spec.sectionId,
          label: spec.label,
          unitNoun: spec.unitNoun,
          questions,
        },
        // Nonzero only if an id in the committed list is no longer resolvable —
        // a quarantined or retired question, say. That is a defect in the
        // mock file rather than a candidate's history, but it still has to be
        // said out loud: a 19-question mock that calls itself a 20-question
        // mock is the exact silence this short-circuit exists to prevent.
        shortfall: spec.questionIds.length - questions.length,
      }
    }

    const plan = planSession({
      // Only questions this candidate's answers actually arrived for.
      //
      // A timed test marks everything at the end in one pass and has no notion
      // of "unknown", so planning in a question whose solution the server
      // withheld would quietly count it wrong. Filtering here rather than
      // refusing to run is what keeps timed practice free: someone without Pro
      // gets a real twenty-question subtest drawn from the free bank and a
      // score that is honestly theirs, instead of a locked door.
      //
      // The test is "did we get the answer", not "may this person have it" —
      // the client never decides, it only observes what the server sent.
      pool: spec.pool.filter(hasSolution),
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
