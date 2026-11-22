import type { MetadataRoute } from 'next'

import { GUIDES } from '@/content/site/guides'
import { SITE_ORIGIN } from '@/lib/seo'
import { SECTIONS } from '@/lib/sections'

/**
 * The public map of the site.
 *
 * Only pages a stranger should land on are listed. Three kinds of route are
 * deliberately absent:
 *
 *  · The product's working screens — the dashboard, practice runners, timed
 *    sets and mocks. They are reachable and they are not secret, but they are
 *    a tool rather than a destination, and a search result that drops somebody
 *    into a timed mock has served nobody.
 *  · Anything behind an account — /account, /checkout.
 *  · Nothing that is gated. The sitemap is not a security boundary and must
 *    not be treated as one; the Free and Pro split is enforced by the
 *    entitlement check and by which solutions are published, exactly as before.
 *
 * `lastModified` is the build time for generated pages and the guide's own
 * published date for articles, which is the honest answer in both cases.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const core: MetadataRoute.Sitemap = [
    { url: `${SITE_ORIGIN}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_ORIGIN}/exam`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_ORIGIN}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_ORIGIN}/guides`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_ORIGIN}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_ORIGIN}/about`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
  ]

  const examPages: MetadataRoute.Sitemap = [
    'format',
    'scoring',
    'rules',
    'logistics',
    'checklist',
    'sources',
  ].map((slug) => ({
    url: `${SITE_ORIGIN}/exam/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // The subtest overviews are the single best teaching content on the site —
  // rules, method, worked examples — so they are listed, while the practice
  // runners beside them are not.
  const subtests: MetadataRoute.Sitemap = SECTIONS.flatMap((s) => [
    {
      url: `${SITE_ORIGIN}/module-a/${s.id}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_ORIGIN}/module-a/${s.id}/overview`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ])

  const guides: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${SITE_ORIGIN}/guides/${g.slug}`,
    lastModified: new Date(`${g.updated}T00:00:00Z`),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const informational: MetadataRoute.Sitemap = [
    'information',
    'privacy',
    'terms',
    'contact',
  ].map((slug) => ({
    url: `${SITE_ORIGIN}/${slug}`,
    lastModified: now,
    changeFrequency: 'yearly' as const,
    priority: 0.3,
  }))

  return [...core, ...examPages, ...subtests, ...guides, ...informational]
}
