'use client'

import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'
import { DIFFICULTIES, type Difficulty } from '@/lib/types/question'

export type StatusFilter = 'all' | 'todo' | 'missed' | 'saved'
export type DifficultyFilter = Difficulty | 'all'

export type DotState = 'todo' | 'right' | 'wrong' | 'locked'

/** Shown in each dot's label, since the navigator carries no colour for it. */
export type DotInfo = {
  id: string
  state: DotState
  difficulty?: string
  /** Bookmarked questions carry a pip, so the list shows them without a filter. */
  bookmarked?: boolean
}

/**
 * The practice bar: where you are in the set, and what you are looking at.
 *
 * Sticky under the top bar, because on a page that is one long column of
 * questions the count and the way back to an unanswered one have to stay
 * reachable however far down you have scrolled.
 *
 * The dots are the navigator. Green, red or plain says what happened without
 * a legend, and a click goes there — which is the only way to move around a
 * hundred questions without a scrollbar and a good memory.
 */
export function PracticeBar({
  ref,
  dots,
  current,
  answered,
  correct,
  total,
  status,
  onStatus,
  difficulty,
  onDifficulty,
  showDifficulty = true,
  onJump,
}: {
  /**
   * The runner measures this bar's height to position the hint sidebar
   * directly beneath it. It must land on the bar's own root: wrapping the bar
   * in a measurable div gives the sticky element a parent box exactly its own
   * size, and a sticky element with no room to travel scrolls away.
   */
  ref?: React.Ref<HTMLDivElement>
  dots: DotInfo[]
  /** The question the sidebar is showing, ringed in the navigator. */
  current: string | null
  answered: number
  correct: number
  total: number
  status: StatusFilter
  onStatus: (value: StatusFilter) => void
  difficulty: DifficultyFilter
  onDifficulty: (value: DifficultyFilter) => void
  showDifficulty?: boolean
  onJump: (id: string) => void
}) {
  const strip = useRef<HTMLElement>(null)

  /**
   * Scroll the selected question into view when it changes.
   *
   * `block: 'nearest'` and `inline: 'nearest'` so a dot already on screen does
   * not move, and the page itself is never scrolled by this — only the strip.
   */
  useEffect(() => {
    if (!current) return
    const dot = strip.current?.querySelector(`[data-dot="${CSS.escape(current)}"]`)
    dot?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [current])

  return (
    <div
      ref={ref}
      className="bg-background/95 supports-[backdrop-filter]:bg-background/85 border-soft sticky top-13 z-15 -mx-4 flex flex-wrap items-center gap-x-4 gap-y-2.5 border-b px-4 py-2.5 backdrop-blur sm:-mx-8 sm:px-8"
    >
      {/*
        One row that scrolls sideways, not a block that wraps.
        
        The prototype wraps its navigator, but it is showing ten questions.
        Eighty-seven wrapped into four rows and ate most of the screen above
        the first question, so the row scrolls instead. The dot itself keeps
        the prototype's `.qdot` — 28px, 7px radius, mono 12 — and the status
        colours are unchanged.
      */}
      <nav
        ref={strip}
        aria-label="Jump to question"
        className="scrollbar-thin flex min-w-0 flex-1 gap-1 overflow-x-auto overflow-y-hidden py-0.5"
      >
        {dots.map((dot, i) => (
          <button
            key={dot.id}
            type="button"
            data-dot={dot.id}
            onClick={() => onJump(dot.id)}
            aria-current={dot.id === current ? 'true' : undefined}
            // Difficulty is in the label rather than the colour on purpose: the
            // prototype's navigator encodes status and nothing else, and a
            // second colour axis in a 28px square would make neither readable.
            // The difficulty chips filter it; the card's badge shows it.
            title={`Question ${i + 1}${dot.difficulty ? ` · ${dot.difficulty}` : ''}`}
            aria-label={`Question ${i + 1}, ${
              dot.state === 'locked' ? 'locked' : dot.state === 'todo' ? 'not answered' : dot.state
            }${dot.difficulty ? `, ${dot.difficulty}` : ''}${
              dot.id === current ? ', selected' : ''
            }`}
            className={cn(
              'size-7 shrink-0 rounded-[7px] border font-mono text-xs transition-colors',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              dot.state === 'right' && 'border-success bg-success text-white',
              dot.state === 'wrong' && 'border-danger bg-danger text-white',
              dot.state === 'locked' && 'border-gold-line bg-gold-soft text-gold-text',
              dot.state === 'todo' && 'border-line2 bg-card hover:border-foreground',
              'relative shrink-0',
              // The prototype's `.qdot.cur`:
              //   box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--blue)
              dot.id === current && 'ring-background ring-offset-brand ring-2 ring-offset-2',
            )}
          >
            {i + 1}
            {dot.bookmarked ? (
              <span
                aria-hidden
                className="bg-brand ring-background absolute -top-0.5 -right-0.5 size-1.5 rounded-full ring-2"
              />
            ) : null}
          </button>
        ))}
      </nav>

      <div className="text-muted-foreground flex items-center gap-3 text-xs whitespace-nowrap">
        <span>
          <b className="text-foreground font-mono font-medium tabular-nums">{answered}</b> of{' '}
          {total} answered
        </span>
        {answered > 0 ? <span className="text-success-fg">{correct} correct</span> : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chips
          label="Show"
          value={status}
          onChange={onStatus}
          options={[
            ['all', 'All'],
            ['todo', 'To do'],
            ['missed', 'Missed'],
            ['saved', 'Bookmarked'],
          ]}
        />
        {showDifficulty ? (
          <Chips
            label="Difficulty"
            value={difficulty}
            onChange={onDifficulty}
            options={[
              ['all', 'Any'],
              ...DIFFICULTIES.map((d) => [d, d[0].toUpperCase() + d.slice(1)] as const),
            ]}
          />
        ) : null}
      </div>
    </div>
  )
}

function Chips<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (next: T) => void
  options: readonly (readonly [T, string])[]
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-1">
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={cn(
            'h-7 rounded-full border px-2.5 text-xs font-medium transition-colors',
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
            value === key
              ? 'border-foreground bg-foreground text-background'
              : 'border-line2 bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground',
          )}
        >
          {text}
        </button>
      ))}
    </div>
  )
}
