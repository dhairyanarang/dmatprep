# Payments — decision document

**Specification only. Nothing in this document is implemented.** No payment SDK,
route, table, migration, service-role key, entitlement logic, coupon or
credential exists in this repository, and none should be added until the
decisions at the end are made.

Researched 14 November 2026 against provider and government documentation only.
Provider blog posts were deliberately not treated as authority, which is why
several numbers that circulate freely appear below as **unverified**.

## 0. Scope — narrowed 18 November 2026

**Domestic INR only. Cross-border is deferred, not solved.**

This decision removes most of the open questions in this document rather than
answering them, which is the point: §4 below could not be answered from
machine-readable sources, and a scope that does not depend on it is worth more
than a guess that does.

| | |
|---|---|
| In scope | Payments from customers in India, in INR, by UPI, card or netbanking |
| **Deferred** | Nepal, and every other cross-border payer |
| **Deferred** | International card acceptance, which also requires a registered business on every provider examined |
| Unchanged | One-time purchase, no subscription, no mock credits, no second SKU |

**What deferring Nepal costs.** The dMAT has a Kathmandu test centre, so Nepali
candidates are a real audience, not a hypothetical one. They can still use
everything that is free — which, after the Core bank was made free, is the whole
Core product. What they cannot do is pay. That is a known, accepted gap rather
than an oversight, and it should be revisited only with a compliance answer in
hand, never with an assumption.

**What it buys.** The RBI purpose-code question in §4 stops blocking. The
registered-business requirement stops blocking. Razorpay becomes viable for an
individual where it was not. The remaining decisions are commercial and tax
questions rather than regulatory ones.

## 0.1 What is actually being sold

The commercial direction has changed and the architecture follows from it.

- **The 473 Core questions are free.** They have been in a public Git repository
  since August; there is no scarcity to sell and no paywall should be built
  around them. See `docs/CONTENT_EXPOSURE.md`.
- **Premium is mocks, analytics, structured preparation, and genuinely new
  protected content.** Those are product rather than bank bytes, and none of
  them is leaked by a public `questions.json`.

That matters for the build: most of what would be sold is *features*, which are
gated by an entitlement check in the app. Only the new content needs
server-side delivery, and that is the expensive part.

## 1. Provider comparison

Evidence grades: **VERIFIED** — read on the provider's own documentation.
**PARTIAL** — from an official domain but not the underlying page, or marketing
rather than documentation. **UNVERIFIED** — could not confirm officially.

| | Razorpay | Cashfree | PayU | Stripe India |
|---|---|---|---|---|
| Individual, no registered business | **Yes** (VERIFIED) | **Yes**, named entity type (VERIFIED) | **Yes**, one of 13 types (VERIFIED) | Domestic only, **invite-only** (VERIFIED) |
| Sole proprietorship | Yes, needs 2 business proofs (VERIFIED) | Yes, 2 documents (VERIFIED) | Yes, 2 government proofs (VERIFIED) | Yes (VERIFIED) |
| UPI | 2% platform fee + GST (VERIFIED) | 1.95% (PARTIAL) | Not published (VERIFIED as unpublished) | **Not supported** (VERIFIED) |
| Cards | 2% + GST (VERIFIED) | 1.95% (PARTIAL) | 2% Visa/MC, 3% Amex (VERIFIED) | 2% (VERIFIED) |
| Settlement | Docs say T+2, pricing page says T+1 — **they contradict** (VERIFIED, both) | T+2 default (VERIFIED) | T+2 (PARTIAL) | No T+n published (VERIFIED as vague) |
| Webhook signature | HMAC-SHA256 over raw body (VERIFIED) | HMAC-SHA256 over timestamp+raw body (VERIFIED) | SHA512 over pipe-delimited fields (PARTIAL) | Not re-verified |
| Retries | Backoff for 24h, then **the webhook is disabled** (VERIFIED) | 3 retries at 2/10/30 min, configurable to 10 (VERIFIED) | +1, +5, +15 min (PARTIAL) | Not re-verified |
| Idempotency | Dedupe on `x-razorpay-event-id`; **ordering explicitly not guaranteed** (VERIFIED) | **At-least-once delivery**, `x-idempotency-header` (VERIFIED) | None documented (UNVERIFIED) | Not re-verified |

