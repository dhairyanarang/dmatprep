'use client'

import { ArrowUpRight, Star } from 'lucide-react'

import { CATEGORY_LABEL, latestUpdate } from '@/content/exam/updates'
import { formatDate } from '@/lib/dates/countdown'
import { useToday } from '@/lib/dates/use-today'

/**
 * The one filled surface on About the Exam: what changed, when, and where to
 * verify it.
 *
 * A discovery surface, not an article. Three lines and a link out to the
 * official document — anything longer belongs at the source, where it can be
 * read in full and in context.
 *
 * When there is nothing new it says so plainly. A placeholder update would be
 * indistinguishable from a real one at a glance, which is precisely the failure
 * mode this product cannot afford.
 */
export function LatestUpdate() {
  const today = useToday()
  const update = latestUpdate(today)

  if (!update) {
    return (
      <section
        aria-label="Latest dMAT updates"
        className="border-border bg-surface-muted flex flex-col gap-1.5 rounded-2xl border p-5"
      >
        <p className="text-eyebrow text-muted-foreground">Latest dMAT updates</p>
        <p className="text-sm font-medium">No new official updates.</p>
        <p className="text-muted-foreground text-sm">
          Registration and exam dates are on{' '}
          <span className="text-foreground">Dates and Logistics</span>, with the source behind
          every claim.
        </p>
      </section>
    )
  }

  return (
    <section
      aria-label="Latest dMAT updates"
      className="bg-brand relative overflow-hidden rounded-2xl p-5"
    >
      <div className="relative flex flex-col gap-5">
        <p className="text-eyebrow flex items-center gap-2 text-white">
          <Star className="size-5 shrink-0" aria-hidden />
          Latest dMAT updates
        </p>

        {/* Nowrap from `sm`: the design keeps the action on the row with the
            headline, and a long summary should take the space it needs rather
            than pushing the button onto a line of its own. */}
        <div className="flex flex-wrap items-end justify-between gap-4 sm:flex-nowrap">
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="text-base leading-tight font-semibold text-balance text-white">
              {update.title}
            </h2>
            <p className="text-sm leading-tight font-medium text-white/60">{update.summary}</p>
            <p className="text-xs font-medium text-white/60">
              {formatDate(update.publishedAt)} · {update.sourceName} ·{' '}
              {CATEGORY_LABEL[update.category]}
            </p>
          </div>

          <a
            href={update.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-brand-cta text-brand-cta-foreground hover:bg-brand-cta/90 flex h-8 shrink-0 items-center gap-2.5 rounded-full px-3 text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <ArrowUpRight className="size-4" aria-hidden />
            Read at the source
          </a>
        </div>
      </div>
    </section>
  )
}
