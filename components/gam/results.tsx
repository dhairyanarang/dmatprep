'use client'

import { useState } from 'react'
import { RotateCcw, TimerOff } from 'lucide-react'

import { SourcePackView } from '@/components/gam/source-pack-view'
import { PageContainer } from '@/components/layout/page-shell'
import { OptionButton } from '@/components/practice/option-button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { GamQuestion, SourcePack } from '@/lib/types/gam'

type Flat = { pack: SourcePack; question: GamQuestion; indexInPack: number; packSize: number }

/**
 * Results, and then the review in the same place.
 *
 * Module A surfaces mistakes at the end of a set rather than as a separate
 * destination, and this follows it. What is different is that a GAM answer can
 * only be explained next to its source, so the review shows the pack again above
 * the questions that used it.
 */
export function GamResults({
  flat,
  answers,
  timedOut,
  onRestart,
}: {
  flat: Flat[]
  answers: Record<string, string>
  timedOut: boolean
  onRestart: () => void
}) {
  const correct = flat.filter((f) => answers[f.question.id] === f.question.correctOptionId).length
  const answered = flat.filter((f) => answers[f.question.id]).length

  const byPack = flat.reduce<{ pack: SourcePack; items: Flat[] }[]>((acc, f) => {
    const last = acc[acc.length - 1]
    if (last && last.pack.id === f.pack.id) last.items.push(f)
    else acc.push({ pack: f.pack, items: [f] })
    return acc
  }, [])

  return (
    <PageContainer className="stagger-enter space-y-6 py-6">
      <header className="space-y-3">
        <h1 className="text-2xl tracking-tight">Results</h1>
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="font-mono text-3xl tabular-nums">
            {correct}
            <span className="text-muted-foreground text-lg"> / {flat.length}</span>
          </p>
          <p className="text-muted-foreground text-sm">
            {answered} answered · {flat.length - answered} left blank
          </p>
        </div>
        <Progress value={(correct / flat.length) * 100} />
      </header>

      {timedOut ? (
        <Alert>
          <TimerOff className="size-4" />
          <AlertTitle>Time ran out</AlertTitle>
          <AlertDescription>
            The session was submitted automatically. Anything unanswered is counted as blank.
          </AlertDescription>
        </Alert>
      ) : null}

      {byPack.map(({ pack, items }) => (
        <section key={pack.id} className="space-y-4">
          <h2 className="text-lg tracking-tight">{pack.title}</h2>
          <details className="border-border rounded-xl border">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
              Show the source again
            </summary>
            <div className="px-4 pt-1 pb-4">
              <SourcePackView pack={pack} />
            </div>
          </details>
          {items.map((f) => (
            <ReviewedQuestion key={f.question.id} item={f} chosen={answers[f.question.id]} />
          ))}
        </section>
      ))}

      <Button variant="outline" onClick={onRestart}>
        <RotateCcw className="size-4" />
        Start again
      </Button>
    </PageContainer>
  )
}

function ReviewedQuestion({ item, chosen }: { item: Flat; chosen?: string }) {
  const { question } = item
  const right = chosen === question.correctOptionId
  const [showHints, setShowHints] = useState(false)

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[15px] leading-relaxed">{question.stem}</p>
          <Badge variant="outline" className="shrink-0">
            {chosen ? (right ? 'Correct' : 'Incorrect') : 'Blank'}
          </Badge>
        </div>

        <div className="grid gap-2">
          {question.options.map((option) => (
            <OptionButton
              key={option.id}
              state={
                option.id === question.correctOptionId
                  ? chosen === option.id
                    ? 'correct'
                    : 'missed'
                  : chosen === option.id
                    ? 'incorrect'
                    : 'idle'
              }
              onSelect={() => {}}
              disabled
              label={option.text}
            >
              <span className="text-muted-foreground font-mono text-xs uppercase">{option.id}</span>
              <span className="text-sm">{option.text}</span>
            </OptionButton>
          ))}
        </div>

        <div className="border-border space-y-3 border-t pt-4">
          <p className="text-sm leading-relaxed">{question.explanation}</p>

          {/* Why the chosen answer was wrong, specifically — not just why the
              key is right. Every wrong option carries its own refutation. */}
          {chosen && !right && question.refutations[chosen] ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              <span className="text-foreground font-medium">Why {chosen} is wrong: </span>
              {question.refutations[chosen].reason}
            </p>
          ) : null}

          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span>
              Traced to{' '}
              <span className="font-mono">{question.supportSpans.map((s) => s.blockId).join(', ')}</span>
            </span>
            {question.computation ? (
              <span className="font-mono">{question.computation.expression}</span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setShowHints((v) => !v)}
            className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
          >
            {showHints ? 'Hide the hints' : 'Show the hints for this question'}
          </button>
          {showHints ? (
            <ol className="text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
              {question.hints.map((h) => (
                <li key={h.level}>{h.text}</li>
              ))}
            </ol>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
