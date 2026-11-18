# Public website and customer readiness

What a visitor and a paying customer must be able to find, and what is actually
there today. Audited 18 November 2026 against the routes in `app/` and the
requirements verified in `docs/RAZORPAY.md` §5 and `docs/BUSINESS_SETUP.md` §5.

**No claim here is that the site is compliant or launch-ready.** It is a gap
list with an order to work through.

---

## 1. The rule that governs every word of copy

**Nothing is advertised before it is built.**

This is not a style preference. `docs/MONETISATION.md` records that the durable
premium value is the enhanced mock experience, performance analytics, weak-area
identification, pacing and readiness insight, and adaptive practice — and that
**none of those exists today** beyond the mock runners. A purchase page listing
them is selling something that does not exist, which is a consumer-protection
problem before it is a marketing one.

Three corollaries, all enforceable by reading the page:

- **Premium features may be named on a roadmap, never in a feature list**, and a
  roadmap must be visibly a roadmap.
- **"Independently developed" is already true and already shipped**, verified by
  provenance records and asserted in the footer and at `/about`. It is the one
  strong claim this product can make. It must not be diluted by sitting beside
  claims that are weaker.
- **Nothing may claim or imply endorsement, affiliation, approval or a
  predicted result.** Already gated — see §5.

A second rule follows from `docs/MONETISATION.md` and is easy to get wrong in
copy: **the 234 premium Core questions are already public.** Copy must not
imply exclusivity it does not have. What is being sold is convenience,
organisation and the features that follow — and saying so plainly is both
honest and a better pitch than a scarcity claim anyone can disprove with a
GitHub link.

---

## 2. The six pages Razorpay requires

Live API keys are withheld until these exist — verified on Razorpay's India
documentation (`docs/RAZORPAY.md` §5). The Consumer Protection (E-Commerce)
Rules, 2020 independently require most of the same information.

| Page | Status | What is needed |
|---|---|---|
| **Privacy policy** | ✅ `/privacy`, live, footer-linked | Needs a payment-data section before launch — flagged in `docs/legal/privacy-policy.md` |
| **About us** | ✅ `/about`, live, footer-linked | Built this sprint. Already carries the independence statement |
| **Terms and conditions** | ⚠️ draft, **no route** | `docs/legal/terms-of-use.md`. Placeholders unfilled; no lawyer review |
| **Refunds policy** | ⚠️ draft, **no route** | `docs/legal/refund-policy.md`. The window is undecided — see `docs/BUSINESS_SETUP.md` §4 |
| **Contact us** | ⛔ **does not exist** | Needs a real monitored address and the grievance officer's details |
| **Pricing details** | ⛔ **cannot exist yet** | Blocked on the price decision |

**Four of six are not shippable today, and two are blocked on decisions rather
than work.** That is the shape of the critical path: Pricing waits on the price,
Contact waits on the address and mailbox decisions in
`docs/BUSINESS_SETUP.md` §8, and both Terms and Refunds want a lawyer.

**A live page headed DRAFT is a liability, not a disclosure.** `docs/legal/README.md`
already says this and it still holds: these publish when payments are activated,
filled in, not before and not provisionally.

### 2.1 What the Contact page must carry

More than an email address. The E-Commerce Rules require the **legal name**, the
**principal geographic address**, and the **grievance officer's name, contact
details and designation**, with a complaint acknowledged **within 48 hours** and
redressed **within one month**.

**The 48 hours is an operational commitment, not a page.** It needs a mailbox
someone reads on a schedule. A personal address is the wrong answer once this is
public, and `docs/BUSINESS_SETUP.md` §8 records the address decision as one with
a genuine privacy cost that only the operator can weigh.

---

## 3. What a paying customer needs that no page currently provides

Beyond the compliance set, and all of it missing because nothing is sold yet:

