# Sprint 4 — legal, infrastructure and payments report

**Revised 18 November 2026 after review.** The review found a correctness defect
in the entitlement design that could have taken money and granted nothing. It is
described in §3.4a, it is fixed, and the fix changed the schema rather than
adding a column. Four documents were added or rewritten as a result; the
originally reported items are unchanged except where §3.4, §3.5 and §4 say
otherwise.

Branch `sprint4/legal-and-payments`, nine commits on top of Sprint 3. **Nothing
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
| *(this commit)* | **Entitlement revision 2**; access policy; pricing note; Razorpay test-mode and second-signature findings; QA decision |

**Zero changes under `content/`, `drafts/` or `supabase/`** across the whole
sprint — confirmed by diff, and the evidence for §5.

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

## 3.4 Entitlement architecture — ⏸️ Awaiting approval (revision 2)

`docs/ENTITLEMENT.md`, a proposal because the brief requires schema, RLS,
privileged operations and rollback to be approved **before** they exist.

**Five tables now, not three**, and the division is the fix rather than growth:

```
payment_orders   append-only   our intent, and the ONLY source of ownership
payments         facts         one row per payment attempt; status monotonic
webhook_events   state machine delivery, claim, outcome — "seen" ≠ "done"
manual_grants    append-only   grandfathering, comps, operator revocation
entitlements     projection    derived from the above; never mutated directly
```

The RLS model is unchanged and is still the part I would defend hardest: **no
INSERT, UPDATE or DELETE policy on any table, and no policy at all on
`webhook_events` or `manual_grants`.** With RLS enabled and no policy, every
client write is refused; writes happen only through the service role. **The
absence of a policy is the security control.**

Its corollary is now stated where it belongs: the service role bypasses RLS, so
on the write path RLS is not a second line of defence — there is no first line.
**Every privileged write verifies ownership in application code**, and §6.1 of
that document fixes exactly where ownership comes from, which revision 1 never
said.

**Three things this breaks**, unchanged, with the full analysis moved into
`docs/ACCESS_POLICY.md`:

- ⏸️ **"Nothing is ever gated behind sign-in" stops being true.** An entitlement
  is attached to an account; every alternative is copyable. The free 150 stay
  exactly as they are. **A narrowing of a documented rule, needing sign-off.**
- The product gains request-time surface; the invariant weakens to "every *page*
  is static".
- Entitlement is the one thing that is not local-first.

## 3.4a The webhook defect, and how it was fixed

**What revision 1 did.** Insert the event id, treat a primary-key collision as a
duplicate and return 200, then grant.

**Why it was wrong.** The insert committed independently of the grant. If the
grant then failed — transient database error, a deploy mid-request, any
exception — the event row survived with `processed_at` null. Razorpay retried,
the insert collided, and the handler returned **200 without retrying the
grant**. Razorpay then correctly stopped retrying. The payment was captured, no
entitlement existed, and nothing in the product knew.

**The error underneath it generalises:** *"we have seen this event"* and *"we
have acted on this event"* are two different facts, and revision 1 stored them
as one. A primary key answers the first question; it was being used to answer
the second.

**The fix, in three parts.**

1. **A durable state machine.** `webhook_events` gains
   `status ∈ (pending, processing, processed, failed, parked)`, `attempts`,
   `locked_until` and `last_error`. A single `insert … on conflict … do update
   … where` statement performs insert-or-claim atomically. Returning zero rows
   is **ambiguous** — processed, parked, or a live lock — so the handler reads
   the row to distinguish them. Returning 200 on all three would be revision 1's
   error again.
2. **The grant and its record commit together.** The payment fact, the
   entitlement projection and the transition to `processed` are **one
   transaction**. There is no window in which one exists without the other. A
   crash anywhere rolls back all three and the lock expires, so nothing wedges.
3. **Entitlement is derived, not mutated.** `recompute_entitlement` is a pure
   function of the stored facts, and `payments.status` is monotonic — enforced
   by a database trigger, so no handler or manual fix can bypass it. **Ordering
   and duplication stop being cases to handle and become impossible to get
   wrong.** A late `captured` after a `refunded` is dropped by the trigger; a
   duplicate event recomputes to the same row.

