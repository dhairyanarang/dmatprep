'use client'

import { useId, useState } from 'react'
import { Plus } from 'lucide-react'

import type { FaqItem } from '@/content/site/faq'
import { cn } from '@/lib/utils'

/**
 * One FAQ category, as a set of disclosures.
 *
 * Built on `<details>`/`<summary>` rather than a hand-rolled widget. That gets
 * keyboard operation, the correct roles and find-in-page working for free —
 * browsers open a closed `<details>` when the text inside it matches a search,
 * which a div-based accordion silently breaks. On a long reference page people
 * do use find-in-page.
 *
 * The open state is tracked only to animate the marker; the element is the
 * source of truth, so the component stays correct even before hydration.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="border-border border-t">
      {items.map((item) => (
        <Disclosure key={item.id} item={item} />
      ))}
    </div>
  )
}

function Disclosure({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <details
      id={item.id}
      className="border-border group border-b"
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-start gap-4 py-4 pr-1',
          'hover:text-brand transition-colors duration-150',
          'focus-visible:ring-brand rounded-sm focus-visible:ring-2 focus-visible:outline-none',
          '[&::-webkit-details-marker]:hidden',
        )}
        aria-controls={panelId}
      >
        <h3 className="flex-1 text-[15.5px] leading-6 font-medium">{item.q}</h3>
        <Plus
          aria-hidden
          className={cn(
            'text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform duration-200',
            open && 'rotate-45',
            'motion-reduce:transition-none',
          )}
        />
      </summary>
      <div id={panelId} className="panel-reveal pb-5">
        {item.a.map((para, i) => (
          <p key={i} className="text-muted-foreground max-w-[68ch] text-[14.5px] leading-7 [&+&]:mt-3">
            {para}
          </p>
        ))}
        {item.source ? (
          <p className="text-muted-foreground mt-3 font-mono text-[11.5px]">
            Source: {item.source}
          </p>
        ) : null}
      </div>
    </details>
  )
}
