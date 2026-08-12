'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * The primary action stays reachable no matter how long the hint or the
 * walkthrough gets.
 *
 * Sticky rather than fixed: fixed positioning takes the bar out of the page and
 * on mobile it ends up fighting the browser chrome and covering the last option.
 * Sticky keeps it inside the one scrolling context the page already has, so it
 * sits at the bottom of the viewport while content scrolls behind it and settles
 * naturally at the end of the page when the content is short.
 *
 * The negative margins let the background bleed to the column edges, so content
 * scrolling underneath is covered rather than showing through beside the bar.
 */
export function PracticeActionBar({
  secondary,
  primary,
  className,
}: {
  secondary?: ReactNode
  primary: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky bottom-0 z-20',
        '-mx-4 border-t px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8',
        className,
      )}
    >
      {/* Stacked on phones so the primary action gets a full-width touch target
          and never has its label truncated by a long helper string. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 empty:hidden">{secondary}</div>
        <div className="flex shrink-0 items-center gap-2 [&>button]:flex-1 sm:[&>button]:flex-none">
          {primary}
        </div>
      </div>
    </div>
  )
}
