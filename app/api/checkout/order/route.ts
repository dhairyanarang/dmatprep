import { COMMERCE_ENABLED } from '@/lib/payments/config'
import { createOrderForUser } from '@/lib/payments/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Create an order.
 *
 * The amount is NOT in the request. It comes from server configuration, so a
 * client cannot ask to pay ₹1 for a ₹999 product. The user id comes from a
 * verified session and is written once into `payment_orders`, which is the only
 * source of ownership for every step that follows.
 */
export const dynamic = 'force-dynamic'

export async function POST() {
  if (!COMMERCE_ENABLED) {
    return Response.json({ error: 'commerce-disabled' }, { status: 503 })
  }

  const supabase = await createSupabaseServerClient()
  if (!supabase) return Response.json({ error: 'auth-unavailable' }, { status: 503 })

  // getUser validates the token with Supabase rather than trusting the cookie.
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return Response.json({ error: 'sign-in-required' }, { status: 401 })

  const result = await createOrderForUser(data.user.id)
  if (!result.ok) {
    const status = result.reason === 'already-entitled' ? 409 : 503
    return Response.json({ error: result.reason }, { status })
  }

  return Response.json({
    orderId: result.providerOrderId,
    amount: result.amountMinor,
    currency: result.currency,
    keyId: result.keyId,
  })
}