**The concurrency argument, not asserted but made**, in `docs/ENTITLEMENT.md`
§6.4: two simultaneous deliveries, a worker that died mid-process, a worker that
died between transactions, and a worker that died inside the transaction. The
claim statement takes a row lock for its duration, so the second claimant
re-evaluates its `where` against the committed row and matches nothing —
**exactly one claimant, always**. And a second, independent guarantee: even if
every lock failed, idempotence of the projection makes a double grant
impossible. The locking prevents wasted work; **correctness does not depend on
it**.

**`parked` is the state revision 1 lacked**, and it does two jobs. It stops one
poison event returning 500 for 24 hours and tripping Razorpay's auto-disable —
which would break *every* future payment, not just the bad one. And it makes the
acknowledgement honest: a 200 on a parked event says "received, and recorded
that we did not act", which is alerted, queryable and in the sweep's queue, not
silent. The attempt cap (5) promotes a stuck `failed` to `parked` for the same
reason.

**The sweep now has two jobs.** Provider-side drift as before, and — new —
re-driving every `failed`, `parked` or lock-expired event. **A failed grant is
now a row in a queryable queue rather than a lost log line**, which is the
direct answer to the defect.

**Alternatives considered and rejected, with reasons** (§6.6): a pure single
transaction cannot satisfy "a failed grant remains visible" because a rollback
leaves no trace, and gives no way to park a poison event; a transactional outbox
gives up the provider's retry safety net and needs always-on compute this product
does not have. Both are recorded with the conditions under which they would win.

**Four further corrections from the same review:**

- **Two SQL errors of my own**, found while writing revision 2: `user_id uuid
  not null … on delete set null` is a contradiction that makes the delete fail,
  and §11's description had the foreign-key direction garbled. Both fixed.
- **Raw webhook payloads are no longer stored.** Revision 1 kept `payload jsonb
  not null` forever; Razorpay payloads carry contact email, phone, card last
  four, issuer and UPI VPA. Revision 2 stores a **`body_sha256`** and an
  **allowlisted** redacted subset, purged after 180 days — just past Razorpay's
  six-month refund limit. An allowlist cannot go stale when the provider adds a
  field.
- **Account deletion is pseudonymisation, not `restrict`.** Revision 1 blocked
  deletion to preserve evidence, which is a developer deciding a legal question.
  Revision 2 nulls the user reference and keeps the order, amount, dates and
  provider ids, so we can still answer *"was this order paid"* and not *"by
  whom"*. Still question 6.7 for counsel, now with three concrete options
  instead of one assumption.
- **There are two signatures, not one** (`docs/RAZORPAY.md` §10.2) — the webhook
  signs the raw body with the **webhook secret**; the Checkout return signs
  `order_id + "|" + payment_id` with the **API key secret**. Different keys,
  different messages, and confusing them produces verification that is wrong in
  a way that looks right. Razorpay's own documentation also says **"Do not use
  the `razorpay_order_id` returned by Checkout"** — independent confirmation of
  the ownership rule in §6.1, arriving from the provider.

## 3.5 Implementation plan and sandbox — ⏸️ / ⛔

Planned in `docs/ENTITLEMENT.md` §11. **No code written**, per the instruction
that the sandbox comes only after the architecture and approval gates.

**Phase 1 needs no approval, no provider and no sandbox**, and is where
provider-independence is actually established: the adapter, `recompute_entitlement`
as a pure function, and tests against a mock. Written after a real integration
instead, the Razorpay shape leaks into everything.

The Phase 1 test list grew with the redesign, and it is now the real deliverable
of that phase: duplicate delivery, **concurrent** delivery, worker death between
transactions, worker death **inside** the transaction, refund-before-capture,
two payments on one order, two orders for one user, duplicate refund,
chargeback-then-comp, and a poison event reaching the attempt cap. Every one of
these is **easier against a mock than against a live sandbox**, which is the
argument for the ordering.

