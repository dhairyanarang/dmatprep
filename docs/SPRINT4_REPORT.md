# Sprint 4 — legal, infrastructure and payments report

Branch `sprint4/legal-and-payments`, eight commits on top of Sprint 3. **Nothing
pushed, nothing merged to `main`.** No Supabase project created or connected, no
production schema, Auth setting, RLS policy or user record touched, no payment
account created, no provider SDK installed, no payments activated, no live or
test credential placed anywhere in this repository, no repository visibility
change, no Git history rewritten.

**Sprint 4 is not complete, and this report existing does not make it so.** Five
of the sixteen items are finished and verified; the rest are blocked on
decisions, on approval, or on people outside this repository. The distinction is
carried item by item below, and the decisions that unblock the most are
collected in §18.

**Nothing in this report claims legal clearance, regulatory compliance, provider
approval, payment readiness or production readiness.** Where it says "verified",
it means a named source was read on a named date, and nothing more.

## State vocabulary

Used exactly, never loosely.

| State | Meaning |
|---|---|
| ✅ **Done, tested** | Finished, and an automated gate proves it |
| ☑️ **Done, not end-to-end tested** | Finished and reviewed, but nothing executes it against reality |
| 🔄 **In progress** | Started, not finished |
| ⛔ **Blocked** | Cannot proceed; the blocker is named |
| ⏸️ **Awaiting approval** | Finished as a proposal; needs the operator's decision |
| 💳 **Awaiting Razorpay** | Needs a written answer from the provider |
| ⚖️ **Awaiting lawyer / CA / security** | Needs a professional this sprint cannot substitute for |

---

## 1. Commits

| Commit | What |
|---|---|
| `b7e58b1` | Independence claim stated in full; `/about`; disclaimer gate extended to 8 points |
| `54c1163` | IP audit; lawyer brief; content and takedown policy; hardcoded counts derived |
| `ed1eb7f` | `not-found.tsx` and `global-error.tsx` |
| `2e12d46` | Infrastructure audit; auth QA procedure made runnable |
| `ec887ed` | Freemium model measured against the bank |
| `269076f` | Razorpay verified against its own docs; superseded commercial model corrected |
| `a43277a` | Entitlement architecture proposal; business and tax brief; legal question 6.7 |
| `12bb812` | Implementation plan; public website readiness audit |

24 files changed, 3,227 insertions. **Zero changes under `content/`, `drafts/`
or `supabase/`** — confirmed by diff, and the evidence for §17.

---

# Workstream 1 — Copyright, independence, legal

## 1.1 Independent-preparation identity — ✅ Done, tested

The footer now carries the originality claim it had deliberately withheld for
three sprints. Its own doc comment had set the condition — *"The claim goes in
when the provenance audit supports it, and not before"* — and the provenance
work of Sprints 1–3 now supports it: 384 of 384 active Core questions are
`original-generated`, and an 8-gram comparison against both official PDF builds
returned 0 overlaps in Figure Sequences, 0 in Mathematical Equations and 4
incidental in Latin Squares.

`/about` was added as a fuller statement, footer-linked, **not** a fifth nav
destination.

**Gate:** release check 6 asserts the affiliation statement on every prerendered
page. Passing as of 18 November 2026.

## 1.2 Consistent disclaimer — ✅ Done, tested

The check was one regex and is now **eight required points**, each failing
independently: independence, name used only to identify, independently
developed, not official questions, the real exam may differ, no outcome
guaranteed, a fuller statement exists at `/about`, and `/about` stating that
nothing has been signed off by a person.

The supplied draft was used nearly as written. Two changes, both narrowing:
"may differ in content, difficulty and structure", and "guarantees no
examination result or admission outcome" rather than a vaguer non-guarantee.

## 1.3 Repository-wide IP audit — ☑️ Done, not end-to-end tested

`docs/IP_AUDIT.md`. Question content is clean on measurement. Official material
is paraphrased with two short attributed fragments retained deliberately (§1.4).

**Two findings remain open, and neither is closable from inside the repository:**

- ⚖️ The Figma design system's brand provenance needs written confirmation.
  *"It came from our Figma" is not a provenance record* — now a rule in
  `CONTENT_POLICY.md`.
