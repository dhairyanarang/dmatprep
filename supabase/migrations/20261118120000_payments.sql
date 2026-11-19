-- dMAT Prep — payments and entitlements.
--
-- NOT APPLIED TO ANY PROJECT. Written for an isolated local or staging project
-- only. See docs/ENTITLEMENT.md §14 for what still needs approval.
--
-- Five tables and five functions. The division of the tables is load-bearing
-- rather than decorative, and it comes from one defect found in review: an
-- earlier design stored "we have seen this event" and "we have acted on this
-- event" as the same fact, so a failed grant could never be retried.
--
--   payment_orders   append-only    our intent, and the ONLY source of ownership
--   payments         facts          one row per payment attempt; status monotonic
--   webhook_events   state machine  delivery, claim and outcome, separately
--   manual_grants    append-only    grandfathering, comps, operator revocation
--   entitlements     projection     derived; nothing writes it but recompute
--
-- The functions exist because supabase-js has no transaction API. Applying a
-- payment fact, recomputing the projection and marking the event processed must
-- be atomic, and three separate client calls are not. A plpgsql function runs
-- in one implicit transaction, so the atomicity is real rather than described.

-- ---------------------------------------------------------------------------
-- payment_orders
-- ---------------------------------------------------------------------------

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),

  -- Nullable deliberately. On account deletion this is set to null and the
  -- order survives pseudonymised: we can still answer "was this order paid, how
  -- much and when" and not "by whom". A `not null` column cannot be `set null`
  -- on delete — the clauses contradict and the delete fails.
  user_id uuid references auth.users (id) on delete set null,
  product text not null check (product in ('core-premium')),

  provider text not null check (provider in ('razorpay', 'cashfree')),
  provider_order_id text not null,

  -- Minor units. 59900 is Rs 599.00. Never a float, never a rupee decimal.
  amount_minor integer not null check (amount_minor > 0),
  currency text not null default 'INR' check (currency = upper(currency)),

  created_at timestamptz not null default now(),

  -- When reconciliation last asked the provider about this order. An order
  -- with no captured payment is only callable "unconfirmed" once we have
  -- actually looked; before that it is just an order we have not checked.
  last_reconciled_at timestamptz,

  unique (provider, provider_order_id)
);

comment on column public.payment_orders.user_id is
  'Written once, server-side, from the authenticated session. NEVER read from a webhook payload — this column is the only source of ownership.';

create index if not exists payment_orders_user_idx
  on public.payment_orders (user_id, product);

-- The reconciliation sweep's working set: oldest unchecked orders first.
create index if not exists payment_orders_reconcile_idx
  on public.payment_orders (last_reconciled_at nulls first, created_at);

-- ---------------------------------------------------------------------------
-- payments
--
-- One row per payment ATTEMPT, not per order: an order can carry a failed card
-- attempt and then a successful UPI one.
-- ---------------------------------------------------------------------------

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.payment_orders (id) on delete restrict,

  provider text not null check (provider in ('razorpay', 'cashfree')),
  provider_payment_id text not null,

  amount_minor integer not null check (amount_minor > 0),
  currency text not null default 'INR',

  status text not null default 'created'
    check (status in ('created', 'failed', 'captured', 'refunded', 'charged_back')),

  created_at timestamptz not null default now(),
  captured_at timestamptz,
  refunded_at timestamptz,
  charged_back_at timestamptz,
  updated_at timestamptz not null default now(),

  unique (provider, provider_payment_id)
);

create index if not exists payments_order_idx on public.payments (order_id);

-- Status is a lattice and moves one way only. This is what makes out-of-order
-- delivery a non-event: a `captured` arriving after a `refunded` is dropped.
-- In the database rather than in a handler, so no caller can bypass it.
create or replace function public.payment_status_rank(s text)
returns integer
language sql
immutable
as $$
  select case s
    when 'created'      then 0
    when 'failed'       then 1
    when 'captured'     then 2
    when 'refunded'     then 3
    when 'charged_back' then 4
    else -1
  end;
$$;

create or replace function public.payments_status_monotonic()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.payment_status_rank(new.status)
     < public.payment_status_rank(old.status) then
    new.status := old.status;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists payments_monotonic on public.payments;
