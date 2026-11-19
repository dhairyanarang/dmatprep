import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { COMMERCE_ENABLED } from '@/lib/payments/config'
import { SECTION_IDS, type SectionId } from '@/lib/sections'

/**
 * The free half of the solutions, during a pilot.
 *
 * `next.config.ts` rewrites `/solutions/:section` here when COMMERCE_ENABLED=1,
 * which works because `beforeFiles` rewrites are matched before the `public/`
 * directory is consulted. The committed file stays on disk, untouched, and is
 * simply not what gets served.
 *
 * A dynamic segment rather than a query parameter: rewriting into
 * `?section=:section` did not substitute reliably, and the failure was silent —
 * the handler refused an unknown section while every structural test passed.
 * A path parameter is what the rewrite is good at.
 *
 * No authentication, deliberately: this is the FREE half and the free product
 * must keep working with no account. What makes the gate real is that the
 * premium half is not in this response and has no public URL anywhere — it is
 * served only by `/api/content/solutions`, after an entitlement check.
 *
 * A missing pilot set returns 503 rather than falling back to the committed
 * file. A fallback would serve every premium answer while appearing to work.
 */
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, ctx: { params: Promise<{ section: string }> }) {
  if (!COMMERCE_ENABLED) {
    return Response.json({ error: 'not-in-pilot-mode' }, { status: 404 })
  }

  // The rewrite captures the whole path segment, extension included.
  const { section: raw } = await ctx.params
  const section = raw.replace(/\.json$/, '')
  if (!SECTION_IDS.includes(section as SectionId)) {
    return Response.json({ error: 'unknown-section' }, { status: 400 })
  }

  try {
    const body = readFileSync(join(process.cwd(), '.pilot', 'solutions', `${section}.json`), 'utf8')
    return new Response(body, {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    })
  } catch {
    return Response.json(
      { error: 'pilot-solutions-missing', hint: 'Run: npm run build:pilot-solutions' },
      { status: 503 },
    )
  }
}
