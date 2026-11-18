# Pricing — decision note

**₹599 is a proposal, not an approved price.** It appears nowhere in the
product. One-time purchase only: no subscription, no credit pack, no second SKU.

Short by intention. The full model is `docs/MONETISATION.md`; the access rules
are `docs/ACCESS_POLICY.md`.

---

## 1. The price and what it costs to collect

**Proposed: ₹599, one-time, INR, domestic only.**

Razorpay's published rate, verified 18 November 2026: **2% platform fee**, with
**18% GST on the fee** — not on the transaction. Setup ₹0, annual maintenance
₹0, refund processing ₹0.

| | |
|---|---|
| Price | ₹599.00 |
| Platform fee, 2% | ₹11.98 |
| GST on the fee, 18% | ₹2.16 |
| **Total deducted** | **₹14.14** (2.36%) |
| **Net** | **₹584.86** |

At three prices, for comparison:

| Price | Deducted | Net |
|---|---|---|
| ₹399 | ₹9.42 | ₹389.58 |
| **₹599** | **₹14.14** | **₹584.86** |
| ₹799 | ₹18.86 | ₹780.14 |

**Fees do not drive the decision.** 2.36% is not a number worth optimising at
this volume. Two costs that are not in the table: a **₹199 + taxes one-time KYC
processing fee**, which is blog-sourced and unconfirmed
(`docs/RAZORPAY.md` §13 item 6); and **whether the ₹14.14 is returned on a
refund**, which Razorpay does not document anywhere. Plan on it not being
returned.

**Why not ₹799:** Module B is unsellable until someone signs it off, and Figure
Sequences contributes only 37 premium questions. **Why not ₹399:** it prices the
product below the features that are supposed to justify it, and raising a price
later is harder than launching at one.

**Reminder that constrains the copy, not the price.** CGST s.32(1): an
unregistered person "shall not collect … any amount by way of tax". So the
figure shown is **"₹599"** — never "+ GST", never "inclusive of GST" — and the
document issued is an ordinary commercial invoice, not a tax invoice. See
`docs/BUSINESS_SETUP.md` §3.2.

---

## 2. What the customer actually receives at launch

Honestly, and in the order a buyer would rank it.

| | |
|---|---|
| **234 additional Core questions** | Figure Sequences 37, Mathematical Equations 122, Latin Squares 75 — each with a complete explanation and distractor notes |
| **Existing mock and timed runners** | Already built. Diagnostic, quick, timed per section, full simulation |
| **Nothing else** | Everything else that justifies the price is unbuilt |

**That is the whole list.** A buyer at launch is paying for 234 questions and
the convenience of having them organised, measured and explained inside a tool
that already tracks their progress.

---

## 3. What does not exist and therefore cannot be advertised

`docs/MONETISATION.md` names these as the durable premium value. **None exists
today**, and `docs/WEBSITE_READINESS.md` §1 makes "nothing is advertised before
it is built" the governing rule for all copy.

| Feature | Status |
|---|---|
| Enhanced mock experience | ⛔ not built. The existing runners are not "enhanced" |
| Detailed performance analytics | ⛔ not built |
| Weak-area identification | ⛔ not built — the data model exists, the surface does not |
| Pacing and readiness insight | ⛔ not built |
| Adaptive practice | ⛔ not built |

**They may appear on a roadmap that is visibly a roadmap. They may not appear in
a feature list, a price comparison, or a checkout page.** Selling a named
feature that does not exist is a consumer-protection problem before it is a
marketing one.

**The consequence for the price.** If the launch offer is honestly described, it
is "234 more questions" — and ₹599 for that alone is defensible but not
obviously generous. Two ways to resolve it, and both are the operator's call:
launch at ₹599 and ship the features quickly, or launch lower and raise when
they land. **Recommendation: hold ₹599 and ship the features**, because a
launch price is a reference point for a long time.

---

## 4. The 234 premium questions are already public

They have been in a public Git repository since **August 2026**, and
`npm run build:solutions` writes their solutions to `public/solutions/*.json`,
which is a predictable public URL. `docs/CONTENT_EXPOSURE.md` records this
deliberately: *"hygiene, not protection"*.

**This cannot be reversed.** Git history is public; the files are cloned.

Three consequences that follow:

1. **What is being sold is convenience, not scarcity.** Copy must not imply
   exclusivity that a GitHub link disproves. "The complete bank, organised,
   explained and measured" is true. "Exclusive questions" is not.
2. **The premium gate is still worth building properly**, because the *next*
   content will not be public. Building it correctly now costs the same as
   building it badly, and `docs/ENTITLEMENT.md` is sized for content that is
   genuinely protected.
3. **A technically literate buyer will find them.** That is an argument for
   pricing against the product rather than the bytes — and for making the
   features real, since they are the only part that cannot be cloned.

---

## 5. Grandfathering — recommendation and schema cost

Every Core question is free today. Launching takes 234 away from anyone already
using the product unless something is done. `docs/ACCESS_POLICY.md` §3 sets out
the three options; this is their data cost.

| Option | Schema implication | Operational cost |
|---|---|---|
| **A. Grandfather existing accounts, announce, gate new users** | One `manual_grants` row per existing account, `source = 'grandfathered'` — **append-only, already in the proposed schema** | A notice before the cutoff; a defined window |
| **B. Nothing already public is ever gated** | **No entitlement needed at launch at all.** The schema is still built, for future content | Nothing to sell until features exist |
| **C. Gate everyone on a cutoff date** | Nothing extra — and nothing recorded, so the decision is **unrecoverable** | Breaks the no-silent-change rule |

**Recommended: A**, with the window anchored to the **16 January 2027 sitting** —
candidates preparing for that date should not have the ground move under them
mid-preparation.

**The schema point that decides this now rather than later.** `source` on
`manual_grants` already carries `grandfathered` precisely because this is a
column either way. **It cannot be retrofitted.** Once a user has been gated
without a grant row, there is no record of who was there first — the
`auth.users.created_at` timestamp survives, but the *policy decision* about
where the line fell does not, and reconstructing it later is guesswork. Choosing
A costs one insert per account. Choosing C and reversing it costs an archaeology
exercise.

A second, cheaper safeguard that applies under any option: **a question already
answered never becomes locked** for a signed-in user — the access check allows
entitlement **or** a prior attempt. It is enforceable server-side, it costs one
clause, and it means no account ever loses work it has already done. It does not
work for guests, for the reason in `docs/ACCESS_POLICY.md` §3.

---

## 6. Decisions requested

1. **Confirm ₹599**, or set another figure. Blocks the Pricing page, which blocks
   live API keys.
2. **Confirm the launch offer is described as 234 questions and the existing
   runners**, with unbuilt features on a roadmap only.
3. **Choose a grandfathering option.** A is recommended; the window is the
   second half of that choice.
4. **Confirm one-time only** — no subscription, no credits, no second SKU.

Nothing here is tax or legal advice, and no price has been set in the product.
