import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

import { PageShell } from '@/components/layout/page-shell'
import { Badge } from '@/components/ui/badge'
import { SOURCES, type SourceId } from '@/content/exam/sources'
import { buildLedger } from '@/lib/content/ledger'

export const metadata = { title: 'Sources' }

export default function ExamSourcesPage() {
  const { bySource, flagged } = buildLedger()

  return (
    <PageShell
      title="Sources"
      description="Every factual claim in this hub traces to an official g.a.s.t. or APS India document. This page is generated from the content itself, so it cannot drift out of date."
    >
      <div className="space-y-10">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              What is not officially confirmed
            </h2>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              The dMAT is new and thinly documented. These claims are either inferred from official
              sources or unconfirmed, and are marked as such wherever they appear. Nothing here is
              presented as an official rule.
            </p>
          </div>

          {flagged.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Every claim currently traces to an explicit official statement.
            </p>
          ) : (
            <ul className="space-y-3">
              {flagged.map((entry, i) => (
                <li key={i} className="rounded-lg border border-amber-600/30 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        entry.confidence === 'unconfirmed'
                          ? 'border-rose-600/40 text-rose-700 dark:text-rose-400'
                          : 'border-amber-600/40 text-amber-700 dark:text-amber-400'
                      }
                    >
                      {entry.confidence === 'unconfirmed' ? 'Unconfirmed' : 'Inferred'}
                    </Badge>
                    <Link
                      href={entry.href}
                      className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
                    >
                      {entry.where}
                    </Link>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed">{entry.text}</p>
                  {entry.note ? (
                    <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                      {entry.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Official documents</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              Only g.a.s.t. and APS India are cited. Third-party dMAT guides are excluded
              deliberately — several circulating ones contain wrong item counts and incomplete topic
              lists.
            </p>
          </div>

          <ul className="space-y-4">
            {(Object.keys(SOURCES) as SourceId[]).map((id) => {
              const source = SOURCES[id]
              const claims = bySource.get(id) ?? []

              return (
                <li key={id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-medium">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 underline underline-offset-4"
                      >
                        {source.title}
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    </h3>
                    <span className="text-muted-foreground text-xs">
                      {source.publisher}
                      {source.asAt ? ` · ${source.asAt}` : ''}
                    </span>
                  </div>

                  {source.note ? (
                    <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                      {source.note}
                    </p>
                  ) : null}

                  <p className="text-muted-foreground mt-2 text-xs">
                    {claims.length} claim{claims.length === 1 ? '' : 's'} cite this document.
                  </p>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">Re-checking a claim</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            g.a.s.t. re-dates the preparatory materials PDF whenever it updates them, so its URL
            changes and old links go stale. The version everything here was checked against is dated
            4 August 2026 and is linked from the India page rather than the English preparation page.
            The repository includes a script that reads these PDFs correctly — they use subset font
            encodings that defeat ordinary text extraction.
          </p>
        </section>
      </div>
    </PageShell>
  )
}
