import { PRODUCT } from '@/lib/payments/config'
import { readEntitlementStatus } from '@/lib/payments/server'
import { grantsAccess } from '@/lib/payments/types'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * What the signed-in user is currently allowed.
 *
 * The client caches this to decide what to SHOW. It never decides what to
 * SERVE: premium bytes come from `/api/content/solutions`, which performs its
 * own check. A cached entitlement driving the interface is good UI; a cached
 * entitlement releasing content is a bug.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  if (!supabase) return Response.json({ product: PRODUCT, access: false, status: null })

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return Response.json({ product: PRODUCT, access: false, status: null })

  const entitlement = await readEntitlementStatus(data.user.id)
  return Response.json({
    product: PRODUCT,
    access: grantsAccess(entitlement),
    status: entitlement?.status ?? null,
  })
}