- ⚖️ The OG image device mockup has no recorded licence. The real finding of the
  audit, and the only asset of unknown origin shipping today.

Five scaffold SVGs of unknown provenance were deleted rather than investigated.

## 1.4 Lawyer-ready legal brief — ⚖️ Awaiting lawyer

`docs/legal/LEGAL_BRIEF.md`, 298 lines. Re-reading the official T&Cs surfaced
three facts Sprint 3 had missed, two of which reframe the question:

- **GTC 12 chooses German law** for "all legal relations".
- **GTC 9.1 purports to bind "no participant or third party"** — and the
  operator is not a participant, raising a privity question the brief now asks
  directly.

**Seven questions for counsel.** The seventh was added this sprint and is the
only non-copyright one: how long payment records may lawfully outlive a deleted
account, where retention for dispute evidence and DPDP erasure both have a
legitimate claim and the schema cannot satisfy both.

§8 lists five facts only the operator can supply before counsel is instructed.

## 1.5 Copyright and provenance policy, and takedown — ☑️ / ⚖️

`docs/legal/CONTENT_POLICY.md`. The rules are operational: independent creation;
never from a live examination **including with names and numbers changed**; no
close paraphrase; provenance derived, never asserted; third-party assets
recorded. Removal is **quarantine-first**, reusing the mechanism that already
holds 86 Figure Sequences questions, because it is reversible and keeps stored
attempts resolvable.

⚖️ The takedown process names **five questions a lawyer must settle** before it
is a process rather than a draft — who receives notice, what counter-notice is
appropriate, and what jurisdiction governs a complaint from Germany.

---

# Workstream 2 — Product and infrastructure

## 2.1 Full application audit — ☑️ Done, not end-to-end tested

`docs/INFRASTRUCTURE.md`, with a four-state legend. The architecture section is
verified against the build: every page prerendered, exactly one request-time
handler (`app/auth/callback/route.ts`), no `middleware.ts`, no `proxy.ts`, no
`app/api`.

A correction I made during the audit and should record: I briefly concluded the
icon assets were missing, on the strength of a shell glob that failed because of
the space in the directory name. They exist and the OG tags emit correctly.

## 2.2 Isolated auth and cloud-sync QA — ⛔ Blocked

`docs/AUTH_QA_PROCEDURE.md` is now runnable rather than aspirational: local
stack setup, `.env.qa.local`, the `qa:assert-isolated` guard, teardown, and a
cloud alternative. It states plainly the one thing a local stack cannot
test — Google OAuth.

⛔ **It has not been executed, and cannot be.** No container runtime is
installed on this machine, so `supabase start` cannot run. This also blocks
Phase 2 of the payments build (§3.5).

What *is* verified, by `npm run verify:rls` on 18 November 2026: the anonymous
role reads zero rows from all five tables and its insert into `attempts` is
refused with 401. **Cross-user isolation was not tested** — that needs two real
access tokens, which needs the stack.

## 2.3 Privacy and security gap assessment — ☑️ / ⚖️

`docs/INFRASTRUCTURE.md` §2. Assessed: data collected, where it lives, RLS
posture, the deliberate `attempts` immutability, and the answer-delivery split.

⚖️ **No independent security review has happened**, and a privacy policy
existing is not compliance. Recorded as a gap, not a finding.

## 2.4 Operational readiness and launch checklist — ☑️ Done

`docs/INFRASTRUCTURE.md` §4. The 404 and 500 pages were built this sprint partly
because the audit found neither existed.

One real bug was found and fixed by reading the Next 16 docs rather than
assuming: `global-error.tsx` takes **`retry`**, not `reset`. The older name
compiles and produces a "Try again" button wired to `undefined`.

---

# Workstream 3 — Payments and monetisation

## 3.1 Revised freemium model — ☑️ Done (Core) / ⛔ Blocked (GAM)

`docs/MONETISATION.md`, measured not assumed.

**Core supports the model.** 384 active: 150 free, 234 premium — 50 per section.
The free list is a committed, hash-locked file, and none of its 150 ids has
since been quarantined. It is demonstrably not "the first 50": 9/9, 20/20 and
5/5 pattern types covered, even difficulty across all three. Reported anyway
because it looks bad without the explanation — 38–40 of each 50 also fall in the
first 50 by file order, which reflects batch ordering, not the selection method.

