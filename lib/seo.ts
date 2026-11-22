/**
 * One place that knows the site's address.
 *
 * `metadataBase` in the root layout already turns relative asset paths into
 * absolute URLs. Canonicals need the same thing for page URLs, and a canonical
 * that points at the wrong origin is worse than none at all — it tells a search
 * engine to index somebody else's copy. So the origin is written once, here.
 *
 * The address itself is fixed and is not a configuration knob:
 * https://dmatprep.vercel.app has been shared in applications and must keep
 * working, so it is a constant rather than an environment variable that a
 * misconfigured deployment could change underneath us.
 */
export const SITE_ORIGIN = 'https://dmatprep.vercel.app'

/** An absolute canonical URL for a route path. `/` stays `/`. */
export function canonical(path: string): string {
  if (path === '/') return `${SITE_ORIGIN}/`
  const clean = path.startsWith('/') ? path : `/${path}`
  return `${SITE_ORIGIN}${clean.replace(/\/+$/, '')}`
}

/**
 * The organisation, for a single JSON-LD block on the landing page.
 *
 * Deliberately minimal and deliberately careful. It names the site and says
 * plainly that it is independent; it claims no rating, no award, no
 * affiliation, and no `sameAs` profile that does not exist. Structured data
 * that overstates is a liability, not an optimisation.
 */
export const organisationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'dMAT Prep',
  url: SITE_ORIGIN,
  description:
    'An independent practice tool for the Digital Master Assessment Test, offering original practice questions, worked solutions and timed mock exams.',
  // Not affiliated with g.a.s.t. or APS India, and the structured data must not
  // suggest otherwise. `knowsAbout` describes the subject matter only.
  knowsAbout: [
    'Digital Master Assessment Test',
    'Figure Sequences',
    'Mathematical Equations',
    'Latin Squares',
    'Graduate admission to German universities',
  ],
} as const

/** A `WebSite` entry so the site name can appear correctly in results. */
export const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'dMAT Prep',
  url: SITE_ORIGIN,
} as const

/** Renders a JSON-LD block. Kept in one helper so the shape never varies. */
export function jsonLdProps(data: unknown) {
  return {
    type: 'application/ld+json' as const,
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  }
}

/**
 * The social preview image, for any page that declares its own `openGraph`.
 *
 * `app/opengraph-image.jpeg` is a file convention, and Next applies it to the
 * segment holding it and inherits it downward. But a child page that exports
 * its own `openGraph` **replaces** the inherited object rather than merging
 * into it, so the image silently disappears — and with it `twitter:image`,
 * since X derives that from the Open Graph one. That is not obvious from the
 * metadata documentation and it cost five pages their preview until an audit
 * of the built HTML caught it. Any page setting `openGraph` spreads this in.
 */
export const OG_IMAGE = {
  url: '/opengraph-image.jpeg',
  width: 1200,
  height: 627,
  alt: 'dMAT Prep — practice for the Digital Master Assessment Test',
} as const

/**
 * Open Graph and Twitter metadata for one page, built together.
 *
 * They are built together because setting one and not the other is what went
 * wrong: a page that overrode `openGraph` alone kept the root layout's generic
 * Twitter title, so the same link previewed with page-specific copy on
 * WhatsApp and site-wide copy on X. One call, one set of words, both places.
 *
 * `twitter.images` stays out on purpose — X falls back to the Open Graph
 * image, which this always sets, so the asset is declared once.
 */
export function social(opts: {
  title: string
  description: string
  path: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
}) {
  const { title, description, path, type = 'website', publishedTime, modifiedTime } = opts
  return {
    openGraph: {
      type,
      siteName: 'dMAT Prep',
      locale: 'en_GB',
      url: canonical(path),
      title,
      description,
      images: [OG_IMAGE],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
    },
  }
}
