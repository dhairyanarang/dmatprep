import figureSequences from '@/content/access/premium-solutions/figure-sequences.json'
import latinSquares from '@/content/access/premium-solutions/latin-squares.json'
import mathematicalEquations from '@/content/access/premium-solutions/mathematical-equations.json'

import { hasPremiumAccess } from '@/lib/payments/server'
import { SECTION_IDS, type SectionId } from '@/lib/sections'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Premium solutions, released only after a server-side entitlement check.
 *
 * This route is the reason the entitlement exists. Everything else about
 * premium — the lock icons, the pricing page, the cached client flag — is
 * presentation. This is the only thing that actually withholds anything, and it
 * never consults the client about what the client is allowed.
 *
 * The solutions are imported rather than read from `public/`, so they are
 * bundled into this handler and have no publicly fetchable URL of their own.
 * `docs/CONTENT_EXPOSURE.md` calls the static split "hygiene, not protection";
 * this is the protection, and it is the shape the next content needs.
 */
export const dynamic = 'force-dynamic'

const PREMIUM: Record<SectionId, Record<string, unknown>> = {
  'figure-sequences': figureSequences as Record<string, unknown>,
  'mathematical-equations': mathematicalEquations as Record<string, unknown>,
  'latin-squares': latinSquares as Record<string, unknown>,
}

export async function GET(request: Request) {
  const section = new URL(request.url).searchParams.get('section')
  if (!section || !SECTION_IDS.includes(section as SectionId)) {
    return Response.json({ error: 'unknown-section' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()
  if (!supabase) return Response.json({ error: 'sign-in-required' }, { status: 401 })

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return Response.json({ error: 'sign-in-required' }, { status: 401 })

  if (!(await hasPremiumAccess(data.user.id))) {
    return Response.json({ error: 'not-entitled' }, { status: 403 })
  }

  return Response.json(PREMIUM[section as SectionId], {
    // Never cached by a shared cache: the response depends on who asked.
    headers: { 'cache-control': 'private, no-store' },
  })
}
