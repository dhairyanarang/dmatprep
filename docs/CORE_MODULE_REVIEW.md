# Core modules — your feedback, and where each item stands

**18 November 2026.** Your feedback was recovered from the project record, not
re-requested. It was given as "qualitative recollection of the kinds of
difficulty and subject coverage encountered in the last dMAT examination",
explicitly as design guidance and explicitly not as content to reconstruct.

Measurements below come from the committed bank, re-run today. `verify:bank`
reports **473 questions checked, 0 failed, 89 quarantined and not served** —
384 active.

Status vocabulary: ✅ done and measured · ⚠️ partly done · ⛔ not done ·
🔒 blocked by a documented constraint.

---

## A. Figure Sequences

| # | What you asked for | Status | Measurement |
|---|---|---|---|
| 1 | More genuinely difficult multi-element sequences | ✅ | High tier: 28 items, **all** 3–4 symbols (16×3, 12×4) |
| 2 | Multiple interacting shapes and transformations | ✅ | High tier: **28/28 rotating, 28/28 colour-changing, 16/28 accelerating** |
| 3 | Explore rotation, orientation, movement, colour and combinations | ⚠️ | Rotation, movement (linear/diagonal/boundary), bounce, colour cycle and x+1 all present. **Reflection and count changes are absent and must stay absent** — not in the official rule list |
| 4 | Related/recurring figures, each independently solvable | ✅ | 25 distinct pattern-type combinations across 87 active items |
| 5 | High difficulty from tracking properties, not visual tricks | ✅ | Difficulty is measured as transformation load, not symbol count |
| 6 | Diagrams render correctly on desktop and mobile | ✅ | Verified today at 1440px and 390px. SVG from state, no image assets, no overflow |
| 7 | Exactly one defensible answer | ✅ | Every item inverted against the documented rule space at generation and in `verify-bank`; 0 failures |

**The real gap, and it is the opposite of where you were looking.** The *low*
tier is the weak one:

> **21 active low items. All 1 symbol. Zero rotating. Zero colour-changing.
> Zero accelerating.** Every one is a single symbol moving.

You asked for "more variety in low-difficulty material" in the calibration
round. It has not happened, and the reason is documented: `direction-cycle` was
quarantined as an invented mechanic, taking 86 items with it — most of them
low — and the remaining documented mechanics give a single symbol very little to
do. A test asserts the low tier can place at most one new item per batch.

🔒 **Blocked, not forgotten.** Closing it needs either a documented mechanic we
do not yet have, or a deliberate decision to allow low-tier items with two
symbols and one transformation.

---

## B. Mathematical Equations

| # | What you asked for | Status | Measurement |
|---|---|---|---|
| 1 | Raise genuine difficulty, especially high | ⚠️ | High: 58 items, avg 3.8 letters and 3.8 equations, 81% at the official 4-letter count |
| 2 | **Review whether the bank over-relies on basic arithmetic** | ✅ **answered — and the answer is yes** | See below |
| 3 | Quadratics, multi-step algebra, systems, fractions, ratios | 🔒 | **0 of 172** |
| 4 | Retain the A-to-A, B-to-B structure | ✅ | All 172 |
| 5 | Solving time as part of calibration | ✅ | Measured as substitution depth to the asked letter |
| 6 | Fair, solvable, unambiguous, assumptions stated | ✅ | 0 failures; four items re-solved by hand today, all correct |

**The measurement you asked for, in one line:**

> **0 of 172 active equations contain a product or quotient of two unknowns.
> 0 contain a number divided by an unknown.** Every equation in the bank is
> linear with numeric coefficients.

Operators are used freely — 214 `×`, 198 `−`, 172 `+`, 126 `÷` — so the bank is
not arithmetically thin. It is *structurally* thin: `3 × C = D` is multiplication
by a constant, never `A × B`.

🔒 **This is enforced, not accidental.** `ME_CONTRACT.forbidden` lists
"quadratic or higher-power terms" and the gate rejects any `A × B`. It was
written that way because no official exercise shows a product of two unknowns:
the documented shapes are all linear — bare pin, define-linear,
define-multiplicative with a numeric coefficient, compound coefficient plus
offset, pair-constant, multi-term and the alternating-sign combining equation.

