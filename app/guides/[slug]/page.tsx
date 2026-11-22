import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, ArrowLeft } from 'lucide-react'

import { ReadingProgress } from '@/components/site/reading-progress'
import { GUIDES, guideBySlug, type Block } from '@/content/site/guides'
import { canonical, jsonLdProps, SITE_ORIGIN, social } from '@/lib/seo'

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/guides/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const guide = guideBySlug(slug)
  if (!guide) return {}
  const url = canonical(`/guides/${guide.slug}`)
  return {
    title: guide.metaTitle,
    description: guide.description,
    alternates: { canonical: url },
    ...social({
      type: 'article',
      title: guide.metaTitle,
      description: guide.description,
      path: `/guides/${guide.slug}`,
      publishedTime: guide.published,
      modifiedTime: guide.updated,
    }),
  }
}

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

export default async function GuidePage({ params }: PageProps<'/guides/[slug]'>) {
  const { slug } = await params
  const guide = guideBySlug(slug)
  if (!guide) notFound()

  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 2)

  /**
   * Article structured data. `author` and `publisher` are the site itself —
   * there is no byline to invent — and no image is declared, because declaring
   * one that does not represent the article is worse than declaring none.
   */
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    datePublished: guide.published,
    dateModified: guide.updated,
    author: { '@type': 'Organization', name: 'dMAT Prep', url: SITE_ORIGIN },
    publisher: { '@type': 'Organization', name: 'dMAT Prep', url: SITE_ORIGIN },
    mainEntityOfPage: canonical(`/guides/${guide.slug}`),
    isAccessibleForFree: true,
  }

  return (
    <>
      <script {...jsonLdProps(articleJsonLd)} />
      <ReadingProgress />

      <article>
        <header className="border-border border-b">
          <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-9 sm:px-6 sm:pt-14">
            <Link
              href="/guides"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-[13.5px] transition-colors duration-150"
            >
              <ArrowLeft aria-hidden className="size-3.5" />
              All guides
            </Link>
            <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11.5px] tracking-wide uppercase">
              <span className="text-brand">{guide.topic}</span>
              <span aria-hidden>·</span>
              <span>{guide.minutes} min read</span>
              <span aria-hidden>·</span>
              <time dateTime={guide.updated}>Updated {longDate(guide.updated)}</time>
            </div>
            <h1 className="mt-3 text-[28px] leading-tight font-semibold tracking-tight text-balance sm:text-[34px]">
              {guide.title}
            </h1>
            <p className="text-muted-foreground mt-4 text-[16px] leading-7">{guide.summary}</p>
          </div>
        </header>

        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
          {guide.blocks.map((block, i) => (
            <BlockView key={i} block={block} />
          ))}

          <div className="border-border text-muted-foreground mt-12 border-t pt-6 text-[13px] leading-6">
            <p>
              dMAT Prep is independent and not affiliated with g.a.s.t. or APS India. Every
              worked example in this guide was written for it; no official examination material
              is reproduced. Facts about the examination are summarised in our own words from
              the sources listed on{' '}
              <Link href="/exam/sources" className="text-foreground underline underline-offset-2">
                our sources page
              </Link>
              . Confirm dates, fees and requirements officially before relying on them.
            </p>
          </div>
        </div>
      </article>

      {others.length ? (
        <section className="border-border bg-frame/40 border-t">
          <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
            <h2 className="text-[13px] font-medium tracking-wide uppercase">Keep reading</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {others.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/guides/${g.slug}`}
                    className="group hover:text-brand flex items-baseline gap-3 text-[15.5px] font-medium transition-colors duration-150"
                  >
                    <span className="text-muted-foreground font-mono text-[11.5px] uppercase">
                      {g.topic}
                    </span>
                    <span className="min-w-0 flex-1">{g.title}</span>
                    <ArrowRight
                      aria-hidden
                      className="size-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'h2':
      return (
        <h2 className="mt-11 mb-3 text-[21px] leading-snug font-semibold tracking-tight text-balance">
          {block.text}
        </h2>
      )
    case 'h3':
      return (
        <h3 className="mt-8 mb-2 text-[17px] leading-snug font-semibold tracking-tight">
          {block.text}
        </h3>
      )
    case 'p':
      return (
        <p className="text-muted-foreground mt-4 text-[15.5px] leading-7">{block.text}</p>
      )
    case 'ul':
      return (
        <ul className="text-muted-foreground mt-4 flex list-disc flex-col gap-2 pl-5 text-[15.5px] leading-7">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol className="text-muted-foreground mt-4 flex list-decimal flex-col gap-2 pl-5 text-[15.5px] leading-7">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      )
    case 'example':
      return (
        <figure className="border-border bg-card mt-6 overflow-hidden rounded-xl border">
          <figcaption className="border-border bg-frame/60 border-b px-4 py-2.5 text-[12.5px] font-medium tracking-wide uppercase">
            {block.title}
          </figcaption>
          <pre className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-6 whitespace-pre">
            {block.lines.join('\n')}
          </pre>
          {block.note ? (
            <p className="border-border text-muted-foreground border-t px-4 py-3 text-[13.5px] leading-6">
              {block.note}
            </p>
          ) : null}
        </figure>
      )
    case 'callout':
      return (
        <aside className="border-brand/30 bg-brand-50/60 mt-6 rounded-xl border p-4 sm:p-5">
          <h3 className="text-[14px] font-semibold tracking-tight">{block.title}</h3>
          <p className="text-muted-foreground mt-1.5 text-[14.5px] leading-6">{block.text}</p>
        </aside>
      )
    case 'cta':
      return (
        <aside className="border-border mt-8 rounded-xl border border-dashed p-5">
          <p className="text-muted-foreground text-[14.5px] leading-6">{block.text}</p>
          <Link
            href={block.href}
            className="text-brand hover:text-brand-strong group mt-3 inline-flex items-center gap-1.5 text-[14px] font-medium underline-offset-4 hover:underline"
          >
            {block.label}
            <ArrowRight
              aria-hidden
              className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
            />
          </Link>
        </aside>
      )
    default:
      return null
  }
}