create trigger payments_monotonic
  before update on public.payments
  for each row execute function public.payments_status_monotonic();

-- ---------------------------------------------------------------------------
-- webhook_events
--
-- A durable state machine, not a dedupe key. `pending` exists for rows the
-- reconciliation sweep enqueues; the webhook path inserts straight to
-- `processing` because it claims as it records.
-- ---------------------------------------------------------------------------

create table if not exists public.webhook_events (
  provider text not null check (provider in ('razorpay', 'cashfree')),
  -- Razorpay: x-razorpay-event-id. Cashfree: x-idempotency-header.
  provider_event_id text not null,
  event_type text not null,

  status text not null default 'pending'
    check (status in ('pending', 'processing', 'processed', 'failed', 'parked')),

  attempts integer not null default 0,
  locked_until timestamptz,
  last_error text,

  -- Proof of exactly what we received, carrying no personal data.
  body_sha256 text not null,
  -- An ALLOWLISTED subset. Never the raw body: Razorpay payloads carry contact
  -- email, phone, card last four, issuer and UPI VPA. An allowlist cannot go
  -- stale when the provider adds a field. Purged after 180 days.
  payload_redacted jsonb not null default '{}'::jsonb,

  first_received_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now(),

  primary key (provider, provider_event_id)
);

create index if not exists webhook_events_recoverable_idx
  on public.webhook_events (status, locked_until)
  where status in ('pending', 'processing', 'failed', 'parked');

-- ---------------------------------------------------------------------------
-- manual_grants — append-only. A withdrawal is a 'revoke' row, never an edit.
-- ---------------------------------------------------------------------------

create table if not exists public.manual_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null check (product in ('core-premium')),

  action text not null check (action in ('grant', 'revoke')),
  source text not null check (source in ('grandfathered', 'comp', 'support', 'fraud')),
  reason text not null,

  created_at timestamptz not null default now(),
  created_by text not null
);

create index if not exists manual_grants_user_idx
  on public.manual_grants (user_id, product, created_at desc);

-- ---------------------------------------------------------------------------
-- entitlements — a projection. Nothing writes this but recompute_entitlement.
-- ---------------------------------------------------------------------------

create table if not exists public.entitlements (
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null check (product in ('core-premium')),

  status text not null check (status in ('active', 'refunded', 'revoked')),
  -- Null means it does not expire. A one-time purchase does not. The column
  -- exists so a future time-limited product is not a migration.
  expires_at timestamptz,

  -- Why the projection currently says what it says. Diagnostic, not input.
  reason text not null,
  computed_at timestamptz not null default now(),

  primary key (user_id, product)
);

comment on table public.entitlements is
  'Derived. Recomputed from payments and manual_grants by recompute_entitlement; never mutated incrementally. If it is ever wrong, re-running the function fixes it.';

-- ---------------------------------------------------------------------------
-- recompute_entitlement
--
-- A pure function of the stored facts, so duplication and ordering cannot
-- produce a wrong result. Called by every write path. Takes the row lock first,
-- which serialises concurrent recomputes for the same (user, product) — and
-- handles first-time creation, where no row exists yet.
-- ---------------------------------------------------------------------------

