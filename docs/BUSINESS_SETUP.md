# Business and tax requirements — decision brief

**Nothing here is legal, tax or compliance advice, and nothing here says the
product is compliant.** This is a brief: what is verified, what follows from it,
what only the operator can decide, and what must go to a chartered accountant.
Sources were read on the dates given; statutory text was read on official
government domains only.

**The known position**, taken from the brief rather than assumed: the operator
is an **individual**, is **not GST-registered**, and **has a bank account whose
type and suitability have not been established**.

---

## 1. Entity — Individual now, register later

**Recommendation: onboard as an Individual. Do not register a proprietorship
first.**

This reverses the instinct, and the evidence points one way. Razorpay's India
KYC documentation, read 18 November 2026, requires of an
**Individual/Unregistered** merchant no business-identity document at all —
identity, address and bank, with identity and address auto-fetched from CKYC
where a record exists. A **Proprietorship** "MUST upload 2 from" MSME/UDYAM, GST
certificate, Shop & Establishment, Import Export Code or a postpaid mobile bill,
**plus** owner PAN and address proof. See `docs/RAZORPAY.md` §2.3.

So registering first does not smooth the application; it adds two documents the
operator does not currently hold, to obtain which is a separate process with its
own timeline.

**What registering later buys, and when it becomes necessary:**

| Trigger | Why |
|---|---|
| Turnover approaching **₹20 lakh** | GST registration becomes mandatory for services (§3) |
| **International payments** | Razorpay restricts individuals to PayPal or bank transfer (`docs/RAZORPAY.md` §7) |
| A business **current account** is wanted | Banks generally require a registration to open one in a business name |
| Credibility | Not a legal requirement, and not a reason on its own |

Cashfree, the fallback, treats this the same way: sign up as an Individual, and
"create a new account under the applicable type" after registering
(`docs/RAZORPAY.md` §14.1). Neither provider treats the upgrade as a problem.

**A caution.** Registering a proprietorship does **not** create a separate legal
person. The proprietor remains personally liable. If limited liability matters —
and for a product making factual claims about an examination, it might — that is
an LLP or a private limited company, which is a materially larger undertaking
and a question for a CA, not a payments decision.

---

## 2. The bank account

**This is the single requirement most likely to produce a surprise, because the
documentation is thinnest exactly here.**

What is verified (`docs/RAZORPAY.md` §3):

- Account number and IFSC are **mandatory** for every business type.
- An unregistered business or sole proprietorship **may provide personal bank
  account details** — so a savings account in the operator's own name is not
  disqualified on its face, and a current account is not required.
- Settlements go to the account given at KYC, and fail if it is "inactive,
  frozen or the details are incorrect".
- If automated bank verification fails, the fallback is a **video of a cancelled
  cheque**.

What is **not** documented by Razorpay, and must not be assumed:

1. Whether the **account holder name must match the PAN exactly**.
2. Whether a **joint account** is acceptable.
3. Whether a **savings account** carries any restriction a current account does
   not.

Cashfree states the name rule outright — *"The account must be in the name of
the business owner"* — and adds that for a newly opened account the first
transaction must be a credit from an existing KYC-complied account. That is
evidence about **Cashfree**, not Razorpay, but it sets a sensible expectation.

**Practical consequence worth acting on now:** if the operator's account is
joint, or is in any name other than exactly the one on the PAN, find out before
applying rather than during review. A failed bank verification is recoverable;
it is just slow, and it arrives at the worst moment.

**A separate, non-obvious point.** Many Indian banks' terms restrict *business*
receipts into a **savings** account. That is a question for the operator's bank,
not for Razorpay, and it is not answered by Razorpay accepting the account.
Recorded in §7.

---

## 3. GST

### 3.1 Registration is not required to onboard, and probably not required at all yet

**Razorpay does not require a GSTIN to onboard an Individual** — verified by
structure: GSTIN is not a standalone field, and a GST certificate appears only
as one of five optional business-identity documents for a *Proprietorship*,
which this is not. Cashfree says it in words: **"GSTIN is not mandatory."**

**The statutory threshold for services is ₹20 lakh** aggregate turnover
(₹10 lakh in a few specified states), verified against CBIC on 14 November 2026
and recorded in `docs/PAYMENTS.md` §2. The ₹40 lakh figure in wide circulation
is for **goods**. Aggregate turnover is computed all-India on one PAN.