**Two claims are explicitly flagged as untested.** `docs/ENTITLEMENT.md` §6.4
argues the concurrency properties; it does not prove them. Two need a real
Postgres rather than a mock and are written down as the first integration tests
Phase 2 should carry: that the claim statement admits exactly one of two
simultaneous claimants, and that the monotonic trigger drops a late `captured`.
Until those run, §6.4 is reasoning, not evidence.

⛔ Phase 2 is blocked by the same missing container runtime as §2.2. The options
and a recommendation are now in `docs/INFRASTRUCTURE.md` §5 — see §8 item 6.

Phase 4 records what a perfect sandbox run still does not prove: settlement
timing, refund fee behaviour, chargebacks, the 24-hour auto-disable, and
activation itself. **The sandbox proves the code, not the business.**

---

# Workstream 4 — Public website and customer readiness

## 4. ☑️ Audited / ⛔ Blocked on decisions

`docs/WEBSITE_READINESS.md`. Four of the six pages Razorpay requires are not
shippable, and **two are blocked on decisions rather than work**.

Two approval-facing documents were added this revision and belong here as much
as under §3:

- **`docs/ACCESS_POLICY.md`** — the six access rules, what each means for the
  product as it stands, and **seven conflicting statements** found by grep in
  `CLAUDE.md`, `docs/SUPABASE.md` and `docs/CONTENT_EXPOSURE.md`. Two are flat
  contradictions, two need a qualifying clause, and three turn out to be fine.
  **None has been edited**, because `CLAUDE.md` is the policy and the brief says
  not to change the policy before approval.
- **`docs/PRICING_DECISION.md`** — ₹599 with the fee arithmetic, what a buyer
  actually receives at launch (234 questions and the existing runners, and
  nothing else), the five named premium features that **do not exist and
  therefore cannot be advertised**, and grandfathering with each option's schema
  cost.

**The consequence worth reading in `ACCESS_POLICY.md` §3**: the
no-silent-change rule is enforceable for accounts and **not** for guests. A
signed-in user can be protected by allowing access where a prior attempt
exists; a guest's history lives in their browser and cannot be trusted by a
server — the same reasoning that rules out client-held flags, applied
consistently. That turns grandfathering from a nicety into the only mechanism
that honours the rule, and it is why the recommendation is to announce before
the cutoff rather than after.

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
| Test suite | ✅ **0 failed.** 340 passing under `verify:content`; 339 + 1 skipped under a bare `npm test` — see below |
| `npm run release:check` | ✅ **all 6 passed** |
| `npm run verify:rls` | ☑️ anonymous checks passed; **cross-user isolation not tested** |
| `npm run build` | ✅ included in `verify:content` |
| `npm run lint` | ✅ included in `verify:content` |

**The one `todo` is a real gap, not a formality.** `module-b/timed.html` ships
**19 `correctOptionId` values** in its public payload — Module B has not had the
answer/solution split that Core received. It is not a commercial exposure, since
nothing in Module B is sellable, but it is a known hole and the flag should drop
only when the split happens.

**The count differs between the two runs, and the difference is not a
regression.** A bare `npm test` reports 339 passing and **1 skipped**; under
`verify:content` the same suite reports 340 passing and 0 skipped. The skipped
test is *"a production build is present when CI requires one"*, which is
CI-gated: `verify:content` builds first, so it runs; standalone, it skips.
Reported because a changed number with no explanation is how a real regression
gets waved through.

**All of this is automated validation.** It proves no question is correct and
nobody has signed anything off.

---

## 6.1 Remaining technical risks

Ranked by what they would cost if they went wrong.

