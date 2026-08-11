import { DIFFICULTY_LABEL, type Difficulty } from '@/lib/types/question'
import { cn } from '@/lib/utils'

/** Tinted rather than outlined — reads as a property of the question, not a control. */
const TONE: Record<Difficulty, string> = {
  low: 'bg-success-tint text-success-fg',
  medium: 'bg-warning-tint text-warning-fg',
  high: 'bg-danger-tint text-danger-fg',
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded px-2 text-xs font-medium',
        TONE[difficulty],
      )}
    >
      {DIFFICULTY_LABEL[difficulty]}
    </span>
  )
}
