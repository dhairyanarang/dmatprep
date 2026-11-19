import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { EVENTS } from '../analytics/events.ts'
import { trackServerEvent } from '../analytics/server.ts'
import { CURRENCY, PRICE_MINOR, PRODUCT } from './config.ts'
import { createMockProvider } from './mock.ts'
import type { CheckoutReturn, PaymentProvider } from './provider.ts'
import { decideOrderOutcome } from './reconcile-policy.ts'
import { createRazorpayProvider, razorpayConfigured } from './razorpay.ts'
import type { ClaimOutcome, EntitlementStatus, NormalisedEvent } from './types.ts'
import { grantsAccess } from './types.ts'

/**
 * Every privileged payment operation, and the only module that reads the
 * service-role key.
 *
 * The service role BYPASSES row level security. On the write path RLS is
 * therefore not a second line of defence — there is no first line — so
 * ownership is verified here and in the database functions, never by a policy.
 *
 * The `server-only` package would make a client import a build error, and is
 * not installed; adding a dependency was not in scope. The guard below plus
 * `scripts/test/payments-boundary.test.mjs`, which fails if any `'use client'`
 * file imports this module, are the enforcement in its place.
 */

if (typeof window !== 'undefined') {
  throw new Error('lib/payments/server.ts was imported in the browser')
}

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

/**
 * Which provider is in play.
 *
 * The mock is refused in production: a flow that grants an entitlement from a
 * provider which takes no money must not be reachable on a deployed site, and a
 * misconfigured environment variable is exactly how that would happen.
 */
export function getProvider(): PaymentProvider | null {
  if (process.env.PAYMENTS_PROVIDER === 'mock') {
    if (process.env.NODE_ENV === 'production') return null
    return createMockProvider()
  }
  if (!razorpayConfigured()) return null
  return createRazorpayProvider()
}

export function paymentsReady(): boolean {
  return Boolean(serviceClient()) && Boolean(getProvider())
}

/* ------------------------------------------------------------------ orders */

export type OrderResult =
  | { ok: true; providerOrderId: string; amountMinor: number; currency: string; keyId: string }
  | { ok: false; reason: string }

/**
 * Create an order for an authenticated user.
 *
 * `userId` comes from a verified session in the route handler. It is written
 * once, here, and is the only source of ownership for everything downstream —
 * no later step reads a user from a provider payload.
 *
 * The amount comes from server configuration, never from the request body.
 */
export async function createOrderForUser(userId: string): Promise<OrderResult> {
  const db = serviceClient()
  const provider = getProvider()
  if (!db || !provider) return { ok: false, reason: 'payments-not-configured' }

  // Already entitled? Creating a second order would be taking money for
  // something the user already has.
  const existing = await readEntitlementStatus(userId)
  if (existing && grantsAccess(existing)) return { ok: false, reason: 'already-entitled' }

  const receipt = `${PRODUCT}:${userId.slice(0, 8)}:${Date.now()}`
  const order = await provider.createOrder({
    amountMinor: PRICE_MINOR,
    currency: CURRENCY,
    receipt,
  })

  const { error } = await db.from('payment_orders').insert({
    user_id: userId,
    product: PRODUCT,
    provider: provider.id,
    provider_order_id: order.providerOrderId,
    amount_minor: order.amountMinor,
    currency: order.currency,
  })
  if (error) return { ok: false, reason: `order-not-recorded: ${error.message}` }

  // Server-side: an order row exists. The browser cannot fake this stage.
  await trackServerEvent(EVENTS.checkoutCreated, {
    order_ref: order.providerOrderId,
    amount_minor: order.amountMinor,
    currency: order.currency,
  })

  return {
    ok: true,
    providerOrderId: order.providerOrderId,
    amountMinor: order.amountMinor,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID ?? 'mock_key_id',
  }
}

/* ---------------------------------------------------------- checkout return */

/**
 * Verify the Checkout return and apply it.
 *
 * The order id used for signing is read back from OUR table by `userId`, never
 * taken from the browser. Razorpay's documentation says so outright — "Do not
 * use the `razorpay_order_id` returned by Checkout" — and it is also the only
 * way this can be an ownership check rather than a formality.
 *
 * This is the fetch-on-return path: it makes a successful purchase immediate
 * instead of waiting for a webhook, and it races the webhook harmlessly because
 * both call the same idempotent database function.
 */
