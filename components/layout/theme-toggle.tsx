'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'

import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'dark', label: 'Dark', Icon: Moon },
] as const

/**
 * The stored theme only exists on the client, so reading it during the first
 * render makes the server and client disagree about which segment is checked —
 * a real hydration mismatch, not a cosmetic one. This renders the server's
 * "none checked" state through hydration and swaps on the next tick, the same
 * way `useProgressReady` handles localStorage.
 */
const NEVER_CHANGES = () => () => {}

function useHydrated(): boolean {
  return useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false,
  )
}

/**
 * Segmented rather than a single toggle, so the current choice is visible
 * without having to infer it — and "system" stays reachable.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const hydrated = useHydrated()

  return (
    <div
      className="bg-muted border-border flex items-center gap-1 rounded-md border p-1"
      role="radiogroup"
      aria-label="Colour theme"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = hydrated && theme === value

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
              // Elevation from a border, not a shadow.
              active
                ? 'bg-accent text-foreground border-border border'
                : 'text-muted-foreground hover:text-foreground border border-transparent',
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
