# Entitlement architecture — proposal, revision 2

**This is a proposal and nothing in it has been applied.** No table exists, no
migration file has been written, no RLS policy has been added, no service-role
key exists in any environment, and no payment route exists. The brief requires
that the schema, the RLS policies, the privileged server-side operations and the
rollback plan be presented for explicit approval **before** any of that is
created. This document is that presentation.

Written against Razorpay's verified webhook contract (`docs/RAZORPAY.md` §10),
the commercial model in `docs/MONETISATION.md`, the access rules in
`docs/ACCESS_POLICY.md`, and the existing schema in
`supabase/migrations/20260813120000_init_progress.sql`.

---

## 0. What revision 1 got wrong

**Revision 1 contained a defect that could take money and grant nothing.** It
was found in review, it is fixed here, and the fix changed the schema rather
than adding a column — so the whole document is restated rather than patched.

Revision 1's handler did this:

```
4. insert into webhook_events (...)
      → primary-key collision: this is a duplicate. Return 200 immediately.
5. grant / revoke
6. stamp processed_at
```

**The insert at step 4 committed independently of the work at step 5.** If the
grant failed — a transient database error, a deploy mid-request, an exception in
the handler — the event row survived with `processed_at` null. Razorpay then
retried the same event, step 4 collided on the primary key, and the handler
returned **200 without ever retrying the grant**. Razorpay, correctly, stopped
retrying. The payment was captured, no entitlement existed, and nothing in the
product knew.

The error underneath it is worth naming because it generalises: **"we have seen
this event" and "we have acted on this event" are two different facts, and
revision 1 stored them as one.** A primary key answers the first question. It
was being used to answer the second.

Three consequences shape this revision:

1. The event's lifecycle is now an explicit **state machine** with a claim, a
   lock and an attempt count, so "seen" and "done" are distinguishable and a
   failed attempt is retryable.
2. The grant and the event's transition to `processed` are now in **one
   transaction**, so they cannot diverge.
3. Entitlement is **derived from the payment facts**, not mutated by each event,
   which makes ordering and duplication irrelevant rather than handled.

Revision 1 also under-specified transaction boundaries, stored raw webhook
payloads indefinitely, and took `user_id` from a source that was never stated.
All three are fixed below.

---

## 1. The one rule

**Hiding content in the UI, in a client-side flag, in `localStorage`, or behind
an obscure public URL is not access control.** Every premium byte must be
withheld by a server that has checked an entitlement row, and released only
after it has.

The product currently violates the spirit of this on purpose and says so:
`public/solutions/*.json` is a predictable public URL, which
`docs/CONTENT_EXPOSURE.md` calls "hygiene, not protection". That is the right
call for a free bank and the wrong call for anything sold.

A second, weaker rule follows: **the client may know what is locked, but may
never decide it.** A lock icon rendered from a cached local flag is good UI. The
same flag deciding whether bytes are served is a bug.

---

## 2. Three things this breaks, stated before the design

### 2.1 "Nothing is ever gated behind sign-in" stops being true

`CLAUDE.md` line 120: *"nothing is ever gated behind it."* An entitlement is
attached to an account, so purchase requires one, and premium content is gated
behind sign-in by construction.

There is no alternative that is not worse. An entitlement keyed on a device, a
local token or an unauthenticated email is one that can be copied, and the brief
is explicit that client-held flags are not access control.

**What survives:** the free product is unchanged — every route static, guest
mode first-class, no sign-in affordance, 150 Core questions with complete
explanations and full progress tracking, no account. The full consequence
analysis and the exact documentation conflicts are in `docs/ACCESS_POLICY.md`,
which is the document to approve or amend; this is a summary of it.

### 2.2 The product gains request-time surface

`CLAUDE.md` line 123: *"Every route is static; nothing needs a server at request
time."* This design adds three route handlers and a scheduled job. The invariant
weakens to **"every page is static"**, which is a weaker and more ordinary
claim.

### 2.3 Entitlement is the one thing that is not local-first

`CLAUDE.md` line 167: *"The local store is the render source, signed in or
not"*, and answering a question never waits on the network. A cached entitlement
may drive the interface; content is released by the server, on the request,
every time. **A stale local entitlement must never serve a byte.**

---

## 3. Proposed schema

Five tables. The division is not decoration — each separates a fact that the
others cannot express, and revision 1's defects came from conflating three of
them.

```
  payment_orders    append-only   our intent, and the ONLY source of ownership
  payments          facts         one row per provider payment attempt; status monotonic
  webhook_events    state machine delivery, claim, outcome — "seen" ≠ "done"
  manual_grants     append-only   grandfathering, comps, operator revocation
  entitlements      projection    derived from the four above; never mutated directly
```

### 3.1 `payment_orders` — intent, and where ownership comes from

