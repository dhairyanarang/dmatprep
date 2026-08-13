import type { ReactNode } from 'react'

/**
 * A section label with an optional fact on the right — "Module A · 45 questions
 * each". Both sit at 14px; the meta is muted so the label still leads.
 */
export function SectionHeading({
  title,
  meta,
  note,
  children,
}: {
  title: string
  meta?: ReactNode
  /** Second line under the label, e.g. "2 questions to revisit." */
  note?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">{title}</h2>
          {note ? <p className="text-muted-foreground text-sm font-medium">{note}</p> : null}
        </div>
        {meta ? <span className="text-muted-foreground text-sm">{meta}</span> : null}
      </div>
      {children}
    </section>
  )
}
