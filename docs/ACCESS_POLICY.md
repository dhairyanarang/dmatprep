# Product access rules — proposal for approval

**This is a proposal. No access rule has been changed, and nothing in the
product is locked today.** It is here to be approved or amended before the
policy is implemented, because it contradicts rules this repository currently
states as absolutes (§4).

Derived from the commercial model in `docs/MONETISATION.md`, priced in
`docs/PRICING_DECISION.md`, and enforced by the architecture in
`docs/ENTITLEMENT.md`.

---

## 1. The proposed rules

| # | Rule |
|---|---|
| 1 | **Free Core practice remains guest-accessible.** No account, no sign-in affordance, no network dependency |
| 2 | **The 150 free Core questions keep everything** — complete explanations, answer feedback of the same quality, progress tracking, attempt history |
| 3 | **Premium access and purchasing require an authenticated account** |
| 4 | **Guest progress is preserved on registration and on upgrade.** Signing in never costs work |
| 5 | **No existing user is silently changed or locked out** |
| 6 | **GAM is neither sold nor sampled** until a person signs it off |

Rules 1, 2 and 6 describe the product as it already behaves. Rules 3, 4 and 5
are the new work, and rule 5 is the one with a cost.

---

## 2. What each rule means concretely

### 2.1 Free Core stays guest-accessible — no change

Verified against the current build: every page prerendered, no sign-in
affordance rendered when Supabase environment variables are absent, progress in
`localStorage`. 150 questions — 50 per section, 9/9, 20/20 and 5/5 pattern types
covered, even difficulty across all three.

**Nothing to build.** The requirement is to not regress it, and the way to hold
that is a test: the free set must be reachable and answerable with no session,
asserted in CI alongside the existing hash lock on
`content/access/free-set.json`.

### 2.2 The free 150 keep everything — no change

| Requirement | Status |
|---|---|
| Complete explanations | ✅ every question carries one, gated by a type and by `verify-bank` |
| Answer feedback of equal quality | ✅ one runner serves both; there is no second, worse path |
| Progress tracking and accuracy | ✅ derived from attempts, locally |
| Attempt history | ✅ |
| Explanations never withheld for a free question | ✅ by construction |

**The one thing to guard:** premium must not be implemented by degrading the
free path. The runner is shared, and it must stay shared.

### 2.3 Premium requires an account — the new gate

Purchase requires a session, because `payment_orders.user_id` is written from
the authenticated session and is the only source of ownership
(`docs/ENTITLEMENT.md` §6.1). Premium content requires a session for the same
reason: the entitlement is keyed on the user.

**What this is not.** It is not a sign-in wall on the product. A guest meets no
account prompt anywhere in the free 150. The prompt appears at exactly two
points: the purchase flow, and the first attempt to open premium content.

### 2.4 Guest progress is preserved — already built, already tested

This is the rule most likely to be assumed rather than checked, so: it exists.
`lib/progress/migrate.ts` performs the guest → cloud merge, and
`scripts/test/progress-merge.test.mjs` covers it in 11 tests. The mechanism is
deterministic legacy attempt ids, so the same guest attempt produces the same id
on every device and merging twice cannot duplicate it.

**What must not change:** entitlement must not fork the progress model. There is
one attempts table, one merge, and one derivation of accuracy, whether or not
the user has paid. An entitlement is a row that answers "may this person open
this content", and nothing else. It must never become a dimension of progress.

### 2.5 No existing user is silently changed — the rule with a real cost

**Every Core question is free today.** 384 of them, to everyone, with no
account. Introducing the model removes 234 from anyone already using the
product. There is no version of this that is costless, and §3 is the decision it
forces.

### 2.6 GAM stays out — no change

Sixteen active questions, sixteen through automated validation, sixteen covered
by an independent blind round, **zero signed off by a person**. Neither sellable
nor offerable as a free sample. `verify:gam` and release check 2 hold this.

---

## 3. The consequence that needs a decision

Rule 5 and rule 3 pull against each other for one specific population, and the
conflict is not resolvable by design — only by choosing.

**For signed-in users, the fix is clean.** The server can see their attempts, so
"a question you have already answered never becomes locked" is enforceable: the
access check becomes *entitlement is active **or** this user has a prior attempt
on this question*. Nothing is taken away from anyone with an account.