```sql
create table public.payment_orders (
  id uuid primary key default gen_random_uuid(),

  -- Nullable, and deliberately so: on account deletion this is set to null and
  -- the order survives pseudonymised. A `not null` column cannot be `set null`
  -- on delete — the two clauses contradict each other and the delete fails.
  -- See §11.
  user_id uuid references auth.users (id) on delete set null,
  product text not null check (product in ('core-premium')),

  provider text not null check (provider in ('razorpay', 'cashfree')),
  provider_order_id text not null,

  -- Minor units. 59900 is ₹599.00. Never a float, never a rupee decimal.
  amount_minor integer not null check (amount_minor > 0),
  currency text not null default 'INR' check (currency = upper(currency)),

  created_at timestamptz not null default now(),

  unique (provider, provider_order_id)
);
```

**This table is the answer to "who does this payment belong to".** The `user_id`
is written once, by us, at order creation, from the authenticated session. It is
**never** read from a webhook payload. See §6.1.

`unique (provider, provider_order_id)` makes order creation retry-safe.

`amount_minor` is the server's figure, from server configuration. A client that
asks to pay ₹1 for a ₹599 product is refused at order creation, and the webhook
handler re-checks the captured amount against this row.

### 3.2 `payments` — provider facts, with a monotonic status

One row per **payment attempt**, not per order. An order can carry several: a
failed card attempt, then a successful UPI one. Revision 1 could not represent
that, because it had one row per order.

```sql
create table public.payments (
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

  unique (provider, provider_payment_id)
);

-- Status is a lattice and moves one way only.
create function public.payment_status_rank(s text) returns int
  language sql immutable as $$
    select case s
      when 'created'      then 0
      when 'failed'       then 1
      when 'captured'     then 2
      when 'refunded'     then 3
      when 'charged_back' then 4
    end;
  $$;

create function public.payments_status_monotonic() returns trigger
  language plpgsql as $$
  begin
    if public.payment_status_rank(new.status)
       < public.payment_status_rank(old.status) then
      -- A late `captured` after a `refunded` is dropped, not applied.
      new.status := old.status;
    end if;
    return new;
  end;
  $$;

create trigger payments_monotonic before update on public.payments
  for each row execute function public.payments_status_monotonic();
```

**The monotonic trigger is what makes out-of-order delivery a non-event**, and
it is enforced in the database rather than in application code, so no handler,
sweep or manual fix can bypass it. Razorpay states outright that ordering is not
guaranteed (`docs/RAZORPAY.md` §10); this is the structural answer rather than a
sequence of `if` statements that must each be remembered.

### 3.3 `webhook_events` — a durable state machine, not a dedupe key

```sql
create table public.webhook_events (
  provider text not null check (provider in ('razorpay', 'cashfree')),
  -- Razorpay: x-razorpay-event-id. Cashfree: x-idempotency-header.
  provider_event_id text not null,
  event_type text not null,

  status text not null default 'pending'
    check (status in ('pending', 'processing', 'processed', 'failed', 'parked')),

  attempts integer not null default 0,
  -- Held by whichever worker claimed the row. Expiry is the crash backstop.
  locked_until timestamptz,
  last_error text,

  -- Proof of exactly what we received, carrying no personal data. §10.
  body_sha256 text not null,
  -- An allowlisted subset. NOT the raw body. §10.
  payload_redacted jsonb not null default '{}'::jsonb,

  first_received_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now(),

  primary key (provider, provider_event_id)
);

create index webhook_events_recoverable_idx
  on public.webhook_events (status, locked_until)
  where status in ('pending', 'processing', 'failed', 'parked');
```

The five states, and what each means:

| Status | Meaning | HTTP returned | In the sweep's queue |
|---|---|---|---|
| `pending` | Recorded, not yet claimed. Only the sweep creates these | — | yes |
| `processing` | Claimed, with a lock. A worker is on it, or died holding it | 409 to a concurrent delivery | once the lock expires |
| `processed` | **Done.** The grant committed in the same transaction | 200 | no |
| `failed` | Attempted, failed, **retryable** | 500 | yes |
| `parked` | Attempted, failed, **will not succeed unaided**. Alerted | 200 | yes, for a human |

**`parked` is the state revision 1 lacked, and it does two jobs.** It prevents a
single poison event from returning 500 forever and tripping Razorpay's 24-hour
auto-disable — which would take down *every* future payment, not just the bad
one. And it makes the acknowledgement honest: a 200 on a parked event says "we
have received this and recorded that we did not act on it", which is visible,
alerted and queued, not silent.

### 3.4 `manual_grants` — append-only, for the cases no payment explains