Also recorded there, and load-bearing: **services below the threshold are exempt
from registration even for inter-state supply**, so the "inter-state supply
forces registration" rule that applies to goods does not bite here.

### 3.2 The consequence that changes the checkout copy

> **"A person who is not a registered person shall not collect in respect of any
> supply of goods or services or both any amount by way of tax under this Act."**
> — CGST Act, 2017, s.32(1)

Read on CBIC's statutory repository, 18 November 2026.

An unregistered seller **may not collect GST**, and may not present a price as
carrying one. So:

- ✅ "₹599" — correct.
- ⛔ "₹599 + GST" — unlawful collection.
- ⛔ "₹599 inclusive of GST" — states a tax component that is not being
  collected or remitted.
- ⛔ A "tax invoice". CBIC's own FAQ: only registered persons issue tax invoices
  under s.31; an unregistered person "cannot issue tax invoice" and uses an
  **ordinary commercial invoice** instead.

**None of that changes the net.** Razorpay's own 18% GST is charged on
*Razorpay's* fee, not on the transaction, and it is payable regardless of the
operator's registration status (`docs/RAZORPAY.md` §4). On ₹599 the fee is
₹11.98 and the GST on it ₹2.16, netting ₹584.86.

**What must change when registration happens**: the price presentation, the
receipt, and the checkout copy all become GST-bearing documents. Writing the
receipt generator so the tax line is a configuration rather than a rewrite is
ten minutes now and a day later.

### 3.3 The question that could not be answered

**Whether OIDAR rules touch this at all remains UNVERIFIED**, unchanged since
14 November. CGST s.24's mandatory-registration rule for OIDAR is written for
suppliers *outside* India supplying *into* India — the opposite direction to
this. No official statement was found covering an Indian-resident supplier of a
self-served digital product to Indian customers, and none has been invented.
**This is a CA question, not a search question** (§7).

---

## 4. Refunds — a policy decision, bounded by what the provider can do

`docs/legal/refund-policy.md` is a draft with no route. The decision is the
operator's; the constraints are not.

| Constraint | Source |
|---|---|
| Refunds go **only to the original payment method**. No alternative destination | Razorpay docs, verified |
| **Normal refunds are impossible after 6 months** | Razorpay docs, verified |
| Normal refunds take **5–7 working days**; instant is available | Razorpay docs, verified |
| Partial refunds are allowed, multiple, up to the captured amount | Razorpay docs, verified |
| Razorpay's refund **processing** fee is ₹0 | Pricing page, verified |
| **Whether the 2% fee + its GST is returned is UNDOCUMENTED** | §7, and `docs/RAZORPAY.md` §13 |

**The six-month wall is the one with a product consequence.** A policy promising
refunds for longer than six months cannot be honoured through Razorpay and would
require a manual bank transfer — a worse experience, a worse record, and a
reconciliation problem. **A refund window inside six months is strongly
preferable**, and the policy should state the window explicitly rather than
leaving it open.

**The digital-goods question the policy must answer head-on:** this product is
instantly delivered and partly already public. "No refunds on digital goods" is
common and is also the kind of term consumer forums look at closely. A short,
clearly stated window — a plain 7 or 14 days, no conditions to argue about — is
both easier to administer and easier to defend than a blanket exclusion.

**Assume the ~₹14 provider fee is not returned** until Razorpay confirms
otherwise, because that is the worse case and the one safe to plan against.

---

## 5. Consumer disclosures

Two independent sources require them, and they want nearly the same things.

**Razorpay withholds live API keys without them** — verified, and the binding
practical constraint. Required links: About us, Contact us, Pricing details,
Terms and conditions, Privacy policy, Refunds policy (`docs/RAZORPAY.md` §5).

**The Consumer Protection (E-Commerce) Rules, 2020** require an e-commerce
entity to display, prominently and accessibly: its **legal name**, the
**principal geographic address** of headquarters and branches, and the **name,
contact details and designation of a grievance officer**, who must acknowledge a
complaint **within 48 hours** and redress it **within one month**. Read on
consumeraffairs.nic.in and consumerhelpline.gov.in, 18 November 2026.

*Evidence note:* the sources consulted number these duties differently — one
official FAQ labels the duties section 18 — so the rule number is not asserted
here. The **substance** was consistent across the official sources read; the
citation should be pinned against the gazette text before it is quoted in a
published document.

**Against the product as it stands:**

