'use client'

import { Clock, RotateCcw, TimerOff } from 'lucide-react'

import type { TimedStage } from '@/components/practice/timed-runner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useNow } from '@/lib/dates/use-today'
import type { ActiveSession } from '@/lib/types/progress'

export type ResumeState = ActiveSession & { expired: boolean }

/**
 * What happens when you come back to a test you had already started.
 *
 * Never a silent reset. Restarting a mock throws away the only unseen questions
 * left in the bank as well as the work already done, so it has to be a decision
 * someone makes rather than something a refresh does to them.
 *
 * If the clock ran out while the browser was closed, there is nothing left to
 * decide — but the candidate is still told, rather than being dropped onto a
 * results screen with no explanation of where their test went.
 */
export function ResumePrompt({
  session,
  stages,
  onResume,
  onDiscard,
}: {
  session: ActiveSession
  stages: TimedStage[]
  onResume: (resume: ResumeState) => void
  onDiscard: () => void
}) {
  const now = useNow()

  const answered = Object.values(session.answers).filter(
    (s) => s && Object.keys(s).length > 0,
  ).length
  const total = stages.reduce((n, s) => n + s.questions.length, 0)

  const deadline = session.stageEndsAt ? new Date(session.stageEndsAt).getTime() : null
  const expired = Boolean(!session.untimed && deadline && now > 0 && deadline <= now)
  const remainingMs = deadline ? Math.max(0, deadline - now) : 0
  const minutes = Math.floor(remainingMs / 60_000)
  const seconds = Math.floor((remainingMs % 60_000) / 1000)

  return (
    <Card className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
      <CardContent className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            {expired ? 'Your time ran out' : 'Resume your session?'}
          </h2>
          <p className="text-muted-foreground mt-1.5 max-w-prose text-sm leading-relaxed">
            {expired ? (
              <>
                The clock on this part ran out while you were away. Nothing is lost — the{' '}
                {answered} {answered === 1 ? 'answer' : 'answers'} you had given will be marked,
                exactly as they would have been had you stayed on the page.
              </>
            ) : (
              <>
                You have a {session.title || 'test'} in progress — {answered} of {total}{' '}
                {answered === 1 ? 'question' : 'questions'} answered. Everything you had chosen is
                still there.
              </>
            )}
          </p>
        </div>

        {session.untimed || expired ? null : (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Clock className="size-4 shrink-0" aria-hidden />
            <span className="font-mono tabular-nums">
              {minutes}:{String(seconds).padStart(2, '0')}
            </span>
            left on this part — the clock has been running since you started.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {expired ? (
            <Button onClick={() => onResume({ ...session, expired: true })}>
              <TimerOff className="size-4" aria-hidden />
              See how you did
            </Button>
          ) : (
            <>
              <Button onClick={() => onResume({ ...session, expired: false })}>Resume</Button>
              <Button variant="outline" onClick={onDiscard}>
                <RotateCcw className="size-4" aria-hidden />
                Start over
              </Button>
            </>
          )}
        </div>

        {expired ? null : (
          <p className="text-muted-foreground text-xs leading-relaxed">
            Starting over builds a new test from questions you have not seen, and discards this
            one&apos;s answers.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