export async function applyCheckoutReturn(
  userId: string,
  ret: CheckoutReturn & { claimedOrderId: string },
): Promise<{ ok: boolean; reason?: string; status?: EntitlementStatus }> {
  const db = serviceClient()
  const provider = getProvider()
  if (!db || !provider) return { ok: false, reason: 'payments-not-configured' }

  const { data: order } = await db
    .from('payment_orders')
    .select('provider_order_id, amount_minor')
    .eq('user_id', userId)
    .eq('provider_order_id', ret.claimedOrderId)
    .maybeSingle()

  // No row for this (user, order) means the order was not created by this user.
  if (!order) return { ok: false, reason: 'order-not-found-for-user' }

  const stored = order.provider_order_id as string
  if (!provider.verifyCheckoutReturn(stored, ret)) {
    return { ok: false, reason: 'signature-mismatch' }
  }

  // Ask the provider what actually happened rather than trusting the browser's
  // word that it succeeded.
  const snapshot = await provider.fetchPaymentStatus(ret.providerPaymentId)
  if (!snapshot || snapshot.status !== 'captured') {
    return { ok: false, reason: 'not-captured' }
  }

  const eventId = `checkout:${ret.providerPaymentId}`
  const claim = await claimEvent(db, {
    provider: provider.id,
    eventId,
    eventType: 'checkout.return',
    bodySha256: eventId,
    redacted: { source: 'checkout-return', payment_id: ret.providerPaymentId },
  })
  if (claim === 'locked') return { ok: false, reason: 'in-progress' }
  if (claim === 'already_processed') {
    return { ok: true, status: (await readEntitlementStatus(userId))?.status }
  }

  const applied = await applyEvent(db, {
    provider: provider.id,
    eventId,
    providerOrderId: stored,
    providerPaymentId: ret.providerPaymentId,
    status: 'captured',
    amountMinor: order.amount_minor as number,
  })
  if (applied !== 'processed') {
    await settleEvent(db, provider.id, eventId, 'parked', applied)
    return { ok: false, reason: applied }
  }

  return { ok: true, status: (await readEntitlementStatus(userId))?.status }
}

/* ----------------------------------------------------------------- webhook */

export type WebhookOutcome = { http: number; note: string }

/**
 * Process a webhook delivery.
 *
 * The step order is fixed by Razorpay's verified contract and by a defect found
 * in review, and every line of it matters:
 *
 *   raw text → verify → parse → claim → apply (atomic) → respond
 *
 * The claim is what makes a retry safe. An earlier design treated a
 * primary-key collision as "already done", so a grant that failed after the
 * event was recorded could never be retried: the payment was captured and the
 * entitlement never existed. `claim_webhook_event` distinguishes "already
 * processed" from "recorded but not processed" and returns which.
 */
export async function processWebhook(raw: string, headers: Headers): Promise<WebhookOutcome> {
  const db = serviceClient()
  const provider = getProvider()
  if (!db || !provider) return { http: 503, note: 'payments-not-configured' }

  const event = provider.verifyWebhook(raw, headers)
  // Signature mismatch: nothing parsed, nothing written, nothing logged in full.
  if (!event) return { http: 400, note: 'signature-mismatch' }

  const claim = await claimEvent(db, {
    provider: event.provider,
    eventId: event.eventId,
    eventType: event.eventType,
    bodySha256: String(event.redacted.body_sha256 ?? ''),
    redacted: event.redacted,
  })

  if (claim === 'already_processed') return { http: 200, note: 'duplicate' }
  // Parked: recorded, alerted, and in the sweep's queue. 200 acknowledges
  // receipt, not action — and is what stops one poison event from tripping
  // Razorpay's 24-hour auto-disable and breaking every future payment.
  if (claim === 'parked') return { http: 200, note: 'parked' }
  // Another worker holds the lock. 409 so Razorpay retries: if that worker
  // finishes, the retry sees `processed`; if it dies, the lock expires.
  if (claim === 'locked') return { http: 409, note: 'in-progress' }

  // A real event we understand that changes nothing. A dispute being OPENED is
  // the case this exists for: the money is still ours until the dispute is
  // decided, so the correct response is to record it and revoke nothing.
  if (event.disposition === 'acknowledge') {
    await settleEvent(db, event.provider, event.eventId, 'processed', event.note)
    return { http: 200, note: `acknowledged: ${event.note}` }
  }

  if (event.disposition === 'park' || !event.status || !event.providerPaymentId) {
    const final = await settleEvent(db, event.provider, event.eventId, 'parked', event.note || 'unhandled-event-type')
    return { http: 200, note: final }
  }

  const providerOrderId = event.providerOrderId ?? (await orderIdForPayment(db, event))
  if (!providerOrderId) {
    const final = await settleEvent(db, event.provider, event.eventId, 'parked', 'no-order-id')
    return { http: 200, note: final }
  }

  try {
    const applied = await applyEvent(db, {
      provider: event.provider,
      eventId: event.eventId,
      providerOrderId,
      providerPaymentId: event.providerPaymentId,
      status: event.status,
      amountMinor: event.amountMinor,
    })
    if (applied === 'processed') return { http: 200, note: 'processed' }
    // park:unknown-order | park:order-has-no-owner | park:amount-mismatch —
    // each needs a human, and none will succeed by retrying.
    const final = await settleEvent(db, event.provider, event.eventId, 'parked', applied)
    return { http: 200, note: final }
  } catch (error) {
    // Transient. Retryable, and in the sweep's queue either way. The attempt
    // cap in `settle_webhook_event` decides when this becomes `parked`.
    const message = error instanceof Error ? error.message : 'unknown'
    const final = await settleEvent(db, event.provider, event.eventId, 'failed', message)
    return { http: final === 'parked' ? 200 : 500, note: final }
  }
}

