import { COMMERCE_ENABLED } from '@/lib/payments/config'
import { applyCheckoutReturn } from '@/lib/payments/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Verify the Checkout return, and grant if it is real.
 *
 * This is fetch-on-return: it makes a successful purchase immediate rather than
 * waiting for a webhook, and it races the webhook harmlessly because both call
 * the same idempotent database function.
 *
 * The signature is checked against the order id read back from OUR table, not
 * the one the browser sends. Razorpay's documentation says so outright: "Do not
 * use the `razorpay_order_id` returned by Checkout."
 */
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!COMMERCE_ENABLED) {
    return Response.json({ error: 'commerce-disabled' }, { status: 503 })
  }

  const supabase = await createSupabaseServerClient()
  if (!supabase) return Response.json({ error: 'auth-unavailable' }, { status: 503 })

  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError || !auth.user) return Response.json({ error: 'sign-in-required' }, { status: 401 })

  let body: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return Response.json({ error: 'bad-request' }, { status: 400 })
  }

  const paymentId = body.razorpay_payment_id
  const claimedOrderId = body.razorpay_order_id
  const signature = body.razorpay_signature
  if (!paymentId || !claimedOrderId || !signature) {
    return Response.json({ error: 'bad-request' }, { status: 400 })
  }

  const result = await applyCheckoutReturn(auth.user.id, {
    providerPaymentId: paymentId,
    signature,
    claimedOrderId,
  })

  if (!result.ok) {
    // `not-captured` is the pending case and is not an error the buyer caused:
    // the webhook or the sweep will finish it.
    const pending = result.reason === 'not-captured' || result.reason === 'in-progress'
    return Response.json({ error: result.reason, pending }, { status: pending ? 202 : 400 })
  }

  return Response.json({ ok: true, status: result.status })
}