```sql
create table public.manual_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null check (product in ('core-premium')),

  action text not null check (action in ('grant', 'revoke')),
  source text not null check (source in ('grandfathered', 'comp', 'support', 'fraud')),
  reason text not null,

  created_at timestamptz not null default now(),
  created_by text not null
);
```

Append-only: a withdrawal is a `revoke` row, never an edit. The projection reads
the most recent row per `(user_id, product)`. This is how grandfathering
(`docs/PRICING_DECISION.md`) is recorded, and how a fraudulent account is cut
off without touching the payment record.

### 3.5 `entitlements` — a projection, never mutated directly

```sql
create table public.entitlements (
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null check (product in ('core-premium')),

  status text not null check (status in ('active', 'refunded', 'revoked')),
  -- Null means it does not expire. A one-time purchase does not.
  expires_at timestamptz,

  -- Why the projection currently says what it says. Diagnostic, not input.
  reason text not null,
  computed_at timestamptz not null default now(),

  primary key (user_id, product)
);
```

**Nothing writes this table except `recompute_entitlement`** (§8). That single
rule is what makes duplicate, concurrent and out-of-order events incapable of
producing a wrong result, and it is why revision 1's incremental grant/revoke
mutation is gone.

The access check is, and is only:

```sql
status = 'active' and (expires_at is null or expires_at > now())
```

evaluated on the server, inside a request that has verified the session.

---

## 4. Proposed RLS policies

```sql
alter table public.payment_orders enable row level security;
alter table public.payments       enable row level security;
alter table public.webhook_events enable row level security;
alter table public.manual_grants  enable row level security;
alter table public.entitlements   enable row level security;

create policy "entitlements are self-readable"
  on public.entitlements for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "orders are self-readable"
  on public.payment_orders for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "payments are self-readable"
  on public.payments for select to authenticated
  using (exists (
    select 1 from public.payment_orders o
     where o.id = payments.order_id
       and o.user_id = (select auth.uid())
  ));
```

**There is no INSERT, UPDATE or DELETE policy on any of the five tables, and no
policy of any kind on `webhook_events` or `manual_grants`.** That is the design,
not an omission. With RLS enabled and no policy, every write by `anon` and
`authenticated` is refused. Writes happen only through the service role, which
bypasses RLS.

A user therefore cannot grant themselves an entitlement, cannot alter an
amount, cannot mark a refund reversed, and cannot read the event ledger at all.
This generalises the `attempts` convention — *"There is no update policy on the
table"* — into a principle: **the absence of a policy is the security control.**

### 4.1 The corollary that is easy to miss

The service role **bypasses RLS entirely**, so on the write path RLS is not a
second line of defence — there is no first line. **Every privileged write must
verify ownership in application code**, and §6.1 fixes exactly where ownership
comes from.

---

## 5. Privileged server-side operations

| # | Operation | Trigger | Idempotency |
|---|---|---|---|
| 1 | **Create order** — insert `payment_orders`, ask the provider for an order id | Authenticated buyer | `(provider, provider_order_id)` |
| 2 | **Apply payment fact** — upsert `payments`, monotonic status | Webhook, fetch-on-return, sweep | `(provider, provider_payment_id)` + trigger |
| 3 | **Recompute entitlement** — derive and write the projection | After any fact changes | Pure function; idempotent by construction |
| 4 | **Manual grant / revoke** — append to `manual_grants`, recompute | Operator only | Append-only |
| 5 | **Serve premium content** — release bytes after an entitlement check | Authenticated request | Read-only |

**Operations 2 and 3 are the only ways entitlement can change**, and every
caller — webhook, fetch-on-return, sweep, operator — goes through them. Nothing
implements granting separately.

### 5.1 Service-role key isolation

- Server environment only. **Never** prefixed `NEXT_PUBLIC_`.
- Not in `.env.example` (names only, no values), not committed, never pasted
  into this repository, a document or a chat.
- Read in exactly one module, which does `import 'server-only'` at the top.
  That package makes the **build fail** if a client component imports it,
  transitively — a stronger guarantee than a lint rule because it cannot be
  forgotten in review.
- A runtime guard in the same module throws if `typeof window !== 'undefined'`.
- A separate key per environment. A staging key must not work against anything
  else, which is the point of §13.3.

---

## 6. The webhook handler — corrected

### 6.1 Where `user_id` comes from

**Never from the webhook payload.** The chain is:

```
webhook event → provider_order_id (or provider_payment_id)
              → payment_orders row WE created at order time
              → user_id
```

If no `payment_orders` row matches, we did not create that order, and the event
is **parked**, not guessed at. A matching row whose `user_id` is **null** — the
buyer deleted their account between paying and the event arriving — is also
parked: the payment fact is still recorded against the order, but there is no
one to grant to, and inventing a recipient is exactly what this chain exists to
prevent. Every privileged write takes its `user_id` from
this chain and from nowhere else. This is the ownership verification §4.1
requires, made concrete.

