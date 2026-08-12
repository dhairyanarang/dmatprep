# Module A Question Bank Audit

Analysis only — no question, generator, solver or schema was modified.

Audited with `scripts/audit-bank.mjs` (temporary harness), which re-derives every
answer from the committed JSON and adds checks `verify-bank` does not perform:
exhaustive Latin-square completion counting, explicit equation satisfaction, and
per-note factual verification. All official comparisons are against the g.a.s.t.
General Academic Module preparatory materials, 4 August 2026 build, re-downloaded
and re-extracted for this audit. No third-party source was consulted.

---

## Executive Summary

| Metric | Figure Sequences | Mathematical Equations | Latin Squares | Total |
|---|---|---|---|---|
| Total questions | 40 | 40 | 40 | **120** |
| low / medium / high | 14 / 13 / 13 | 14 / 13 / 13 | 14 / 13 / 13 | 42 / 39 / 39 |
| **Technical failures** | 0 | 0 | 0 | **0** |
| Questionable (quality, not correctness) | 26 | 18 | 6 | 50 |
| Duplicate / near-duplicate clusters | 3 (covering 16 items) | 9 (covering 20 items) | 8 (covering 21 items) | 20 clusters |
| officially_documented | 34 | 40 | 40 | 114 |
| reasonable_extrapolation | 6 | 0 | 0 | 6 |
| uncertain | 0 | 0 | 0 | 0 |

**Every one of the 120 questions is technically sound.** Uniqueness, rule
fidelity, option integrity and distractor-note factual accuracy all hold. Two
apparent failures in the first pass were bugs in my own audit harness, not the
bank — documented under "Corrections to this audit" below.

### Major strengths

- **Correctness is genuinely proven, not asserted.** Latin square targets were
  re-checked by exhaustive completion search — for all 40, exactly one letter
  admits a valid completion. Equation systems re-solve uniquely over 1–20 and
  the stored solution satisfies every equation. Figure panels re-simulate exactly.
- **Latin Squares difficulty is the best-calibrated tier in the bank**, and its
  depth range (1 / 2–3 / 4–6) matches the official exercises closely: official
  Exercise 2 (low) is a one-step read, Exercise 6 (high) needs roughly six
  sequential placements.
- **Latin Squares distractor notes are the strongest in the bank** — every one
  cites a real clashing cell, and the 63 that depend on a prior placement carry
  an explicit caveat.
- **Figure Sequences low tier matches the official low exercises exactly**: one
  symbol, movement only, no rotation or colour — precisely official Exercises 1
  and 2.

### Major weaknesses

1. **Figure Sequences medium is systematically below the official medium
   standard.** Official Exercise 3 (medium) has a symbol carrying movement +
   colour + rotation simultaneously. **Zero of our 13 medium items have any
   symbol carrying three transformations.** This is a generator ceiling, not 13
   independent defects.
