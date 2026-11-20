'use client'

import Link from 'next/link'
import { Check, Lock } from 'lucide-react'

import { ArrowAffordance } from '@/components/ui/arrow-affordance'
import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import { COMMERCE_ENABLED } from '@/lib/payments/config'
import { useEntitlement } from '@/lib/payments/use-entitlement'
import type { SessionResult } from '@/lib/types/progress'
import { cn } from '@/lib/utils'

export type MockTile = {
  id: string
  label: string
  number: number
  size: number
  /** Every question id in the mock, used to recognise a past sitting. */
  questionIds: string[]
}

/**
 * The four fixed mocks, each showing whether it has been sat and what it
 * scored.
 *
 * The score is the point of a fixed mock — it is the only number in the
 * product that two sittings can be compared on, because it is the only test
 * that is the same test twice. Showing it here is what makes that comparison
 * available without opening anything.
 *
 * A sitting is matched to a mock by its questions rather than by a stored
 * label: `SessionResult` records the ids it covered, and the four mocks share
 * no question, so a session all of whose ids fall inside one mock can only
 * have been that mock. The open simulation draws from the whole bank, so it
 * cannot land entirely inside a 60-question set by accident.
 */
export function MockTiles({ mocks }: { mocks: MockTile[] }) {
  const progress = useProgress()
  const ready = useProgressReady()
  const entitlement = useEntitlement()

  // Locked only once we know: flashing a lock at someone who has paid, for the
  // moment before their entitlement resolves, is worse than showing nothing.
  const locked = COMMERCE_ENABLED && entitlement.ready && !entitlement.access

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {mocks.map((mock) => {
        const best = ready ? bestSitting(progress.sessions, mock.questionIds) : null
        return (
          <MockTile key={mock.id} mock={mock} best={best} locked={locked} />
        )
      })}
    </div>
  )
}

function MockTile({
  mock,
  best,
  locked,
}: {
  mock: MockTile
  best: { correct: number; total: number; at: string } | null
  locked: boolean
}) {
  const href = locked ? '/pricing' : `/test/mock/${mock.id}`

  return (
    <Link
      href={href}
      aria-label={locked ? `${mock.label} — part of Pro, see pricing` : mock.label}
      className={cn(
        'group border-border bg-card flex items-start gap-3 rounded-2xl border p-4',
        'hover:border-brand/40 focus-visible:ring-ring transition-[border-color,translate]',
        'duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:outline-none',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-md font-mono text-sm',
          best ? 'bg-success-tint text-success-fg' : 'bg-brand/8 text-brand',
          locked && 'bg-muted text-muted-foreground',
        )}
      >
        {locked ? (
          <Lock className="size-4" />
        ) : best ? (
          <Check className="size-4" />
        ) : (
          mock.number
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-base leading-5 font-medium">{mock.label}</span>
        <span className="text-muted-foreground text-sm leading-5 font-medium">
          {/* A lock that does not say what it is, or where the link goes, is a
              dead end wearing an arrow. */}
          {locked
            ? `${mock.size} questions · part of Pro — about half of them come from the paid bank, so this cannot be marked without it`
            : `${mock.size} questions · 75 minutes · the same test every time`}
        </span>
        {best ? (
          <span className="bg-muted text-muted-foreground mt-1 w-fit rounded-md px-2 py-1 font-mono text-xs">
            Best {best.correct}/{best.total} · {new Date(best.at).toLocaleDateString()}
          </span>
        ) : null}
      </span>

      <ArrowAffordance className="mt-0.5" />
    </Link>
  )
}

/**
 * The best completed sitting of this mock, or null.
 *
 * "Best" rather than "latest" because the tile is a progress marker: a
 * candidate who scored 48 and then abandoned a retake after four questions has
 * still scored 48, and showing 4/60 would misreport it.
 */
function bestSitting(sessions: SessionResult[], questionIds: string[]) {
  const ids = new Set(questionIds)
  let best: { correct: number; total: number; at: string } | null = null

  for (const session of sessions) {
    if (session.questionIds.length === 0) continue
    if (!session.questionIds.every((id) => ids.has(id))) continue
    if (!best || session.correct > best.correct) {
      best = { correct: session.correct, total: questionIds.length, at: session.at }
    }
  }
  return best
}
