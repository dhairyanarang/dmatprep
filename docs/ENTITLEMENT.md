# Entitlement architecture — proposal

**This is a proposal and nothing in it has been applied.** No table exists, no
migration file has been written, no RLS policy has been added, no service-role
key exists in any environment, and no payment route exists. The brief requires
that the schema, the RLS policies, the privileged server-side operations and the
rollback plan be presented for explicit approval **before** any of that is
created. This document is that presentation.

Written against Razorpay's verified webhook contract (`docs/RAZORPAY.md` §10),
the commercial model in `docs/MONETISATION.md`, and the existing schema in
`supabase/migrations/20260813120000_init_progress.sql`.

---

## 1. The one rule

**Hiding content in the UI, in a client-side flag, in `localStorage`, or behind
an obscure public URL is not access control.** Every premium byte must be
withheld by a server that has checked an entitlement row, and released only
after it has.

The product currently violates the spirit of this on purpose and says so:
`public/solutions/*.json` is a predictable public URL, which `docs/CONTENT_EXPOSURE.md`
calls "hygiene, not protection". That is the right call for a free bank. It is
the wrong call for anything sold, and the distinction is the whole reason this
architecture exists.

A second, weaker rule follows from the first: **the client may know what is
locked, but may never decide it.** A lock icon rendered from a cached local flag
is good UI. The same flag deciding whether bytes are served is a bug.

---

## 2. Three things this breaks, stated before the design

Honest accounting first, because two of these are conventions this repository
currently states as absolutes.

### 2.1 "Nothing is ever gated behind sign-in" stops being true

`CLAUDE.md` says: *"Signing in adds durability across devices and nothing else;
nothing is ever gated behind it."* An entitlement is attached to an account. A
purchase therefore requires an account, and premium content is gated behind
sign-in by construction.

There is no way around this that is not worse. An entitlement keyed on anything
other than an authenticated user — a device, a local token, an email with no
password — is an entitlement that can be copied, and the brief is explicit that
client-held flags are not access control.

**What survives, and should be written into the convention rather than quietly
dropped:** the *free* product stays exactly as it is — every route static, guest
mode first-class, no sign-in affordance, 150 Core questions with complete
explanations and full progress tracking, all with no account. Sign-in becomes
required for **purchase and for premium only**. That is a narrowing of the
convention, not its abandonment, and it needs the operator's sign-off because it
contradicts a documented rule.

### 2.2 The product gains request-time surface

Every route is prerendered and `app/auth/callback/route.ts` is the only
request-time handler in the product. This design adds three more (§6), and a
scheduled job. The static-route invariant becomes "every *page* is static",
which is a weaker and more ordinary claim.

### 2.3 Entitlement is the one thing that is not local-first

`CLAUDE.md`: *"The local store is the render source, signed in or not"*, and
answering a question never waits on the network. **Entitlement inverts that.**
A cached copy may drive the interface, but content is released by the server, on
the request, every time. A stale local entitlement must never serve a byte.

---

## 3. Proposed schema

Three tables. The shape deliberately mirrors the existing one: a record of
something that happened is immutable and append-only; anything mutable is small
and has an explicit owner.

```
  payments          append-only    one row per provider payment, ever
  webhook_events    append-only    one row per provider event id — the dedupe ledger
  entitlements      mutable        what a user is currently allowed, with an audit trail
```

### 3.1 `payments` — immutable, the local shadow of the provider's record

```sql
create table public.payments (
  -- Our own id, minted server-side. Not the provider's, because the provider's
  -- id does not exist yet when an order is created.
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,

  provider text not null check (provider in ('razorpay', 'cashfree')),
  provider_order_id text not null,
  provider_payment_id text,

  -- Minor units. 59900 is ₹599.00. Never a float, never a rupee decimal.
  amount_minor integer not null check (amount_minor > 0),
  currency text not null default 'INR' check (currency = upper(currency)),
  product text not null check (product in ('core-premium')),

  status text not null default 'created'
    check (status in ('created', 'captured', 'failed', 'refunded', 'charged_back')),

  created_at timestamptz not null default now(),
  captured_at timestamptz,
  refunded_at timestamptz,

  -- What the provider actually sent, kept verbatim for dispute and audit. This
  -- is the only place a raw provider payload is retained.
  provider_payload jsonb,

  unique (provider, provider_order_id)
);
```

