import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { GUIDES } from '@/content/site/guides'
import { canonical, social } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'dMAT preparation guides',
  description:
    'Guides to preparing for the dMAT in Germany: the exam pattern with sourced figures, and how to work through Latin Squares, Figure Sequences and Mathematical Equations without notes.',
  alternates: { canonical: canonical('/guides') },
  ...social({
    title: 'dMAT preparation guides',
    description:
      'How the examination is structured, and how to work through each Core subtest when nothing may be written down.',
    path: '/guides',
  }),
}

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

export default function GuidesIndexPage() {
  return (
    <>
      <div className="border-border border-b">
        <div className="mx-auto w-full max-w-6xl px-4 pt-14 pb-10 sm:px-6 sm:pt-16">
          <p className="text-muted-foreground font-mono text-[12px] tracking-wide uppercase">
            {GUIDES.length} guides
          </p>
          <h1 className="mt-3 max-w-3xl text-[30px] leading-tight font-semibold tracking-tight text-balance sm:text-[38px]">
            Preparation guides
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-[15.5px] leading-7">
            Written for an examination that has been sat once, where most of what is published
            online is the same few facts rewritten — and some of it is wrong. Each guide names
            its sources and says plainly where the evidence runs out.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <ul className="border-border border-t">
          {GUIDES.map((g) => (
            <li key={g.slug} className="border-border border-b">
              <Link
                href={`/guides/${g.slug}`}
                className="group hover:bg-frame/50 -mx-4 flex flex-col gap-2 px-4 py-7 transition-colors duration-150 sm:-mx-6 sm:px-6"
              >
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11.5px] tracking-wide uppercase">
                  <span className="text-brand">{g.topic}</span>
                  <span aria-hidden>·</span>
                  <span>{g.minutes} min read</span>
                  <span aria-hidden>·</span>
                  <time dateTime={g.updated}>{longDate(g.updated)}</time>
                </div>
                <h2 className="group-hover:text-brand max-w-3xl text-[19px] leading-snug font-semibold tracking-tight transition-colors duration-150 sm:text-[21px]">
                  {g.title}
                </h2>
                <p className="text-muted-foreground max-w-2xl text-[14.5px] leading-6">
                  {g.summary}
                </p>
                <span className="text-brand mt-1 inline-flex items-center gap-1.5 text-[13.5px] font-medium">
                  Read
                  <ArrowRight
                    aria-hidden
                    className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