| # | Risk | Status |
|---|---|---|
| 1 | **The §6.4 concurrency argument is reasoning, not evidence.** Two claims need a real Postgres to verify | ⛔ untestable until the §8.6 decision |
| 2 | **Razorpay's 24-hour webhook auto-disable.** Mitigated by design (sweep + `parked` + attempt cap); the mitigation is **unbuilt and untested** | ⏸️ by design, not yet by code |
| 3 | **The two signature schemes** (webhook secret over raw body; API secret over `order_id\|payment_id`). Confusing them verifies wrongly while looking right | ☑️ documented; fixture tests specified, not written |
| 4 | **The `JSON.stringify` trap in Razorpay's own sample.** Fails intermittently, in production, from vendor-blessed code | ☑️ documented; CI test specified, not written |
| 5 | **Module B ships 19 answer keys** in `module-b/timed.html`. Not a commercial exposure — nothing in Module B is sellable — but a real hole | 🔄 carried as a `todo` |
| 6 | **No independent security review** of the entitlement design. It has been reviewed once, by the reviewer who found the §3.4a defect, which is exactly why a second pass is worth buying | ⚖️ awaiting security |
| 7 | **Cross-user RLS isolation untested.** Anonymous access is verified; two-token isolation is not | ⛔ blocked on §8.6 |
| 8 | **Supabase point-in-time recovery unverified** on the current plan. "We can roll back" is an unchecked claim until it is checked | 🔄 check before the first live payment |
| 9 | **The OG image device mockup** ships with no recorded licence | ⚖️ awaiting a decision |

**Risk 1 deserves its place at the top.** The redesign in §3.4a is argued
carefully and I believe it is correct, but the last design was also believed
correct and contained a defect that would have taken money and granted nothing.
**The lesson is not "argue harder" — it is that the concurrency claims need
tests against a real database before anyone relies on them.** That is why the
container-runtime decision (§8.6) is no longer a QA convenience.

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

Six decisions unblock everything else, and the brief asked for a small set. This
is it. **Items 7–16 are the longer tail and need nothing from you until the
first six are settled.**

Each is labelled with what it blocks, so the dependency is visible rather than
implied.

### The six

| # | Decision | Blocks | Recommendation |
|---|---|---|---|
| **1** | **Approve or amend the five-table schema and the no-write-policy RLS model** — `docs/ENTITLEMENT.md` §14 | The entire payments build. Phase 2 onward | Approve, applied to an **isolated** project only |
| **2** | **Approve the access rules**, including that sign-in becomes required for purchase and premium — `docs/ACCESS_POLICY.md` §5 | The four `CLAUDE.md` edits; all gating work | Approve the six rules; no architecture avoids this and keeps access control real |
| **3** | **Choose a grandfathering option** — A, B or C, `docs/ACCESS_POLICY.md` §3 | The entitlement schema's launch data, and the pre-cutoff notice | **A** — grandfather accounts, announce before the cutoff, anchor the window to the 16 Jan 2027 sitting |
| **4** | **Confirm ₹599** — `docs/PRICING_DECISION.md` §6 | The Pricing page → **live API keys** → everything | Hold ₹599 and ship the features |
| **5** | **Confirm the launch offer is described as 234 questions and the existing runners**, with unbuilt features on a roadmap only | All customer-facing copy | Confirm. Five named features do not exist |
| **6** | **Install a local container runtime** (not a staging project) — `docs/INFRASTRUCTURE.md` §5 | Auth QA, RLS isolation testing, payments Phase 2, **and the §6.1 risk 1 tests** | **Yes.** Needs no approval of anything cloud, creates nothing, and is the safer place for a service-role key |

**Why 6 is on this list and was not before.** It was a QA convenience. After the
§3.4a redesign it is the only way to test the concurrency claims the design now
rests on, and risk 1 in §6.1 says plainly that those claims are reasoning rather
than evidence until it happens.

**Note on 3.** The schema already carries `source = 'grandfathered'` because this
is a column either way. Choosing A costs one insert per existing account.
Choosing C and reversing it later costs an archaeology exercise, because the
record of where the line fell will not exist.

### Then, before applying to Razorpay

7. **Confirm the bank account qualifies** — name match against PAN, joint or
   sole, savings or current, and whether the bank's own terms permit business
   receipts. Cheapest to check first, worst to discover during review.
8. **Decide the public address.** Required by the E-Commerce Rules and displayed
   prominently; for an individual working from home, that is a home address on a
   public site. A real privacy cost, and the strongest practical argument for
   registering an entity — which is not a tax argument.
