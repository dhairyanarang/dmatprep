'use client'

import { useProgress, useProgressReady } from '@/lib/progress/use-progress'
import { SECTION_BY_ID } from '@/lib/sections'
import type { SessionResult } from '@/lib/types/progress'

/**
 * Every timed sitting this browser has a record of, newest first.
 *
 * Rows are not links. The results screen is built from a session that is still
 * in memory — the questions, the selections and the explanations it shows are
 * not stored, only the score is — so a row that looked like a link would lead
 * somewhere that could not rebuild what it promised. It reports; it does not
 * pretend to reopen.
 */
export function PastAttempts({ mockLabels }: { mockLabels: Record<string, string> }) {
  const progress = useProgress()
  const ready = useProgressReady()

  const sessions = [...progress.sessions].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8)

  return (
    <section className="panel">
      <div className="panel-h">
        <h2 className="ptitle">Past attempts</h2>
        {sessions.length > 0 ? (
          <span className="text-muted-foreground text-xs">
            {progress.sessions.length} recorded
          </span>
        ) : null}
      </div>

      <div className="surface">
        {!ready ? (
          <div className="h-20" />
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            No timed sittings yet. Start one above and the score shows up here.
          </p>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="listrow px-4 py-3">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <b className="truncate text-sm font-semibold">{title(session, mockLabels)}</b>
                <span className="text-muted-foreground text-xs">
                  {new Date(session.at).toLocaleDateString(undefined, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                  {session.timedOut ? ' · ran out of time' : ''}
                </span>
              </span>
              {/* No chevron. These rows do not open anything, and an arrow
                  that leads nowhere is worse than no arrow. */}
              <span className="font-mono text-sm tabular-nums">
                {session.correct}/{session.total}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

/**
 * What the sitting was.
 *
 * A fixed mock is recognised by its questions, the same way the mock tiles do
 * it: the four share no question, so a session wholly inside one can only be
 * that one. Everything else is named by its subtests.
 */
function title(session: SessionResult, mockLabels: Record<string, string>): string {
  const label = mockLabels[session.questionIds.slice().sort().join(',')]
  if (label) return label
  if (session.mode === 'diagnostic') return 'Diagnostic'
  if (session.sections.length > 1) return 'Open simulation'
  const section = session.sections[0]
  return section ? `${SECTION_BY_ID[section].title} · timed set` : 'Timed set'
}