The captured amount is re-checked against `payment_orders.amount_minor` in the
same step. A mismatch parks the event rather than granting.

### 6.2 The flow, with transaction boundaries

```
A. const raw = await request.text()            // RAW. Before any parsing.
B. verify HMAC-SHA256(raw, secret) vs X-Razorpay-Signature
        mismatch → 400. Nothing written. Nothing parsed. Nothing logged in full.
C. const event = JSON.parse(raw)               // only now
D. redact(event) and sha256(raw)

── TXN 1 — claim. Commits immediately. ────────────────────────────────────
E. insert … on conflict … do update … where (status in ('pending','failed')
        or (status='processing' and locked_until < now()))  returning status
F. claimed?  no → read the row and branch:
                   processed | parked          → 200   (done, or recorded as not done)
                   processing, lock still live → 409   (another worker owns it)
── COMMIT ─────────────────────────────────────────────────────────────────

── TXN 2 — process and settle. ONE transaction. ───────────────────────────
G. resolve user_id via §6.1        — no match → abort, park
H. upsert payments (monotonic status trigger applies)
I. select … from entitlements where user_id, product FOR UPDATE
J. recompute_entitlement(user_id, product)
K. update webhook_events set status='processed', processed_at=now(),
                             locked_until=null
── COMMIT ─────────────────────────────────────────────────────────────────

L. rollback of TXN 2 → TXN 3: status='failed' (retryable, 500)
                            or status='parked' (permanent, 200, alert)
M. 200
```

**Step K is inside TXN 2, and that is the fix.** The grant and the record that
the grant happened commit together or not at all. There is no window in which
one exists without the other.

**Step I's `for update`** serialises concurrent recomputes for the same
`(user_id, product)` — two different events for one user cannot interleave their
reads and writes.

**Steps A–M must finish inside 5 seconds.** Razorpay treats a slower response as
a timeout and resends even if the work completed (`docs/RAZORPAY.md` §10).
Nothing slow — no email, no analytics, no receipt PDF — goes in front of the
200. Those belong to a later job keyed off `processed_at`.

### 6.3 The claim statement

```sql
insert into public.webhook_events as we
  (provider, provider_event_id, event_type, body_sha256, payload_redacted,
   status, attempts, locked_until)
values ($1, $2, $3, $4, $5, 'processing', 1, now() + interval '60 seconds')
on conflict (provider, provider_event_id) do update
   set status       = 'processing',
       attempts     = we.attempts + 1,
       locked_until = now() + interval '60 seconds',
       last_error   = null,
       updated_at   = now()
 where we.status in ('pending', 'failed')
    or (we.status = 'processing' and we.locked_until < now())
returning status, attempts;
```

One statement does insert-or-claim. **Returning zero rows is ambiguous** — it
means `processed`, `parked`, or a live lock — so step F reads the row to
distinguish them. Returning 200 on all three would be the same class of error as
revision 1.

### 6.4 Why this is safe under concurrency

Four cases, each argued rather than asserted.

**Two simultaneous deliveries of the same event.** Both run the claim statement.
Postgres takes a row-level lock on the conflicting row for the duration of the
statement, so the second blocks until the first's transaction commits, then
re-evaluates its `where` clause against the **committed** row version — which
now reads `processing` with a live lock. The `where` fails, zero rows return,
step F sees a live lock and returns 409. **Exactly one claimant, always.**

**Two deliveries where the first worker died mid-process.** The first holds
`processing` with `locked_until` in the past. The second's `where` matches on
the expired-lock branch, claims the row, increments `attempts`, and processes.
Nothing is wedged by a crash.

**A worker that dies between TXN 1 and TXN 2.** The row sits `processing` with a
lock that expires in 60 seconds. The next Razorpay retry, or the sweep, reclaims
it. The entitlement was never written, so there is nothing to undo.

**A worker that dies inside TXN 2.** The transaction rolls back in its entirety —
payment fact, entitlement projection and `processed` status all unwind together.
The lock expires and it is retried from a clean state.

**And a second, independent guarantee.** Even if every lock above failed, a
double grant would still be impossible, because `recompute_entitlement` is a
pure function of the stored facts (§8). Running it twice produces the same row.
The locking prevents wasted work and interleaved reads; **idempotence prevents
incorrectness**, and the design does not rely on the locking for correctness.

### 6.5 Failure classification — what returns what

| Failure | Status | HTTP | Why |
|---|---|---|---|
| Signature mismatch | *no row written* | 400 | Unverified input never reaches the database |
| Database unreachable | *no row written* | 500 | Razorpay retries with backoff |
| Transient error in TXN 2 | `failed` | 500 | Retryable; also in the sweep's queue |
| Unknown event type | `parked` | 200 | Will never succeed. 500 would risk the 24h disable |
| No matching `payment_orders` | `parked` | 200 | We did not create this order. Needs a human |
| Amount mismatch | `parked` | 200 | Possible tampering. Needs a human |
| `attempts` exceeds 5 | `parked` | 200 | One poison event must not disable the endpoint |