### The two claims worth re-checking, re-checked

**Stripe India is invite-only, and an Individual cannot take international
payments.** Both still hold, and they are two different rules. Invite-only is
account-level. The individual restriction is specific to international payments;
individuals *are* supported for domestic. All VERIFIED.

**But Stripe is not viable here for a third, independent reason**: it does not
support UPI or netbanking in India at all. For a ₹599 consumer product sold to
Indian candidates, that removes the dominant payment method. Ruled out on facts
rather than preference.

**Razorpay international payments require a registered business.** VERIFIED, and
the documentation is blunt: an individual must integrate PayPal or use bank
transfer instead. Domestic INR on Razorpay as an individual is fine.

## 2. GST

- **₹20 lakh** aggregate turnover is the registration threshold for suppliers of
  services (₹10 lakh in a few north-eastern states). VERIFIED against CBIC. The
  ₹40 lakh figure that circulates is for **goods**.
- Aggregate turnover is computed all-India on one PAN and includes exports.
- Services under the threshold are exempt from registration **even for
  inter-state supply and even when supplied through an e-commerce platform** —
  so the usual "inter-state forces registration" rule does not bite here.
- **No provider requires GST to onboard an Individual.** Cashfree says so in
  those words; Razorpay and PayU list GSTIN only as one of several alternative
  business proofs, and only for a proprietorship.
- **UNVERIFIED and a question for a CA, not a search:** whether OIDAR rules
  touch this at all. CGST s.24's mandatory-registration rule is written for
  suppliers *outside* India supplying *into* India — the opposite direction. I
  found no official statement covering an Indian-resident supplier of a
  self-served digital product, and have not invented one.

## 3. Refunds and chargebacks

- Razorpay: normal refunds 5–7 working days, instant available, source-only, and
  **not possible after 6 months**. Refund processing fee ₹0 (VERIFIED).
- **Whether the original MDR is returned on a refund is not documented** by
  Razorpay, Cashfree or PayU. At ₹599 that is roughly ₹14 per refund. Treat
  "MDR is not refunded" as an assumption and get it in writing. UNVERIFIED.
- **No Indian provider publishes a chargeback fee in its documentation.** The
  ₹200–1,500 figures that circulate come from provider *blogs*. Do not budget
  against them. Stripe is the only one publishing a figure (₹1,000, refunded if
  you win) and Stripe is already ruled out.

## 4. Nepal and cross-border — DEFERRED, and kept for when it returns

**Out of scope as of 18 November 2026.** Nothing below needs deciding now. It is
kept because the questions do not go away, they only stop blocking, and whoever
picks this up should not have to rediscover that the evidence here is thin.

This is the weakest-evidence section and is written to say so.

- Razorpay and Cashfree both list **NPR** among supported currencies. A currency
  in a table is **not** a statement that a payer in that country can transact.
- RBI's FETERS v6.2 purpose-code list, downloaded and text-extracted directly,
  contains **no Nepal or Bhutan carve-out** on P0102/P0103 — grepped for both
  words, zero matches.
- The widely-repeated claim that the *current* codes read "other than Nepal and
  Bhutan" traces to a newer RBI annexure that is **a scanned image**; text
  extraction returns nothing, so it could not be read. **UNVERIFIED.**
- RBI's Master Direction does treat Nepal and Bhutan specially under FEMA, and
  transactions between residents of India and Nepal "may be settled in Indian
  Rupees" (PARTIAL, via search over rbi.org.in).

**Conclusion: no provider in this set is documented as supporting a Nepal
payer.** Do not design a Nepal flow on the reasoning above. Note that the dMAT
has a Kathmandu test centre, so Nepali candidates are a real audience — which
makes this a product question before it is a payments question.

## 5. Architecture — what has to change first

The app's current shape is the binding constraint, and three things about it are
load-bearing.

1. **Every page is statically prerendered.** The only request-time code is
   `app/auth/callback/route.ts`. A prerendered page cannot know who is asking,
   so it cannot gate anything. Entitlement checks must happen in a route handler
   or in the client against a server-verified session — never in a page's
   render.

