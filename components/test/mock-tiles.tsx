'use client'

import Link from 'next/link'
import { Lock, Play } from 'lucide-react'

import { ProBadge } from '@/components/layout/sidebar-brand'
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
  /** How many of its questions came from each subtest, in order. */
  shape: { label: string; count: number }[]
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
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))]">
      {mocks.map((mock, i) => (
        <MockCard
          key={mock.id}
          mock={mock}
          best={ready ? bestSitting(progress.sessions, mock.questionIds) : null}
          locked={locked}
          primary={i === 0 && !locked}
        />
      ))}
    </div>
  )
}

function MockCard({
  mock,
  best,
  locked,
  primary,
}: {
  mock: MockTile
  best: { correct: number; total: number; at: string } | null
  locked: boolean
  primary: boolean
}) {
  const href = locked ? '/pricing' : `/test/mock/${mock.id}`

  return (
    <Link
      href={href}
      aria-label={locked ? `${mock.label} — part of Pro, see pricing` : mock.label}
      className={cn(
        'flex flex-col gap-3.5 rounded-xl border p-[18px] transition-[border-color,transform] duration-150 hover:-translate-y-0.5',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        primary
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-card hover:border-foreground/30',
      )}
    >
      <span className="flex items-center justify-between gap-2">
        {locked ? (
          <ProBadge />
        ) : (
          <span className={cn('over', primary && 'text-[#bdbdbd]')}>
            {best ? 'Sat · retake any time' : 'Fixed · 3 parts'}
          </span>
        )}
        <span
          className={cn('font-mono text-[13px]', primary ? 'text-background' : 'text-muted-foreground')}
        >
          75:00
        </span>
      </span>

      <span className="flex flex-col gap-1">
        <b className="text-lg font-semibold">{mock.label}</b>
        <span className={cn('text-[13px]', primary ? 'text-[#bdbdbd]' : 'text-muted-foreground')}>
          {locked
            ? `${mock.size} questions · about half come from the paid bank, so it cannot be marked without Pro`
            : best
              ? `Best ${best.correct}/${best.total} · ${new Date(best.at).toLocaleDateString()}`
              : `${mock.size} questions across all three subtests, in a fixed order`}
        </span>
      </span>

      {/* The shape of the sitting: three parts, in the order they are taken. */}
      <span aria-hidden className="flex h-2 gap-[3px]">
        {mock.shape.map((part, i) => (
          <span
            key={part.label}
            className="rounded-[2px]"
            style={{
              flex: part.count,
              background: primary
                ? ['#fff', '#bdbdbd', '#737373'][i]
                : ['var(--brand)', 'var(--brand-200)', 'var(--brand-100)'][i],
            }}
          />
        ))}
      </span>

      <span
        className={cn(
          'flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-medium',
          locked
            ? 'border-gold-line bg-gold-soft text-gold-text border'
            : primary
              ? 'bg-background text-foreground'
              : 'bg-brand text-brand-foreground',
        )}
      >
        {locked ? (
          <>
            <Lock aria-hidden className="size-3.5" />
            Included in Pro
          </>
        ) : (
          <>
            <Play aria-hidden className="size-3 fill-current" />
            {best ? 'Sit it again' : 'Start mock'}
          </>
        )}
      </span>
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