**The attempt cap is a deliberate trade of one event for the endpoint.** Without
it, a single permanently-failing event returns 500 for 24 hours and Razorpay
disables the webhook, silently breaking every subsequent purchase. With it, that
event is parked and alerted while everything else keeps flowing.

**Parking is never silent.** It writes `last_error`, alerts, and stays in the
sweep's queue. A parked event is a visible, recorded statement that a payment may
have been taken and not honoured — which is precisely the condition revision 1
could reach without noticing.

### 6.6 The alternatives considered, and why not

**Pure single transaction** — claim, process and settle in one transaction, with
a rollback leaving no trace. Genuinely simpler, and the duplicate case is safe
for the same locking reason as §6.4.

*Rejected because it cannot satisfy two of the requirements.* A rolled-back
transaction leaves **no record of the failure** — the requirement that a failed
grant remain visible and recoverable is unmet, and the only evidence is a log
line. And with no durable attempt count there is **no way to park a poison
event**, so a permanently-failing event returns 500 until Razorpay disables the
webhook. The single transaction is the right tool for the *grant* (and is used,
as TXN 2) and the wrong tool for the *lifecycle*.

**Transactional outbox / async worker** — record the event, return 200 at once,
process from a queue. Attractive against the 5-second timeout, and it makes
retries ours rather than the provider's.

*Rejected for now, on a cost argument rather than a correctness one.* Returning
200 before processing gives up Razorpay's retry safety net entirely: we would own
delivery, and would need a worker that is always running. This product has no
always-on compute — it is a static site with scheduled jobs at most. And the
processing here is two upserts and a projection, comfortably inside 5 seconds.
**Worth revisiting if the handler ever needs to do real work**, at which point
the state machine above is already most of an outbox.

**A status column added to revision 1** — the obvious patch, and insufficient on
its own. Without an atomic claim, two concurrent deliveries both read `pending`
and both process. Without a lock with an expiry, a crashed worker wedges the row
in `processing` forever. Without an attempt cap and a `parked` state, a poison
event takes the endpoint down. The column is necessary; it is about a third of
what is needed.

---

## 7. The rest of the request-time surface

```
POST /api/checkout/order     create an order, return the provider order id
POST /api/checkout/verify    verify the Checkout return, apply the fact, recompute
POST /api/webhooks/razorpay  §6
GET  /api/content/solutions  release premium solutions after an entitlement check
     (scheduled)             reconciliation sweep — §9
```

### 7.1 `POST /api/checkout/verify` — fetch-on-return, and the second signature

**There are two different signatures in this integration, with different keys
and different messages** (`docs/RAZORPAY.md` §10.2). Confusing them produces
verification that is wrong in a way that looks right:

| | Webhook (§6) | Checkout return (here) |
|---|---|---|
| Key | the **webhook secret** | the **API `key_secret`** |
| Message | the **raw request body** | `order_id + "\|" + razorpay_payment_id` |

And one rule from Razorpay's own documentation that this design was already
reaching for independently:

> "Do not use the `razorpay_order_id` returned by Checkout."

The `order_id` in the signed string must be the one **we stored** in
`payment_orders`, looked up from the authenticated session — never the value the
browser handed back. Signing with the browser's value would let a tampered
response verify against itself. This is §6.1's ownership rule, confirmed by the
provider.

The handler then calls the same operations 2 and 3 as the webhook, so a race
between this route and the webhook is harmless: whichever arrives first applies
the fact, and the projection is identical either way.

Razorpay also states that an order **must** be created server-side first, and
that "payments made without an `order_id` cannot be captured and will be
automatically refunded". `payment_orders` is therefore required by the provider,
not just convenient for us.

### 7.2 `GET /api/content/solutions`

Reads the Supabase session from cookies, checks the entitlement, returns premium
solutions only if it is active. Free solutions keep coming from
`public/solutions/*.json` exactly as today — no change, no regression, and no
network dependency added to the free product.

**The content split this requires.** `content/access/free-set.json` already
names the 150 free ids and is hash-locked by a test. `scripts/build:solutions`
gains a third output: free solutions to `public/solutions/` as now, premium
solutions to a server-only path **not** under `public/`.

**And the thing that must be said plainly:** the 234 premium Core questions have
been in a public Git repository since August. Serving them from behind a check
does not make them secret — it makes the product coherent. The architecture is
built properly because the next content will not be public.

---

## 8. `recompute_entitlement` — why ordering stops mattering