create or replace function public.recompute_entitlement(p_user_id uuid, p_product text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_manual        text;
  v_has_captured  boolean;
  v_has_refunded  boolean;
  v_has_chargeback boolean;
  v_status        text;
  v_reason        text;
begin
  if p_user_id is null then
    return null;
  end if;

  -- Ensure the row exists, then lock it. Both halves matter: the insert makes
  -- first-time creation work, the lock makes two concurrent recomputes safe.
  insert into public.entitlements (user_id, product, status, reason)
  values (p_user_id, p_product, 'revoked', 'bootstrap')
  on conflict (user_id, product) do nothing;

  perform 1 from public.entitlements
   where user_id = p_user_id and product = p_product
     for update;

  select mg.action into v_manual
    from public.manual_grants mg
   where mg.user_id = p_user_id and mg.product = p_product
   order by mg.created_at desc, mg.id desc
   limit 1;

  select
    bool_or(p.status = 'captured'),
    bool_or(p.status = 'refunded'),
    bool_or(p.status = 'charged_back')
    into v_has_captured, v_has_refunded, v_has_chargeback
    from public.payments p
    join public.payment_orders o on o.id = p.order_id
   where o.user_id = p_user_id and o.product = p_product;

  -- Precedence: an operator revocation beats everything (fraud); otherwise a
  -- captured payment beats a refunded one (refunded order A, bought again as
  -- order B); otherwise the worst recorded outcome explains the absence.
  if v_manual = 'revoke' then
    v_status := 'revoked';  v_reason := 'manual-revoke';
  elsif coalesce(v_has_captured, false) then
    v_status := 'active';   v_reason := 'captured-payment';
  elsif v_manual = 'grant' then
    v_status := 'active';   v_reason := 'manual-grant';
  elsif coalesce(v_has_chargeback, false) then
    v_status := 'revoked';  v_reason := 'charged-back';
  elsif coalesce(v_has_refunded, false) then
    v_status := 'refunded'; v_reason := 'refunded';
  else
    v_status := 'revoked';  v_reason := 'no-qualifying-payment';
  end if;

  update public.entitlements
     set status = v_status, reason = v_reason, computed_at = now()
   where user_id = p_user_id and product = p_product;

  return v_status;
end;
$$;

-- ---------------------------------------------------------------------------
-- claim_webhook_event
--
-- Insert-or-claim, atomically, in one statement. A primary-key collision alone
-- cannot distinguish "already done" from "recorded but never processed", which
-- is precisely the defect this design exists to fix.
--
-- Returns the outcome: 'claimed' | 'already_processed' | 'parked' | 'locked'.
-- ---------------------------------------------------------------------------

create or replace function public.claim_webhook_event(
  p_provider text,
  p_event_id text,
  p_event_type text,
  p_body_sha256 text,
  p_payload jsonb,
  p_lock_seconds integer default 60
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claimed boolean := false;
  v_status  text;
begin
  insert into public.webhook_events as we
    (provider, provider_event_id, event_type, body_sha256, payload_redacted,
     status, attempts, locked_until)
  values
    (p_provider, p_event_id, p_event_type, p_body_sha256, p_payload,
     'processing', 1, now() + make_interval(secs => p_lock_seconds))
  on conflict (provider, provider_event_id) do update
     set status       = 'processing',
         attempts     = we.attempts + 1,
         locked_until = now() + make_interval(secs => p_lock_seconds),
         last_error   = null,
         updated_at   = now()
   where we.status in ('pending', 'failed')
      or (we.status = 'processing' and we.locked_until < now())
  returning true into v_claimed;

  if coalesce(v_claimed, false) then
    return 'claimed';
  end if;

  -- Zero rows is ambiguous — processed, parked, or a live lock. Returning 200
  -- for all three would be the original bug. Read the row and say which.
  select we.status into v_status
    from public.webhook_events we
   where we.provider = p_provider and we.provider_event_id = p_event_id;

  if v_status = 'processed' then return 'already_processed';
  elsif v_status = 'parked' then return 'parked';
  else return 'locked';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- apply_payment_event
--
-- TXN 2 in one call: resolve ownership, apply the payment fact, recompute the
-- projection, mark the event processed. All or nothing.
--
-- Ownership comes from payment_orders and nowhere else. No order row, a null
-- user_id, or an amount that does not match means the event is parked rather
-- than guessed at.
-- ---------------------------------------------------------------------------

create or replace function public.apply_payment_event(
  p_provider text,
  p_event_id text,
  p_provider_order_id text,
  p_provider_payment_id text,
  p_status text,
  p_amount_minor integer
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order  public.payment_orders;
  v_now    timestamptz := now();
begin
  select * into v_order
    from public.payment_orders o
   where o.provider = p_provider and o.provider_order_id = p_provider_order_id;

  if not found then
    return 'park:unknown-order';
  end if;

  if v_order.user_id is null then
    -- Paid, then the account was deleted. The fact is worth nothing to grant.
    return 'park:order-has-no-owner';
  end if;

  if p_amount_minor is not null and p_amount_minor <> v_order.amount_minor then
    return 'park:amount-mismatch';
  end if;

  -- `as p` matters. Inside ON CONFLICT DO UPDATE the existing row is referenced
  -- by the target's name or alias, never schema-qualified: `public.payments.x`
  -- there is a reference to a range-table entry that does not exist under that
  -- name. plpgsql does not resolve column references at CREATE FUNCTION time,
  -- so the migration would have applied cleanly and the FIRST REAL PAYMENT
  -- would have failed. `claim_webhook_event` already uses the alias form.
  insert into public.payments as p
    (order_id, provider, provider_payment_id, amount_minor, currency, status,
     captured_at, refunded_at, charged_back_at)
  values
    (v_order.id, p_provider, p_provider_payment_id,
     coalesce(p_amount_minor, v_order.amount_minor), v_order.currency, p_status,
     case when p_status = 'captured' then v_now end,
     case when p_status = 'refunded' then v_now end,
     case when p_status = 'charged_back' then v_now end)
  on conflict (provider, provider_payment_id) do update
     set status          = excluded.status,  -- the monotonic trigger arbitrates
         captured_at     = coalesce(p.captured_at, excluded.captured_at),
         refunded_at     = coalesce(p.refunded_at, excluded.refunded_at),
         charged_back_at = coalesce(p.charged_back_at, excluded.charged_back_at);

  perform public.recompute_entitlement(v_order.user_id, v_order.product);

  update public.webhook_events
     set status = 'processed', processed_at = v_now, locked_until = null,
         last_error = null, updated_at = v_now
   where provider = p_provider and provider_event_id = p_event_id;

  return 'processed';
end;
$$;

-- ---------------------------------------------------------------------------
-- settle_webhook_event — record a failure without touching the payment facts.
--
-- The attempt cap lives here rather than in the handler, deliberately: it is a
-- policy about one event versus the endpoint, and it must hold however the
-- event was driven. A `failed` row that has been tried `p_max_attempts` times
-- is promoted to `parked`, so the handler can answer 200 and stop Razorpay
-- retrying. Without that, one permanently-failing event returns 500 for 24
-- hours and Razorpay DISABLES the webhook — breaking every future payment
-- rather than only the bad one.
--
-- Returns the status it settled on, so the caller knows which HTTP to send.
-- ---------------------------------------------------------------------------

create or replace function public.settle_webhook_event(
  p_provider text,
  p_event_id text,
  p_status text,
  p_error text,
  p_max_attempts integer default 5
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempts integer;
  v_final    text := p_status;
begin
  select attempts into v_attempts
    from public.webhook_events
   where provider = p_provider and provider_event_id = p_event_id;

  if p_status = 'failed' and coalesce(v_attempts, 0) >= p_max_attempts then
    v_final := 'parked';
  end if;

  update public.webhook_events
     set status = v_final,
         last_error = p_error,
         locked_until = null,
         -- 'processed' is used for events we understand and have fully handled
         -- without a payment fact to apply — a dispute being opened, or won.
         -- They are finished, not failed, and must not sit in the sweep's queue.
         processed_at = case when v_final = 'processed' then now() else processed_at end,
         updated_at = now()
   where provider = p_provider and provider_event_id = p_event_id;

  return v_final;
end;
$$;

-- ---------------------------------------------------------------------------
-- orders_awaiting_confirmation
--
-- Orders we created, old enough that a successful payment should have been
-- confirmed by now, for which we hold no captured payment. This is the
-- reconciliation sweep's working set, and it is the answer to the failure that
-- matters most: the customer paid, the webhook never arrived, and they never
-- came back to the site. Nothing local knows — but we still hold the order id,
-- and the provider can be asked about it directly.
--
-- Ordered oldest-unchecked-first so a bounded run cannot starve any order.
-- ---------------------------------------------------------------------------

create or replace function public.orders_awaiting_confirmation(
  p_min_age_minutes integer default 2,
  p_limit integer default 25
)
returns table (
  provider text,
  provider_order_id text,
  amount_minor integer,
  created_at timestamptz,
  last_reconciled_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select o.provider, o.provider_order_id, o.amount_minor, o.created_at, o.last_reconciled_at
    from public.payment_orders o
   where o.user_id is not null
     and o.created_at < now() - make_interval(mins => p_min_age_minutes)
     and not exists (
       select 1 from public.payments p
        where p.order_id = o.id
          and p.status in ('captured', 'refunded', 'charged_back')
     )
   order by o.last_reconciled_at asc nulls first, o.created_at asc
   limit p_limit;
$$;

-- ---------------------------------------------------------------------------
-- mark_order_reconciled — records that we asked the provider about this order.
-- ---------------------------------------------------------------------------

create or replace function public.mark_order_reconciled(
  p_provider text,
  p_provider_order_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.payment_orders
     set last_reconciled_at = now()
   where provider = p_provider and provider_order_id = p_provider_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- purge_webhook_payloads — retention. Keeps the hash and the ids, drops the
-- redacted payload once its dispute value has expired.
-- ---------------------------------------------------------------------------

create or replace function public.purge_webhook_payloads(p_days integer default 180)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  with purged as (
    update public.webhook_events
       set payload_redacted = '{}'::jsonb
     where first_received_at < now() - make_interval(days => p_days)
       and payload_redacted <> '{}'::jsonb
    returning 1
  )
  select count(*) into v_count from purged;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security.
--
-- The central feature is what is ABSENT: there is no INSERT, UPDATE or DELETE
-- policy on any of these five tables, and no policy at all on webhook_events or
-- manual_grants. With RLS enabled and no policy, every write by `anon` and
-- `authenticated` is refused. Writes happen only through the service role,
-- which bypasses RLS — so ownership is verified in the functions above, not
-- here. On the write path RLS is not a second line of defence; there is none.
-- ---------------------------------------------------------------------------

alter table public.payment_orders enable row level security;
alter table public.payments       enable row level security;
alter table public.webhook_events enable row level security;
alter table public.manual_grants  enable row level security;
alter table public.entitlements   enable row level security;

drop policy if exists "entitlements are self-readable" on public.entitlements;
create policy "entitlements are self-readable"
  on public.entitlements for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "orders are self-readable" on public.payment_orders;
create policy "orders are self-readable"
  on public.payment_orders for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "payments are self-readable" on public.payments;
create policy "payments are self-readable"
  on public.payments for select to authenticated
  using (exists (
    select 1 from public.payment_orders o
     where o.id = public.payments.order_id
       and o.user_id = (select auth.uid())
  ));

-- The functions are security definer and must not be callable by a client.
-- Only the service role invokes them.
revoke all on function public.recompute_entitlement(uuid, text) from public, anon, authenticated;
revoke all on function public.claim_webhook_event(text, text, text, text, jsonb, integer) from public, anon, authenticated;
revoke all on function public.apply_payment_event(text, text, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.settle_webhook_event(text, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.purge_webhook_payloads(integer) from public, anon, authenticated;
revoke all on function public.mark_order_reconciled(text, text) from public, anon, authenticated;
revoke all on function public.orders_awaiting_confirmation(integer, integer) from public, anon, authenticated;
revoke all on function public.payment_status_rank(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- …and grant them back to the one role that must call them.
--
-- Revoking EXECUTE from PUBLIC removes it from every role that held it only
-- through PUBLIC. Supabase's default privileges normally grant functions to
-- `service_role` explicitly at creation, which would survive the revoke — but
-- "normally" is not a thing to bet a payment system on, and an explicit grant
-- is idempotent if the privilege is already there.
--
-- Without this, every RPC answers `permission denied for function`, and so
-- does the monotonic trigger: `payments_status_monotonic` is not SECURITY
-- DEFINER, so it calls `payment_status_rank` as the invoking role.
-- ---------------------------------------------------------------------------

grant execute on function public.recompute_entitlement(uuid, text) to service_role;
grant execute on function public.claim_webhook_event(text, text, text, text, jsonb, integer) to service_role;
grant execute on function public.apply_payment_event(text, text, text, text, text, integer) to service_role;
grant execute on function public.settle_webhook_event(text, text, text, text, integer) to service_role;
grant execute on function public.purge_webhook_payloads(integer) to service_role;
grant execute on function public.mark_order_reconciled(text, text) to service_role;
grant execute on function public.orders_awaiting_confirmation(integer, integer) to service_role;
grant execute on function public.payment_status_rank(text) to service_role;
