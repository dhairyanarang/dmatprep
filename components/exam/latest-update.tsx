'use client'

import { ArrowUpRight } from 'lucide-react'

import { CATEGORY_LABEL, latestUpdate } from '@/content/exam/updates'
import { formatDate } from '@/lib/dates/countdown'
import { useToday } from '@/lib/dates/use-today'

/**
 * What changed about the exam, when, and where to verify it.
 *
 * It used to be a large filled blue panel — the loudest thing on a page whose
 * job is reference. An update is worth noticing, not worth shouting: it is a
 * panel like every other now, and reads as part of the page rather than an
 * announcement pasted over it.
 *
 * Three lines and a link out to the official document. Anything longer belongs
 * at the source, where it can be read in full and in context.
 *
 * When there is nothing new it says so plainly. A placeholder update would be
 * indistinguishable from a real one at a glance, which is precisely the failure
 * mode this product cannot afford.
 */
export function LatestUpdate() {
  const today = useToday()
  const update = latestUpdate(today)

  return (
    <section aria-label="Latest dMAT updates" className="panel">
      <div className="panel-h">
        <h2 className="ptitle">Latest dMAT updates</h2>
        {update ? (
          <span className="text-muted-foreground text-xs">
            {formatDate(update.publishedAt)}
          </span>
        ) : null}
      </div>

      {update ? (
        <div className="surface flex flex-wrap items-end justify-between gap-4 p-4 sm:flex-nowrap">
          <div className="min-w-0 flex-1 space-y-1.5">
            <h3 className="text-sm leading-5 font-semibold text-balance">{update.title}</h3>
            <p className="text-muted-foreground text-[13px] leading-[19px]">{update.summary}</p>
            <p className="text-muted-foreground text-xs">
              {update.sourceName} · {CATEGORY_LABEL[update.category]}
            </p>
          </div>

          <a
            href={update.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="border-border bg-card hover:bg-frame focus-visible:ring-ring flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <ArrowUpRight className="size-4" aria-hidden />
            Read at the source
          </a>
        </div>
      ) : (
        <div className="surface flex flex-col gap-1.5 p-4">
          <p className="text-sm font-medium">No new official updates.</p>
          <p className="text-muted-foreground text-[13px] leading-[19px]">
            Registration and exam dates are on{' '}
            <span className="text-foreground">Dates &amp; logistics</span>, with the source behind
            every claim.
          </p>
        </div>
      )}
    </section>
  )
}