A pure function of stored facts, called inside TXN 2 and by every other write
path. It reads, it does not accumulate.

```
inputs   all payments for (user_id, product), joined via payment_orders
         the most recent manual_grants row for (user_id, product)

active   iff  latest manual action is not 'revoke'
         and  ( exists a payment with status = 'captured'
                or latest manual action = 'grant' )

otherwise, in precedence order:
         latest manual action = 'revoke'        → 'revoked'
         exists status = 'charged_back'         → 'revoked'
         exists status = 'refunded'             → 'refunded'
         no relevant facts                      → no row
```

Because the output depends only on the **set** of facts and never on the order
they arrived in, every awkward case resolves without special handling:

| Case | Result |
|---|---|
| **Duplicate webhook** | Same inputs, same output. No second grant |
| **Refund arrives before capture** | Refund sets rank 3; the late `captured` (rank 2) is dropped by the trigger; recompute → `refunded`. **No access** |
| **Two payments, one order** (failed card, then UPI) | One captured exists → `active`. The failed attempt is recorded and ignored |
| **Two orders, one user** (bought twice) | Either captured → `active`. Refunding one leaves the other → still `active` |
| **Duplicate refund events** | Rank already 3; no change; recompute identical |
| **Chargeback after refund** | Rank 4 > 3, applies → `revoked` |
| **Chargeback, then goodwill comp** | Later `manual_grants` grant → `active`, with the reason recorded |
| **Fraud revocation despite a valid capture** | Manual `revoke` takes precedence → `revoked` |
| **Events replayed out of order after an outage** | Order irrelevant by construction |

**This is the same principle the product already applies to progress** —
*"Aggregates are never stored … always derived from attempts"*. Entitlement is
stored, because the access check must be a single indexed read, but it is stored
as a **deterministic projection** that can be recomputed from the facts at any
time. If it is ever wrong, re-running the function fixes it.

---

## 8a. KNOWN LIMITATION — a revocation suppresses later payments

**Deferred by decision on 21 November 2026. Not a defect to be rediscovered.**

`recompute_entitlement` reads the ACTION of the most recent `manual_grants`
row and compares it against *whether any captured payment exists*. Neither side
of that comparison carries a timestamp:

```sql
if v_manual = 'revoke' then revoked          -- unconditional
elsif has_captured      then active
```

So once an account carries a `revoke`, every later captured payment is ignored.
The money is taken, the `payments` row is written with its `captured_at`, and
the projection still reads `revoked`. A second purchase on a revoked account
grants nothing until another manual row is appended.

**Consequences while this stands**

- Do not revoke an account you expect to buy again. There is no revocation that
  is also reversible by purchase.
- Free-state and first-purchase testing must use a fresh account, not a revoked
  one.
- Support must not use a revoke as a temporary measure. It is permanent in
  effect until a `grant` is appended by hand.
- Nothing is wrong with the money path: the payment still verifies, captures
  and is recorded. Only the projection withholds access.

**Scope today.** No `manual_grants` row exists in any environment, so no account
is affected and no customer can reach this. It is latent.

**The correction, when it is wanted.** Carry the revocation's `created_at` and
`source`, scope the captured test to `payments.captured_at > cutoff`, and move
the revoke branch below the captured branch — keeping a `source = 'fraud'`
revocation absolute, which is the case the original precedence was written for.
`captured_at` is set server-side by `apply_payment_event` and preserved across
webhook re-delivery by `coalesce`, so it cannot be influenced by a browser.
That change was drafted, reviewed and proved against fourteen cases — it
differs from current behaviour in exactly one — and was **deliberately not
applied** so the release would not carry a database change it did not need.

This is internal. Nothing about it appears in customer-facing copy, and no
customer-visible behaviour depends on it.

## 9. The reconciliation sweep — now with two jobs

Razorpay's own documentation says to poll the payment APIs for business-critical
flows (`docs/RAZORPAY.md` §11), and the 24-hour auto-disable makes it mandatory
rather than advisable.

**Job 1 — provider-side drift.** Ask the adapter for payments captured in the
last N days. Any without a local `captured` row: apply the fact, recompute.
This catches the webhook never arriving, the endpoint being disabled, and the
buyer who paid and closed the tab.

**Job 2 — local-side recovery.** Re-drive every event the handler could not
finish:

```sql
select * from public.webhook_events
 where status = 'failed'
    or status = 'parked'
    or (status = 'processing' and locked_until < now())
 order by first_received_at;
```

Job 2 is new in this revision and it is the direct answer to the defect in §0:
**a failed grant is now a row in a queryable queue**, not a lost log line.
`parked` rows are re-driven too — many park for a reason that later resolves,
such as an event arriving before the order row was visible — and a parked row
that fails again stays parked for a human.

