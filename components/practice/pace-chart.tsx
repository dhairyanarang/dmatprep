'use client'

import { cn } from '@/lib/utils'

/**
 * Where the clock went: seconds on each task, against the pace the exam
 * implies.
 *
 * 75 seconds is 25 minutes divided by 20. It is a pacing guide and not a
 * published limit, which is why the line is dashed and labelled rather than
 * drawn as a threshold something failed.
 *
 * A task that was never opened gets a baseline tick, not a full-height
 * outline. The outline was the first thing drawn here and it was a lie by
 * omission: eighteen unvisited tasks rendered as eighteen full-height boxes,
 * which reads as "these took the longest" when it means "these were never
 * seen". A tick says the second thing and cannot be mistaken for the first.
 */
export function PaceChart({
  tasks,
  label,
}: {
  tasks: { seconds: number | null; answered: boolean }[]
  label: string
}) {
  const measured = tasks.filter((t) => t.seconds !== null).map((t) => t.seconds as number)
  if (measured.length === 0) return null

  const peak = Math.max(75, ...measured)
  const height = 150
  const paceY = Math.round((75 / peak) * height)

  const over = measured.filter((s) => s > 75).length
  const blank = tasks.filter((t) => t.seconds !== null && !t.answered).length
  const unseen = tasks.filter((t) => t.seconds === null).length

  return (
    <section className="panel min-w-0 flex-[2_1_480px]">
      <div className="panel-h">
        <h2 className="ptitle">Where the clock went · {label}</h2>
      </div>

      <div className="surface flex flex-1 flex-col gap-3 p-4">
        <div
          role="img"
          aria-label={`Seconds per task. ${over} ${over === 1 ? 'task' : 'tasks'} over 75 seconds${
            blank ? `, ${blank} left blank` : ''
          }${unseen ? `, ${unseen} never opened` : ''}.`}
          className="relative grid items-end gap-1.5"
          style={{
            height: height + 10,
            gridTemplateColumns: `repeat(${tasks.length}, minmax(0,1fr))`,
            backgroundImage: 'radial-gradient(#e3e3e3 1px, transparent 1px)',
            backgroundSize: '12px 12px',
          }}
        >
          <div
            aria-hidden
            className="border-foreground absolute right-0 left-0 border-t-[1.5px] border-dashed"
            style={{ bottom: paceY }}
          />
          <span
            aria-hidden
            className="bg-card absolute right-0 px-1 font-mono text-[10px]"
            style={{ bottom: paceY + 4 }}
          >
            75 s pace
          </span>

          {tasks.map((task, i) =>
            task.seconds === null ? (
              <div
                key={i}
                title={`Task ${i + 1}: never opened`}
                className="bg-soft rounded-t"
                style={{ height: 3 }}
              />
            ) : (
              <div
                key={i}
                title={`Task ${i + 1}: ${format(task.seconds)}`}
                className={cn('rounded-t', task.seconds > 75 ? 'bg-warning' : 'bg-brand')}
                style={{ height: Math.max(3, Math.round((task.seconds / peak) * height)) }}
              />
            ),
          )}
        </div>

        <div className="text-muted-foreground flex justify-between font-mono text-[10px]">
          <span>Task 1</span>
          <span>{Math.ceil(tasks.length / 2)}</span>
          <span>{tasks.length}</span>
        </div>

        <p className="note">
          {over > 0
            ? `${over} ${over === 1 ? 'task ran' : 'tasks ran'} past 75 seconds${
                blank > 0 ? `, and ${blank} got no answer` : ''
              }. Moving on sooner and guessing at the end costs less than a blank, which scores nothing.`
            : unseen > 0
              ? `Every task you opened came in under the 75-second pace, but ${unseen} ${
                  unseen === 1 ? 'was' : 'were'
                } never reached. A blank scores nothing, so it is worth seeing every task even if the last few are guesses.`
              : 'Every task came in under the 75-second pace. The clock is not what is costing you marks here.'}
        </p>
      </div>
    </section>
  )
}

function format(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`
}
