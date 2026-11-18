# Freemium model and pricing

Measured 18 November 2026 against the actual bank. Every count here was
computed, not estimated.

**Nothing is implemented.** No paywall, no entitlement, no checkout. This is the
model and what the content can currently support.

---

## 1. The counts, as they actually are

### Core — supports the model

| Module | Active | Free | Premium | Free selection |
|---|---|---|---|---|
| Figure Sequences | 87 | 50 | **37** | 17 low · 17 medium · 16 high |
| Mathematical Equations | 172 | 50 | **122** | 17 low · 17 medium · 16 high |
| Latin Squares | 125 | 50 | **75** | 17 low · 17 medium · 16 high |
| **Total** | **384** | **150** | **234** | |

The free selection already exists as a committed list in
`content/access/free-set.json`, locked by a SHA-256 in its test so it cannot
drift. Checked today: **zero** of the 150 ids have since been quarantined, and
every one resolves to a live question.

**It is not the first 50 by any ordering.** Measured against the brief's
requirement that the free set demonstrate a meaningful range:

| | Figure Sequences | Mathematical Equations | Latin Squares |
|---|---|---|---|
| Pattern types covered | **9 of 9** | **20 of 20** | **5 of 5** |
| Generation batches drawn from | 6 | 7 | 4 |
| Difficulty | even | even | even |

Every mechanic present in the active bank is represented in the free sample, in
all three modules. Reported for completeness: 38–40 of each 50 also fall in the
first 50 by file order — but that reflects the bank being ordered by batch and
early batches being the largest, not the selection method, which used structural
fingerprint and batch as its coverage axes and excluded anything carrying a
`verify-bank` warning.

**One number worth looking at before pricing.** Figure Sequences has only **37**
premium questions. A buyer gets 122 more Mathematical Equations and 75 more
Latin Squares, but barely a third more Figure Sequences. That is a consequence
of quarantining 86 `direction-cycle` items and it is the weakest part of the
premium offer.

### GAM — does not support the model

| | |
|---|---|
| Active questions | 16, in 5 packs |
| Passed automated validation | 16 |
| Covered by an independent blind round | 16 |
| **Signed off by a person** | **0** |

**The 2–3 question free sample cannot be provided, and no GAM content can be
sold either.**

The brief is explicit that only questions which have passed the required
quality and human-review gates may be offered, and that a shortfall should be
reported rather than the standard lowered. The shortfall is total: zero of
sixteen have human sign-off, so zero are eligible for the free sample and zero
are eligible for premium.

This is not a content-quality judgement — it is the review gate doing its job.
`npm run review:package` produces everything a reviewer needs; until someone
signs, Module B stays a labelled pilot that is neither given away nor sold.

## 2. The thing that must be said about premium Core

**The 234 "premium" Core questions are already public.** They have been in a
public Git repository since August 2026 and are fetchable from
`raw.githubusercontent.com` without authentication. Sprint 2 verified this
directly.

That cannot be reversed. Clones, forks and API archives are outside anyone's
control, and making the repository private now would not retract them.

So selling the 234 is selling convenience — a good practice interface, progress
tracking, explanations in place — rather than scarcity. That may be a perfectly
good business, and it is also why the brief's own framing is right: **the
durable premium value is the enhanced mock experience, detailed performance
analytics, weak-area identification, pacing and readiness insight, adaptive
practice, and content authored into a private store in future** — not the
question text.

Two implications for the build:

1. **Server-side entitlement is still required**, for the features and for any
   future content authored into a private store. See `docs/ENTITLEMENT.md`.
2. **Honesty in the copy.** Premium should be described as what it is. Nothing
   should imply the questions are otherwise unobtainable.

## 3. What a free user must get

From the brief, and each one checked against what exists today:

| Requirement | Status |
|---|---|
| Complete explanations for free questions | ✅ already — every question carries one, gated by a test |
| Answer feedback of the same quality | ✅ already — one runner serves both |
| Progress tracking and accuracy | ✅ already |
| Their own attempt history | ✅ already |
| A meaningful range of types and difficulty | ✅ measured above |
| Explanations never withheld for a free question | ✅ by construction |
| Free progress preserved on upgrade | ⚠️ **design requirement** — entitlement must not fork the progress model |
| Upgrade does not duplicate history | ⚠️ **design requirement** — see `docs/ENTITLEMENT.md` |
| Free/premium distinction clear *before* a locked question | ⚠️ **not built** — nothing is locked today |

The last three are the real work. The first six already hold because the
product was built without a paywall and nothing degrades a free experience.

### A consequence to decide on

Every one of the 384 Core questions is **free today**. Introducing the model
takes 234 away from anyone already using the product. Options, for the operator:

- **Grandfather existing users.** Kind, and needs a cutoff date in the
  entitlement table from day one.
- **Announce before gating.** Cheapest and most defensible.
- **Gate silently.** Fastest, and the one most likely to be noticed and
  resented.

## 4. Pricing

A recommendation, not a finding. It rests on provider fees that are still
partly unverified — see `docs/PAYMENTS.md`.

### What the buyer gets

234 Core questions, plus the premium features as they land: enhanced mocks,
detailed performance analytics, weak-area identification, pacing and readiness
insight, and adaptive practice. **Not** GAM, which nothing is cleared to sell.

None of those features exists today beyond the mock runners. Nothing may be
advertised before it is built — see `docs/WEBSITE_READINESS.md`.

### What it costs to collect

At a published 2% plus 18% GST on the fee, a provider takes about **2.36%**.

| Price | Provider takes | Net |
|---|---|---|
| ₹399 | ₹9.42 | ₹389.58 |
| ₹599 | ₹14.14 | ₹584.86 |
| ₹799 | ₹18.86 | ₹780.14 |

Negligible at any of these. Fees do not drive the decision; **refunds** might —
whether the fee is returned on a refund is undocumented at every Indian
provider examined, so assume it is not.

### Recommendation: ₹599, one-time

Reasoning:

- It is the figure already carried through three sprints, so it is the one the
  rest of the planning assumes.
- One-time suits a product bought for a single examination sitting. A
  subscription implies ongoing value this product does not yet have.
- No GAM means the offer is thinner than planned. ₹799 would be hard to defend
  while Module B is unsellable and Figure Sequences adds only 37 questions.
- ₹399 leaves little room, and a very low price on a one-time digital product
  invites more refund requests per rupee earned, not fewer.

**Revisit when GAM clears human review.** A sellable Module B is a materially
different offer and would justify looking at the price again.

### Not recommended now

Subscriptions, mock credits and multiple SKUs are all out of scope per the
brief, and none is justified by what exists. One price, one thing, no tiers.

## 5. What has to be decided

| # | Decision | Needed before |
|---|---|---|
| 1 | Confirm ₹599, or set another figure | Checkout copy |
| 2 | Grandfather, announce, or gate silently | Entitlement schema — a cutoff is a column |
| 3 | Accept that GAM is neither free nor sold until someone signs off | Launch scope |
| 4 | Accept that premium Core is convenience, not scarcity, and approve copy that says so | Marketing copy |
| 5 | Whether 37 premium Figure Sequences questions is enough, or FS premium is held back | Launch scope |
