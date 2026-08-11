'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { countdownLabel, daysUntil, formatDate } from '@/lib/dates/countdown'
import { useToday } from '@/lib/dates/use-today'
import { useProgress, useProgressActions, useProgressReady } from '@/lib/progress/use-progress'
import type { KeyDate } from '@/lib/types/progress'

/** Your own dates alongside the two fixed ones — travel, mock sittings, whatever matters. */
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your key dates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!ready ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : keyDates.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nothing added yet. Use this for anything with a date attached — booking travel to the
            test centre, or a week you know you will lose to something else.
          </p>
        ) : (
          <ul className="divide-y">
            {keyDates.map((entry) => {
              const days = today ? daysUntil(entry.date, today) : null
              return (
                <li key={entry.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{entry.label}</p>
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
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}

        <form
          className="flex flex-wrap items-end gap-2 border-t pt-4"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <div className="min-w-0 flex-1 space-y-1">
            <Label htmlFor="key-date-label" className="text-xs">
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
            <Label htmlFor="key-date-date" className="text-xs">
              When
            </Label>
            <Input
              id="key-date-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" disabled={!label.trim() || !date}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