Notes on choices that are not obvious:

- **`on delete restrict`, not `cascade`.** Every other table in this schema
  cascades from `auth.users`, which is right for progress — deleting an account
  should take its practice history with it. A payment is a financial record and
  deleting it on account deletion would destroy the evidence for a refund or a
  chargeback that is still live. This creates a real tension with the DPDP Act's
  erasure expectations and it is a question for the lawyer, recorded in §11.
- **`amount_minor` is stored**, and it is the server's figure, never the
  client's. The amount sent to the provider and the amount checked on the
  webhook both come from server config. A client that asks to pay ₹1 for a
  ₹599 product is refused at order creation, not at reconciliation.
- **`unique (provider, provider_order_id)`** is what makes order creation
  retry-safe.

### 3.2 `webhook_events` — the dedupe ledger

```sql
create table public.webhook_events (
  provider text not null check (provider in ('razorpay', 'cashfree')),
  -- Razorpay: x-razorpay-event-id. Cashfree: x-idempotency-header.
  provider_event_id text not null,

  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  -- Set when handling threw. A row that is received but never processed is the
  -- thing a human needs to see.
  error text,
  payload jsonb not null,

  primary key (provider, provider_event_id)
);
```

**This table is the answer to at-least-once delivery.** The handler inserts
here first. A primary-key collision *is* the duplicate check — it needs no read,
no lock and no application logic, and it is correct under concurrent delivery of
the same event, which a read-then-write is not.

### 3.3 `entitlements` — what a user may currently do

```sql
create table public.entitlements (
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null check (product in ('core-premium')),

  status text not null default 'active'
    check (status in ('active', 'refunded', 'revoked')),

  granted_at timestamptz not null default now(),
  -- Null means it does not expire. A one-time purchase does not. The column
  -- exists so a future time-limited product is not a migration.
  expires_at timestamptz,

  -- Why this exists at all. 'purchase' is the normal case; the others are the
  -- ones that must be auditable years later.
  source text not null default 'purchase'
    check (source in ('purchase', 'grandfathered', 'manual', 'comp')),

  -- The payment that bought it. Null for a grandfathered or comped grant, which
  -- is exactly why this is nullable and why `source` is not derivable from it.
  payment_id uuid references public.payments (id) on delete set null,

  revoked_at timestamptz,
  revoked_reason text,

  updated_at timestamptz not null default now(),

  primary key (user_id, product)
);
```

**`status`, not deletion.** A refunded or charged-back entitlement is set to
`refunded` or `revoked` and keeps its row. Deleting it would erase the fact that
the user once had access, which is the first thing anyone asks about in a
dispute.

**The access check is `status = 'active' and (expires_at is null or expires_at > now())`,
evaluated on the server.** Nowhere else.

---

## 4. Proposed RLS policies

The existing schema's rule — policies scoped `to authenticated`, `user_id`
defaulting to `auth.uid()`, with-check clauses refusing a forged owner — is kept
for reads. **Writes are different, and deliberately so.**

```sql
alter table public.payments       enable row level security;
alter table public.webhook_events enable row level security;
alter table public.entitlements   enable row level security;

-- entitlements: a user may read their own row. Nothing else.
create policy "entitlements are self-readable"
  on public.entitlements for select to authenticated
  using ((select auth.uid()) = user_id);

-- payments: a user may read their own payment history, for a receipts page.
create policy "payments are self-readable"
  on public.payments for select to authenticated
  using ((select auth.uid()) = user_id);

-- webhook_events: no policy at all.
```

**There is no INSERT, UPDATE or DELETE policy on any of the three tables, and
that is the design, not an omission.** With RLS enabled and no policy, every
write by `anon` and `authenticated` is refused. Writes happen only through the
service role, which bypasses RLS. A user cannot grant themselves an entitlement,
cannot alter the amount of a payment, and cannot mark a refund as reversed,
because no policy exists under which any of those would be permitted.

`webhook_events` has **no policy whatsoever**, so it is invisible to every
client role. It holds raw provider payloads and belongs to the server alone.

This mirrors the `attempts` convention — *"There is no update policy on the
table"* — generalised: **the absence of a policy is the security control.**

### 4.1 One thing to get right that is easy to miss