⛔ **GAM does not support it at all.** Sixteen active questions, sixteen through
automated validation, sixteen covered by a blind round, and **zero signed off by
a person**. The brief permits only human-approved content to be offered, and
says a shortfall is to be reported rather than the standard lowered. The
shortfall is total: **no free sample, and nothing sellable either.** That is the
review gate working, not a content judgement.

Two facts stated plainly because they change the offer: the 234 premium
questions **have been public since August** and cannot be made scarce; and every
Core question is **free today**, so launching takes 234 away from existing users.

**Recommendation: ₹599 one-time.** Not a decision.

## 3.2 Provider verification — ☑️ Done / 💳 Awaiting Razorpay

`docs/RAZORPAY.md`, every claim graded and sourced, **all read 18 November
2026**. Razorpay primary, Cashfree the only fallback, per the operator's
decision.

**The discrepancy the brief asked about: found and reported, not silently
reverted.** `docs/PAYMENTS.md` §0.1 still carried the pre-freemium model — *"the
473 Core questions are free … no paywall should be built around them"*. It is
superseded by the 150/234 model. It was never acted on. The old wording is
**quoted in place** so the correction is visible.

`docs/PAYMENTS.md` §6 recommended **Cashfree** and is left standing unedited,
with a decision box above it. Deleting it would hide the trade-off that was
accepted: Cashfree's webhook contract is genuinely stronger, and that argument
was **outweighed, not refuted**. Razorpay disables a webhook after 24 hours of
failures — a silent outage in which a paying customer has no access and nothing
in the product knows. **The reconciliation sweep is therefore now mandatory
rather than recommended.** That is the price of the decision.

Four findings that changed the order of work:

- **Live API keys are withheld until six policy pages exist** — About us,
  Contact us, Pricing details, Terms, Privacy, Refunds. Two exist, two are
  unrouted drafts, two do not exist.
- **Razorpay's own Node sample breaks Razorpay's own rule**, on the same page:
  it warns "Do not parse or cast the webhook request body", then shows
  `validateWebhookSignature(JSON.stringify(webhookBody), …)`. Re-serialising a
  parsed object does not reproduce the signed bytes. It passes in testing and
  fails intermittently in production.
- **Registering a proprietorship first makes onboarding harder.** An Individual
  uploads no business-identity document; a Proprietorship must upload two.
- **Test keys need only a sign-up** — no KYC, no activation, no website.

💳 **Ten items are undocumented and need written confirmation.** Three would
change a decision rather than a forecast: whether the 2% fee and its GST are
returned on a refund; whether settlement is T+1 or T+2 (**Razorpay's pricing
page and its own docs still contradict each other, re-checked 18 November**);
and whether the operator's existing bank account qualifies at all.

Cashfree's minimums are recorded to the depth that makes a switch a decision
rather than a research project — including its own signature contradiction,
where the pseudocode joins timestamp and payload with a dot and the manual
examples use no separator.

## 3.3 Business and tax requirements — ☑️ Done / ⚖️ Awaiting CA

`docs/BUSINESS_SETUP.md`. **Recommendation: stay an Individual**, on the
paperwork evidence above.

One statutory finding changes copy that would otherwise have been written wrong.
**CGST s.32(1)**, read on CBIC: an unregistered person *"shall not collect … any
amount by way of tax"*. So the price is **"₹599"** — never "₹599 + GST", never
"inclusive of GST" — and the document issued is an ordinary commercial invoice,
not a tax invoice. The net is unaffected; Razorpay's 18% is on Razorpay's fee.

⚖️ **Seven questions for a CA**, of which one could change the checkout before
launch: whether OIDAR has any bearing on an Indian-resident individual selling a
self-served digital product to Indian customers. No official statement either
way was found and none was invented.

**The bank account is the likeliest surprise**, because Razorpay documents none
of what matters — name match, joint accounts, savings versus current — while
Cashfree documents all three.

## 3.4 Entitlement architecture — ⏸️ Awaiting approval

`docs/ENTITLEMENT.md`, presented as a proposal because the brief requires schema,
RLS, privileged operations and rollback to be approved **before** they exist.

