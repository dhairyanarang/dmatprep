'use client'

import { AlertTriangle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { STUDY_PLAN } from '@/content/study-plan/plan'
import { formatShortDate } from '@/lib/dates/countdown'
import { useToday } from '@/lib/dates/use-today'
import { useProgress, useProgressActions, useProgressReady } from '@/lib/progress/use-progress'
import { cn } from '@/lib/utils'

export function PlanView() {
  const { milestones } = useProgress()
  const { toggleMilestone } = useProgressActions()
  const ready = useProgressReady()
  const today = useToday()

  const all = STUDY_PLAN.flatMap((w) => w.milestones)
  const doneCount = all.filter((m) => milestones[m.id]).length

  const todayIso = today
    ? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    : null

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Milestones completed</span>
          <span className="font-medium tabular-nums">
            {ready ? `${doneCount} of ${all.length}` : `— of ${all.length}`}
          </span>
        </div>
        <Progress
          value={ready ? (doneCount / all.length) * 100 : 0}
          aria-label="Study plan progress"
        />
      </div>

      <ol className="space-y-6">
        {STUDY_PLAN.map((week) => {
          const current =
            todayIso !== null && todayIso >= week.startDate && todayIso <= week.endDate
          const past = todayIso !== null && todayIso > week.endDate
          const weekDone = week.milestones.filter((m) => milestones[m.id]).length

          return (
            <li
              key={week.id}
              className={cn(
                'rounded-lg border p-4 sm:p-5',
                current && 'border-foreground/40 bg-muted/30',
                past && !current && 'opacity-70',
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium">
                      Week {week.weekNumber} — {week.focus}
                    </h2>
                    {current ? (
                      <Badge variant="outline" className="border-foreground/30">
                        This week
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {formatShortDate(week.startDate)} – {formatShortDate(week.endDate)}
                  </p>
                </div>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {ready ? `${weekDone}/${week.milestones.length}` : ''}
                </span>
              </div>

              <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-pretty">
                {week.summary}
              </p>

              <ul className="mt-4 space-y-2.5">
                {week.milestones.map((milestone) => {
                  const checked = Boolean(milestones[milestone.id])
                  return (
                    <li key={milestone.id} className="flex items-start gap-3">
                      <Checkbox
                        id={milestone.id}
                        checked={checked}
                        onCheckedChange={() => toggleMilestone(milestone.id)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={milestone.id}
                        className={cn(
                          'cursor-pointer text-sm leading-relaxed',
                          checked && 'text-muted-foreground line-through',
                        )}
                      >
                        {milestone.label}
                        {milestone.critical ? (
                          <AlertTriangle
                            className="ml-1.5 inline h-3.5 w-3.5 text-amber-600 dark:text-amber-400"
                            aria-label="Has a hard deadline"
                          />
                        ) : null}
                      </label>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
