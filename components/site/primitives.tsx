import { cn } from '@/lib/utils'

/**
 * The public site's three layout primitives.
 *
 * Every marketing page is built from these so the rhythm is identical across
 * the landing page, the FAQ and the guides: one measure, one vertical scale,
 * one way of introducing a section. Without them each page drifts into its own
 * spacing and the site stops reading as one product.
 *
 * Separation is by hairline rule and by a faint tint, never by a shadow —
 * which is the rule the application's own surfaces already follow.
 */

export function Section({
  children,
  tinted = false,
  className,
}: {
  children: React.ReactNode
  tinted?: boolean
  className?: string
}) {
  return (
    <section className={cn('border-border border-b', tinted && 'bg-frame/40')}>
      <div className={cn('mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16', className)}>
        {children}
      </div>
    </section>
  )
}

export function SectionHead({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string
  title: string
  lead?: string
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? (
        <p className="text-muted-foreground font-mono text-[12px] tracking-wide uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          'text-[24px] leading-tight font-semibold tracking-tight text-balance sm:text-[28px]',
          eyebrow && 'mt-3',
        )}
      >
        {title}
      </h2>
      {lead ? (
        <p className="text-muted-foreground mt-3 text-[15.5px] leading-7">{lead}</p>
      ) : null}
    </div>
  )
}

/**
 * Body copy at a readable measure.
 *
 * Roughly 68 characters a line. Long-form reading is the whole job of the
 * guides, and a paragraph that runs the full width of a 1,400px screen is the
 * single fastest way to make an article unreadable.
 */
export function Prose({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'prose-site text-[15.5px] leading-7 [&>*+*]:mt-4 [&>h2]:mt-10 [&>h3]:mt-8',
        '[&>h2]:text-[20px] [&>h2]:font-semibold [&>h2]:tracking-tight',
        '[&>h3]:text-[16.5px] [&>h3]:font-semibold [&>h3]:tracking-tight',
        '[&>p]:text-muted-foreground [&>ul]:text-muted-foreground [&>ol]:text-muted-foreground',
        '[&>ul]:flex [&>ul]:list-disc [&>ul]:flex-col [&>ul]:gap-2 [&>ul]:pl-5',
        '[&>ol]:flex [&>ol]:list-decimal [&>ol]:flex-col [&>ol]:gap-2 [&>ol]:pl-5',
        'max-w-[68ch]',
        className,
      )}
    >
      {children}
    </div>
  )
}