Three tables: `payments` and `webhook_events` append-only, `entitlements`
mutable with an audit trail. The RLS model's central feature is what it
**omits** — no INSERT, UPDATE or DELETE policy on any of the three. With RLS
enabled and no policy, every client write is refused; writes happen only through
the service role. **The absence of a policy is the security control**,
generalising the rule `attempts` already follows.

Correspondingly: the service role bypasses RLS, so **every privileged write must
re-check the owner in application code**. On the write path RLS is not a second
line of defence; there is no first line.

**Three things this breaks, stated before the design rather than found after:**

- ⏸️ **"Nothing is ever gated behind sign-in" stops being true.** An entitlement
  is attached to an account. Every alternative is copyable, and the brief is
  explicit that client-held flags are not access control. The free 150 stay
  exactly as they are — static, guest-first, no affordance. **This is a
  narrowing of a documented rule and needs sign-off, not a quiet edit.**
- The product gains request-time surface; the invariant weakens to "every *page*
  is static".
- Entitlement is the one thing that is not local-first.

## 3.5 Implementation plan and sandbox — ⏸️ / ⛔

Planned in `docs/ENTITLEMENT.md` §11. **No code written**, per the instruction
that the sandbox comes only after the architecture and approval gates.

**Phase 1 needs no approval, no provider and no sandbox**, and is where
provider-independence is actually established: the adapter, the idempotent grant
function, and tests against a mock. Written after a real integration instead,
the Razorpay shape leaks into everything. The cases that decide
correctness — duplicate event, refund before capture, signature mismatch,
webhook and sweep racing — are also harder to produce against a live sandbox
than against a mock.

⛔ Phase 2 is blocked by the same missing container runtime as §2.2.

Phase 4 records what a perfect sandbox run still does not prove: settlement
timing, refund fee behaviour, chargebacks, the 24-hour auto-disable, and
activation itself. **The sandbox proves the code, not the business.**

---

# Workstream 4 — Public website and customer readiness

## 4. ☑️ Audited / ⛔ Blocked on decisions

`docs/WEBSITE_READINESS.md`. Four of the six pages Razorpay requires are not
shippable, and **two are blocked on decisions rather than work**.

The governing rule: **nothing is advertised before it is built.** The premium
features that justify the price — analytics, weak-area identification, pacing
insight, adaptive practice — do not exist yet, so they may appear on a visible
roadmap and never in a feature list. And since the 234 premium questions are
public, copy must not imply an exclusivity a GitHub link disproves.

Two traps recorded while still cheap: the free/premium boundary must be legible
**before** a candidate meets a locked question; and grandfathering is a schema
column that is impossible to retrofit once the data is gone.

An honest reading of the six release gates: they check containment, and none can
check the thing that will matter most — **that no premium content is reachable
without an entitlement**. That gate cannot exist until the entitlement does.

---

# Workstream 5 — Question development parked

## 5. ✅ Done, verified

**Zero changes under `content/`, `drafts/` or `supabase/`** across all eight
commits, confirmed by diff. Everything preserved:

| Preserved | Evidence |
|---|---|
| 86 quarantined Figure Sequences questions | Release check 1 passes |
| Retired ids, reserved forever | Release check 1 passes |
| Derived provenance on all 384 | `verify:bank` passes |
| GAM human-review package, 0 signed off | `verify:gam` passes |
| Six static-rotator pilot drafts, none in the bank | Release check 2 passes |
| Re-authoring proposal and review findings | Untouched |

Two display-only edits touched `app/`: hardcoded Module B counts replaced with
derived ones (`"17 questions"` → **16**). That corrected a wrong number on a
public page; it did not change a question.

---

## 6. Verification run — 18 November 2026

| Gate | Result |
|---|---|
| `npm run verify:content` | ✅ exit 0 — every content gate passed |
| Test suite | ✅ **340 passed, 0 failed**, 1 `todo` |
| `npm run release:check` | ✅ **all 6 passed** |
| `npm run verify:rls` | ☑️ anonymous checks passed; **cross-user isolation not tested** |
| `npm run build` | ✅ included in `verify:content` |
| `npm run lint` | ✅ included in `verify:content` |