| Need | Status |
|---|---|
| Know what is free before hitting a lock | ⛔ nothing is locked today |
| Know what premium includes, truthfully | ⛔ no page |
| A receipt | ⛔ no mechanism. An ordinary commercial invoice, not a tax invoice (`docs/BUSINESS_SETUP.md` §3.2) |
| Proof of what they bought | ⛔ `payments` is readable by its owner in the §4 design; no page renders it |
| A way to ask for a refund | ⛔ no route, no policy, no window |
| Confidence their free progress survives | ⚠️ a design requirement in `docs/MONETISATION.md`; not yet a tested guarantee |

**The free/premium boundary is the one with a design trap.** `docs/MONETISATION.md`
lists it as a requirement: the distinction must be clear **before** a candidate
meets a locked question, not at the moment of the lock. Discovering a paywall
mid-practice-set is the single most resented pattern in this category, and the
free set is deliberately generous enough — 50 per section, every pattern type,
even difficulty — that there is no reason to be coy about where the line is.

**And the one with an ethical trap:** `docs/MONETISATION.md` records that every
Core question is free today, so introducing the model takes 234 away from anyone
already using the product. Grandfather, announce, or gate silently. The schema
carries a `source = 'grandfathered'` value either way
(`docs/ENTITLEMENT.md` §3.3), so the decision is cheap to honour and impossible
to retrofit once the data is gone.

---

## 4. What the site already does well, and should not regress

Worth recording so a launch push does not quietly undo it.

- **The independence disclaimer is on every prerendered page** and makes all
  eight required points, enforced by `release:check`.
- **`/about` states plainly that nothing has been signed off by a person**,
  which is the honest position on Module B and is gated by a test.
- **`/exam/sources` publishes the audit record** for every exam claim, graded
  *stated / demonstrated / inferred / unknown*. Very few products in this
  category show their working at all.
- **Guest mode is complete.** 150 free questions, full explanations, progress
  tracking, no account, no affordance. That is a real free product, not a demo.
- **404 and 500 pages exist** and both say progress is safe.

---

## 5. What the release gates already guarantee — and what they do not

`npm run release:check` runs six containment checks over the built output:

1. No quarantined or retired question in any active set.
2. No unapproved draft in the production build.
3. No answers shipped with the question on a Core practice route.
4. Separated solution files are not described as protected content.
5. Candidate-facing exam facts trace to an official source, with no superseded
   2026 sitting dates.
6. The independence disclaimer is on every page and makes every required point.

**What they do not check, and would need to before a paid launch:**

- That no premium content is reachable without an entitlement. **Cannot exist
  until the entitlement does** — and it is the single most important gate to add
  when it does.
- That no page advertises a feature that is not built (§1). Partly checkable: a
  list of not-yet-built feature names, asserted absent from the build.
- That the six required pages exist and are reachable.
- That no page states a price other than the decided one.

The last three are cheap and should be added **with** the pages, not after.

---

## 6. Order of work

Decisions first, because four of them block pages rather than the other way
round.

**Blocked on the operator**

1. The price → unblocks the Pricing page → unblocks live keys.
2. The public address → unblocks Contact and the Terms.
3. The support mailbox and grievance officer → unblocks Contact and the 48-hour
   duty.
4. Grandfathering → unblocks the upgrade announcement and the entitlement
   schema.
5. The refund window → unblocks the Refunds page. A window inside six months,
   since Razorpay cannot refund past it (`docs/BUSINESS_SETUP.md` §4).

**Then, and only then**

6. Fill the placeholders in `docs/legal/*.md` and publish Terms, Refunds,
   Contact and Pricing as real routes.
7. Add the payment-data section to `/privacy`.
8. Build the free/premium boundary UI — the "what you get" page and the
   pre-lock clarity of §3.
9. Extend `release:check` with the four gates in §5.
10. Apply for Razorpay activation, which 1–7 have now unblocked.

**Independent of all of it:** the Phase 0 and Phase 1 work in
`docs/ENTITLEMENT.md` §11 — the adapter, the mock, the tests — needs none of
these decisions and can proceed in parallel.

---

## 7. Current state

Twenty-three routes, all static. No pricing page, no contact page, no terms
route, no refunds route, no purchase flow, no locked content, no receipt, and
no mention of money anywhere in the product. Nothing is sold and nothing claims
to be.
