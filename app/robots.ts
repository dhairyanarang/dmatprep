import type { MetadataRoute } from 'next'

import { SITE_ORIGIN } from '@/lib/seo'

/**
 * What crawlers are asked to leave alone.
 *
 * **This is a courtesy, not a control.** robots.txt is advisory: it keeps
 * well-behaved crawlers out of routes that waste their time and would produce
 * useless search results, and it secures nothing. Everything that actually
 * protects content — the entitlement check on premium solutions, the auth
 * guard on the account page, the server-side marking route — is unchanged and
 * does not depend on anything here.
 *
 * The disallowed list is therefore about search quality, not secrecy:
 *
 *  · `/dashboard`, `/account`, `/checkout` are personal or transactional. They
 *    look identical and empty to anyone not signed in.
 *  · `/practice/*`, `/test/*`, `/module-b/timed` are running interfaces. A
 *    visitor who lands mid-mock from a search result has been failed.
 *  · `/api/*` returns JSON and should never be a search result.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/account',
          '/checkout',
          '/api/',
          '/practice/',
          '/test/',
          '/module-b/timed',
        ],
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  }
}