/** A refund event names a payment but not always its order. */
async function orderIdForPayment(db: SupabaseClient, event: NormalisedEvent): Promise<string | null> {
  if (!event.providerPaymentId) return null
  const { data } = await db
    .from('payments')
    .select('order_id, payment_orders!inner(provider_order_id)')
    .eq('provider', event.provider)
    .eq('provider_payment_id', event.providerPaymentId)
    .maybeSingle()
  const joined = data as { payment_orders?: { provider_order_id?: string } } | null
  return joined?.payment_orders?.provider_order_id ?? null
}

/* ------------------------------------------------------- database wrappers */

async function claimEvent(
  db: SupabaseClient,
  input: {
    provider: string
    eventId: string
    eventType: string
    bodySha256: string
    redacted: Record<string, unknown>
  },
): Promise<ClaimOutcome> {
  const { data, error } = await db.rpc('claim_webhook_event', {
    p_provider: input.provider,
    p_event_id: input.eventId,
    p_event_type: input.eventType,
    p_body_sha256: input.bodySha256,
    p_payload: input.redacted,
  })
  if (error) throw new Error(`claim failed: ${error.message}`)
  return data as ClaimOutcome
}

async function applyEvent(
  db: SupabaseClient,
  input: {
    provider: string
    eventId: string
    providerOrderId: string
    providerPaymentId: string
    status: string
    amountMinor: number | null
  },
): Promise<string> {
  const { data, error } = await db.rpc('apply_payment_event', {
    p_provider: input.provider,
    p_event_id: input.eventId,
    p_provider_order_id: input.providerOrderId,
    p_provider_payment_id: input.providerPaymentId,
    p_status: input.status,
    p_amount_minor: input.amountMinor,
  })
  if (error) throw new Error(`apply failed: ${error.message}`)

  const result = data as string

  /**
   * The funnel's money events, emitted in exactly one place.
   *
   * This runs only after a successful `claim_webhook_event`, which admits one
   * caller per event id, and only when the apply actually committed. So a
   * webhook delivered five times produces one `payment_succeeded`, and the
   * same is true whether the event arrived by webhook, by the browser
   * returning from Checkout, or by the reconciliation sweep finding it hours
   * later. Nothing else in the codebase emits these.
   */
  if (result === 'processed') {
    if (input.status === 'captured') {
      await trackServerEvent(EVENTS.paymentSucceeded, {
        order_ref: input.providerOrderId,
        amount_minor: input.amountMinor,
        status: 'captured',
      })
      await trackServerEvent(EVENTS.premiumUnlocked, {
        order_ref: input.providerOrderId,
      })
    } else if (input.status === 'failed') {
      await trackServerEvent(EVENTS.paymentFailed, {
        order_ref: input.providerOrderId,
        status: 'failed',
        reason: 'provider-reported-failure',
      })
    }
  }

  return result
}

async function settleEvent(
  db: SupabaseClient,
  provider: string,
  eventId: string,
  status: 'failed' | 'parked' | 'processed',
  note: string,
): Promise<string> {
  const { data } = await db.rpc('settle_webhook_event', {
    p_provider: provider,
    p_event_id: eventId,
    p_status: status,
    p_error: note.slice(0, 500),
  })
  return (data as string) ?? status
}

