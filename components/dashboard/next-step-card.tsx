import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Star } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * The one filled surface in the product: brand teal, a decorative pattern
 * fading out to the right, and a green pill for the action.
 *
 * Kept generic rather than Home-only — it is the shape any "here is the single
 * thing to do next" prompt should take, wherever it appears.
 */
export function NextStepCard({
  eyebrow = 'Recommended next step',
  title,
  description,
  action,
  href,
  children,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  /** CTA label. Omit along with `href` to render a prompt with no action. */
  action?: string
  href?: string
  /** Replaces the CTA entirely, for prompts that need more than one control. */
  children?: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn('bg-brand relative overflow-hidden rounded-2xl p-5', className)}
      aria-label={eyebrow}
    >
      {/* Decorative only: the gradient dissolves it into the surface so the text
          never sits on top of the busy part of the pattern. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 -right-16 w-[451px]">
        <Image
          src="/brand/next-step-pattern.png"
          alt=""
          fill
          sizes="451px"
          className="object-cover opacity-25"
          priority={false}
        />
        <div className="from-brand absolute inset-0 bg-gradient-to-l from-40% to-transparent" />
      </div>

      <div className="relative flex flex-col gap-5">
        <p className="text-eyebrow flex items-center gap-2 text-white">
          <Star className="size-5 shrink-0" aria-hidden />
          {eyebrow}
        </p>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <h2 className="text-base leading-tight font-semibold text-white">{title}</h2>
            {description ? (
              <p className="text-sm leading-tight font-medium text-white/60">{description}</p>
            ) : null}
          </div>

          {children ??
            (action && href ? (
              <Link
                href={href}
                className={cn(
                  'bg-brand-cta text-brand-cta-foreground flex h-8 shrink-0 items-center gap-2.5 rounded-full px-3 text-xs font-medium',
                  'hover:bg-brand-cta/90 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
                )}
              >
                <ArrowUpRight className="size-4" aria-hidden />
                {action}
              </Link>
            ) : null)}
        </div>
      </div>
    </section>
  )
}
