import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * The one container that decides horizontal alignment, everywhere.
 *
 * 32px gutters, 16 on mobile, and a cap that only bites on very wide screens —
 * the design runs the content area edge to edge beside the sidebar, and a
 * dashboard with a fourteen-day chart needs that room. Pages that read better
 * narrow constrain their *content* inside this with `ReadingMeasure`, which
 * keeps the left edge and the gutters fixed while the line length changes.
 */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1280px] px-4 sm:px-8', className)}>{children}</div>
  )
}

/**
 * Standard page frame: the design's `.page` — 24px above, 48 below, and a
 * 20px rhythm between sections.
 *
 * `title` renders the page's `<h1>` *in the page*, which is where the design
 * puts it. It used to be the breadcrumb's last segment, on the grounds that
 * one heading cannot disagree with itself — but a 14px bold crumb is not a
 * page heading, and every screen opened with no visible title at all. The
 * breadcrumb still carries the same words, so they still cannot disagree; it
 * simply is not pretending to be the heading any more.
 */
export function PageShell({
  title,
  eyebrow,
  description,
  actions,
  wide = false,
  children,
}: {
  title?: ReactNode
  /** Mono label above the heading, e.g. "CORE MOCK · 16 NOVEMBER". */
  eyebrow?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** Full container width for grid-heavy pages; otherwise a reading measure. */
  wide?: boolean
  children?: ReactNode
}) {
  return (
    /**
     * `stagger-enter` is on the container so the page's own sections arrive in
     * order — the same entry Home has had, now shared by every page built on
     * this shell rather than copied onto one of them. It is honoured by the
     * global reduced-motion rule in `app/globals.css`.
     */
    <PageContainer className="stagger-enter flex flex-1 flex-col gap-5 pt-6 pb-12">
      {title || description || actions ? (
        <PageHead title={title} eyebrow={eyebrow} description={description} actions={actions} wide={wide} />
      ) : null}

      {/* A wide page's sections are direct children, so each one takes its own
          step of the stagger. A reading page is one block at one measure, and
          one block is the right thing for it to arrive as. */}
      {wide ? children : <div className="flex max-w-3xl flex-col gap-5">{children}</div>}
    </PageContainer>
  )
}

/**
 * The heading block: an optional eyebrow, the `<h1>`, a line of description,
 * and page-level actions pushed to the right and baseline-aligned with it.
 */
export function PageHead({
  title,
  eyebrow,
  description,
  actions,
  wide = true,
}: {
  title?: ReactNode
  eyebrow?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  wide?: boolean
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className={cn('min-w-0', !wide && 'max-w-3xl')}>
        {eyebrow ? <p className="over mb-1.5">{eyebrow}</p> : null}
        {title ? (
          <h1 className="text-2xl leading-8 font-semibold tracking-[-0.015em]">{title}</h1>
        ) : null}
        {description ? (
          <div className="text-muted-foreground mt-1 text-sm leading-5 text-pretty">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

/**
 * The reading measure, applied *inside* a full-width shell.
 *
 * A runner's chrome — the stage header, the clock, the jump strip, the action
 * bar — belongs on the page's own left and right edges, the same ones every
 * other route uses. Only the question itself wants a shorter line, so the
 * constraint goes here rather than on the page container. Narrowing the whole
 * page is what made the mock sit 100px inside every other screen.
 */
export function ReadingMeasure({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('mx-auto w-full max-w-3xl', className)}>{children}</div>
}

/** Placeholder for routes whose content lands in a later phase. */
export function ComingSoon({ note }: { note: string }) {
  return (
    <div className="text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm">
      {note}
    </div>
  )
}

/**
 * A framed section: the design's `.panel`, with its mono header and an inset
 * white surface. The signature container of the whole system.
 */
export function Panel({
  title,
  meta,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode
  meta?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn('panel', className)}>
      {title || meta ? (
        <div className="panel-h">
          {typeof title === 'string' ? <h2 className="ptitle">{title}</h2> : title}
          {meta ? <span className="text-muted-foreground text-xs">{meta}</span> : null}
        </div>
      ) : null}
      <div className={cn('surface flex min-w-0 flex-1 flex-col', bodyClassName)}>{children}</div>
    </section>
  )
}