/* ------------------------------------------------------------ entitlements */

export async function readEntitlementStatus(
  userId: string,
): Promise<{ status: EntitlementStatus; expiresAt: string | null } | null> {
  const db = serviceClient()
  if (!db) return null
  const { data } = await db
    .from('entitlements')
    .select('status, expires_at')
    .eq('user_id', userId)
    .eq('product', PRODUCT)
    .maybeSingle()
  if (!data) return null
  return { status: data.status as EntitlementStatus, expiresAt: data.expires_at as string | null }
}

/** The one access rule, on the server, for every premium byte. */
export async function hasPremiumAccess(userId: string): Promise<boolean> {
  return grantsAccess(await readEntitlementStatus(userId))
}

/**
 * Grandfathering, comps and operator revocation.
 *
 * Append-only: a withdrawal is a `revoke` row, never an edit, so the record of
 * who was granted what and why survives for as long as the account does.
 */
export async function recordManualGrant(input: {
  userId: string
  action: 'grant' | 'revoke'
  source: 'grandfathered' | 'comp' | 'support' | 'fraud'
  reason: string
  createdBy: string
}): Promise<boolean> {
  const db = serviceClient()
  if (!db) return false
  const { error } = await db.from('manual_grants').insert({
    user_id: input.userId,
    product: PRODUCT,
    action: input.action,
    source: input.source,
    reason: input.reason,
    created_by: input.createdBy,
  })
  if (error) return false
  const { error: recomputeError } = await db.rpc('recompute_entitlement', {
    p_user_id: input.userId,
    p_product: PRODUCT,
  })
  return !recomputeError
}

/* --------------------------------------------------------- reconciliation */

export type ReconcileReport = {
  /** Stuck webhook events re-driven. */
  reDriven: number
  /** Orders we asked the provider about directly. */
  ordersChecked: number
  /** Entitlements granted that no webhook had delivered. */
  recovered: number
  /** Still unresolved after we asked. An inference, never a confirmed cancel. */
  unconfirmed: number
  /** Events that failed again, or orders the provider could not answer for. */
  stillFailing: number
  note: string
}

/** How many orders one sweep will ask the provider about. */
const RECONCILE_BATCH = 25
/**
 * Wait between provider calls.
 *
 * Razorpay does not publish a rate limit for the REST API, so this is a
 * deliberate conservatism rather than a figure traced to documentation: 25
 * orders at 200ms is five seconds of calls per run, which no sane limit would
 * refuse. Flagged as unverified in docs/RAZORPAY.md §13.
 */
const RECONCILE_DELAY_MS = 200
/** An order younger than this has not had time to confirm normally. */
const MIN_AGE_MINUTES = 2

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * The reconciliation sweep. Mandatory, not advisable.
 *
 * Razorpay disables a webhook after 24 hours of failures and tells only the
 * Alert Email Address. Between that moment and someone reading that mailbox,
 * every purchase succeeds at Razorpay and grants nothing — the customer has
 * paid and has no access, and no part of the product knows.
 *
 * Two jobs, and the second is the one that matters:
 *
 *   A. Re-drive events we received but could not finish. A failed grant is a
 *      row in a queryable queue rather than a lost log line.
 *
 *   B. Ask the provider about orders we created that have no captured payment.
 *      This is the ONLY thing that recovers a payment whose webhook never
 *      arrived AND whose customer never returned to the site — in that case
 *      there is no local event to re-drive, and job A finds nothing at all.
 *
 * Everything goes through the same claim → apply path as the webhook, keyed on
 * a deterministic event id, so running the sweep twice cannot grant twice.
 */