A third, cheap safety net: **fetch-on-return**. When the buyer lands back from
checkout, ask the provider for the payment status directly rather than waiting
for a webhook. It covers the common case and makes the purchase feel immediate.

All three paths call operations 2 and 3 (§5). None implements granting.

---

## 10. Webhook payloads — privacy and retention

**Revision 1 stored `payload jsonb not null` — the raw event — indefinitely.**
Razorpay payment payloads carry contact email, contact phone, card last four,
card network and issuer, and the UPI VPA. That is personal data under the DPDP
Act, retained forever, for no stated purpose.

This revision stores two things instead:

- **`body_sha256`** — a hash of the exact bytes received. It proves what we got
  without containing any of it, and it is what a dispute actually needs.
- **`payload_redacted`** — an **allowlist**, not a blocklist: event type, order
  id, payment id, amount, currency, method, status, provider timestamps. An
  allowlist cannot be out of date when the provider adds a field.

**Never stored:** email, phone, name, card last four, network, issuer, VPA,
billing address. **Never logged:** the raw body, in full or in part. The raw
body exists in memory for the length of signature verification and is not
persisted.

**Retention.** `payload_redacted` is purged after **180 days**, chosen to sit
just past Razorpay's six-month refund limit, after which a normal refund is
impossible and the payload's dispute value expires with it. `body_sha256`, the
ids and the amounts are kept, since they carry no personal data and are the
financial record.

This also shrinks the account-deletion problem in §11, because most of what
would have been personal data is never written.

---

## 11. Account deletion and financial records

The conflict is real and the schema cannot satisfy both sides. Revision 1 chose
`on delete restrict` — retention wins, account deletion blocked — which is a
developer deciding a legal question.

**This revision proposes pseudonymisation instead**, as the option that gives
each side most of what it needs:

- `payment_orders.user_id` → **`on delete set null`**. The order, amount, dates
  and provider ids survive; the link to a person does not. The column is
  therefore nullable, which is why §3.1 does not mark it `not null`.
- `payments.order_id` → **`on delete restrict`**, so an order carrying payments
  cannot be deleted at all. Deleting a *user* does not delete the order — it
  only nulls the reference — so the payment facts survive and stay joined to
  the order they belong to.
- `entitlements` and `manual_grants` **cascade** on user deletion. They are
  access state, not financial records, and they are derivable again if needed.
- `webhook_events` holds no user reference at all — by §10 it never did.

The practical consequence: after deletion we can still answer *"was this order
paid, how much, and when"*, and cannot answer *"who paid it"* without the
provider's own records — which are the actual system of record for payments, and
which Razorpay retains independently of us.

⚖️ **Still a lawyer's question, now a better-specified one.** It is question 6.7
in `docs/legal/LEGAL_BRIEF.md`, and this revision gives counsel three concrete
options — restrict, cascade, pseudonymise — rather than one assumption. What
counsel must settle: the lawful retention period, whether pseudonymisation
satisfies erasure, and what the privacy policy must say, since the live page
describes a product that takes no payments at all.

---

## 12. Keeping the provider swappable

- **No provider name in a column name.** `provider`, `provider_order_id`,
  `provider_payment_id`, `provider_event_id` are values.
- **One adapter interface**, five operations: `createOrder`,
  `verifyWebhook(raw, headers)`, `verifyCheckoutReturn(storedOrderId, fields)`,
  `fetchPaymentStatus`, `refund`. Everything provider-shaped lives behind
  it — both signature schemes and their different keys, the raw-body rule, hex
  versus base64, the header names, Cashfree's timestamp-prefixed signing.
  `verifyCheckoutReturn` takes the **stored** order id as an argument precisely
  so no implementation can reach for the client-supplied one.
- **No provider SDK imported outside the adapter**, enforced by a lint rule and
  by the `server-only` module boundary of §5.1.
- **The state machine is provider-independent.** `webhook_events` has no
  Razorpay-specific column; Cashfree's `x-idempotency-header` lands in
  `provider_event_id` exactly as Razorpay's `x-razorpay-event-id` does.
- **Retry and disable behaviour cannot be hidden**, which is why the sweep
  exists; the sweep is provider-independent anyway.

One provider is implemented. Cashfree's minimums are in `docs/RAZORPAY.md` §14.

---

## 13. Rollback and recovery

### 13.1 Before the first live payment — a clean drop

```sql
drop table if exists public.entitlements;
drop table if exists public.manual_grants;
drop table if exists public.webhook_events;
drop table if exists public.payments;
drop table if exists public.payment_orders;
drop function if exists public.payments_status_monotonic();
drop function if exists public.payment_status_rank(text);
```

**The migration is purely additive** — no existing table gains a column, no
existing policy, trigger or function is modified — so rolling it back cannot
damage progress data.