2. **There is no service-role key in the application, and there should not be
   one in the client bundle ever.** Granting entitlement on a webhook needs a
   key that can write a row no user may write. That key belongs to a route
   handler's environment, server-scoped, never prefixed `NEXT_PUBLIC_`.

3. **There is no entitlement table, and `attempts` has no UPDATE policy.** The
   immutability convention is deliberate. An entitlements table is new
   schema — and this sprint changed no Supabase schema, Auth setting or RLS
   policy, as instructed.

### The minimum that would have to exist

Specification, not a plan of record:

- **One table**, `entitlements`, with RLS allowing a user to read only their own
  row and no client to write any row. Writes come from the service role only.
- **One webhook route handler** that verifies the provider's signature over the
  **raw** body, dedupes on the provider's event id, and upserts the entitlement.
  Upsert rather than insert, because at-least-once delivery means the same event
  will arrive twice.
- **A reconciliation sweep.** Not optional on Razorpay: its webhook is
  **disabled after 24 hours of failures**, which is a silent product outage —
  the customer has paid and has no access, and nothing alerts. A scheduled job
  that polls payment status and grants anything the webhook missed is the
  difference between a bad day and a refund queue.
- **Server-side delivery for new premium content.** The static-asset split built
  this sprint is hygiene, not protection: `public/solutions/*.json` is a
  predictable URL anyone can fetch. That is the right level for a free bank. It
  is **not** acceptable for anything sold, which must be delivered only after an
  entitlement check in a route handler.

## 6. Recommendation

**This is a recommendation, not a finding.**

**Start with Cashfree, as an Individual, domestic-only.** Three reasons, in
order of weight:

1. **Its documentation blesses the exact path a solo founder needs**, including
   the upgrade: sign up as an Individual, and create a Proprietorship account
   once the business is registered. That removes the risk of onboarding and
   then being stuck.
2. **Its webhook contract is the strongest of the four, and entitlement is
   granted on a webhook.** At-least-once delivery is stated, there is a
   dedicated idempotency header, retries are configurable, and signing is over
   the raw body. Razorpay's 24-hour auto-disable is a genuinely dangerous
   failure mode for this use.
3. **It states GST is not mandatory in those words.**

Razorpay is a close second and fine for domestic-only — choose it if ecosystem
maturity outweighs the webhook semantics, but build the reconciliation sweep
first, not later. PayU publishes the least of the four, including no UPI rate,
which is a poor position to negotiate from. Stripe is out on three independent
verified facts.

## 7. Decisions needed before any implementation begins

Nepal is no longer on this list — it was decided on 18 November by deferring it.
What remains is commercial, tax and architectural.

1. **Individual now, or register a proprietorship first?** Individual is faster
   and every provider but Stripe allows it for domestic INR. A proprietorship
   becomes necessary before turnover approaches the ₹20 lakh GST threshold, and
   before any international card acceptance — which is itself deferred.
2. **Confirm in writing with the chosen provider**: whether MDR is returned on a
   refund, the chargeback fee in rupees, the contracted settlement cycle, and
   instant-settlement pricing. All four are undocumented or contradictory in the
   providers' own materials, and none should be budgeted against until written
   down.
3. **A CA on the GST question**, specifically whether ₹599 is treated as
   inclusive, and whether OIDAR has any bearing on an Indian-resident supplier
   selling into India. I found no official statement either way and did not
   invent one.
4. **Settle the price.** ₹599 is still a hypothesis. It appears nowhere in the
   product and nothing depends on it yet.
5. **Approval to add the schema in §5** — a new `entitlements` table, a new RLS
   policy, and a server-scoped service-role key. None of that was touched this
   sprint or the last, and none should be until items 1 to 4 are answered.

## 8. What is deliberately not here

No payment SDK is installed. No payment route exists. No schema, migration,
entitlement row, coupon or credential has been created. `npm ls` will show no
provider package, and `app/` has no route under `/api`. That is the state this
document describes and the state it should stay in until the decisions above
are made.

Nothing here is legal, tax or compliance advice.
