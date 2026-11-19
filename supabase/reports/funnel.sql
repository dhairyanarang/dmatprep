-- dMAT Prep — purchase funnel and payment health.
--
-- Run these in the Supabase SQL editor. There is NO route, no dashboard and no
-- API that exposes them: payment records must not be reachable by ordinary
-- users, and a reporting page is a surface to secure for numbers one person
-- reads a few times a week.
--
-- The database is the source of truth for anything involving money. Vercel
-- Analytics counts funnel STEPS and is deliberately given no user identifier,
-- so it cannot count distinct humans — that is what query 2 is for. If the two
-- ever disagree about money, the database is right.
--
-- Nothing here is applied automatically. Nothing here writes.

-- ---------------------------------------------------------------------------
-- 1. The funnel, last 30 days.
--
-- Orders created vs. orders that reached a captured payment. "Attempts" counts
-- every payment row, so a buyer who failed once and succeeded once shows as
-- two attempts and one success — which is the point of separating them.
-- ---------------------------------------------------------------------------

select
  date_trunc('day', o.created_at)::date                                  as day,
  count(distinct o.id)                                                   as orders_created,
  count(p.id)                                                            as payment_attempts,
  count(p.id) filter (where p.status = 'captured')                       as captured,
  count(p.id) filter (where p.status = 'failed')                         as failed,
  count(distinct o.id) filter (where p.id is null)                       as no_payment_row,
  round(
    100.0 * count(distinct o.id) filter (where p.status = 'captured')
          / nullif(count(distinct o.id), 0)
  , 1)                                                                   as conversion_pct
from public.payment_orders o
left join public.payments p on p.order_id = o.id
where o.created_at > now() - interval '30 days'
group by 1
order by 1 desc;

-- ---------------------------------------------------------------------------
-- 2. Unique buyers, and what they bought.
--
-- Distinct accounts with at least one captured payment. Counted here rather
-- than in analytics precisely because analytics is given no user id.
-- ---------------------------------------------------------------------------

select
  count(distinct o.user_id)                                              as unique_buyers,
  count(*) filter (where p.status = 'captured')                          as captured_payments,
  sum(p.amount_minor) filter (where p.status = 'captured') / 100.0       as gross_inr,
  count(*) filter (where p.status = 'refunded')                          as refunded,
  count(*) filter (where p.status = 'charged_back')                      as charged_back
from public.payments p
join public.payment_orders o on o.id = p.order_id
where o.user_id is not null;

-- ---------------------------------------------------------------------------
-- 3. Entitlements now in force.
-- ---------------------------------------------------------------------------

select
  e.status,
  e.reason,
  count(*) as accounts
from public.entitlements e
group by 1, 2
order by 3 desc;

-- ---------------------------------------------------------------------------
-- 4. UNCONFIRMED CHECKOUTS — an inference, not a cancellation.
--
-- An order with no captured payment, older than 30 minutes, that the
-- reconciliation sweep has already asked the provider about at least once.
--
-- Read this carefully before drawing a conclusion from it:
--
--   · It is NOT proof the customer abandoned Checkout. They may have closed
--     the tab, a bank may still be deciding, or a UPI mandate may be pending.
--   · It is NOT a failure. Nothing in these rows has been marked failed, and
--     no entitlement has been touched.
--   · `last_reconciled_at is null` means we have not checked yet, so those
--     rows are excluded — an order we never asked about says nothing.
--
-- A payment that confirms later simply leaves this list on its own.
-- ---------------------------------------------------------------------------

select
  o.provider_order_id,
  o.amount_minor / 100.0                                                 as amount_inr,
  o.created_at,
  o.last_reconciled_at,
  round(extract(epoch from (now() - o.created_at)) / 60)                 as age_minutes
from public.payment_orders o
where o.created_at < now() - interval '30 minutes'
  and o.last_reconciled_at is not null
  and not exists (
    select 1 from public.payments p
     where p.order_id = o.id
       and p.status in ('captured', 'refunded', 'charged_back')
  )
order by o.created_at desc
limit 100;

-- ---------------------------------------------------------------------------
-- 5. Webhook health — the one to check when something feels wrong.
--
-- `parked` and `failed` rows are the queue of things that need a human.
-- A growing `parked` count is the signal that an event type is arriving that
-- we do not understand, and the `last_error` says which.
-- ---------------------------------------------------------------------------

select
  status,
  count(*)                                                               as events,
  max(attempts)                                                          as worst_attempts,
  max(first_received_at)                                                 as most_recent
from public.webhook_events
group by 1
order by 2 desc;

select
  provider_event_id,
  event_type,
  status,
  attempts,
  last_error,
  first_received_at
from public.webhook_events
where status in ('parked', 'failed')
order by first_received_at desc
limit 50;

-- ---------------------------------------------------------------------------
-- 6. Disputes seen, and what we did about them.
--
-- A dispute being OPENED never revokes access — only a lost one does. These
-- rows are how you see an open dispute that still needs contesting.
-- ---------------------------------------------------------------------------

select
  event_type,
  payload_redacted ->> 'dispute_status'                                  as dispute_status,
  payload_redacted ->> 'dispute_phase'                                   as phase,
  status                                                                 as our_handling,
  first_received_at
from public.webhook_events
where event_type like 'payment.dispute.%'
order by first_received_at desc
limit 50;

-- ---------------------------------------------------------------------------
-- 7. Recovery credit — payments that only exist because of reconciliation.
--
-- Events whose id starts `reconcile:` were found by the sweep asking the
-- provider, not by a webhook. A non-zero count here means webhooks are being
-- missed, and is worth investigating even though nobody lost access.
-- ---------------------------------------------------------------------------

select
  count(*)                                                               as recovered_by_sweep,
  max(first_received_at)                                                 as most_recent
from public.webhook_events
where provider_event_id like 'reconcile:%'
  and status = 'processed';
