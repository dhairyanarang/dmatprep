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
 *
 * This file is a request, not a boundary. A disallowed URL can still be
 * indexed from a link somewhere else, so every page listed here also carries
 * `noindex` through `NOT_A_LANDING_PAGE` in `lib/seo.ts` — that is the half
 * that actually settles it. Neither is access control: what a Free account may
 * see is decided by the entitlement check and by which solutions are
 * published, and nothing in this file affects either.
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
          // `/practice/` above does not cover these: a prefix rule matches from
          // the start of the path, so the per-subtest runners and the General
          // Academic packs sit outside it and were being crawled.
          '/module-a/*/practice',
          '/module-b/practice/',
        ],
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  }
}