The service-role key bypasses RLS entirely, so **every privileged write must
re-check the owner in application code.** RLS is not a second line of defence
on these tables; on the write path there is no first line. A handler that writes
`entitlements` for a `user_id` it took from a request body, rather than from a
verified payment record, is an authorisation bug that no policy will catch.

---

## 5. Privileged server-side operations

Four, and no more. Each runs only in a route handler or a scheduled job, each
needs the service-role key, and none of them is reachable from the browser.

| # | Operation | Trigger | Idempotency key |
|---|---|---|---|
| 1 | **Create order** — mint a `payments` row at `created`, ask the provider for an order id | Buyer clicks Buy | `(provider, provider_order_id)` |
| 2 | **Grant** — mark the payment `captured`, upsert `entitlements` to `active` | Webhook, fetch-on-return, or sweep | `(user_id, product)` |
| 3 | **Revoke** — set `refunded` or `revoked`, stamp reason and time | Refund or chargeback webhook, or operator action | `(user_id, product)` |
| 4 | **Serve premium content** — release bytes after checking the entitlement | Authenticated content request | n/a, read-only |

**All three write paths into operation 2 call the same function.** That is the
single most important structural decision here: the webhook, the
fetch-on-return check and the reconciliation sweep do not each implement
granting. They race freely, and the upsert makes the race harmless.

### 5.1 The service-role key

- Lives in the server environment only. **Never** prefixed `NEXT_PUBLIC_`.
- Is not in `.env.example`, is not committed, and is not pasted into this
  repository, a document, or a chat.
- Is read in exactly one module, which the adapter boundary (§8) keeps small.
- A lint rule or build-time assertion should fail the build if a
  `SUPABASE_SERVICE_ROLE_KEY` reference appears in any client component. Cheap,
  and the failure mode it prevents is total.

---

## 6. The request-time surface

Three route handlers and one job.

```
POST /api/checkout/order     create an order, return the provider order id
POST /api/webhooks/razorpay  verify, dedupe, grant or revoke
GET  /api/content/solutions  release premium solutions after an entitlement check
     (scheduled)             reconciliation sweep
```

### 6.1 `POST /api/webhooks/razorpay`

The shape is fixed by the verified contract in `docs/RAZORPAY.md` §10, and three
of its properties dictate the order of the steps below.

```
1. const raw = await request.text()          // RAW. Before any parsing.
2. verify HMAC-SHA256(raw, secret) against the X-Razorpay-Signature header
      → mismatch: 400, log, write nothing
3. const event = JSON.parse(raw)             // only now
4. insert into webhook_events (provider, provider_event_id, ...)
      → primary-key collision: this is a duplicate. Return 200 immediately.
5. grant / revoke, by event type, via the shared idempotent function
6. stamp processed_at
7. return 200
```

- **Step 1 is the trap.** Razorpay's own Node sample re-serialises a parsed body
  with `JSON.stringify`, which does not reproduce the signed bytes. Copying it
  produces verification that passes in testing and fails intermittently in
  production. See `docs/RAZORPAY.md` §10.1.
- **Step 2 before step 3.** An unverified payload is not parsed, not logged in
  full, and never reaches the database.
- **Step 4 before step 5.** The insert *is* the duplicate check.
- **Steps 1–7 must finish inside 5 seconds.** Razorpay treats a slower response
  as a timeout and resends even if the work completed. Nothing slow — no email,
  no analytics call, no PDF — goes in front of the 200.
- **Out-of-order events are expected.** A `refunded` arriving before its
  `captured` must not produce an active entitlement. The grant function
  therefore refuses to move an entitlement from `refunded` back to `active`
  unless a later payment justifies it; status transitions are checked, not
  assumed.

### 6.2 `GET /api/content/solutions`

Reads the Supabase session from cookies, checks the entitlement, and returns
premium solutions only if it is active. Free solutions keep coming from
`public/solutions/*.json` exactly as today — no change, no regression, and no
network dependency added to the free product.

**The split this requires in content.** `content/access/free-set.json` already
names the 150 free ids and is hash-locked by a test. `scripts/build:solutions`
would gain a third output: free solutions to `public/solutions/` as now, premium
solutions to a server-only path that is **not** under `public/`.

**And the thing that must be said plainly:** the 234 premium Core questions have
been in a public Git repository since August. Serving them from behind a check
does not make them secret — it makes the *product* coherent. The architecture is
built properly because the next content will not be public, not because this
content can be recovered.

---