export async function reconcile(): Promise<ReconcileReport> {
  const db = serviceClient()
  const provider = getProvider()
  const empty: ReconcileReport = {
    reDriven: 0,
    ordersChecked: 0,
    recovered: 0,
    unconfirmed: 0,
    stillFailing: 0,
    note: 'not-configured',
  }
  if (!db || !provider) return empty

  let recovered = 0
  let stillFailing = 0

  /* ---- Job A: re-drive events we received but could not finish ---------- */

  const { data: stuck } = await db
    .from('webhook_events')
    .select('provider, provider_event_id, payload_redacted')
    .or(
      `status.eq.failed,status.eq.parked,and(status.eq.processing,locked_until.lt.${new Date().toISOString()})`,
    )
    .limit(100)

  const stuckRows = (stuck ?? []) as {
    provider: string
    provider_event_id: string
    payload_redacted: Record<string, unknown>
  }[]

  for (const row of stuckRows) {
    const payload = row.payload_redacted ?? {}
    const orderId = typeof payload.order_id === 'string' ? payload.order_id : null
    const paymentId = typeof payload.payment_id === 'string' ? payload.payment_id : null
    if (!orderId || !paymentId) {
      stillFailing += 1
      continue
    }
    // Ask the provider rather than trusting the stored event: if it is stuck,
    // the stored view of it is the thing least worth believing.
    const snapshot = await provider.fetchPaymentStatus(paymentId)
    if (!snapshot?.status) {
      stillFailing += 1
      continue
    }
    try {
      const claim = await claimEvent(db, {
        provider: row.provider,
        eventId: row.provider_event_id,
        eventType: 'reconcile',
        bodySha256: String(payload.body_sha256 ?? ''),
        redacted: payload,
      })
      if (claim !== 'claimed') {
        stillFailing += 1
        continue
      }
      const applied = await applyEvent(db, {
        provider: row.provider,
        eventId: row.provider_event_id,
        providerOrderId: orderId,
        providerPaymentId: paymentId,
        status: snapshot.status,
        amountMinor: snapshot.amountMinor,
      })
      if (applied === 'processed') recovered += 1
      else {
        await settleEvent(db, row.provider, row.provider_event_id, 'parked', applied)
        stillFailing += 1
      }
    } catch {
      stillFailing += 1
    }
  }

  /* ---- Job B: ask the provider about orders with no captured payment ---- */

  const { data: awaiting } = await db.rpc('orders_awaiting_confirmation', {
    p_min_age_minutes: MIN_AGE_MINUTES,
    p_limit: RECONCILE_BATCH,
  })

  const orders = (awaiting ?? []) as {
    provider: string
    provider_order_id: string
    amount_minor: number
    created_at: string
  }[]

  let unconfirmed = 0

  for (const [index, order] of orders.entries()) {
    if (index > 0) await sleep(RECONCILE_DELAY_MS)

    let payments: Awaited<ReturnType<typeof provider.fetchOrderPayments>> = []
    try {
      payments = await provider.fetchOrderPayments(order.provider_order_id)
    } catch {
      // A provider error is not evidence about the order. Leave
      // `last_reconciled_at` alone so the next run tries again.
      stillFailing += 1
      continue
    }

    await db.rpc('mark_order_reconciled', {
      p_provider: order.provider,
      p_provider_order_id: order.provider_order_id,
    })

    const ageMinutes = (Date.now() - new Date(order.created_at).getTime()) / 60_000
    const outcome = decideOrderOutcome(payments, ageMinutes)

    if (outcome.action !== 'recover') {
      // An inference, and labelled as one. Nothing is marked failed and no
      // record is changed — a payment that confirms later simply leaves the
      // list on its own.
      if (outcome.action === 'unconfirmed') unconfirmed += 1
      continue
    }
    const captured = outcome.payment

    // Amount is re-checked by `apply_payment_event`, which parks on mismatch
    // rather than granting. Nothing here decides that.
    try {
      const eventId = `reconcile:${captured.providerPaymentId}`
      const claim = await claimEvent(db, {
        provider: order.provider,
        eventId,
        eventType: 'reconcile.order',
        bodySha256: eventId,
        redacted: {
          source: 'reconcile',
          order_id: order.provider_order_id,
          payment_id: captured.providerPaymentId,
          amount: captured.amountMinor,
          status: captured.status,
        },
      })
      // Already processed means another path got there first — the webhook
      // arriving late, or a previous sweep. Not a failure, and not a second
      // grant.
      if (claim !== 'claimed') continue

      const applied = await applyEvent(db, {
        provider: order.provider,
        eventId,
        providerOrderId: order.provider_order_id,
        providerPaymentId: captured.providerPaymentId,
        status: 'captured',
        amountMinor: captured.amountMinor,
      })
      if (applied === 'processed') recovered += 1
      else {
        await settleEvent(db, order.provider, eventId, 'parked', applied)
        stillFailing += 1
      }
    } catch {
      stillFailing += 1
    }
  }

  return {
    reDriven: stuckRows.length,
    ordersChecked: orders.length,
    recovered,
    unconfirmed,
    stillFailing,
    note: `${stuckRows.length} stuck events re-driven, ${orders.length} orders checked, ${recovered} recovered`,
  }
}
