import { reconcile } from '@/lib/payments/server'

/**
 * The reconciliation sweep, triggered by a schedule.
 *
 * Mandatory rather than advisable. Razorpay disables a webhook after 24 hours
 * of failures and notifies only an alert mailbox; until someone reads it, every
 * purchase succeeds at Razorpay and grants nothing. This is what notices.
 *
 * Protected by a shared secret in a header rather than a session, because a
 * scheduler has no session. Returns 404 rather than 401 when the secret is
 * wrong, so the endpoint does not confirm its own existence.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const expected = process.env.RECONCILE_SECRET ?? ''
  const provided = request.headers.get('x-reconcile-secret') ?? ''
  if (!expected || provided !== expected) {
    return new Response('Not found', { status: 404 })
  }

  const report = await reconcile()
  return Response.json(report)
}
