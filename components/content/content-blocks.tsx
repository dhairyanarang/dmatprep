import { AlertTriangle, HelpCircle, Info } from 'lucide-react'

import { ConfidenceBadge } from '@/components/content/source-ref'
import { WorkedExample } from '@/components/content/worked-example'
import { DIAGRAMS } from '@/components/exam/diagrams'
import { Stat } from '@/components/exam/visuals'
import { getQuestion } from '@/lib/content/registry'
import type { SectionId } from '@/lib/sections'
import type { ContentBlock } from '@/lib/types/content'
import { cn } from '@/lib/utils'

const CALLOUT_STYLE = {
  note: 'border-border bg-muted/50',
  warning: 'border-warning/35 bg-warning-tint/50',
  unconfirmed: 'border-danger/35 bg-danger-tint/50',
} as const

const CALLOUT_ICON_TONE = {
  note: 'text-muted-foreground',
  warning: 'text-warning-fg',
  unconfirmed: 'text-danger-fg',
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

    case 'stats':
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          {block.items.map((s) => (
            <Stat key={s.label} value={s.value} unit={s.unit} label={s.label} />
          ))}
        </div>
      )

    case 'diagram': {
      const Diagram = DIAGRAMS[block.kind]
      return (
        <div className="space-y-3">
          {block.title ? <h3 className="text-sm font-medium">{block.title}</h3> : null}
          {block.description ? (
            <p className="text-muted-foreground text-sm leading-relaxed">{block.description}</p>
          ) : null}
          <Diagram />
        </div>
      )
    }

    case 'cards':
      return (
        <div className="space-y-3">
          {block.title ? <h3 className="text-sm font-medium">{block.title}</h3> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {block.items.map((c) => (
              <div key={c.title} className="border-border bg-card rounded-xl border p-4">
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'tips': {
      const isMistake = block.variant === 'mistake'
      return (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-base font-semibold tracking-tight">{block.title}</h2>
            <span className="text-muted-foreground text-xs tabular-nums">
              {block.items.length}
            </span>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {block.items.map((tip, i) => (
              <li
                key={tip.title}
                className={cn(
                  'rounded-xl border p-4',
                  isMistake ? 'border-danger/25 bg-danger-tint/25' : 'border-border bg-card',
                )}
              >
                <div className="flex items-start gap-2.5">
                  {isMistake ? (
                    <AlertTriangle className="text-danger-fg mt-0.5 size-4 shrink-0" aria-hidden />
                  ) : (
                    <span
                      aria-hidden
                      className="border-border bg-accent text-foreground flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums"
                    >
                      {i + 1}
                    </span>
                  )}
                  <h3 className="text-sm font-medium">{tip.title}</h3>
                </div>
                <p className="text-muted-foreground mt-2.5 text-sm leading-relaxed">{tip.body}</p>
              </li>
            ))}
          </ol>
        </section>
      )
    }

    case 'prose':
      return (
        <div>
          <p className="text-sm leading-relaxed text-pretty">
            {block.text}
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
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span
                  aria-hidden
                  className="bg-muted-foreground/40 mt-2 size-1 shrink-0 rounded-full"
                />
                <span>
                  {item.text}
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
                {/* Acid lime on a 10% lime wash was close to unreadable. The
                    step index is structure, not accent — it takes neutral. */}
                <span
                  aria-hidden
                  className="border-border bg-accent text-foreground flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums"
                >
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )

    case 'callout': {
      const Icon = CALLOUT_ICON[block.variant]
      return (
        <div className={cn('flex gap-3 rounded-xl border p-4', CALLOUT_STYLE[block.variant])}>
          <Icon
            className={cn('mt-px size-4 shrink-0', CALLOUT_ICON_TONE[block.variant])}
            aria-hidden
          />
          <div className="space-y-1">
            {block.title ? <p className="text-sm font-medium">{block.title}</p> : null}
            <p className="text-muted-foreground text-sm leading-relaxed">{block.text}</p>
          </div>
        </div>
      )
    }

    case 'quote':
      return (
        <blockquote className="border-primary/30 bg-muted/30 rounded-r-lg border-l-2 py-3 pr-4 pl-4">
          <p className="text-sm leading-relaxed">{block.text}</p>
          <p className="text-muted-foreground mt-2 text-xs">
            Official wording
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
