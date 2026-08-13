'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CornerDownLeft, Search, X } from 'lucide-react'

import { searchEntries, type SearchEntry, type SearchGroup } from '@/lib/search/entries'
import { cn } from '@/lib/utils'

/**
 * Global search, as a command palette.
 *
 * Built on the native `<dialog>` element: `showModal()` gives focus trapping,
 * Escape-to-close, the top layer and an inert background for free, all of which
 * a hand-rolled overlay has to reimplement and usually gets wrong. Focus
 * returning to the trigger on close is also native.
 *
 * It navigates. It does not search the question bank — see `lib/search/entries`.
 */
const GROUP_ORDER: SearchGroup[] = ['Go to', 'Prepare', 'Test', 'The exam', 'In the guides']

const STARTERS: { label: string; query: string }[] = [
  { label: 'Latin Squares', query: 'latin squares' },
  { label: 'Scoring', query: 'scoring' },
  { label: 'Exam-day rules', query: 'rules' },
  { label: 'Timed practice', query: 'timed' },
]

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const results = useMemo(() => searchEntries(query), [query])

  // Drive the native dialog from the `open` prop.
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      inputRef.current?.focus()
    } else if (!open && el.open) {
      el.close()
    }
  }, [open])

  // `close` fires for Escape and for backdrop dismissal alike, so the parent
  // state is reconciled in one place rather than at every call site.
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const handleClose = () => {
      setQuery('')
      setActive(0)
      onClose()
    }
    el.addEventListener('close', handleClose)
    return () => el.removeEventListener('close', handleClose)
  }, [onClose])

  const go = useCallback(
    (entry: SearchEntry) => {
      dialogRef.current?.close()
      router.push(entry.href)
    },
    [router],
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    const ordered = GROUP_ORDER.flatMap((group) => results.filter((r) => r.group === group))
    if (ordered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % ordered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + ordered.length) % ordered.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const entry = ordered[active]
      if (entry) go(entry)
    }
  }

  // Keyboard order must follow the *displayed* order, not the score order, so
  // the flattened list is derived first and grouping reads its index from it.
  const ordered = GROUP_ORDER.flatMap((group) => results.filter((r) => r.group === group))
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: results.filter((r) => r.group === group),
  })).filter((g) => g.items.length > 0)

  return (
    <dialog
      ref={dialogRef}
      aria-label="Search dMAT Prep"
      // Backdrop and positioning: the element is centred in the viewport rather
      // than anchored to the trigger, so it reads as a product-wide surface.
      className={cn(
        'bg-card border-border m-0 w-[calc(100vw-2rem)] max-w-xl rounded-2xl border p-0 shadow-lg',
        'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'backdrop:bg-foreground/20 backdrop:backdrop-blur-[2px]',
      )}
      onClick={(e) => {
        // Clicking the backdrop (the dialog element itself) dismisses.
        if (e.target === dialogRef.current) dialogRef.current?.close()
      }}
    >
      <div className="border-border flex items-center gap-2 border-b px-4 py-3">
        <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
        <input
          ref={inputRef}
          // Not type="search": browsers bind Escape to clearing that input, which
          // swallows the key before the dialog can close on it.
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Search dMAT Prep"
          aria-label="Search dMAT Prep"
          aria-controls="search-results"
          className="placeholder:text-muted-foreground flex-1 bg-transparent text-sm outline-none"
        />
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close search"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-md p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div id="search-results" className="max-h-[60vh] overflow-y-auto p-2">
        {query.trim() === '' ? (
          <div className="px-2 py-3">
            <p className="text-muted-foreground text-xs">Try</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {STARTERS.map((s) => (
                <button
                  key={s.query}
                  type="button"
                  onClick={() => {
                    setQuery(s.query)
                    inputRef.current?.focus()
                  }}
                  className="border-border hover:bg-muted focus-visible:ring-ring rounded-md border px-2 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <p className="text-muted-foreground px-2 py-6 text-center text-sm">
            Nothing matches “{query.trim()}”.
          </p>
        ) : (
          <ul role="listbox" aria-label="Search results" className="flex flex-col gap-0.5">
            {grouped.map(({ group, items }) => (
              <li key={group}>
                <p className="text-muted-foreground px-2 pt-2 pb-1 text-xs font-medium">{group}</p>
                <ul className="flex flex-col gap-0.5">
                  {items.map((entry) => {
                    const index = ordered.indexOf(entry)
                    const isActive = index === active
                    return (
                      <li key={entry.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => go(entry)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors',
                            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                            isActive ? 'bg-muted' : 'hover:bg-muted/60',
                          )}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{entry.title}</span>
                            {entry.description ? (
                              <span className="text-muted-foreground block truncate text-xs">
                                {entry.description}
                              </span>
                            ) : null}
                          </span>
                          {/* Not colour alone: the active row also shows the key
                              that will open it. */}
                          {isActive ? (
                            <CornerDownLeft
                              className="text-muted-foreground size-3.5 shrink-0"
                              aria-hidden
                            />
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </dialog>
  )
}
