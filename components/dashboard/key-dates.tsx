'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { countdownLabel, daysUntil, formatDate } from '@/lib/dates/countdown'
import { useToday } from '@/lib/dates/use-today'
import { useProgress, useProgressActions, useProgressReady } from '@/lib/progress/use-progress'
import type { KeyDate } from '@/lib/types/progress'

/**
 * Your own dates alongside the two fixed ones.
 *
 * One CardContent rather than CardHeader + CardContent: each brings its own
 * spacing, which is what opened the gap between the title and the body.
 */
export function KeyDates() {
  const { keyDates } = useProgress()
  const { setKeyDates } = useProgressActions()
  const ready = useProgressReady()
  const today = useToday()

  const [label, setLabel] = useState('')
  const [date, setDate] = useState('')

  const add = () => {
    if (!label.trim() || !date) return
    const entry: KeyDate = { id: `${date}-${label.trim()}`, label: label.trim(), date }
    setKeyDates([...keyDates, entry].sort((a, b) => a.date.localeCompare(b.date)))
    setLabel('')
    setDate('')
  }

  const remove = (id: string) => setKeyDates(keyDates.filter((d) => d.id !== id))

  return (
    <Card className="[--card-spacing:--spacing(5)]">
      <CardContent className="space-y-4">
        <h3 className="text-sm font-medium">Your key dates</h3>

        {!ready ? (
          <div className="h-8" aria-hidden />
        ) : keyDates.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Travel bookings, mock sittings, anything else with a date.
          </p>
        ) : (
          <ul className="divide-y">
            {keyDates.map((entry) => {
              const days = today ? daysUntil(entry.date, today) : null
              return (
                <li key={entry.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{entry.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(entry.date)}
                      {days !== null ? ` · ${countdownLabel(days)}` : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(entry.id)}
                    aria-label={`Remove ${entry.label}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}

        {/* Grid, not flex-wrap: with flex the label field shrank to a few
            pixels on a phone because the date input and button won the space. */}
        <form
          className="grid gap-3 border-t pt-4 sm:grid-cols-[1fr_auto_auto] sm:items-end sm:gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <div className="min-w-0 space-y-1">
            <Label htmlFor="key-date-label" className="text-muted-foreground text-xs">
              What
            </Label>
            <Input
              id="key-date-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Book travel to the centre"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="key-date-date" className="text-muted-foreground text-xs">
              When
            </Label>
            <Input
              id="key-date-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            disabled={!label.trim() || !date}
            className="w-full sm:w-auto"
          >
            <Plus className="size-4" />
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
