/** Midnight-anchored day difference, so a countdown ticks over at the date change. */
export function daysUntil(isoDate: string, now: Date): number {
  const target = new Date(`${isoDate}T00:00:00`)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatShortDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

/** "3 days to go" / "today" — full phrase, for inline use in a list. */
export function countdownLabel(days: number): string {
  if (days > 1) return `${days} days to go`
  if (days === 1) return 'tomorrow'
  if (days === 0) return 'today'
  if (days === -1) return 'yesterday'
  return `${Math.abs(days)} days ago`
}

/**
 * Just the trailing words, for cards that already show the number in large
 * type — otherwise the count reads twice.
 */
export function countdownSuffix(days: number): string {
  if (days > 1) return 'days to go'
  if (days === 1) return 'day to go'
  if (days === 0) return 'today'
  if (days === -1) return 'day ago'
  return 'days ago'
}