**The one `todo` is a real gap, not a formality.** `module-b/timed.html` ships
**19 `correctOptionId` values** in its public payload — Module B has not had the
answer/solution split that Core received. It is not a commercial exposure, since
nothing in Module B is sellable, but it is a known hole and the flag should drop
only when the split happens.

**All of this is automated validation.** It proves no question is correct and
nobody has signed anything off.

---

## 7. What was explicitly not done

Per the brief, and verifiable: no push, merge or deploy; no repository
visibility change; no Git history rewritten; no production Supabase schema, Auth
setting, RLS policy, user or entitlement touched; no payment account created; no
provider SDK installed; no live or test credential placed in source,
documentation or any committed environment file; no live payments activated; no
real card or UPI transaction; no second provider implemented; no admin
functionality or analytics invented; no claim of legal clearance, regulatory
compliance, provider approval or production readiness.

---

## 8. Next decisions required from me

The operator's, in the order that unblocks the most. Items 1–5 are decisions,
not work, and between them they unblock most of the remaining sprint.

### Blocking the most

1. **Approve or amend the entitlement schema** — `docs/ENTITLEMENT.md` §3, §4,
   applied to a **local or staging** project only. Blocks the entire payments
   build.
2. **Accept that sign-in becomes required for purchase and premium**, narrowing
   `CLAUDE.md`'s "nothing is ever gated behind it" to the free product. There is
   no architecture that avoids this and keeps access control real.
3. **Settle the price.** ₹599 is recommended with the arithmetic shown. It
   blocks the Pricing page, which blocks **live API keys**, which blocks
   everything downstream. It is no longer free to defer.
4. **Decide grandfathering** — grandfather, announce, or gate silently. A column
   either way; impossible to retrofit once the data is gone.
5. **Decide the public address.** The E-Commerce Rules require a principal
   geographic address displayed prominently; for an individual working from
   home, that is a home address on a public site. A real privacy cost, and the
   strongest practical argument for registering an entity — which is not a tax
   argument.

### Needed before applying to Razorpay

6. **Confirm the bank account qualifies** — name match against PAN, joint or
   sole, savings or current, and whether the bank's own terms permit business
   receipts. Cheapest to check first, worst to discover during review.
7. **Decide the support mailbox and grievance officer.** The 48-hour
   acknowledgement is an operational commitment, not a page, and a personal
   address is the wrong answer once public.
8. **Decide the refund window** — inside six months, since Razorpay cannot
   refund past it.

### To be delegated

9. **Instruct a lawyer** — seven questions in `LEGAL_BRIEF.md` §6, five in the
   takedown process, plus the §8 facts only the operator can supply.
10. **Instruct a CA** — seven questions in `BUSINESS_SETUP.md` §7, of which
    OIDAR is the one that could change the checkout.
11. **Get the ten items in `RAZORPAY.md` §13 in writing.**
12. **Decide on an independent security review** before anything is sold.

### Smaller, but mine to raise

13. **Install a container runtime**, or provision a separate Supabase project as
    staging. Unblocks auth QA and payments Phase 2 together.
14. **Resolve the two open IP items** — the Figma brand confirmation and the OG
    device mockup's licence. The mockup ships today with unknown provenance.
15. **Decide whether Figure Sequences premium is worth launching** at 37
    questions, or held back.
16. **Decide whether Module B ships at all**, given that 0 of 16 are signed off
    and nothing in it may be free or sold until someone signs.

---

## 9. The honest summary

The legal and provenance position is materially stronger than at the start of
the sprint: the independence claim is now made in full and is supported by
measurement, the IP position is audited, and a lawyer can be instructed from a
real brief rather than a description.

The payments position is **researched and designed, and nothing is built**. That
is the correct state given the gates in the brief, but it should not be mistaken
for being close to taking money. Between here and a first rupee sit an approval,
five decisions, four pages that do not exist, a provider application that can be
refused, and a build that has not started.

The thing most likely to go wrong is still the thing this sprint could not do:
**nobody has signed off any question.** Sixteen GAM questions, automated and
blind-reviewed, remain unsellable and unofferable for exactly that reason, and
that gate held under commercial pressure this sprint. It should keep holding.