**For guests, it is not enforceable.** A guest's history lives in their own
browser and is unverifiable by a server. After the content split, premium
solutions leave `public/solutions/` — so a guest who answered premium questions
before launch, and never signs in, loses the explanations for work they already
did. The claim "I answered this before" cannot be trusted from the client; that
is the same reasoning that makes client-held flags unacceptable as access
control (`docs/ENTITLEMENT.md` §1), applied consistently.

Three options, and the gap between them is real:

| Option | Existing accounts | Existing guests | What is sellable at launch |
|---|---|---|---|
| **A. Grandfather accounts, announce widely** | Keep everything | Keep everything **if they sign in** during a stated window | 234 premium questions to new users, plus features as they land |
| **B. Nothing already public is ever gated** | Keep everything | Keep everything | **Nothing** — features do not exist yet |
| **C. Gate on the cutoff date, no grandfathering** | Lose 234 | Lose 234 | As A, but by breaking a promise |

**Recommended: A.** It honours rule 5 for everyone who can be identified,
converts the unidentifiable case into a clear, time-boxed call to action instead
of a silent loss, and leaves something to sell. B is the most honest reading of
rule 5 and makes launch pointless, since the premium *features* that justify the
price do not exist (`docs/WEBSITE_READINESS.md` §1). C violates rule 5 and
should not be considered.

**What A requires:**

- A `manual_grants` row with `source = 'grandfathered'` for every account
  existing at the cutoff (`docs/ENTITLEMENT.md` §3.4). One insert per account,
  append-only, auditable years later.
- The *prior attempt* access rule in §3, for signed-in users.
- A notice shown to guests **before** the cutoff, not after, stating plainly
  that signing in preserves access to everything they have already practised.
- A window long enough to be fair. A single exam cycle is the natural unit —
  the 16 January 2027 sitting is the obvious anchor.

**What A does not require:** taking anything away on the cutoff date itself. The
gate can go up for *new* users while every existing user is grandfathered, which
is the lowest-harm sequencing and costs nothing extra.

---

## 4. Conflicting statements in existing documentation

Found by grep, not from memory. **None of these is edited yet** — the brief says
not to make the policy change until it is approved, and `CLAUDE.md` is the
policy.

| Where | Current text | Status under this proposal |
|---|---|---|
| `CLAUDE.md:120` | *"nothing is ever gated behind it"* | ⛔ **Contradicted.** Must narrow to the free product |
| `CLAUDE.md:116` | *"Guest mode is a supported mode, not a degraded one"* | ⚠️ **Survives, needs a clause.** Guest mode remains complete *for the free product*; it cannot reach premium |
| `CLAUDE.md:123` | *"Every route is static; nothing needs a server at request time"* | ⛔ **Contradicted.** Weakens to "every page is static". Already flagged in `docs/CONTENT_EXPOSURE.md` §196 |
| `CLAUDE.md:167–170` | *"The local store is the render source, signed in or not … answering a question never waits on the network"* | ⚠️ **Survives for progress, not for entitlement.** Answering a *free* question still never waits. Opening *premium content* does |
| `CLAUDE.md:328` | *"Four primary destinations, and no more"* | ✅ **Not contradicted.** Pricing, Terms, Refunds and Contact are footer-linked, as `/about` and `/privacy` already are. **Not a fifth destination** |
| `docs/SUPABASE.md:146` | *"The local store is the render source at all times, signed in or not"* | ⚠️ Same qualification as `CLAUDE.md:167` |
| `docs/CONTENT_EXPOSURE.md:105` | *"This is hygiene, not protection, and the distinction is the whole point"* | ✅ **Still true, and now load-bearing.** It is the reason premium needs a different mechanism rather than the same one |

**Four edits, if approved.** Two are genuine narrowings (`:120`, `:123`), two are
clarifying clauses (`:116`, `:167`), and `CONTENT_EXPOSURE.md` needs nothing
because it already anticipated this.

**A note on how to make them.** The honest edit states what changed and why, in
place — the same treatment `docs/PAYMENTS.md` §0.1 received when it was found
carrying a superseded model. Silently rewriting `CLAUDE.md:120` would remove the
evidence that the rule once held and was deliberately changed, which is the only
thing that makes the new rule trustworthy.

---

## 5. What is being asked

1. **Approve or amend the six rules** in §1.
2. **Choose A, B or C** in §3. A is recommended.
3. **Set the grandfathering window**, if A.
4. **Approve the four documentation edits** in §4, which I will not make until
   then.

Until all four are settled, nothing is locked, nothing is sold, and the product
behaves exactly as it does today.
