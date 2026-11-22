# Razorpay — provider document

> ## ⚠️ STATUS — corrected 22 November 2026
>
> **Razorpay is implemented. The integration exists and is exercised by tests.**
>
> `lib/payments/razorpay.ts` calls the REST API directly — order creation, payment fetch and reconciliation — with webhook signature verification in `lib/payments/signature.ts` and the handler at `app/api/webhooks/razorpay/route.ts`. Whether it can take money is a question of credentials and `NEXT_PUBLIC_COMMERCE_ENABLED`, not of code. The provider facts below were read on 18 November 2026 and should be re-read before anything load-bearing is relied on; §13 lists what.
>
> The banner below was written before any of it existed and is preserved only
> so the sequence of decisions stays readable. **Treat the status lines in the
> original text as historical.** The design reasoning in the body is still the
> authority for how this works and why — it is the status, not the content,
> that went stale.

---

**The provider decision is made. Nothing here is implemented, and the decision
does not authorise implementing it.**

Razorpay is the **primary** provider; Cashfree is the **only** fallback (§14).
No Razorpay account has been created, no SDK is installed, no key exists in this
repository, and no live onboarding has begun. This document records what
Razorpay's own documentation says today so that the account, the schema and the
code can be designed against facts rather than recollection.

**All sources below were read on 18 November 2026.** Payment-provider
documentation changes without notice and without a changelog; anything load-
bearing should be re-read before it is relied on, and §13 lists what must be
confirmed by Razorpay **in writing** because it is not documented at all.

Evidence grades, same vocabulary as `docs/PAYMENTS.md`:

| Grade | Meaning |
|---|---|
| **VERIFIED** | Read on the page cited, in words, on the date given. |
| **PARTIAL** | From an official Razorpay domain, but a blog or marketing page rather than documentation. |
| **UNVERIFIED** | Not stated anywhere official that could be found. Never treated as a fact. |

A Razorpay **blog post is not documentation**, and is graded PARTIAL even
though razorpay.com serves it. Several widely-repeated onboarding numbers exist
only on blogs, and they are marked as such rather than quietly promoted.

---

## 1. What the decision does and does not settle

| | |
|---|---|
| **Settled** | Razorpay is the provider we design for. Cashfree is the fallback. |
| **Settled** | Domestic INR only. Cross-border stays deferred — see `docs/PAYMENTS.md` §4. |
| **Not settled** | Whether Razorpay will onboard this operator. §2 and §3 are requirements, not an approval. |
| **Not settled** | The price. ₹599 is a recommendation in `docs/MONETISATION.md`, not a decision. |
| **Not settled** | Any database change. The entitlement schema needs explicit approval before a migration exists. |
| **Not settled** | Whether to onboard as an Individual or register a proprietorship first. §2.3. |

**Do not read this document as clearance to create an account.** §5 describes a
gate that is cheaper to pass before applying than after being rejected.

---

## 2. Onboarding as an individual

### 2.1 The entity type exists, and it is a first-class one

