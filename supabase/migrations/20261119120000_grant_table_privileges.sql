-- dMAT Prep — table privileges.
--
-- NOT APPLIED. Drafted for review; `npx supabase db push` has not been run
-- since this file was created.
--
-- ---------------------------------------------------------------------------
-- Why this is needed
-- ---------------------------------------------------------------------------
--
-- The first three migrations create ten tables, enable row level security on
-- all of them, and write fifteen policies. On `dmatprep-pilot` every one of
-- those tables is unreachable by every role:
--
--     GET /rest/v1/profiles  →  403  42501  permission denied for table profiles
--     hint: GRANT SELECT ON public.profiles TO service_role;
--
-- RLS policies decide WHICH ROWS a role may touch. They do not grant the right
-- to touch the table at all — that is a separate GRANT, and nothing in the
-- first three migrations issues one. Production never showed this because its
-- tables were created through a path where Supabase's default privileges
-- applied; the CLI's migration role does not own those defaults, so tables
-- created by `db push` inherit nothing.
--
-- The function grants added to the payments migration work for exactly this
-- reason — they are explicit. This does the same for tables.
--
-- ---------------------------------------------------------------------------
-- The rule: privilege mirrors policy
-- ---------------------------------------------------------------------------
--
-- For `anon` and `authenticated`, every grant below has a matching RLS policy
-- in an earlier migration, and every policy has a matching grant. Nothing else
-- is granted. So:
--
--   · `attempts` gets SELECT, INSERT, DELETE and NOT update — there is no
--     update policy, because an attempt is a statement about something that
--     already happened. Two layers now say so.
--   · `webhook_events` and `manual_grants` get nothing for either role: they
--     carry no policy at all, which is what makes them server-only.
--   · the three payment tables with a self-read policy get SELECT and nothing
--     more. A client can see what it bought. It can never write a payment
--     fact or an entitlement.
--   · `anon` gets nothing anywhere. No policy in this schema references it —
--     guests keep their progress in their own browser and never reach these
--     tables. The explicit revoke below states that rather than relying on it.
--
-- `service_role` is different: it bypasses RLS, so a policy cannot bound it.
-- It gets the minimum the server code actually performs, verb by verb, and
-- nothing on the progress tables, where no server code operates today.
--
-- Nothing here disables RLS, adds a policy, or widens an existing one.

-- ---------------------------------------------------------------------------
-- anon — nothing, stated explicitly.
--
-- Idempotent and defensive: if a future Supabase default ever grants to anon,
-- re-running this migration takes it back.
-- ---------------------------------------------------------------------------

revoke all on public.profiles          from anon;
revoke all on public.sessions          from anon;
revoke all on public.attempts          from anon;
revoke all on public.question_exposure from anon;
revoke all on public.user_state        from anon;
revoke all on public.payment_orders    from anon;
revoke all on public.payments          from anon;
revoke all on public.webhook_events    from anon;
revoke all on public.manual_grants     from anon;
revoke all on public.entitlements      from anon;

-- ---------------------------------------------------------------------------
-- authenticated — progress. Each grant mirrors a policy in
-- 20260813120000_init_progress.sql.
-- ---------------------------------------------------------------------------

-- Read, create and update your own display identity. Rows are created by the
-- `handle_new_user` trigger; no client code writes here today, but the policies
-- allow it and the grant matches them.
grant select, insert, update on public.profiles to authenticated;

-- A session is a live working document: created, updated as you move through
-- it, frozen on completion, and deletable as part of your own history.
grant select, insert, update, delete on public.sessions to authenticated;

-- Append-only. NO UPDATE, deliberately — `attempts` has no update policy, and
-- rewriting an attempt would silently change every derived figure in the
-- product. The client's upsert uses ON CONFLICT DO NOTHING
-- (`ignoreDuplicates: true`), so INSERT alone is sufficient for a safe retry.
grant select, insert, delete on public.attempts to authenticated;

-- Upserted per (user, question, context) as questions are shown.
grant select, insert, update, delete on public.question_exposure to authenticated;

-- A small document, replaced wholesale.
grant select, insert, update on public.user_state to authenticated;

-- ---------------------------------------------------------------------------
-- authenticated — payments. READ ONLY, and only the three tables that carry a
-- self-read policy.
--
-- This is the line that matters most in this file. A signed-in user may see
-- their own orders, their own payments and their own entitlement. They may not
-- insert, update or delete any of them, so they cannot grant themselves Pro,
-- cannot mark a refund reversed, and cannot alter an amount. Those writes
-- happen only inside SECURITY DEFINER functions, reached only by the service
-- role, and only after a verified provider signature.
-- ---------------------------------------------------------------------------

grant select on public.payment_orders to authenticated;
grant select on public.payments       to authenticated;
grant select on public.entitlements   to authenticated;

-- `webhook_events` and `manual_grants` are deliberately absent. They carry no
-- policy, and a client has no business reading the provider's raw event ledger
-- or the record of who was comped.

-- ---------------------------------------------------------------------------
-- service_role — exactly what the server code performs.
--
-- Every verb below corresponds to a `.from(...)` call in
-- `lib/payments/server.ts`. The writes that are NOT listed — inserting a
-- payment, transitioning a webhook event, recomputing an entitlement — happen
-- inside SECURITY DEFINER functions that run as their owner, so the service
-- role needs no table privilege for them. Granting it anyway would widen the
-- blast radius of a leaked key for no benefit.
-- ---------------------------------------------------------------------------

-- createOrderForUser: writes the ownership record; applyCheckoutReturn reads it.
grant select, insert on public.payment_orders to service_role;

-- orderIdForPayment: resolves a refund or dispute back to its order.
grant select on public.payments to service_role;

-- reconcile: finds events that failed, parked, or died holding a lock.
grant select on public.webhook_events to service_role;

-- recordManualGrant: grandfathering, comps, operator revocation.
grant select, insert on public.manual_grants to service_role;

-- readEntitlementStatus / hasPremiumAccess: the access check.
grant select on public.entitlements to service_role;

-- NOT granted to service_role: the five progress tables. No server-side code
-- reads or writes them — the browser does, as `authenticated`, under RLS. If a
-- support or account-deletion tool ever needs them, that is a deliberate grant
-- in its own migration, reviewed on its own merits.