9. **Decide the support mailbox and grievance officer.** The 48-hour
   acknowledgement is an operational commitment, not a page.
10. **Decide the refund window** — inside six months, since Razorpay cannot
    refund past it.

### To be delegated

11. **Instruct a lawyer** — seven questions in `LEGAL_BRIEF.md` §6 (6.7 now
    carries three concrete options rather than one assumption), five in the
    takedown process, plus the §8 facts only the operator can supply.
12. **Instruct a CA** — seven questions in `BUSINESS_SETUP.md` §7, of which
    OIDAR is the one that could change the checkout.
13. **Get the ten items in `RAZORPAY.md` §13 in writing.**
14. **Commission an independent security review** of the entitlement design
    before anything is sold. §6.1 risk 6 — one review already found a defect
    that would have taken money and granted nothing, which is the argument.

### Smaller

15. **Resolve the two open IP items** — the Figma brand confirmation and the OG
    device mockup's licence. The mockup ships today with unknown provenance.
16. **Decide whether Figure Sequences premium launches** at 37 questions, and
    **whether Module B ships at all** given 0 of 16 signed off.

---

## 8.1 The exact next actions, and what each waits on

Separated as the brief asks: **completed**, **tested**, and **proposed** are not
the same thing.

| Action | State | Waits on |
|---|---|---|
| Razorpay **test-mode** sign-up; keys to `.env.local` only | proposed, can start now | nothing |
| `.env.example` gains variable **names**, no values | proposed, can start now | nothing |
| Adapter interface + in-memory mock provider | proposed, can start now | nothing |
| `recompute_entitlement` as a pure function + unit tests | proposed, can start now | nothing |
| Both signature schemes + fixture tests | proposed, can start now | nothing |
| The ten Phase 1 failure-case tests | proposed, can start now | nothing |
| **Concurrency integration tests** (risk 1) | proposed | **decision 6** |
| The migration, on an isolated project | proposed | **decisions 1 and 6** |
| The four `CLAUDE.md` / `SUPABASE.md` edits | proposed, written out | **decision 2** |
| Grandfathering notice copy | proposed | **decision 3** |
| Pricing page | proposed | **decision 4** |
| Terms, Refunds, Contact routes | proposed | decisions 8, 9, 10 + lawyer |
| Razorpay activation application | proposed | decisions 4, 7, 8, 9, 10 |
| Content split: premium solutions out of `public/` | proposed | **decision 1** |
| Extend `release:check` with the premium-reachability gate | proposed | the entitlement existing |

**Everything in the first six rows needs nothing from you.** That is the work I
would do next if told to continue, and none of it touches a database, a
credential, or production.

---

## 9. The honest summary

The legal and provenance position is materially stronger than at the start of
the sprint: the independence claim is made in full and supported by measurement,
the IP position is audited, and a lawyer can be instructed from a real brief.

**The payments position improved by getting worse.** The review found a defect
that would have taken money and granted nothing, and finding it is worth more
than the design being clean on paper. The corrected version is stronger in a way
that matters beyond the bug: entitlement is now **derived** from payment facts
rather than mutated by each event, which makes duplication and ordering
impossible to get wrong rather than handled case by case. Four other defects
fell out of the same pass — two SQL contradictions of my own, indefinite
retention of personal data in raw payloads, and `on delete restrict` quietly
deciding a legal question.

**It is still researched and designed, and nothing is built.** Between here and
a first rupee sit six decisions, four pages that do not exist, a provider
application that can be refused, a build that has not started, and a set of
concurrency claims that are argued but untested. The last of those is the one I
would least like to be wrong about, which is why §6.1 ranks it first and why the
container-runtime decision is now on the critical path rather than beside it.

The thing most likely to go wrong is still the thing this sprint could not do:
**nobody has signed off any question.** Sixteen GAM questions, automated and
blind-reviewed, remain unsellable and unofferable for exactly that reason. That
gate held under commercial pressure twice this sprint. It should keep holding.