| Required | Status |
|---|---|
| Privacy policy | ✅ `/privacy`, live and linked |
| About us | ✅ `/about`, live and linked |
| Terms and conditions | ⚠️ draft, **no route** |
| Refunds policy | ⚠️ draft, **no route** |
| Contact us | ⛔ **does not exist** |
| Pricing details | ⛔ **cannot exist** until the price is decided |
| Legal name + address displayed | ⛔ not displayed anywhere |
| Grievance officer named | ⛔ not named anywhere |

**The 48-hour acknowledgement is an operational commitment, not a page.** It
needs a monitored mailbox and someone who reads it, and it should not be a
personal address once this is public.

**DPDP** is not new and is not payments-specific: the product already collects
personal data today. `docs/INFRASTRUCTURE.md` §2 records that position. What
payments add is a new category — transaction records — and a new retention
conflict (§6).

---

## 6. The retention conflict

`docs/ENTITLEMENT.md` §3.1 proposes that payment records **survive** account
deletion, because they are the evidence in a refund or chargeback dispute whose
window may still be open. Every other table in this product cascades on account
deletion by design.

That is a developer choosing a retention period for a legal obligation, which is
the wrong person. It is now question **6.7** in `docs/legal/LEGAL_BRIEF.md`.

---

## 7. Questions for a chartered accountant

Grouped by what the answer changes. None should be guessed, and none has been.

**Changes the checkout before launch**

1. **Does OIDAR have any bearing** on an Indian-resident individual selling a
   self-served digital product to Indian customers? §3.3. If yes, mandatory
   registration applies regardless of turnover and the entire pricing
   presentation changes.
2. **Confirm that ₹599 may be presented with no tax component at all** while
   unregistered, and that an ordinary commercial invoice — not a tax invoice —
   is the correct document. §3.2.
3. **What must the receipt contain** for an unregistered individual seller?

**Changes planning, not the build**

4. **When exactly does the ₹20 lakh clock start and what counts toward it?**
   Aggregate turnover on one PAN, all-India — does other income of the operator
   aggregate with this?
5. **Is voluntary GST registration worth it before the threshold?** Input credit
   on the ~2.36% provider fee against the cost of returns and compliance.
6. **How is this income reported** — business income or other sources — and what
   records must be kept?
7. **Any professional tax, Shop & Establishment or local registration** that
   applies to an individual operating online from the operator's state?

**For the bank, not the CA**

8. **Does the operator's bank permit business receipts into this account?** §2.
   Independent of whether Razorpay accepts it.

**For Razorpay, in writing** — the full list is `docs/RAZORPAY.md` §13. The two
that bear on this document: whether the 2% fee and its GST are returned on a
refund, and whether the account qualifies at all.

---

## 8. What only the operator can supply

Every legal draft in `docs/legal/` carries these placeholders, deliberately left
unfilled. A legal document containing an invented one is worse than no document.

| Placeholder | Needed for |
|---|---|
| `{{LEGAL_NAME}}` | Razorpay KYC, the E-Commerce Rules, every policy page |
| `{{ADDRESS}}` | The E-Commerce Rules. Not optional, and it becomes public |
| `{{CONTACT_EMAIL}}` | The Contact page, and the 48-hour acknowledgement duty |
| `{{GRIEVANCE_OFFICER}}` | The E-Commerce Rules. For a sole operator, the operator |
| `{{PRICE}}` | The Pricing page Razorpay requires before issuing live keys |
| `{{JURISDICTION}}` | The courts named in the Terms |

**The address is the one worth pausing on.** The E-Commerce Rules require a
principal geographic address displayed prominently. For an individual operating
from home, that is a home address on a public website. It is a real decision
with a real privacy cost, it is the operator's to make, and the alternatives —
a registered office, a virtual office, a proprietorship with a business address
— all involve registering something. It is the strongest practical argument in
this document for registering an entity, and it is not a tax argument.

---

## 9. Order of operations

1. **Confirm the bank account qualifies** — name match, type, and the bank's own
   terms. §2. Cheapest to do first, worst to discover late.
2. **Decide the address question** — §8. It gates the policy pages and may
   change the entity decision.
3. **Settle the price** — it gates the Pricing page, which gates live keys.
4. **Fill the placeholders and publish the four missing pages.**
5. **Sign up for Razorpay test mode.** Needs none of the above
   (`docs/RAZORPAY.md` §12), which is why the build need not wait.
6. **Apply for activation**, once 1–4 are done.
7. **CA before the first ₹1 lakh**, not before the first ₹599.

Steps 1, 2 and 3 are decisions, not work, and all three are the operator's.