2. **Latin Squares trains one deduction technique; the official solutions are
   dominated by another.** All 112 deduction steps in our bank are *naked
   singles* ("four letters are already in this cell's row and column"). Four of
   the six official solution paths lead with a *line-based pair elimination*
   ("A and D are missing in the first row; A can only go at α1 since it is
   already in column γ, so D must be at γ1"). Our items are valid, but they do
   not exercise the reasoning the official materials actually demonstrate.
3. **Difficulty in two of three subtests is assigned by construction, not
   measured.** Mathematical Equations difficulty is *exactly* variable count
   (low=2, medium=3, high=4, no exceptions). Figure Sequences difficulty is
   *exactly* symbol count (1 / 2 / 3–4). Only Latin Squares measures anything.
4. **Figure Sequences distractors barely test rotation or colour.** Of 160
   distractors, 143 differ by position alone, 13 by colour, 4 by rotation.
5. **Redundancy is concentrated at low difficulty.** 11 of 14 Figure Sequences
   low items share one identical structural shape; 4 of 14 Latin Squares low
   items and 5 of 13 medium items likewise.
6. **Mathematical Equations distractors cluster tightly around the answer** —
   42.5% of all 120 distractors sit at exactly ±1.

---

## Corrections to this audit

My first harness reported 32 failures. All were harness bugs; both are fixed and
the numbers above are post-fix. Recording them because they were nearly reported
as bank defects:

- **6 false ME failures.** I tested `correct±1` before "is another letter's
  value", so any letter whose value happened to be adjacent to the answer was
  misread as a mislabelled distractor. `me-medium-006`'s `opt-5` genuinely is
  A's value (A=5); it merely also equals 6−1.
- **26 false LS failures.** Distractor notes are written against the grid *after*
  the forced prerequisite placements, so cells they cite are legitimately blank
  in the published grid. The harness compared against the published grid.
  Re-checked against the post-step grid, all notes are accurate.

---

## Figure Sequences

### Overall assessment

Technically flawless and structurally faithful to the official task (4 given
matrices, 5th and 6th predicted, three options each). The problem is calibration:
the tiers are separated by *symbol count* rather than by *rule density*, which is
not how the official exercises escalate.

Official escalation, read from the six worked solutions (pp. 13–16):

| Official | Symbols | What escalates |
|---|---|---|
| Ex 1 (low) | 1 | vertical movement + bounce |
| Ex 2 (low) | 1 | diagonal movement + bounce |
| Ex 3 (medium) | 2 | **one symbol carries border travel + colour alternation + 90° rotation** |
| Ex 4 (medium) | 2 | one symbol carries linear movement + bounce + rotation |
| Ex 5 (high) | 3 | **x+1** border travel; a second symbol carries movement + rotation + 3-colour cycle; a third uses a direction cycle |
| Ex 6 (high) | 3 | diagonal + bounce with **x+1 rotation** |

Two things follow. Official difficulty rises by **stacking transformations onto a
single symbol**, and **x+1 appears only at high**. Symbol count rises too, but
never past three.

### Technical validation

40/40 PASS. Re-simulation reproduces all four given panels; symbol counts are
constant across all six panels and every option panel; no symbol leaves the 4×4
grid; no two symbols share a cell in any panel; exactly one option per image
matches the rules; no two options within an image are identical; all 160
distractor notes are present.

### Difficulty distribution

| | n | Symbols | Max transforms on one symbol | Uses x+1 |
|---|---|---|---|---|
| low | 14 | 1 (all) | 1 (all) | 0 |
| medium | 13 | 2 (all) | **2 (all)** | 0 |
| high | 13 | 3 (9), 4 (4) | 3–4 | 10 of 13 |

Concerns:

- **All 13 medium items** sit below official medium. 4 of them (`fs-medium-006`,
  `-008`, `-009`, `-011`) have `maxTransforms = 1`: two symbols that only move.
  That is two low items side by side, not a medium item.
- **4 high items use 4 symbols** (`fs-high-005`, `-006`, `-009`, `-010`),
  exceeding anything the official materials show. This is the "complex but not
  cognitively difficult" case from §11 — a fourth independent symbol adds
  bookkeeping and time cost, not reasoning depth.
- **3 high items have no x+1 at all** (`fs-high-001`, `-008`, `-011`). Both
  official high exercises use it.

### Pattern coverage

| Pattern | Count | Official support |
|---|---|---|
| linear-movement | 27 | Ex 1, 4, 5, 6 |
| boundary-bounce | 33 | Ex 1, 2, 4, 6 |
| boundary-travel (perimeter) | 20 | Ex 3, 5 |
| multiple-symbol | 26 | Ex 3–6 |
| colour-cycle | 20 | Ex 3 (2-colour), Ex 5 (3-colour) |
| diagonal-movement | 13 | Ex 2, 6 |
| direction-cycle | 10 | Ex 5 |
| x-plus-one | 10 | Ex 5, 6 |
| rotation | 8 | Ex 3, 4, 5, 6 |
| compound-rule (3 on one symbol) | 2 | Ex 3, 5 |

**Rotation is the most under-tested documented mechanic**: 8 of 40 items, and
only because rotation is restricted to triangles and arrows (correctly — a
rotating circle is unanswerable). Border step sizes are 1 (13), 2 (10), x+1 (1);
official Exercise 3 uses 2 and Exercise 5 uses x+1, so the distribution is sound
but x+1 border travel appears exactly once.

### Duplicate clusters

| Cluster | IDs | Why similar | Strongest | Recommendation |
|---|---|---|---|---|
| **1 symbol, linear, no rotation/colour** (11 items) | `fs-low-001`, `-002`, `-003`, `-004`, `-005`, `-006`, `-007`, `-009`, `-012`, `-013`, `-014` | Identical solving process: read the row/column, read the step, apply the bounce. Only the lane, direction and shape change. | `fs-low-001` (clean single bounce), `fs-low-002` (two bounces) | Keep ~5; replace the surplus with diagonal, border and direction-cycle items |
| **1 symbol, diagonal** (3 items) | `fs-low-008`, `-010`, `-011` | Same process, diagonal lane | `fs-low-008` | KEEP all 3 |
| border + direction-cycle pair | `fs-medium-010`, `fs-medium-012` | Same two movement families, same colour count | `fs-medium-010` | KEEP both (differ enough in layout) |

The low tier is effectively **two questions asked fourteen times**. Note the
official low tier is also narrow (one symbol, movement only) — so the *tier* is
right; the *count* is too high for the variety available.

### Distractor quality

160 distractors, all plausible near-misses derived by nudging the correct panel.
None are arbitrary, none are accidentally correct, none duplicate a sibling.

| Difference type | Count | Share |
|---|---|---|
| Position only | 143 | 89.4% |
| Colour | 13 | 8.1% |
| Rotation | 4 | 2.5% |

This is the weakest dimension. A candidate who misreads a rotation rule or a
colour cycle is almost never punished for it — the wrong options mostly differ by
where a symbol sits. Officially, rotation and colour are first-class mechanics.

### Explanation quality

**Good teaching explanation**, uniformly. All 40 follow one template: state each
symbol's full rule in the style of the official solutions ("The blue diamond
moves horizontally along the fourth row, one field at a time, bouncing off the
left and right boundary and returning the same way"), then give both target
panels' cell positions. This mirrors the official solution voice closely.

Weakness: the template is *identical* in all 40, and it explains the rule rather
than how to *find* it. None models the search process — which symbol to track
first, or how to use a visible bounce as evidence.

### dMAT alignment

- **officially_documented: 34.** Movement types, bounce semantics, border travel,
  direction cycles, rotation, colour cycles, and x+1 on movement or rotation are
  all explicitly documented or demonstrated.
- **reasonable_extrapolation: 6** — `fs-high-002`, `-003`, `-006`, `-007`,
  `-010`, `-013`, all using **accelerating colour**. The rule "Figures can also
  change their movement, colour **or** orientation by x + 1" (p. 8) names colour
  explicitly, but no official exercise demonstrates it. Legitimate to keep; worth
  knowing it is rule-derived rather than exemplified.
- **uncertain: 0.**

### Questions requiring human review

| ID | Issue |
|---|---|
| `fs-high-005`, `-006`, `-009`, `-010` | 4 symbols — beyond the official maximum of 3. Decide whether to cap at 3. |
| `fs-high-001`, `-008`, `-011` | High difficulty with no x+1, the official marker of high. |
| `fs-medium-006`, `-008`, `-009`, `-011` | Two plain movers; no transformation stacking at all. |

### Per-question table

| ID | Difficulty | Pattern | Technical | Difficulty | dMAT Alignment | Distractors | Explanation | Recommendation |
| -- | ---------- | ------- | --------- | ---------- | -------------- | ----------- | ----------- | -------------- |
| fs-low-001 | low | linear-movement, boundary-bounce | PASS | OK | officially_documented | position | Correct; states rule + both panels | KEEP |
| fs-low-002 | low | linear-movement, boundary-bounce | PASS | OK | officially_documented | position | Correct; states rule + both panels | KEEP |
| fs-low-003 | low | linear-movement, boundary-bounce | PASS | OK | officially_documented | position | Correct; states rule + both panels | KEEP |
| fs-low-004 | low | linear-movement, boundary-bounce | PASS | OK | officially_documented | position | Correct; states rule + both panels | KEEP |
| fs-low-005 | low | linear-movement, boundary-bounce | PASS | OK | officially_documented | position | Correct; states rule + both panels | KEEP |
| fs-low-006 | low | linear-movement, boundary-bounce | PASS | Redundant: 11 low items share this exact shape | officially_documented | position | Correct; states rule + both panels | REPLACE |
| fs-low-007 | low | linear-movement, boundary-bounce | PASS | Redundant: 11 low items share this exact shape | officially_documented | position | Correct; states rule + both panels | REPLACE |
| fs-low-008 | low | diagonal-movement, boundary-bounce | PASS | OK | officially_documented | position | Correct; states rule + both panels | KEEP |
| fs-low-009 | low | linear-movement, boundary-bounce | PASS | Redundant: 11 low items share this exact shape | officially_documented | position | Correct; states rule + both panels | REPLACE |
| fs-low-010 | low | diagonal-movement, boundary-bounce | PASS | OK | officially_documented | position | Correct; states rule + both panels | KEEP |
| fs-low-011 | low | diagonal-movement, boundary-bounce | PASS | OK | officially_documented | position | Correct; states rule + both panels | KEEP |
| fs-low-012 | low | linear-movement, boundary-bounce | PASS | Redundant: 11 low items share this exact shape | officially_documented | position | Correct; states rule + both panels | REPLACE |
| fs-low-013 | low | linear-movement, boundary-bounce | PASS | Redundant: 11 low items share this exact shape | officially_documented | position | Correct; states rule + both panels | REPLACE |
| fs-low-014 | low | linear-movement, boundary-bounce | PASS | Redundant: 11 low items share this exact shape | officially_documented | position | Correct; states rule + both panels | REPLACE |
| fs-medium-001 | medium | direction-cycle, rotation, multiple-symbol | PASS | Below official medium (no symbol carries move+rotate+colour) | officially_documented | position | Correct; states rule + both panels | REVISE |
| fs-medium-002 | medium | boundary-travel, colour-cycle, multiple-symbol | PASS | Below official medium (no symbol carries move+rotate+colour) | officially_documented | position | Correct; states rule + both panels | REVISE |
| fs-medium-003 | medium | linear-movement, boundary-travel, boundary-bounce, colour-cycle, multiple-symbol | PASS | Below official medium (no symbol carries move+rotate+colour) | officially_documented | position | Correct; states rule + both panels | REVISE |
| fs-medium-004 | medium | linear-movement, boundary-bounce, colour-cycle, multiple-symbol | PASS | Below official medium (no symbol carries move+rotate+colour) | officially_documented | position+colour | Correct; states rule + both panels | REVISE |
| fs-medium-005 | medium | diagonal-movement, boundary-travel, boundary-bounce, colour-cycle, multiple-symbol | PASS | Below official medium (no symbol carries move+rotate+colour) | officially_documented | position+colour | Correct; states rule + both panels | REVISE |
| fs-medium-006 | medium | boundary-travel, multiple-symbol | PASS | Below official medium (no symbol carries move+rotate+colour) | officially_documented | position | Correct; states rule + both panels | REVISE |
| fs-medium-007 | medium | linear-movement, boundary-bounce, rotation, colour-cycle, multiple-symbol | PASS | Below official medium (no symbol carries move+rotate+colour) | officially_documented | position+colour | Correct; states rule + both panels | REVISE |
| fs-medium-008 | medium | diagonal-movement, boundary-travel, boundary-bounce, multiple-symbol | PASS | Below official medium (no symbol carries move+rotate+colour) | officially_documented | position | Correct; states rule + both panels | REVISE |
| fs-medium-009 | medium | linear-movement, boundary-travel, boundary-bounce, multiple-symbol | PASS | Below official medium (no symbol carries move+rotate+colour) | officially_documented | position | Correct; states rule + both panels | REVISE |
| fs-medium-010 | medium | direction-cycle, boundary-travel, colour-cycle, multiple-symbol | PASS | Below official medium (no symbol carries move+rotate+colour) | officially_documented | position+colour | Correct; states rule + both panels | REVISE |
| fs-medium-011 | medium | direction-cycle, boundary-travel, multiple-symbol | PASS | Below official medium (no symbol carries move+rotate+colour) | officially_documented | position | Correct; states rule + both panels | REVISE |
| fs-medium-012 | medium | direction-cycle, boundary-travel, colour-cycle, multiple-symbol | PASS | Below official medium (no symbol carries move+rotate+colour) | officially_documented | position | Correct; states rule + both panels | REVISE |
| fs-medium-013 | medium | linear-movement, boundary-travel, boundary-bounce, rotation, colour-cycle, multiple-symbol | PASS | Below official medium (no symbol carries move+rotate+colour) | officially_documented | position+rotation | Correct; states rule + both panels | REVISE |
| fs-high-001 | high | diagonal-movement, boundary-travel, boundary-bounce, colour-cycle, multiple-symbol | PASS | No x+1; both official high exercises use it | officially_documented | position | Correct; states rule + both panels | REVISE |
| fs-high-002 | high | linear-movement, direction-cycle, boundary-bounce, rotation, colour-cycle, x-plus-one, multiple-symbol, compound-rule | PASS | OK | reasonable_extrapolation | colour+position | Correct; states rule + both panels | KEEP |
| fs-high-003 | high | linear-movement, diagonal-movement, boundary-travel, boundary-bounce, colour-cycle, x-plus-one, multiple-symbol | PASS | OK | reasonable_extrapolation | position+colour | Correct; states rule + both panels | KEEP |
| fs-high-004 | high | linear-movement, direction-cycle, boundary-bounce, rotation, colour-cycle, x-plus-one, multiple-symbol | PASS | OK | officially_documented | rotation+position | Correct; states rule + both panels | KEEP |
| fs-high-005 | high | linear-movement, diagonal-movement, direction-cycle, boundary-travel, boundary-bounce, rotation, colour-cycle, x-plus-one, multiple-symbol | PASS | 4 symbols — official high never exceeds 3 | officially_documented | colour+position | Correct; states rule + both panels | REVISE |
| fs-high-006 | high | linear-movement, diagonal-movement, direction-cycle, boundary-bounce, colour-cycle, x-plus-one, multiple-symbol | PASS | 4 symbols — official high never exceeds 3 | reasonable_extrapolation | position | Correct; states rule + both panels | REVISE |
| fs-high-007 | high | linear-movement, diagonal-movement, boundary-travel, boundary-bounce, rotation, colour-cycle, x-plus-one, multiple-symbol | PASS | OK | reasonable_extrapolation | position | Correct; states rule + both panels | KEEP |
| fs-high-008 | high | linear-movement, diagonal-movement, boundary-travel, boundary-bounce, colour-cycle, multiple-symbol | PASS | No x+1; both official high exercises use it | officially_documented | position+colour | Correct; states rule + both panels | REVISE |
| fs-high-009 | high | linear-movement, diagonal-movement, boundary-travel, boundary-bounce, colour-cycle, x-plus-one, multiple-symbol | PASS | 4 symbols — official high never exceeds 3 | officially_documented | position | Correct; states rule + both panels | REVISE |
| fs-high-010 | high | linear-movement, direction-cycle, boundary-travel, boundary-bounce, colour-cycle, x-plus-one, multiple-symbol | PASS | 4 symbols — official high never exceeds 3 | reasonable_extrapolation | position | Correct; states rule + both panels | REVISE |
| fs-high-011 | high | direction-cycle, boundary-travel, multiple-symbol | PASS | No x+1; both official high exercises use it | officially_documented | position | Correct; states rule + both panels | REVISE |
| fs-high-012 | high | linear-movement, boundary-travel, boundary-bounce, colour-cycle, x-plus-one, multiple-symbol | PASS | OK | officially_documented | colour+position | Correct; states rule + both panels | KEEP |
| fs-high-013 | high | linear-movement, diagonal-movement, boundary-travel, boundary-bounce, rotation, colour-cycle, x-plus-one, multiple-symbol, compound-rule | PASS | OK | reasonable_extrapolation | position | Correct; states rule + both panels | KEEP |

---

## Mathematical Equations

### Overall assessment

The most technically airtight subtest — uniqueness is proven exhaustively over
the exact official domain, and the solver reproduces all six official worked
exercises. The weakness is that difficulty is a synonym for variable count, and
the distractor pool is narrow.

### Technical validation

40/40 PASS. Unique solution over 1–20; every stored value an integer in range;
stored solution satisfies every equation; `correctOptionId` equals the asked
letter's value; exactly one option matches the answer; no duplicate option values
or ids; every explanation states the answer and derives every letter; every
distractor note opens with its own option value.

### Difficulty distribution

| | n | Variables | Equations | Structure | Asked letter is the root |
|---|---|---|---|---|---|
| low | 14 | 2 (all) | 2 (all) | direct pinning equation | 8 of 14 |
| medium | 13 | 3 (all) | 3 (all) | combining equation | 4 of 13 |
| high | 13 | 4 (all) | 4 (all) | combining equation | 2 of 13 |

Concerns:

- **Difficulty is variable count, exactly.** Medium and high are the *same
  structure* — a combining equation plus definitions — differing only by one
  extra letter. Neither dependency depth nor arithmetic load is measured.
- **14 of 40 items have chain depth 0**: the asked letter is the root, so once
  the pinning or combining equation resolves, the answer is already in hand and
  the remaining definitions are never needed. At high difficulty
  (`me-high-002`, `me-high-011`) this makes a four-variable system materially
  shorter than its label suggests.
- Conversely, `asked` is chosen at random, so within one difficulty the real work
  varies from one step to three. That variance is invisible to the label.
- **No item carries two or more multiplicative operations.** The systems are
  overwhelmingly additive, so the arithmetic load the guide warns about is
  largely untested.

### Pattern coverage

| Pattern | Count |
|---|---|
| elimination (combining equation) | 26 |
| two-variable-chain | 14 |
| three-variable-system | 13 |
| four-variable-system | 13 |
| direct-substitution | 8 |
| multi-step-substitution (depth ≥ 2) | 7 |
| mixed-operations | **0** |

Against the official exercises: Exercises 1–2 are two-variable direct chains,
3–4 three-variable, 5–6 four-variable with an alternating-sign combining equation
(`A − B + C − D = 2`). Our shapes match the official shapes well. What is missing
is the official spread of *operations* — official Exercise 2 (`B ÷ 2 = A`,
`B − A = 8`) and Exercise 4 (`18 − B = A`, `3 × A = C`, `B ÷ 2 = A`) lean on
division and multiplication far more than our bank does.

### Duplicate clusters

Nine clusters covering 20 items. All are structural, not exact — the numbers
differ, the solving process does not.

| Cluster | IDs | Strongest | Recommendation |
|---|---|---|---|
| 2-var, pin, root asked, ×/− | `me-low-001`, `-003`, `-007` | `me-low-001` | Keep 2, replace 1 |
| 2-var, pin, depth 1, ×/− | `me-low-005`, `-009`, `-013` | `me-low-005` | Keep 2, replace 1 |
| 4-var, combine, +3/−3 | `me-high-001`, `-012`, `-013` | `me-high-001` | Keep 2, replace 1 |
| 4-var, combine, +4/−2 | `me-high-003`, `-006`, `-007` | `me-high-003` | Keep 2, replace 1 |
| 2-var, pin, root, − only | `me-low-004`, `-006` | `me-low-004` | KEEP both |
| 3-var, combine, +1/−3 | `me-medium-001`, `-013` | `me-medium-001` | KEEP both |
| 3-var, combine, +2/−2, depth 0 | `me-medium-004`, `-007` | `me-medium-004` | KEEP both |
| 3-var, combine, +2/−2, depth 1 | `me-medium-005`, `-009` | `me-medium-005` | KEEP both |
| 3-var, combine, depth 2 | `me-medium-010`, `-012` | `me-medium-010` | KEEP both |

At the level the brief calls "structural duplicates", the honest count is
**three**: every low item is a pinned two-variable chain, every medium a
three-variable elimination, every high a four-variable elimination.

### Distractor quality

120 distractors. Every one is a real error mode; none is arbitrary or
accidentally correct; no duplicates within an item.

Distribution as requested:

| Error mode | Count | Share |
|---|---|---|
| Another variable's value (wrong letter) | 53 | 44.2% |
| One above | 23 | 19.2% |
| One below | 20 | 16.7% |
| Double | 14 | 11.7% |
| Half | 9 | 7.5% |
| Generic filler | 1 | 0.8% |

Counting *coincidence* rather than the note's label, the clustering is tighter
still: **51 of 120 distractors (42.5%) sit at exactly ±1 from the answer**, and
27 additionally coincide with double, 11 with half. The answer is almost always
bracketed by its immediate neighbours.

Two items where the modes collide badly:

- **`me-medium-012`** — A=12, B=14, C=13, asked C. Options 12 and 14 are *both*
  other letters' values *and* ±1. The notes call them off-by-one slips. A
  candidate cannot distinguish "I solved for the wrong letter" from "I miscounted
  by one", so the item cannot diagnose either.
- **`me-low-014`** — A=7, B=8, asked A. `opt-8` is B's value, but the note calls
  it an off-by-one slip, teaching the less useful lesson.

### Explanation quality

**Correct but basic** — all 40. Every explanation is exactly the `solutionSteps`
array joined with spaces: a faithful forward substitution, ending with "The
question asks for A, so the answer is 9."

They are mathematically correct and they do reinforce the final re-read (which
guards the most common error). But they teach one method only. The guide
recommends testing options against an equation as a faster route, and **no
explanation in the bank ever demonstrates it**. Nor do they mention divisibility
filtering, the other strategy the guide teaches.

### dMAT alignment

**officially_documented: 40.** Integers 1–20, exactly one solution per letter,
operators `+ − × ÷`, systems of several equations, and the alternating-sign
combining shape are all directly attested.

One standing caveat, already recorded in the content layer and not a per-question
defect: the official materials never state how many options an item offers, nor
whether the exam asks for one letter or all of them. Our four-option,
one-letter-asked format is a practice-implementation choice and is flagged
`unconfirmed` in the section guide.

### Questions requiring human review

| ID | Issue |
|---|---|
| `me-medium-012` | Distractors indistinguishable between two error modes |
| `me-low-014` | Distractor note picks the weaker of two true explanations |
| `me-high-002`, `me-high-011` | Four variables, but the asked letter is the root — high label, medium work |
| 10 further chain-depth-0 items | Asked letter is the root; real work below label |

### Per-question table

| ID | Difficulty | Pattern | Technical | Difficulty | dMAT Alignment | Distractors | Explanation | Recommendation |
| -- | ---------- | ------- | --------- | ---------- | -------------- | ----------- | ----------- | -------------- |
| me-low-001 | low | two-variable-chain, direct-substitution | PASS | Single pinning equation answers it; second equation is decorative | officially_documented | double+minus-one+plus-one | Correct; procedural restatement of the substitution | REVIEW |
| me-low-002 | low | two-variable-chain | PASS | OK | officially_documented | minus-one+other-variable+plus-one | Correct; procedural restatement of the substitution | KEEP |
| me-low-003 | low | two-variable-chain, direct-substitution | PASS | Single pinning equation answers it; second equation is decorative | officially_documented | minus-one+other-variable+plus-one | Correct; procedural restatement of the substitution | REVIEW |
| me-low-004 | low | two-variable-chain, direct-substitution | PASS | Single pinning equation answers it; second equation is decorative | officially_documented | half+other-variable+plus-one | Correct; procedural restatement of the substitution | REVIEW |
| me-low-005 | low | two-variable-chain | PASS | OK | officially_documented | double+other-variable+plus-one | Correct; procedural restatement of the substitution | KEEP |
| me-low-006 | low | two-variable-chain, direct-substitution | PASS | Single pinning equation answers it; second equation is decorative | officially_documented | double+minus-one+other-variable | Correct; procedural restatement of the substitution | REVIEW |
| me-low-007 | low | two-variable-chain, direct-substitution | PASS | Single pinning equation answers it; second equation is decorative; 3rd item with an identical structural shape | officially_documented | minus-one+other-variable+plus-one | Correct; procedural restatement of the substitution | REPLACE |
| me-low-008 | low | two-variable-chain | PASS | OK | officially_documented | double+minus-one+plus-one | Correct; procedural restatement of the substitution | KEEP |
| me-low-009 | low | two-variable-chain | PASS | OK | officially_documented | minus-one+other-variable+plus-one | Correct; procedural restatement of the substitution | KEEP |
| me-low-010 | low | two-variable-chain, direct-substitution | PASS | Single pinning equation answers it; second equation is decorative | officially_documented | double+half+other-variable | Correct; procedural restatement of the substitution | REVIEW |
| me-low-011 | low | two-variable-chain | PASS | OK | officially_documented | minus-one+other-variable+plus-one | Correct; procedural restatement of the substitution | KEEP |
| me-low-012 | low | two-variable-chain, direct-substitution | PASS | Single pinning equation answers it; second equation is decorative | officially_documented | half+other-variable+plus-one | Correct; procedural restatement of the substitution | REVIEW |
| me-low-013 | low | two-variable-chain | PASS | 3rd item with an identical structural shape | officially_documented | double+half+plus-one | Correct; procedural restatement of the substitution | REPLACE |
| me-low-014 | low | two-variable-chain, direct-substitution | PASS | Single pinning equation answers it; second equation is decorative | officially_documented | double+minus-one+other-variable | Correct; procedural restatement of the substitution | REVISE |
| me-medium-001 | medium | three-variable-system, elimination | PASS | OK | officially_documented | half+other-variable+other-variable | Correct; procedural restatement of the substitution | KEEP |
| me-medium-002 | medium | three-variable-system, elimination, multi-step-substitution | PASS | OK | officially_documented | minus-one+other-variable+other-variable | Correct; procedural restatement of the substitution | KEEP |
| me-medium-003 | medium | three-variable-system, elimination | PASS | Asked letter is the root — no chain to walk | officially_documented | double+other-variable+plus-one | Correct; procedural restatement of the substitution | REVIEW |
| me-medium-004 | medium | three-variable-system, elimination | PASS | Asked letter is the root — no chain to walk | officially_documented | minus-one+other-variable+plus-one | Correct; procedural restatement of the substitution | REVIEW |
| me-medium-005 | medium | three-variable-system, elimination | PASS | OK | officially_documented | half+minus-one+other-variable | Correct; procedural restatement of the substitution | KEEP |
| me-medium-006 | medium | three-variable-system, elimination, multi-step-substitution | PASS | OK | officially_documented | double+other-variable+other-variable | Correct; procedural restatement of the substitution | KEEP |
| me-medium-007 | medium | three-variable-system, elimination | PASS | Asked letter is the root — no chain to walk | officially_documented | minus-one+other-variable+plus-one | Correct; procedural restatement of the substitution | REVIEW |
| me-medium-008 | medium | three-variable-system, elimination | PASS | Asked letter is the root — no chain to walk | officially_documented | minus-one+other-variable+plus-one | Correct; procedural restatement of the substitution | REVIEW |
| me-medium-009 | medium | three-variable-system, elimination | PASS | OK | officially_documented | minus-one+other-variable+plus-one | Correct; procedural restatement of the substitution | KEEP |
| me-medium-010 | medium | three-variable-system, elimination, multi-step-substitution | PASS | OK | officially_documented | minus-one+other-variable+plus-one | Correct; procedural restatement of the substitution | KEEP |
| me-medium-011 | medium | three-variable-system, elimination | PASS | OK | officially_documented | double+other-variable+plus-one | Correct; procedural restatement of the substitution | KEEP |
| me-medium-012 | medium | three-variable-system, elimination, multi-step-substitution | PASS | OK | officially_documented | filler+other-variable+other-variable | Correct; procedural restatement of the substitution | REVISE |
| me-medium-013 | medium | three-variable-system, elimination | PASS | OK | officially_documented | double+other-variable+other-variable | Correct; procedural restatement of the substitution | KEEP |
| me-high-001 | high | four-variable-system, elimination | PASS | OK | officially_documented | half+other-variable+other-variable | Correct; procedural restatement of the substitution | KEEP |
| me-high-002 | high | four-variable-system, elimination, multi-step-substitution | PASS | OK | officially_documented | other-variable+other-variable+plus-one | Correct; procedural restatement of the substitution | KEEP |
| me-high-003 | high | four-variable-system, elimination | PASS | OK | officially_documented | double+other-variable+other-variable | Correct; procedural restatement of the substitution | KEEP |
| me-high-004 | high | four-variable-system, elimination | PASS | Asked letter is the root — solved the moment the combining equation resolves | officially_documented | minus-one+other-variable+other-variable | Correct; procedural restatement of the substitution | REVIEW |
| me-high-005 | high | four-variable-system, elimination, multi-step-substitution | PASS | OK | officially_documented | other-variable+other-variable+plus-one | Correct; procedural restatement of the substitution | KEEP |
| me-high-006 | high | four-variable-system, elimination | PASS | OK | officially_documented | other-variable+other-variable+plus-one | Correct; procedural restatement of the substitution | KEEP |
| me-high-007 | high | four-variable-system, elimination | PASS | 3rd item with an identical structural shape | officially_documented | minus-one+other-variable+plus-one | Correct; procedural restatement of the substitution | REPLACE |
| me-high-008 | high | four-variable-system, elimination | PASS | Asked letter is the root — solved the moment the combining equation resolves | officially_documented | other-variable+other-variable+plus-one | Correct; procedural restatement of the substitution | REVIEW |
| me-high-009 | high | four-variable-system, elimination | PASS | OK | officially_documented | other-variable+other-variable+other-variable | Correct; procedural restatement of the substitution | KEEP |
| me-high-010 | high | four-variable-system, elimination, multi-step-substitution | PASS | OK | officially_documented | half+minus-one+other-variable | Correct; procedural restatement of the substitution | KEEP |
| me-high-011 | high | four-variable-system, elimination | PASS | OK | officially_documented | double+other-variable+other-variable | Correct; procedural restatement of the substitution | KEEP |
| me-high-012 | high | four-variable-system, elimination | PASS | OK | officially_documented | double+other-variable+other-variable | Correct; procedural restatement of the substitution | KEEP |
| me-high-013 | high | four-variable-system, elimination | PASS | 3rd item with an identical structural shape | officially_documented | half+minus-one+other-variable | Correct; procedural restatement of the substitution | REPLACE |

---

## Latin Squares

### Overall assessment

The best-calibrated subtest in the bank and the only one whose difficulty is
measured rather than assigned. Its one significant gap is the deduction
*technique* it trains.

### Technical validation

40/40 PASS, on the strongest check in this audit: for every item, each of the
five letters was placed at the target and the grid was searched exhaustively for
a completion. In all 40, **exactly one letter admits a valid completion**, and it
is the stored `correctOptionId`. Grids are 5×5 with letters A–E, options are the
five letters, no row or column repeats a letter, and every target cell is empty.

All 158 distractor notes cite a cell that genuinely holds the clashing letter in
the solved grid, and all 63 notes depending on a derived cell carry the caveat.

### Difficulty distribution

| | n | forcedPlacementDepth | Givens (range) | Prerequisites outside the target's lines |
|---|---|---|---|---|
| low | 14 | 1 (all) | 4–21 | 0 |
| medium | 13 | 2 (4), 3 (9) | 4–13 | 0–1 |
| high | 13 | 4 (5), 5 (5), 6 (3) | 6–11 | 1–3 |

This matches the official exercises well. Official Exercise 2 (low) is a direct
read; Exercise 6 (high) lists roughly six sequential placements before the
target — so our 4–6 high range is authentic, and the earlier decision to cap
depth at 6 is vindicated by the official material.

Two calibration concerns:

- **Given count varies 4–21 within the low tier alone.** `ls-low-013` and
  `-014` have 4 givens — the four relevant cells sit alone on an empty grid and
  are impossible to miss. `ls-low-007` has 21 givens, so the same depth-1
  deduction requires scanning a nearly complete grid. These are not equally
  difficult items despite sharing a depth and a label.
- **Our low tier is uniformly depth 1, but official low is not.** Official
  Exercise 1 (low) requires one prerequisite placement before the target. We
  classify that as medium, so nothing in our low tier looks like half the
  official low material.

### Pattern coverage

| Pattern | Count |
|---|---|
| row-column-intersection | 8 |
| multi-step-deduction (depth 3–4) | 14 |
| deep-chain (depth 5–6) | 8 |
| one-step-deduction (depth 2) | 4 |
| direct-column | 4 |
| direct-row | 2 |

**The significant finding.** All 112 deduction steps across the bank are *naked
singles*: "four of the five letters already appear in this cell's row and
column, so the fifth goes here." That is the technique the official instructions
example uses.

But four of the six official *solution paths* lead with a different technique —
eliminating within a line:

> "In column γ, C and D are missing. C is already in row 4, so D must be inserted
> in β4." (Exercise 1)
>
> "A and D are missing in the first row. A can only be inserted at position α1,
> since it is already in column γ. Consequently, D must be in position γ1."
> (Exercise 4)

This reasons about *which cell a letter must occupy*, not *which letter a cell
must take*. Our generator implements naked singles only, by explicit design
decision in `scripts/lib/latin.mjs`. Every item is valid and uniquely solvable —
but a candidate who practises only on this bank never rehearses the move the
official solutions reach for first.

The section guide inherits the same gap: its method teaches counting letters
around the marked cell, and never the two-missing-letters-in-a-line move.

### Duplicate clusters

| Cluster | IDs | Why similar | Strongest | Recommendation |
|---|---|---|---|---|
| depth 3, 5 givens, 2 directly excluded | `ls-medium-001`, `-004`, `-005`, `-007`, `-010` | Identical shape: sparse grid, two letters visible around the target, three-step chain entirely within the target's lines | `ls-medium-001` | Keep 2–3, replace the rest |
| depth 1, 17 givens | `ls-low-002`, `-003`, `-004`, `-010` | Near-full grid, direct read | `ls-low-002` | Keep 2, replace 2 |
| depth 1, 19 givens | `ls-low-009`, `-012` | As above | `ls-low-009` | KEEP both |
| depth 1, 4 givens | `ls-low-013`, `-014` | Minimal grid, unmissable cells | `ls-low-013` | KEEP both |
| depth 3, 9 givens | `ls-medium-002`, `-012` | Same chain shape | `ls-medium-002` | KEEP both |
| depth 6, 8 givens, 2 out-of-line | `ls-high-001`, `-009` | Same deep-chain shape | `ls-high-001` | KEEP both |
| depth 5, 9 givens, 3 out-of-line | `ls-high-005`, `-006` | As above | `ls-high-005` | KEEP both |
| depth 5, 7 givens, 2 out-of-line | `ls-high-011`, `-012` | As above | `ls-high-011` | KEEP both |

### Distractor quality

The strongest in the bank, and structurally guaranteed: the four wrong letters
are the four letters that genuinely clash, and each note names the exact cell
causing the clash. Nothing is arbitrary, nothing is accidentally correct, and
none is obviously wrong in a way that could be eliminated without reasoning.

One defect: **`ls-high-007`** appends "That clash only becomes visible once you
fill in the cells the puzzle forces first" to the note for A, but the cited cell
(R3C3) is a given — the clash is visible immediately. The generator decides the
caveat from whether *any* step placed that letter in the target's lines, rather
than whether the *cited* cell was derived.

### Explanation quality

**Good teaching explanation.** Each names the specific letters excluded and the
line that excludes them, in the official voice ("A, C, E already appear in row 1;
D already appears in column 5 — so B is the only letter left for R1C5"), then
lists prerequisite placements in solving order for deeper items.

Weakness: all 14 depth-1 items close with the same boilerplate sentence, and no
explanation offers a search strategy — which prerequisite to look for first when
the target is not directly forced.

### dMAT alignment

**officially_documented: 40.** 5×5 grids, letters A–E, one letter per row and
column, only response-row letters used, a single marked cell, and exclusion-based
solving are all directly attested. Depth range matches the official exercises.

### Questions requiring human review

| ID | Issue |
|---|---|
| `ls-high-007` | Misapplied "only visible after prior placements" caveat |
| `ls-low-007`, `-009`, `-011`, `-012` | 19–21 givens for a depth-1 read: heavy scan, trivial deduction |
| `ls-low-013`, `-014` | 4 givens: arguably too sparse to require any search |
| whole subtest | No item uses line-based pair elimination, the technique four official solution paths lead with |

### Per-question table

| ID | Difficulty | Pattern | Technical | Difficulty | dMAT Alignment | Distractors | Explanation | Recommendation |
| -- | ---------- | ------- | --------- | ---------- | -------------- | ----------- | ----------- | -------------- |
| ls-low-001 | low | row-column-intersection | PASS | Depth 1; official low includes a depth-2 example we never generate | officially_documented | Real clashes, all directly visible | Correct; names the excluded letters | KEEP |
| ls-low-002 | low | direct-column | PASS | Depth 1; official low includes a depth-2 example we never generate | officially_documented | Real clashes, all directly visible | Correct; names the excluded letters | KEEP |
| ls-low-003 | low | row-column-intersection | PASS | Depth 1; official low includes a depth-2 example we never generate | officially_documented | Real clashes, all directly visible | Correct; names the excluded letters | KEEP |
| ls-low-004 | low | row-column-intersection | PASS | Depth 1; official low includes a depth-2 example we never generate | 3th item of an identical shape | officially_documented | Real clashes, all directly visible | Correct; names the excluded letters | REPLACE |
| ls-low-005 | low | row-column-intersection | PASS | Depth 1; official low includes a depth-2 example we never generate | officially_documented | Real clashes, all directly visible | Correct; names the excluded letters | KEEP |
| ls-low-006 | low | row-column-intersection | PASS | Depth 1; official low includes a depth-2 example we never generate | officially_documented | Real clashes, all directly visible | Correct; names the excluded letters | KEEP |
| ls-low-007 | low | direct-row | PASS | Depth 1; official low includes a depth-2 example we never generate | 21 givens — heavy visual scan for a depth-1 item | officially_documented | Real clashes, all directly visible | Correct; names the excluded letters | KEEP |
| ls-low-008 | low | direct-column | PASS | Depth 1; official low includes a depth-2 example we never generate | only 5 givens — relevant cells are unmissable | officially_documented | Real clashes, all directly visible | Correct; names the excluded letters | KEEP |
| ls-low-009 | low | direct-row | PASS | Depth 1; official low includes a depth-2 example we never generate | 19 givens — heavy visual scan for a depth-1 item | officially_documented | Real clashes, all directly visible | Correct; names the excluded letters | KEEP |
| ls-low-010 | low | row-column-intersection | PASS | Depth 1; official low includes a depth-2 example we never generate | 4th item of an identical shape | officially_documented | Real clashes, all directly visible | Correct; names the excluded letters | REPLACE |
| ls-low-011 | low | direct-column | PASS | Depth 1; official low includes a depth-2 example we never generate | 20 givens — heavy visual scan for a depth-1 item | officially_documented | Real clashes, all directly visible | Correct; names the excluded letters | KEEP |
| ls-low-012 | low | direct-column | PASS | Depth 1; official low includes a depth-2 example we never generate | 19 givens — heavy visual scan for a depth-1 item | officially_documented | Real clashes, all directly visible | Correct; names the excluded letters | KEEP |
| ls-low-013 | low | row-column-intersection | PASS | Depth 1; official low includes a depth-2 example we never generate | only 4 givens — relevant cells are unmissable | officially_documented | Real clashes, all directly visible | Correct; names the excluded letters | KEEP |
| ls-low-014 | low | row-column-intersection | PASS | Depth 1; official low includes a depth-2 example we never generate | only 4 givens — relevant cells are unmissable | officially_documented | Real clashes, all directly visible | Correct; names the excluded letters | KEEP |
| ls-medium-001 | medium | multi-step-deduction | PASS | OK | officially_documented | Real clashes; 2 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-medium-002 | medium | multi-step-deduction | PASS | OK | officially_documented | Real clashes; 2 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-medium-003 | medium | one-step-deduction | PASS | OK | officially_documented | Real clashes; 1 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-medium-004 | medium | multi-step-deduction | PASS | OK | officially_documented | Real clashes; 2 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-medium-005 | medium | multi-step-deduction | PASS | OK | 3th item of an identical shape | officially_documented | Real clashes; 2 need a prior placement (caveated) | Correct; names the excluded letters | REPLACE |
| ls-medium-006 | medium | one-step-deduction | PASS | OK | officially_documented | Real clashes; 1 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-medium-007 | medium | multi-step-deduction | PASS | OK | 4th item of an identical shape | officially_documented | Real clashes; 2 need a prior placement (caveated) | Correct; names the excluded letters | REPLACE |
| ls-medium-008 | medium | multi-step-deduction | PASS | OK | officially_documented | Real clashes; 1 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-medium-009 | medium | one-step-deduction | PASS | OK | officially_documented | Real clashes; 1 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-medium-010 | medium | multi-step-deduction | PASS | OK | 5th item of an identical shape | officially_documented | Real clashes; 2 need a prior placement (caveated) | Correct; names the excluded letters | REPLACE |
| ls-medium-011 | medium | multi-step-deduction | PASS | OK | officially_documented | Real clashes; 1 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-medium-012 | medium | multi-step-deduction | PASS | OK | officially_documented | Real clashes; 2 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-medium-013 | medium | one-step-deduction | PASS | OK | officially_documented | Real clashes; 1 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-high-001 | high | deep-chain | PASS | OK | officially_documented | Real clashes; 3 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-high-002 | high | deep-chain | PASS | OK | officially_documented | Real clashes; 2 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-high-003 | high | multi-step-deduction | PASS | OK | officially_documented | Real clashes; 2 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-high-004 | high | multi-step-deduction | PASS | OK | officially_documented | Real clashes; 2 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-high-005 | high | deep-chain | PASS | OK | officially_documented | Real clashes; 1 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-high-006 | high | deep-chain | PASS | OK | officially_documented | Real clashes; 1 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-high-007 | high | deep-chain | PASS | OK | officially_documented | Real clashes; 1 need a prior placement (caveated) | Caveat claims a clash is only visible after prior placements, but the cited cell is a given | REVISE |
| ls-high-008 | high | multi-step-deduction | PASS | OK | officially_documented | Real clashes; 1 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-high-009 | high | deep-chain | PASS | OK | officially_documented | Real clashes; 3 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-high-010 | high | multi-step-deduction | PASS | OK | officially_documented | Real clashes; 1 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-high-011 | high | deep-chain | PASS | OK | officially_documented | Real clashes; 2 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-high-012 | high | deep-chain | PASS | OK | officially_documented | Real clashes; 2 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |
| ls-high-013 | high | multi-step-deduction | PASS | OK | officially_documented | Real clashes; 1 need a prior placement (caveated) | Correct; names the excluded letters | KEEP |

---

## What the ideal Module A bank should look like

Recommendation counts from the tables above:

| | KEEP | REVIEW | REVISE | REPLACE |
|---|---|---|---|---|
| Figure Sequences | 14 | 0 | 20 | 6 |
| Mathematical Equations | 22 | 12 | 2 | 4 |
| Latin Squares | 34 | 0 | 1 | 5 |
| **Total** | **70** | **12** | **23** | **15** |

The 20 Figure Sequences REVISEs are one generator change, not twenty edits.

### Figure Sequences

**Target: 45 questions — 12 low / 18 medium / 15 high.**

Rationale: the exam is 20 items in 25 minutes, so a bank should support at least
two full-length sittings per tier. Medium is widened because it is currently both
the weakest tier and the widest band in the official material.

| | Now | Target | Why |
|---|---|---|---|
| low | 14 | 12 | Tier is correct but only ~2 genuine variants exist; 14 is padding |
| medium | 13 | 18 | Must carry the official medium standard, which we currently never meet |
| high | 13 | 15 | Structure is right; needs consistent x+1 and a 3-symbol cap |

Desired coverage changes:

- **Overrepresented:** single-symbol linear movement (11 items → target ~4);
  position-only distractors (89% → target ~65%).
- **Underrepresented:** rotation (8/40 → target ~40% of medium and high);
  compound rules stacking three transformations on one symbol (2 items → should
  be the *defining feature* of medium); x+1 border travel (1 item).
- **Regenerate:** all 13 medium items, so at least one symbol per item carries
  movement + rotation or movement + colour + rotation, matching official
  Exercise 3. The 4 medium items with two plain movers are the priority.
- **Regenerate:** the 4 four-symbol high items at 3 symbols, and the 3 high items
  lacking x+1.
- **Retain:** the entire low tier's approach, and all 13 border/direction-cycle
  medium and high items, which are well matched to Exercises 3 and 5.

Also worth deciding: nothing in the bank shows a linear or diagonal mover
*reaching* a boundary and then travelling along it. Our model treats border
travel as its own movement rule — which is exactly how all six official exercises
present it — so this is defensible. But the rule text reads "If they come up
against an outer boundary, they can EITHER bounce off OR move along the outer
boundary", which can be read as describing a response to contact. **This needs a
human decision**, and it is the same ambiguity the Phase 1 guide wording now
describes.

### Mathematical Equations

**Target: 45 questions — 15 low / 15 medium / 15 high.**

| | Now | Target | Why |
|---|---|---|---|
| low | 14 | 15 | Shape is right; needs operation variety |
| medium | 13 | 15 | Needs to differ from high by more than one letter |
| high | 13 | 15 | Needs depth, not just a fourth variable |

Desired coverage changes:

- **Overrepresented:** additive systems; ±1 distractors (42.5% of all options);
  chain-depth-0 items at medium and high (14 items).
- **Underrepresented:** multiplication and division — official Exercises 2 and 4
  lean on `B ÷ 2 = A` and `3 × A = C`, and **no item in our bank carries two or
  more multiplicative operations**. Divisibility filtering is a strategy the
  guide teaches and the bank barely rewards.
- **Change the difficulty definition.** Difficulty should be
  `substitution depth to the asked letter`, not variable count. A four-variable
  system whose asked letter is the root is easier than a three-variable system
  whose asked letter sits two substitutions down. Concretely: low = answer within
  1 substitution; medium = 2; high = 3+, with the asked letter never the root.
- **Distractor policy:** guarantee at least one wrong-letter option and at most
  one ±1 option per item, and reject items where a letter's value coincides with
  correct ±1 (which is what breaks `me-medium-012` and `me-low-014`).
- **Retain:** all 14 low items' structure, the alternating-sign combining shape,
  and the exhaustive uniqueness proof, which is doing exactly its job.

### Latin Squares

**Target: 45 questions — 15 low / 15 medium / 15 high.**

| | Now | Target | Why |
|---|---|---|---|
| low | 14 | 15 | Add the official depth-2 "one easy prerequisite" variety |
| medium | 13 | 15 | Reduce the 5-item identical cluster, add technique variety |
| high | 13 | 15 | Depth range is already right |

Desired coverage changes:

- **Overrepresented:** the depth-3 / 5-given / 2-excluded shape (5 items); near-
  full depth-1 grids (6 items at 17–21 givens).
- **Underrepresented, and the most valuable single change in this audit:
  line-based pair elimination.** Four of six official solution paths use it and
  none of our 112 deduction steps do. This needs a solver extension, not just new
  questions — and the section guide's method should gain the technique too.
- **Normalise given count within a tier.** Depth-1 items ranging 4–21 givens are
  not equally difficult. A band of roughly 8–14 would make the label mean one
  thing.
- **Retain:** the measured-difficulty approach, the depth ranges, the exhaustive
  uniqueness check, and the distractor notes, which need no change beyond the
  `ls-high-007` caveat fix.

### Cross-cutting

1. **Fold the harness's stronger checks into `verify-bank`** — exhaustive Latin
   completion counting, explicit equation satisfaction, and distractor-note
   factual verification found nothing today, but they are the checks that would
   catch a regression when generators change.
2. **Explanations should teach a route, not just a derivation.** No Mathematical
   Equations explanation demonstrates option-testing; no Figure Sequences
   explanation models how to find the rule; no Latin Squares explanation says
   which prerequisite to hunt for first.
3. **Difficulty should be measured everywhere**, as it already is for Latin
   Squares. That single change would resolve most of the calibration findings in
   this report.
