'use client'

import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'

import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'dark', label: 'Dark', Icon: Moon },
] as const

/**
 * Segmented rather than a single toggle, so the current choice is visible
 * without having to infer it — and "system" stays reachable.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className="bg-muted/60 flex items-center gap-0.5 rounded-lg p-1"
      role="radiogroup"
      aria-label="Colour theme"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              'flex h-6 flex-1 items-center justify-center rounded-md transition-colors',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
              active
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
