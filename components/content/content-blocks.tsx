import { AlertTriangle, HelpCircle, Info } from 'lucide-react'

import { ConfidenceBadge, SourceCitation } from '@/components/content/source-ref'
import { WorkedExample } from '@/components/content/worked-example'
import { getQuestion } from '@/lib/content/registry'
import type { SectionId } from '@/lib/sections'
import type { ContentBlock } from '@/lib/types/content'
import { cn } from '@/lib/utils'

const CALLOUT_STYLE = {
  note: 'border-border bg-muted/40',
  warning: 'border-amber-600/40 bg-amber-50/60 dark:bg-amber-950/20',
  unconfirmed: 'border-rose-600/40 bg-rose-50/60 dark:bg-rose-950/20',
} as const

const CALLOUT_ICON = {
  note: Info,
  warning: AlertTriangle,
  unconfirmed: HelpCircle,
} as const

export function ContentBlocks({
  blocks,
  sectionId,
}: {
  blocks: ContentBlock[]
  /** Needed to resolve `example` blocks against the right question bank. */
  sectionId?: SectionId
}) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <Block key={i} block={block} sectionId={sectionId} />
      ))}
    </div>
  )
}

function Block({ block, sectionId }: { block: ContentBlock; sectionId?: SectionId }) {
  switch (block.type) {
    case 'heading':
      return <h2 className="pt-2 text-lg font-semibold tracking-tight">{block.text}</h2>

    case 'prose':
      return (
        <div>
          <p className="text-sm leading-relaxed text-pretty">
            {block.text}
            <SourceCitation sources={block.sources} />
          </p>
          <ConfidenceBadge confidence={block.confidence} note={block.note} />
        </div>
      )

    case 'rules':
      return (
        <div className="space-y-2">
          {block.title ? <h3 className="text-sm font-medium">{block.title}</h3> : null}
          <ul className="space-y-2.5">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                <span className="bg-muted-foreground/50 mt-[0.55rem] h-1 w-1 shrink-0 rounded-full" />
                <span>
                  {item.text}
                  <SourceCitation sources={item.sources} />
                  <ConfidenceBadge confidence={item.confidence} note={item.note} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )

    case 'steps':
      return (
        <div className="space-y-2">
          {block.title ? <h3 className="text-sm font-medium">{block.title}</h3> : null}
          <ol className="space-y-2.5">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="bg-muted text-muted-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  {i + 1}
                </span>
                <span className="pt-px">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )

    case 'callout': {
      const Icon = CALLOUT_ICON[block.variant]
      return (
        <div className={cn('flex gap-3 rounded-lg border p-4', CALLOUT_STYLE[block.variant])}>
          <Icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="space-y-1">
            {block.title ? <p className="text-sm font-medium">{block.title}</p> : null}
            <p className="text-muted-foreground text-sm leading-relaxed">{block.text}</p>
          </div>
        </div>
      )
    }

    case 'quote':
      return (
        <blockquote className="border-l-2 py-1 pl-4">
          <p className="text-sm leading-relaxed italic">“{block.text}”</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Official wording
            <SourceCitation sources={block.sources} />
          </p>
        </blockquote>
      )

    case 'example': {
      const question = sectionId ? getQuestion(sectionId, block.questionId) : undefined
      if (!question) return null
      return <WorkedExample question={question} caption={block.caption} />
    }
  }
}
