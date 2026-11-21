import { getGamSolutions, getPackIds } from '@/lib/gam/registry'

/**
 * Mark a submitted Module B session.
 *
 * This route exists because `/module-b/timed` used to ship all 19 answer keys
 * and explanations inside its own prerendered HTML. The page is static, so an
 * anonymous `curl` returned every correct option before a single question had
 * been answered. The packs are now served stripped and the answers live here,
 * behind a submission.
 *
 * What this does and does not achieve, stated plainly because the difference
 * matters: Module B is free and ungated, so there is no entitlement to check
 * and anyone may legitimately sit a session and then see the answers. The
 * guarantee is therefore about *order*, not about secrecy — nothing that
 * answers a question is sent until the browser asks to be marked. A determined
 * visitor can still POST here without having read anything. What they can no
 * longer do is read the answers out of the page, or have them handed over by a
 * CDN, a prefetch or a view-source.
 *
 * `force-static` would be wrong and `force-dynamic` is not merely a default
 * repeated: a cached response here is a cached answer key.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let body: { packIds?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return Response.json({ error: 'bad-request' }, { status: 400 })
  }

  const requested = body.packIds
  if (!Array.isArray(requested) || requested.some((id) => typeof id !== 'string')) {
    return Response.json({ error: 'bad-request' }, { status: 400 })
  }

  // Bounded by what exists, so a caller cannot ask for an unbounded response
  // by sending a long list of ids.
  const known = new Set(getPackIds())
  const packIds = [...new Set(requested as string[])].filter((id) => known.has(id))
  if (packIds.length === 0) {
    return Response.json({ error: 'no-such-pack' }, { status: 400 })
  }

  return Response.json(
    { solutions: getGamSolutions(packIds) },
    { headers: { 'cache-control': 'no-store' } },
  )
}