## 7. Failure, refunds and the cases that actually bite

| Case | What happens |
|---|---|
| **Duplicate webhook** | PK collision on `webhook_events`, 200, no second grant |
| **Out-of-order webhook** | Status transitions are checked; `refunded` cannot be overwritten by a late `captured` |
| **Webhook never arrives** | Fetch-on-return grants it when the buyer lands back |
| **Webhook disabled after 24h** | The sweep grants it. Without the sweep this is a silent outage — see below |
| **User pays, never returns** | The sweep grants it |
| **Refund** | `payments.status = 'refunded'`, entitlement → `refunded`, access ends at once |
| **Chargeback** | `charged_back` / `revoked`, with `revoked_reason` |
| **Two devices, same purchase** | One entitlement row per `(user_id, product)`. The upsert is the whole mechanism |
| **Signature mismatch** | 400, nothing written, logged for investigation |
| **Our database down during webhook** | Non-2xx → Razorpay retries with backoff for 24h |
| **Down for over 24 hours** | **Webhook is disabled.** Only the sweep recovers it |

**The sweep is not optional.** Razorpay disables a webhook after 24 hours of
failures and notifies only the Alert Email Address. Between that moment and
someone reading that mailbox, every purchase succeeds at Razorpay and grants
nothing. The customer has paid and has no access, and no part of the product
knows. `docs/PAYMENTS.md` §6 records this as the accepted cost of choosing
Razorpay over Cashfree; the sweep is how that cost is paid.

The sweep: list payments captured at the provider in the last N days, find ones
with no `active` entitlement locally, grant through the shared function. It is
provider-independent by construction, since it asks the adapter rather than the
provider.

---

## 8. Keeping the provider swappable

Required by the brief, and cheap only if designed in from the first line.

- **No provider name in a column name.** `provider`, `provider_order_id`,
  `provider_payment_id` are values. `razorpay_payment_id` would be a migration
  on the day we switch.
- **One adapter interface**, four operations: `createOrder`,
  `verifyWebhook(raw, headers)`, `fetchPaymentStatus`, `refund`. Everything
  provider-shaped lives behind it — the raw-body rule, hex versus base64, the
  header names, the timestamp-prefixed signing Cashfree uses.
- **No provider SDK imported outside the adapter**, enforced by a lint rule.
- **Retry and disable behaviour is not hideable.** It is why the sweep exists,
  and the sweep is provider-independent anyway.

One provider is implemented. Cashfree's minimums are recorded in
`docs/RAZORPAY.md` §14 so a switch is a bounded change.

---

## 9. Rollback plan

Presented because the brief requires it, and the honest version has two halves
that are not equally easy.

### 9.1 Before the first live payment — a clean drop

```sql
drop table if exists public.entitlements;
drop table if exists public.webhook_events;
drop table if exists public.payments;
```

Nothing references these tables, no existing table gains a column, and no
existing policy, trigger or function is modified. **The migration is purely
additive**, so rolling it back cannot damage progress data. This is the
strongest argument for applying it to a local or staging project first and
leaving production untouched until the whole flow has been exercised.

### 9.2 After the first live payment — not a drop

Once real money has moved, these tables hold financial records and a drop
destroys them. Rollback then means: restore from a point-in-time backup, then
**re-derive state from the provider**, which is the actual system of record for
payments. That is the reason the sweep in §7 is worth building well — it is also
the disaster-recovery path.

**Confirm Supabase's point-in-time-recovery availability on the current plan
before the first live payment**, not after. On the free tier, daily backups may
be the only option, and "we can roll back" would be a claim that has not been
checked.

### 9.3 Staging first

The brief forbids production schema changes, and the design does not need one.
Everything in §6 can be built and exercised against a local Supabase stack and
Razorpay **test** keys, which need only a sign-up (`docs/RAZORPAY.md` §12).
Note the standing blocker: `docs/INFRASTRUCTURE.md` records that **no container
runtime is installed**, so the local Supabase stack cannot currently be started.
That is unchanged and it blocks this the same way it blocks auth QA.

---

## 10. What this is approval for

Nothing is built until these are answered. The first four are the operator's;
the fifth is a lawyer's.

1. **Approve the three tables and the no-write-policy RLS model** in §3 and §4,
   to be applied to a **local or staging** project only.