**So your recollection and our documented sources disagree, and I have not
resolved it unilaterally.** Widening the contract is a decision with a
provenance cost: such items could never be graded `officially_documented`. The
decision is in `docs/LEGAL_READINESS.md` §5 item 2.

**One quality issue found while reviewing, independent of the above.** High-tier
items 2 and 3 in the current ordering are structurally near-identical:

```
A ÷ 7 = B      A ÷ 4 = 2
2 × C = D      A ÷ 8 = B
A ÷ 2 = 7      7 × B = C
4 × B = C      2 × C = D
```

Both are "pin A with a division, chain through B and C, double into D". The
verifier already flags three items for sharing a left-hand side; this is a
looser kind of sameness it does not catch. ⚠️ **Recommend** adding a topology
fingerprint check to `verify-bank` rather than hand-editing items.

---

## C. Latin Squares

| # | What you asked for | Status | Measurement |
|---|---|---|---|
| 1 | Audit high-difficulty items by filled cells | ✅ | High: min 6, max 10, **avg 8.4** |
| 2 | Identify items solved too easily for the information given | ✅ | See below |
| 3 | More difficult puzzles with fewer given cells | ⚠️ | Partly — and deliberately bounded |
| 4 | Preserve logical uniqueness | ✅ | Every item solver-proven; 0 failures |
| 5 | Validate all constraints independently | ✅ | `verify-bank` re-derives rather than trusting the stored answer |

**Clue density by tier:** low avg 11.4 (8–14), medium avg 8.9 (6–12), high avg
8.4 (6–10).

⚠️ **Medium and high are only 0.5 cells apart, and three medium items are
sparser than any high item.** If you judge difficulty by how empty the grid
looks, the tiers are nearly indistinguishable.

**They are not indistinguishable by the measure that was chosen**, and the
reasoning is already recorded in `docs/DIFFICULTY_CALIBRATION.md`: depth bands
the item, sparsity does not. Measured by `forcedPlacementDepth` the separation
is clean and there is **no overlap at all** — low 1–2, medium 3–4, high 5–7.

That doc explains why: an earlier version *did* require few givens for the high
band, and it demoted five genuinely deep puzzles for being generously filled.
Few givens is a thing to aim for when authoring, not evidence a puzzle was hard.

**One defect fixed today.** `CLAUDE.md` stated the bands as "1 → low, 2–3 →
medium, 4+ → high". No committed item has ever followed that rule — 42 of 125
contradicted it. The calibration document and the bank agree with each other;
the project instructions were stale. Corrected.

---

## D. User experience — verified today

Checked at 1440×1000 and 390×844 on the running app.

| | Result |
|---|---|
| Question loading, all three sections | ✅ |
| Figure Sequences diagrams | ✅ 4×4 grids, four shown, two unknown panels, correct on both widths |
| Latin Squares grids | ✅ 5×5, A–E, highlighted target, available-letters line |
| Equation rendering | ✅ monospace, correct `×` and `÷` glyphs |
| Answer selection and feedback | ✅ correct/incorrect state, value revealed, key insight shown |
| Explanations and "See more" | ✅ |
| Progress and accuracy | ✅ "1 attempted · 100% accuracy" updated immediately |
| Difficulty filter | ✅ persists |
| Console errors | ✅ **zero errors, zero warnings** across every page visited |
| Free/premium handling | ✅ nothing locked; commerce flag off; `public/solutions` byte-identical to before |

⚠️ **One thing to be aware of, not a regression:** practice renders every
question in one scrolling list. For Latin Squares that is an **80,945px** page.
It works, and it has always worked this way, but it is the obvious candidate if
mobile performance ever becomes a complaint.

---

## E. What I did not do, and why

- **I did not add Mathematical Equations questions.** Adding more linear items
  would not answer your feedback, and adding nonlinear ones requires widening a
  contract that deliberately forbids them. §B.
- **I did not add low-tier Figure Sequences items.** The documented mechanics do
  not support variety at one symbol. §A.
- **I did not re-tier anything.** Difficulty is measured, and no measurement
  changed.
- **I did not change the 150-question free selection.** It is hash-locked and
  the commercial model is measured against those exact ids.
- **I did not edit questions that are correct.** Nothing in the bank failed
  verification, so there was nothing to fix that would not have been churn.
