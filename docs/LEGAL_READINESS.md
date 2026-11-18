# Legal readiness — status report

**18 November 2026. Nothing here says the product is legally cleared, and no
lawyer or chartered accountant has reviewed any of it.**

A status report rather than another brief. The underlying analysis already
exists — `docs/IP_AUDIT.md`, `docs/legal/LEGAL_BRIEF.md`,
`docs/legal/CONTENT_POLICY.md`, `docs/BUSINESS_SETUP.md` — and is not restated
here. What follows is what is verified, what was fixed, what is still open, and
what needs a professional.

---

## 1. Verified

Re-checked against official sources on 18 November 2026, not from memory.

| Item | Evidence |
|---|---|
| **The official preparation PDF has not been re-dated** | `d-mat.de/en/dmat-in-india` still links the `260902_` build. No facts changed, so nothing downstream needs re-deriving |
| **The 2027 cycle is unchanged** | Applications close 4 Jan, test 16 Jan, results 8 Feb; second cycle closes 1 Mar, test 13 Mar, results 5 Apr. Matches what the product shows |
| **All 384 active Core questions are independently generated** | `verify:bank` — 473 checked, **0 failed**; provenance derived, not asserted |
| **No official text is reproduced in the bank** | 8-gram comparison against both official PDF builds: 0 overlaps in Figure Sequences, 0 in Mathematical Equations, 4 incidental in Latin Squares |
| **No live-examination content has been used** | The operator's exam recollection was supplied as *design guidance only* and is recorded as such. Nothing was reconstructed from it — see §3 for the one place this actively constrained us |
| **The independence disclaimer is on every page** | Release check 6, eight required points, all passing |
| **No credential is committed** | New test greps every source file for `rzp_live_`/`rzp_test_`, `NEXT_PUBLIC_*SECRET`, and service-role reads |
| **Quarantined and retired content cannot reach a user** | Release checks 1 and 2, passing |

---

## 2. Fixed in this pass

| Gap | What was done |
|---|---|
| **Terms of Use had no route** | Published at `/terms`, footer-linked |
| **Refund policy had no route** | Published at `/refunds`, footer-linked |
| **No contact page existed at all** | Published at `/contact`, with the legal name, address and grievance officer the E-Commerce Rules require |
| **No pricing page existed** | Published at `/pricing`, with derived counts and an explicit statement that nothing is for sale yet |
| **Operator details risked being invented** | All six live in `content/legal/operator.ts` as `null`. Unfilled values render as `[legal name required]` under a "not yet in force" notice, and the pages are `noindex` until filled |
| **Raw payment payloads would have been retained indefinitely** | Never stored. A body hash plus an allowlisted subset, purged at 180 days |
| **Account deletion would have been blocked to preserve evidence** | Changed to pseudonymisation: the order survives, the link to a person does not |
| **CLAUDE.md stated a Latin Squares difficulty rule the code does not follow** | Corrected to the measured bands |

**The four new pages are deliberately linked from the footer even while
incomplete.** A Terms page that says it is not in force is worse than a
finished one and far better than one that cannot be found; Razorpay's
activation check also requires them reachable.

---

## 3. Still uncertain, and why

**The exam-recollection tension — the one worth your attention.**

Your feedback from sitting the examination says the mathematics included
"quadratic equations and other advanced equation-solving approaches". Our
question contract **explicitly forbids** quadratic or higher-power terms, and
the generator rejects any equation multiplying two letters. That is not an
oversight: no official example shows a product of two unknowns, so the mechanic
is undocumented, and shipping it would mean labelling items as extrapolation
rather than documented.

Three things are true at once and none of them can be resolved by me:

1. Your recollection is genuine evidence about the examination.
2. It is not an official source, and CLAUDE.md's rule zero forbids stating a
   dMAT fact from one.
3. Reconstructing examination content from recollection is forbidden by the
   examination's own terms and by your own instruction.

**Writing an original question that happens to use a mechanic you remember is
not reconstruction** — the distinction is whether the *item* is copied, not
whether the *mechanic* is. But it does mean the contract would have to be
widened deliberately, with honest provenance grading. That is a decision, and
it is yours. See §5.

**Other open items, unchanged:**

- **GTC 9.1 scope and privity.** Whether a contractual confidentiality clause
  reaches an openly published PDF, and whether it binds a non-participant.
- **Two retained quotation fragments**, nine words each, kept to demonstrate
  that two official sources contradict each other on the exam's duration.
- **Nominative use of "dMAT"** in a product name and domain.
- **The OG image device mockup** ships with no recorded licence. The only asset
  of unknown provenance in the build.
- **The Figma design system's brand provenance** needs written confirmation.
- **OIDAR** — whether it touches an Indian individual selling a self-served
  digital product to Indian customers. No official statement was found.

---

## 4. Needs a lawyer or a CA

Nothing here is new work; it is the list, consolidated.

**Lawyer** — seven questions in `docs/legal/LEGAL_BRIEF.md` §6, plus five in the
takedown process in `CONTENT_POLICY.md` §2. The ones that would change what we
ship: GTC 9.1's reach (§6.1), the two retained fragments (§6.2), the trademark
use in the product name and domain (§6.4), and payment-record retention after
account deletion (§6.7).

**CA** — seven questions in `docs/BUSINESS_SETUP.md` §7. The one that changes
the checkout: whether OIDAR applies. Already acted on without waiting: CGST
s.32(1) means an unregistered seller may not present a price as carrying tax, so
the pricing page says "₹599" and nothing else.

**Neither** — the OG mockup licence and the Figma brand confirmation are
procurement questions, not legal ones. Someone has to find the receipt.

---

## 5. What I need from you

1. **Fill `content/legal/operator.ts`** — legal name, service address, support
   email, grievance officer, jurisdiction, last-updated date. Six values, one
   file, and every "not in force" notice disappears. **The address is the one to
   think about:** it becomes public, and for an individual working from home
   that is a home address.
2. **Decide the quadratic question in §3.** Widen the Mathematical Equations
   contract to allow variable products, accepting that those items carry
   `reasonable_extrapolation` provenance rather than `officially_documented` —
   or leave the bank linear and tell candidates plainly what it covers.
3. **Instruct a lawyer**, with `LEGAL_BRIEF.md` as the brief.
4. **Instruct a CA**, with `BUSINESS_SETUP.md` §7.
5. **Find the OG mockup's licence**, or replace the image.