2. **Accept that sign-in becomes required for purchase and premium** — §2.1 —
   and that `CLAUDE.md`'s "nothing is ever gated behind it" is narrowed to the
   free product, deliberately and in writing.
3. **Decide grandfathering** — §3.3 has a `source` column holding
   `grandfathered` precisely because this is a column either way, and it cannot
   be added after the fact without guessing who was there first.
4. **Settle the price**, because `amount_minor` is server-side config and
   because Razorpay will not issue live keys without a Pricing details page
   (`docs/RAZORPAY.md` §5).
5. **The `on delete restrict` question in §3.1** — a deleted account's payment
   records must survive for dispute and audit, which sits awkwardly against the
   DPDP Act's erasure expectations. This is a real conflict between two
   legitimate requirements and it is a lawyer's call, not a schema preference.
   Added to `docs/legal/LEGAL_BRIEF.md` §6's questions for counsel.

---

## 11. Implementation plan — what gets built, in what order

**Nothing in this plan starts until §10 is approved.** It is here so the
approval is informed by what it authorises.

### Phase 0 — nothing to approve, nothing to install

Can start today and depends on no decision:

- **Razorpay test-mode sign-up.** Test keys need no KYC, no activation and no
  website (`docs/RAZORPAY.md` §12). Keys go in `.env.local`, which is
  git-ignored, and nowhere else. **No key, test or live, is ever pasted into a
  file in this repository, a document, or a chat.**
- **`.env.example` gains the variable *names*** and no values.

### Phase 1 — the adapter, against a mock, with no provider at all

The highest-value work, and it needs neither approval nor a provider:

- The adapter interface (§8) and a **mock provider** implementing all four
  operations in memory.
- The idempotent grant/revoke function, pure, against an in-memory store.
- **Tests for the cases that cannot be reproduced on demand against a real
  provider**: duplicate event, out-of-order refund-before-capture, a
  signature mismatch, a timeout mid-grant, a double grant from webhook and
  sweep racing. These are the whole correctness argument, and a sandbox makes
  them *harder* to test, not easier.
- A signature-verification test using known-good fixtures, which is where the
  `JSON.stringify` trap (§6.1) gets caught by CI rather than by production.

This phase is where provider-independence is actually established. If it is
written after a real integration, the Razorpay shape leaks into everything and
§8 becomes aspirational.

### Phase 2 — the schema, on a local or staging project only

Needs §10 approval. Does **not** touch production.

- One additive migration creating the three tables and the two read policies.
- Blocked today by a known, unrelated problem: `docs/INFRASTRUCTURE.md` records
  that **no container runtime is installed**, so `supabase start` cannot run.
  The same blocker holds up auth QA. Either install one, or use a separate
  free Supabase project as staging.

### Phase 3 — the handlers, against test keys

- The three route handlers and the sweep, wired to the Razorpay adapter.
- Exercised with Razorpay's published failure cards —
  `payment_timed_out`, `insufficient_fund`, `card_declined`,
  `authentication_failed`, `gateway_technical_error`.
- Webhook delivery to a local endpoint needs a public URL; a tunnel is the
  normal answer and is a development tool, not a deployment.

### Phase 4 — what cannot be tested before live

Recorded so it is not mistaken for tested:

| Cannot be verified in sandbox | Why |
|---|---|
| Real settlement timing | T+1 vs T+2 is unresolved and only a real settlement answers it |
| Whether the fee returns on a refund | Needs a real refund, or Razorpay in writing |
| Chargeback handling | Cannot be simulated |
| The 24-hour webhook auto-disable | Would require 24 hours of real failures |
| Activation itself | A real application that can be rejected |

The last line matters for the plan's honesty: **the sandbox proves the code, not
the business.** Everything in §13 of `docs/RAZORPAY.md` stays open after a
perfect sandbox run.

### What this plan deliberately excludes

No second provider. No subscription, credit pack or second SKU. No coupon
system. No production anything — no migration, no RLS change, no deployment, no
live key, no real transaction.

---

## 12. Current state

No table, migration, policy, route handler, scheduled job, SDK, key or
entitlement row exists. `app/` still has no `/api` directory,
`app/auth/callback/route.ts` is still the only request-time handler, `npm ls`
shows no payment package, and `supabase/migrations/` still holds exactly the two
files it held in August.

Nothing here is legal, tax or security advice, and no part of this design has
been reviewed by anyone but its author.
