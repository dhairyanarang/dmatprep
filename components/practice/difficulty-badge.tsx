import { Badge } from '@/components/ui/badge'
import { DIFFICULTY_LABEL, type Difficulty } from '@/lib/types/question'
import { cn } from '@/lib/utils'

const TONE: Record<Difficulty, string> = {
  low: 'border-emerald-600/30 text-emerald-700 dark:text-emerald-400',
  medium: 'border-amber-600/30 text-amber-700 dark:text-amber-400',
  high: 'border-rose-600/30 text-rose-700 dark:text-rose-400',
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Badge variant="outline" className={cn('font-medium', TONE[difficulty])}>
      {DIFFICULTY_LABEL[difficulty]}
    </Badge>
  )
}