Razorpay's India KYC documentation lists **"Individual/Unregistered
Businesses"** as a business type in its own right, alongside Proprietorship,
Partnership, LLP, Private Limited and the rest. An individual with no registered
business is a supported merchant, not an exception being squeezed through a form
built for companies. **VERIFIED** —
[business-types-kyc-documents](https://razorpay.com/docs/payments/business-types-kyc-documents).

### 2.2 What an Individual must supply

| Requirement | What Razorpay says | Grade |
|---|---|---|
| Proof of identity | "Auto-fetched from CKYC". If CKYC fails: PAN card and mobile number | VERIFIED |
| Proof of address | "Auto-fetched from CKYC". If CKYC fails: DigiLocker verification, or soft copies of Aadhaar, photo ID or passport | VERIFIED |
| Bank details | Account number and IFSC, **mandatory**. If bank verification fails, a **video of a cancelled cheque** | VERIFIED |
| Personal PAN | "Permanent Account Number belonging to an individual who owns the business" | VERIFIED |
| Aadhaar | Front and back; a one-page copy from the UIDAI site is accepted | VERIFIED |
| Same-person rule | "The PAN Card details and authorised signatory address proof, that is, Aadhar Card and Passport should be of the same person" | VERIFIED |

The CKYC path matters more than it looks. If the operator's PAN already has a
Central KYC record, identity and address are fetched automatically against an
OTP sent to the mobile number linked to that record — no uploads, no video call.
If it does not, the fallback is document upload and, in Razorpay's own flow,
video KYC. **Whether the operator has a CKYC record is the single largest
unknown in the onboarding timeline**, and it is knowable only by starting the
form. Sources:
[kyc](https://razorpay.com/docs/payments/kyc),
[business-types-kyc-documents](https://razorpay.com/docs/payments/business-types-kyc-documents).

### 2.3 Individual versus Proprietorship — the documents diverge sharply

This is the one place where the choice of entity type changes the paperwork by
an order of magnitude.

- **Individual/Unregistered**: no business-identity document at all. Identity,
  address, bank.
- **Proprietorship**: "MUST upload **2 from**" — MSME/UDYAM certificate, GST
  certificate, Shop & Establishment certificate, Import Export Code, or a
  postpaid mobile bill — **plus** the owner's PAN and a government-approved
  address proof.

**VERIFIED**, both, on the same page. The practical consequence: registering a
proprietorship *before* onboarding does not simplify the application, it adds
two documents the operator does not currently hold. Registering later, when
turnover or international acceptance requires it, costs nothing now.

### 2.4 Timeline — officially unstated

Razorpay's documentation does **not** state how long activation takes, whether
live payments work while KYC is pending, or what limits apply before full
activation. The KYC page covers documents and steps and stops there.
**VERIFIED as unstated.**

Figures that circulate — 3–4 working days for standard document review, minutes
where CKYC succeeds, 4–5 days for partner accounts, 8 business hours for paid
assisted onboarding, and a **₹199 + taxes one-time KYC processing fee** — come
from Razorpay *blog* posts and search snippets, not from documentation. All
**PARTIAL**. The ₹199 fee is the one worth confirming, because it is a real cost
appearing nowhere in the pricing page. See §13.

**Do not plan a launch date against any of these numbers.**

---

## 3. The settlement bank account

The operator has a bank account. Razorpay's documentation does not let us
conclude it is the right one, and three separate rules bear on it.

1. **The account number and IFSC are mandatory for every business type**, and
   settlements are credited to "the bank account you provided during KYC
   verification". **VERIFIED** —
   [settlements](https://razorpay.com/docs/payments/settlements/).
2. **An unregistered business or sole proprietorship may give personal bank
   account details.** Stated on the account-activation reference. **VERIFIED** —
   [account-activation-support](https://razorpay.com/docs/payments/account-activation-support).
   So a savings account in the operator's own name is not disqualified on its
   face. A current account is not required for an Individual.
3. **Verification can fail, and the fallback is a video of a cancelled cheque.**
   **VERIFIED.** Razorpay's blog additionally describes a ₹1 test credit as the
   verification mechanism — **PARTIAL**, not found in documentation.

Settlements fail if the account is "inactive, frozen or the details are
incorrect". **VERIFIED** (settlements page).

**What is not documented, and must not be assumed:** whether the account holder
name must match the PAN exactly, whether a joint account is acceptable, and
whether a savings account attracts any restriction a current account does not.
Razorpay's page says none of this. Cashfree's equivalent page *does* state the
name rule explicitly (§14.2), which is a useful hint about industry practice but
is **not** evidence about Razorpay. Listed in §13.

---

## 4. GST

**Razorpay does not require a GSTIN to onboard an Individual.** VERIFIED, by
absence and by structure: GSTIN is not a standalone field on the KYC
requirements page, and a GST certificate appears only as *one of five optional
business-identity documents* for a **Proprietorship** — a category the operator
is not applying under. An Individual supplies no business-identity document at
all.

That is a statement about **onboarding**, not about tax liability. Whether the
operator must register for GST is a function of turnover and the nature of the
supply, it is governed by the CGST Act and not by Razorpay, and it is a question
for a CA. `docs/PAYMENTS.md` §2 records what was verified against CBIC — the
₹20 lakh services threshold, and the OIDAR question that could not be answered
from official sources. Nothing there has changed, and nothing in Razorpay's
documentation speaks to it.

**Razorpay charges 18% GST on its own platform fee**, not on the transaction
amount: "GST (18%) applies on Razorpay's service fee, not on the underlying
transaction amount." **VERIFIED** — [pricing](https://razorpay.com/pricing/).
This is charged regardless of whether the operator is GST-registered.

---

## 5. The website gate — the finding that changes the order of work

**Without live website details, Razorpay does not release live-mode API keys.**

The India documentation is unambiguous: without website or app details you
"will not be able to access live mode API keys" and therefore "cannot accept
payments from your website or app". Invoices and Payment Links generated from
the Dashboard still work — which is the documented escape hatch, and not one
this product would use. **VERIFIED** —
[business-website-details](https://razorpay.com/docs/payments/dashboard/account-settings/business-website-details/?preferred-country=IN).

The same page lists the links that must be provided for a website:

> About us · Contact us · Pricing details · Terms and conditions ·
> Privacy policy · Refunds policy

and states that instant automated checks validate the website, the policy pages
and the business industry. For additional websites the last item is named
"Cancellation/Refund policy".

**Against the repository as it stands today:**

| Required page | Status |
|---|---|
| Privacy policy | ✅ live at `/privacy`, linked from the footer |
| About us | ✅ live at `/about`, added this sprint |
| Terms and conditions | ⚠️ **draft only** — `docs/legal/terms-of-use.md`, no route |
| Refunds policy | ⚠️ **draft only** — `docs/legal/refund-policy.md`, no route |
| Contact us | ⛔ **does not exist** in any form |
| Pricing details | ⛔ **does not exist** — and cannot, until the price is decided |

So three of six are missing or unrouted, and one of them (**Pricing details**)
is blocked on a commercial decision that has not been made. `docs/legal/README.md`
already anticipated this for PayU and Cashfree; it now applies to the chosen
provider, and it is the gate that should be cleared **before** an application is
submitted rather than after a rejection.

The drafts carry unresolved placeholders — `{{LEGAL_NAME}}`, `{{ADDRESS}}`,
`{{CONTACT_EMAIL}}`, `{{GRIEVANCE_OFFICER}}`, `{{PRICE}}`, `{{JURISDICTION}}` —
every one of which is a fact only the operator can supply. Publishing a page with
an invented one is worse than not publishing it.

**One caution on the evidence.** A Razorpay blog claims website policies are no
longer required at *initial* onboarding and are checked when the site is
submitted for review. That is **PARTIAL** and it contradicts the documentation
page quoted above. The conservative reading — the pages are needed — is also the
one that is independently required by the Consumer Protection (E-Commerce)
Rules, 2020, so the contradiction does not change what to do.

---

## 6. Payment methods and fees

From [pricing](https://razorpay.com/pricing/), read 18 November 2026. The
dedicated payment-methods documentation path returned 404 on that date, so the
method list below is the pricing page's, which is the weaker source for
*coverage* even though it is authoritative for *rates*.

| Method | Rate | Grade |
|---|---|---|
| UPI | Zero MDR; **2% platform fee applies** | VERIFIED |
| RuPay debit | Zero MDR; **2% platform fee applies** | VERIFIED |
| Debit and credit cards | 2% | VERIFIED |
| Corporate / business credit cards | **2.15%** | VERIFIED |
| Netbanking | 2% | VERIFIED |
| Wallets | 2% | VERIFIED |
| International cards (inward) | up to 3% | VERIFIED — and unavailable to an Individual, §7 |

- **GST at 18% is additional**, on the fee. VERIFIED.
- **Setup fee ₹0, annual maintenance ₹0, refund processing fee ₹0, integration
  and support ₹0.** VERIFIED.
- Fees are deducted at source, per transaction. VERIFIED.

**On ₹599**: 2% = ₹11.98, plus 18% GST on that fee = ₹14.14, net ₹584.86. This
matches the arithmetic already in `docs/MONETISATION.md` §4, computed
independently, which is a small cross-check that both are right.

UPI being covered at all is the decisive product fact. It is the dominant
consumer method in India, and it is the reason Stripe was ruled out in
`docs/PAYMENTS.md` §1 — Stripe India supports neither UPI nor netbanking.

---

## 7. International payments — closed for an Individual

> "If you are an individual, such as a freelancer, you must integrate PayPal to
> accept international payments."

**VERIFIED** —
[international-payments](https://razorpay.com/docs/payments/payments/international-payments/).
The full set of international methods is tied to being "an eligible registered
business with a valid website". International Bank Transfer is also listed for
individuals.

This costs nothing today because cross-border is already deferred
(`docs/PAYMENTS.md` §0, §4), and the Nepal gap it implies is recorded there as a
known, accepted limitation rather than an oversight. It becomes a reason to
register a business later; it is not a reason to register one now.

---

## 8. Settlements — the two official numbers still disagree

| Source | Says | Grade |
|---|---|---|
| [settlements docs](https://razorpay.com/docs/payments/settlements/) | **T+2 working days** domestic, T+7 international | VERIFIED |
| [pricing page](https://razorpay.com/pricing/) | "settled to your bank account on a **T+1** or instant settlement cycle" | VERIFIED |

**Both were read on 18 November 2026 and they contradict each other.** This
contradiction was already recorded on 14 November and it has not been resolved
by Razorpay in the interim. Do not plan cash flow against either figure until
the contracted cycle is confirmed in writing (§13).

Also stated, and all **VERIFIED**:

- The cycle is "subject to bank approval and can vary based on your business
  vertical, risk profile and other factors". Working days exclude bank holidays.
- **Instant Settlements** reduce the cycle "from T+2 days (default settlement
  cycle) to a few minutes", are on-demand, and must be enabled by raising a
  request with Razorpay Support. Priced separately.
- No new-merchant hold period is documented. No minimum settlement amount is
  documented. Both **VERIFIED as unstated** — which is not the same as knowing
  there is none, and a new-merchant reserve is common industry practice. §13.

---

## 9. Refunds

From [refunds](https://razorpay.com/docs/payments/refunds/), all **VERIFIED**:

- Normal refunds: "Amount is refunded within 5-7 working days."
- Instant refunds: "Amount is refunded almost immediately."
- **Source refunds only** — "money is refunded to the payment method that the
  customer used to make the payment." There is no choosing a destination.
- **"Normal refunds are not possible for a payment which is more than 6 months
  old."** No limit is stated for instant refunds.
- Partial refunds are allowed, and multiple partial refunds are allowed "as long
  as their total does not exceed the captured payment amount".
- Refund **processing** fee is ₹0 (pricing page).

**Not stated, and materially so: whether the original 2% platform fee and its
GST are returned to the merchant when a payment is refunded.** The refunds page
is silent and so is the pricing page. At ₹599 this is ~₹14 per refund — small
per transaction, and the difference between a refund policy that costs nothing
and one that costs real money at volume. Treat "the fee is **not** returned" as
the planning assumption, because it is the worse case, and get the answer in
writing (§13). **UNVERIFIED.**

**Chargebacks: no fee is published in Razorpay's documentation.** The ₹200–1,500
figures in circulation come from provider blogs and comparison sites. Do not
budget against them. **UNVERIFIED**, unchanged from 14 November.

---

## 10. Webhooks — the contract entitlement depends on

Entitlement is granted on a webhook, so these semantics are not background
detail; they are the correctness argument for the whole purchase flow.

From [webhooks/validate-test](https://razorpay.com/docs/webhooks/validate-test/)
and [webhooks/best-practices](https://razorpay.com/docs/webhooks/best-practices/),
read 18 November 2026. All **VERIFIED**.

| Property | What Razorpay states |
|---|---|
| Signature header | `X-Razorpay-Signature` |
| Algorithm | "calculated using HMAC with SHA256 algorithm", keyed on the webhook secret |
| Encoding | **Not stated in prose.** A code block is labelled "HMAC Hex Digest"; the pseudocode shows no encoding call. Confirm empirically (§14.3) |
| Signed message | **The raw request body.** "Do not parse or cast the webhook request body." |
| Event id header | `x-razorpay-event-id`, "unique per event" |
| Duplicates | Expected. "This is an expected behaviour based on the webhook design." |
| Delivery | **At-least-once** |
| Ordering | "Ideally, you should receive a webhook in the order in which the webhook events occur" … "However, you may not always receive the webhooks in order." |
| Success response | Any **non-2xx** is a delivery failure |
| **Timeout** | **5 seconds.** A slower response is a timeout and the event is **resent even if your server already accepted it** |
| Retries | "retry the delivery in exponential backoff policy for **24 hours** after event creation timestamp" |
| **After 24h of failure** | **"If the webhooks continue to fail for 24 hours, the webhook is disabled."** Re-enabled manually from the Dashboard; an alert goes to the Alert Email Address |
| Secret rotation | "use the old secret for webhook signature validation while retrying older requests" |

Four of these have direct architectural consequences, and they are the reason
§11 exists rather than being optional polish:

1. **Raw body.** A Next.js route handler must read the body as text and verify
   before parsing. Reading `await request.json()` first and re-serialising
   destroys the signature. See §10.1 — Razorpay's own sample does exactly this.
2. **5-second timeout.** The handler must verify, record, and return 2xx fast.
   Granting entitlement must be a short write, not a chain of work. Anything slow
   belongs behind the acknowledgement, not in front of it.
3. **At-least-once plus no ordering.** The write must be an idempotent upsert
   keyed on the event id, and it must tolerate a later event arriving first.
   This matches the convention the progress layer already follows — client-minted
   ids, upsert-only, union by id — so the pattern is not new to this codebase.
4. **The 24-hour auto-disable is a silent outage.** The customer has paid and
   has no access; nothing in the product knows. Only an email to an address
   nobody may be watching reports it. This is the single worst failure mode in
   the Razorpay contract and the thing Cashfree does better (§14.3).

### 10.1 The trap in Razorpay's own documentation

**Razorpay's Node.js sample contradicts Razorpay's own raw-body rule, on the
same page.** The page warns "Do not parse or cast the webhook request body", and
then shows:

```
validateWebhookSignature(JSON.stringify(webhookBody), webhookSignature, webhookSecret)
```

`JSON.stringify` re-serialises a parsed object. Key order, whitespace and
number formatting are no longer guaranteed to match the bytes Razorpay signed,
so verification can pass in testing — where the shapes happen to round-trip —
and fail in production on a payload that does not. **VERIFIED by reading the
page**, not inferred.

Copying the official sample is the obvious thing to do and it is wrong. The
handler must take the raw text:

```
const raw = await request.text()          // before any parsing
verify(raw, request.headers.get('x-razorpay-signature'))
const event = JSON.parse(raw)             // only after verifying
```

This is recorded here because it is exactly the class of error that ships: it
comes from the vendor, it looks authoritative, and it fails intermittently
rather than immediately.

### 10.2 There are TWO signatures, with different keys and different messages

Not noticed in the first pass, and confusing them would produce verification
that is wrong in a way that looks right. Both verified 18 November 2026 on
[integration-steps](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/).

| | **Webhook** | **Checkout return** |
|---|---|---|
| Header / field | `X-Razorpay-Signature` | `razorpay_signature` in the Checkout response |
| Key | the **webhook secret** | the **API `key_secret`** |
| Message | the **raw request body** | `order_id + "\|" + razorpay_payment_id` |
| Encoding | not stated in prose; a block is labelled "HMAC Hex Digest" | **hex**, stated |

**One rule from that page is load-bearing and easy to get backwards:**

> "Do not use the `razorpay_order_id` returned by Checkout."

The `order_id` in the signed string must be the one **our server stored** when
it created the order. Using the value the browser handed back would let a
tampered response verify against itself. This is the same reasoning as
`docs/ENTITLEMENT.md` §6.1 — ownership comes from the record we wrote, never
from the payload — arriving from the provider's own documentation.

Two further facts from the same page, both **VERIFIED**:

- **An order must be created server-side first.** "An order should be created
  for every payment", via the Orders API, "a server-side API call".
- **"Payments made without an `order_id` cannot be captured and will be
  automatically refunded."** So the Orders API is not optional, and the
  `payment_orders` table is not a design preference.

---

## 11. Reconciliation is mandatory, not optional

Razorpay's own best-practices page says that for business-critical flows you
should poll the payment APIs as well as consuming webhooks, and the overview
page says that if a webhook "has not arrived within the time mandated by your
business needs" you should "perform an immediate API Fetch call". **VERIFIED.**

Combined with the 24-hour auto-disable, this is not a recommendation we are free
to defer:

- **A fetch-on-return check.** When the buyer lands back from checkout, the app
  asks Razorpay for the payment status directly rather than waiting for a
  webhook. This alone covers the common case and keeps the purchase feeling
  immediate.
- **A sweep.** A scheduled pass over payments that are captured at Razorpay but
  have no entitlement row locally, granting what the webhook missed. Without it,
  a disabled webhook is discovered by a customer complaint.
- **Both write through the same idempotent grant path as the webhook**, keyed on
  the same event or payment id, so the two can race without double-granting.

The product is currently **fully static with exactly one request-time handler**
(`app/auth/callback/route.ts`). A webhook route and a sweep are both new
request-time surface, and both need a server-scoped key that can write a row no
client may write. That is a schema and privilege change, and it needs explicit
approval before any migration is written.

---

## 12. The sandbox — what is available before any approval

**Test mode is available immediately on sign-up, with no KYC, no activation and
no website.** This is the most useful operational fact in this document.

> Test mode is "available to you as soon as you complete the sign-up process"
> and can be used "as long as you want".
>
> "You have to generate a separate set of API keys for Live and Test modes."
>
> Live mode "is available after you activate your account from the Dashboard."

**VERIFIED** —
[test-live-modes](https://razorpay.com/docs/payments/dashboard/test-live-modes/).

Test cards, including cards that force specific failures —
`payment_timed_out`, `insufficient_fund`, `card_declined`,
`authentication_failed`, `gateway_technical_error` — are published at
[test-card-upi-details](https://razorpay.com/docs/payments/payments/test-card-upi-details/).
No test UPI IDs appear on that page. **VERIFIED.**

### 12.1 Test-mode integration requirements

Verified 18 November 2026 on
[setup-edit-payments](https://razorpay.com/docs/webhooks/setup-edit-payments/)
and the integration-steps page above.

| Requirement | Detail |
|---|---|
| Test keys | Generated separately from live keys, immediately after sign-up |
| Webhooks in test mode | **Supported.** Dashboard → Accounts & Settings → Webhooks |
| Test-mode webhook OTP | "Enter the default OTP `754081` when prompted, while setting up, editing or deleting a webhook in test mode" |
| Webhook secret | **Merchant-chosen.** "Entering the secret is optional but recommended" |
| Secret ≠ API secret | "The webhook secret does not need to be the Razorpay API key secret" — and should not be |
| Webhook URL count | Up to 30 |
| Local delivery | Needs a publicly reachable URL. A tunnel is the normal answer, and is a development tool, not a deployment |
| Test cards | Published, including cards that force `payment_timed_out`, `insufficient_fund`, `card_declined`, `authentication_failed`, `gateway_technical_error` |
| Test UPI | **None published** on the test-details page |

**"Optional but recommended" is wrong for this product.** Without a webhook
secret there is no signature to verify, and an unauthenticated endpoint that
grants entitlements is the whole problem. **The secret is mandatory here**, it
must differ from the API key secret, and a missing-secret configuration should
fail the build rather than degrade quietly.

So the dependency order is:

1. Entitlement architecture designed and **approved** → §11, and a schema the
   operator has signed off.
2. Provider-independent code written against a mock, locally.
3. Razorpay **test** keys, which need only a sign-up.
4. The §5 website gate cleared.
5. KYC and activation — a real application, with a real possibility of rejection.
6. Live keys.

**Steps 1 and 2 need nothing from Razorpay at all**, which means the sandbox is
not the blocker and should not be treated as the next step. The architecture is.

---

## 13. What is not documented and must be confirmed in writing

Each of these was searched for on official Razorpay properties on 18 November
2026 and could not be found in documentation. None should be budgeted,
designed against, or stated to a customer until Razorpay confirms it in writing.

| # | Question | Why it matters |
|---|---|---|
| 1 | **Is the 2% platform fee + GST returned on a refund?** | ~₹14 per refund at ₹599. Decides whether a generous refund policy is cheap or not |
| 2 | **What is the chargeback fee in rupees?** | No figure is published anywhere official. Unbudgetable today |
| 3 | **Is the contracted settlement cycle T+1 or T+2?** | Razorpay's own two pages disagree, today (§8) |
| 4 | **Is there a new-merchant settlement hold or rolling reserve?** | Undocumented; common practice. Affects first cash in hand |
| 5 | **Is there a minimum settlement amount?** | Undocumented |
| 6 | **Is the ₹199 + taxes KYC processing fee real and current?** | Blog-only (PARTIAL). A real cost absent from the pricing page |
| 7 | **Must the bank account holder name match the PAN exactly? Is a savings account acceptable for an Individual? A joint account?** | §3. The operator's existing account may or may not qualify |
| 8 | **Are the §5 policy pages required at application, or only at website review?** | Documentation and blog contradict each other. Changes what must be built first |
| 9 | **What is the activation timeline for an Individual, with and without CKYC?** | Officially unstated. No launch date can be planned without it |
| 10 | **Is instant settlement available to an Individual, and at what price?** | Enabled only on request; pricing not published for this case |

Items 1, 3 and 7 are the three that would change a decision rather than a
forecast.

---

## 14. Cashfree — the fallback, recorded to the minimum useful depth

Recorded so that a switch is a decision rather than a research project. **Not to
be implemented.** Only one provider gets built.

Read 18 November 2026:
[onboarding FAQs](https://www.cashfree.com/docs/help/onboarding-related/onboarding-faqs),
[account activation](https://www.cashfree.com/docs/help/account/account-activation),
[webhooks overview](https://www.cashfree.com/docs/payments/online/webhooks/overview).

### 14.1 Onboarding minimums

| | What Cashfree says | Grade |
|---|---|---|
| Entity type | Lists **"Individuals (unregistered) or Proprietorship"** as a type | VERIFIED |
| Individual documents | "PAN, Aadhaar, bank account details (all required)"; Aadhaar must be linked to the phone number | VERIFIED |
| PAN alternative | PAN **or Form 60** where there is no PAN | VERIFIED |
| Identity | Aadhaar or CKYC, via DigiLocker or the Central KYC registry | VERIFIED |
| GST | **"GSTIN is not mandatory."** Adding it "lets you avail of GST benefits" | VERIFIED |
| Business proof | Only if automated checks cannot confirm the business — then "at least **two** documents" | VERIFIED |
| If proofs are absent | **"If you do not have these documents, Cashfree changes the business type to Unregistered."** | VERIFIED |
| Registration | "your business must be registered in India"; if not yet registered, sign up as an Individual and create a new account under the applicable type later | VERIFIED |
| Activation time | **"activated within 24–48 working hours after document verification"** | VERIFIED |
| Website | A website URL (or Play/App Store URL) is required for Collect Payments; the site is auto-checked for legal-name match and business category | VERIFIED |

### 14.2 The bank account rule Razorpay does not state

> "The account must be in the name of the business owner."

**VERIFIED** for Individual/Proprietorship. Cashfree also states that for newly
opened accounts the first transaction must be "a credit from an existing
KYC-complied bank account of the customer".

Cashfree states plainly what Razorpay leaves unsaid (§3, item 7). This is
evidence about **Cashfree**, not about Razorpay — but it does mean the fallback
has a knowable answer to a question the primary does not, and it sets a
reasonable expectation of what Razorpay will likely ask.

### 14.3 Technical minimums — and why the fallback is technically stronger

| Property | Cashfree | vs Razorpay |
|---|---|---|
| Signature | HMAC-SHA256, **base64-encoded** | Razorpay appears to be **hex** — see note below |
| Signed message | **timestamp + payload** | Razorpay: body only |
| Headers | `x-webhook-timestamp`, `x-webhook-signature` | `X-Razorpay-Signature` |
| Raw body | "Cashfree generates the webhook signature based on the raw payload, not the parsed payload" | Same rule |
| Delivery | **"Cashfree uses at-least-once delivery"** — stated outright | Stated in best practices |
| Idempotency | **`x-idempotency-header`**, "always be unique for each unique webhook payload". Only on webhook versions from **2025-01-01** | `x-razorpay-event-id` |
| Retries | **Configurable**: default 3 at 2/10/30 min; fixed, exponential or custom up to 10 | Fixed 24h exponential backoff |
| **Disable after failure** | **Not documented** | **Disabled after 24h — §10** |
| Resend | `payment` webhooks can be batch-resent from the dashboard, max 24h window | Not offered |

**The encoding difference is weaker evidence than the rest of this table, and
is recorded at its real strength.** Cashfree's page base64-encodes explicitly,
in its pseudocode. Razorpay's page never states an encoding in prose: the only
indicator is a code block *labelled* "HMAC Hex Digest", and its pseudocode
(`expected_signature = hmac('sha256', message, key)`) shows no `hexdigest`,
`raw_output` flag or base64 call. Hex is the reasonable reading and the
near-universal default, but it is **inferred from a label**, not stated. It
costs nothing to confirm against a real test-mode webhook on day one, and that
is where it should be settled rather than here.

**Cashfree has its own documentation trap, and it should be recorded now rather
than discovered during a migration**: the signature pseudocode joins timestamp
and payload with a dot (`$timestamp.$payload`), while the manual-verification
examples on the same page concatenate them with no separator. The page does not
reconcile the two. Anyone implementing Cashfree must determine empirically which
is correct — the same class of error as §10.1, from a different vendor.

**The honest summary**: on webhook semantics alone Cashfree is the better
product, and `docs/PAYMENTS.md` §6 recommended it for that reason. The decision
went to Razorpay on other grounds. That is a legitimate call — the webhook
weakness is **mitigable** by building the §11 reconciliation, which this
document now treats as mandatory rather than optional. It is not a weakness that
disappears because it was overruled, and the mitigation is the price of the
decision.

---

## 15. What provider-independence has to mean in code

The brief requires that switching to Cashfree later "does not require rebuilding
the entire entitlement system". That is achievable, and it is cheap only if it
is designed in from the first line. Concretely, it means:

- **No provider name in the entitlement schema.** Store `provider`,
  `provider_payment_id`, `provider_event_id` as values. A column called
  `razorpay_payment_id` is a migration on the day we switch.
- **One grant function, provider-agnostic.** It takes an amount, a currency, a
  buyer, and an idempotency key, and it does not know which provider produced
  them. Every path — webhook, fetch-on-return, sweep — calls it.
- **A thin provider adapter** with four operations: create an order, verify a
  webhook signature, fetch a payment's status, and issue a refund. Everything
  provider-shaped lives behind that boundary — including the raw-body rule and
  the base64-versus-hex difference, which are adapter details and nothing else's
  business.
- **The differences that cannot be hidden, named up front**: Cashfree signs
  `timestamp + payload`, Razorpay signs the body alone; Cashfree base64-encodes,
  Razorpay hex-encodes; the id header differs. All three are inside the adapter.
  Retry and disable behaviour is **not** hideable — it is why reconciliation
  exists, and reconciliation is provider-independent by design.
- **No provider SDK imported outside the adapter.** Easy to state, easy to
  verify with a lint rule, and the thing that actually decays without one.

What is deliberately **not** done: no abstraction layer attempting to support
both providers at once, no configuration flag selecting between them, no second
implementation. One provider is built. The second is a known, bounded change.

---

## 16. Current state

No Razorpay account exists. No SDK is installed — `npm ls` shows no provider
package. No key, secret or webhook secret exists anywhere in this repository or
in any environment file. No `entitlements` table, migration or RLS policy has
been written. No payment route exists; `app/` still has no `/api` directory and
`app/auth/callback/route.ts` is still the only request-time handler in the
product.

That is the state this document describes, and the state it should remain in
until the entitlement schema is approved.

Nothing here is legal, tax or compliance advice, and nothing here is a statement
that Razorpay will approve this operator.