### 13.2 After the first live payment — not a drop

These tables then hold financial records. Rollback means restore from a
point-in-time backup, then **re-derive from the provider**, which is the real
system of record. Job 1 of the sweep (§9) *is* the disaster-recovery path, which
is the second reason to build it well.

**Confirm Supabase's point-in-time-recovery availability on the current plan
before the first live payment**, not after. On the free tier daily backups may
be all there is, and "we can roll back" would be an unchecked claim.

### 13.3 Staging only

The brief forbids production schema changes and this design does not need one.
Everything can be built and exercised against an isolated Supabase project and
Razorpay **test** keys, which need only a sign-up (`docs/RAZORPAY.md` §12).

⛔ Blocked today: `docs/INFRASTRUCTURE.md` records that **no container runtime
is installed**, so a local Supabase stack cannot start. The options and a
recommendation are in `docs/INFRASTRUCTURE.md` §5; it needs a decision, and it
blocks auth QA and payments Phase 2 together.

---

## 14. What this is approval for

1. **The five tables and the no-write-policy RLS model** (§3, §4), applied to an
   **isolated** project only — never production.
2. **The corrected processing model** (§6, §8): claim/process/settle, the grant
   and its record in one transaction, entitlement derived rather than mutated.
3. **The access-rule change** — sign-in required for purchase and premium. The
   full consequence analysis is `docs/ACCESS_POLICY.md`, which is the document
   to approve.
4. **Grandfathering**, which decides what `manual_grants` rows exist at launch.
   See `docs/PRICING_DECISION.md`.
5. **The price**, because `amount_minor` is server config and Razorpay will not
   issue live keys without a Pricing page.
6. **Pseudonymisation on account deletion** (§11) — or a different answer from
   counsel.
7. **180-day payload retention** (§10), or a different period.

---

## 15. Implementation plan

**Nothing starts until §14 is approved.** It is here so the approval is informed.

### Phase 0 — no approval, no install

- Razorpay **test-mode** sign-up. Test keys need no KYC, no activation, no
  website. Keys live in `.env.local`, which is git-ignored, **and nowhere
  else** — not in source, not in a document, not in a chat.
- `.env.example` gains variable **names** and no values.

### Phase 1 — the adapter and the state machine, against a mock

The highest-value work; needs no approval and no provider.

- The adapter interface (§12) and an in-memory mock.
- `recompute_entitlement` as a pure function, tested in isolation.
- **Tests for every case in §6.4, §6.5 and §8**, which are far easier to produce
  against a mock than against a live sandbox: duplicate delivery, concurrent
  delivery, worker death between transactions, worker death inside TXN 2,
  refund-before-capture, two payments on one order, two orders, duplicate
  refund, chargeback-then-comp, poison event hitting the attempt cap.
- Signature-verification tests with known-good fixtures for **both** schemes —
  where the `JSON.stringify` trap gets caught by CI rather than by production,
  and where a test asserts that `verifyCheckoutReturn` fails when handed a
  client-supplied order id that differs from the stored one.

**The concurrency claims in §6.4 are claims until Phase 1 tests them.** Two in
particular need a real Postgres rather than a mock, and should be written as
integration tests the moment Phase 2 has a database: that the claim statement
admits exactly one of two simultaneous claimants, and that the monotonic trigger
drops a late `captured`.

### Phase 2 — the schema, on an isolated project

Needs §14 approval. ⛔ Blocked on the §13.3 decision.

### Phase 3 — the handlers, against test keys

Exercised with Razorpay's published failure cards. Webhook delivery to a local
endpoint needs a tunnel — a development tool, not a deployment.

### Phase 4 — what cannot be tested before live

| Not verifiable in sandbox | Why |
|---|---|
| Real settlement timing | T+1 vs T+2 unresolved; only a real settlement answers it |
| Whether the fee returns on a refund | Needs a real refund, or Razorpay in writing |
| Chargeback handling | Cannot be simulated |
| The 24-hour webhook auto-disable | Would need 24 hours of real failures |
| Activation itself | A real application that can be rejected |

**The sandbox proves the code, not the business.** Everything in
`docs/RAZORPAY.md` §13 stays open after a perfect sandbox run.

### Excluded

No second provider. No subscription, credit pack or second SKU. No coupons. No
production migration, RLS change, deployment, live key or real transaction.

---

## 16. Current state

No table, migration, policy, function, trigger, route handler, scheduled job,
SDK, key or entitlement row exists. `app/` has no `/api` directory,
`app/auth/callback/route.ts` is still the only request-time handler, `npm ls`
shows no payment package, and `supabase/migrations/` holds exactly the two files
it held in August.

Nothing here is legal, tax or security advice, and no part of this design has
been reviewed by anyone but its author and the reviewer who found the §0 defect.
