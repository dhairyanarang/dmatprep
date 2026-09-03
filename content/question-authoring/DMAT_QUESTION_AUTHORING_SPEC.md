# dMAT Question Authoring Specification

**This is the source of truth for generating Module A questions.** Read it before
writing or generating any question, and before changing a generator.

Its purpose is narrow and important: the dMAT was first sat on 26 September 2026,
after most model training cutoffs. Anything a model "knows" about this exam is
either read from the official material or invented. This document records only
what the official material supports, and labels everything else.

**Primary authority:** g.a.s.t. *dMAT — Preparatory Materials for Test Takers,
General Academic Module*, 4 August 2026 build, linked from the d-mat.de India
page. Extract it with `node scripts/extract-pdf.mjs <file.pdf>`; naive text
extraction returns mojibake. Secondary: d-mat.de and aps-india.de only. **Never
cite a third-party dMAT guide, even for corroboration.**

Page references below are to that PDF.

---

## 0. Classification vocabulary

Every mechanic and every generated question carries one of three labels.

| Label | Meaning |
|---|---|
| `officially_documented` | Stated in the rules or demonstrated in a worked example. |
| `reasonable_extrapolation` | Composed from documented mechanics, or covered by a rule that is stated but never demonstrated. Legitimate practice material; must be labelled. |
| `uncertain` | Cannot be tied to the documented structure. **Must not be published without human review.** |

An inference never gets promoted to a fact by being useful.

---

## 1. What is officially documented, across all three subtests

| Fact | Source |
|---|---|
| Core Module: three subtests, each **25 minutes for 20 items** | pp. 8, 18, 25 |
| Each subtest's own noun: "20 series of matrices", "20 systems of equations", "20 tasks" | pp. 8, 18, 25 |
| All tasks are single-choice | d-mat.de |
| Candidates are told to guess when they do not know | pp. 8, 25, 34 |
| No notes at any point; no scratch paper | p. 6, T&Cs |

**75 seconds per item is a derived average** (25 min ÷ 20), not a published
per-item limit. Never present it as a rule.

---

## 2. Figure Sequences

### 2.1 Official mechanics

Verbatim rules (pp. 7–8):

> The figures in the matrices can change their position, colour, and/or
> orientation from one matrix to the next according to specific rules. It is your
> task to continue the series logically and to determine what the next two
> matrices look like.
>
> - Figures can change their colour.
> - Figures can rotate around their own axis.
> - Figures can move in the matrix. Vertical, horizontal, and diagonal movements
>   are allowed. Figures cannot change from one diagonal movement to another type
>   of movement.
> - Figures can also change their movement, colour or orientation by x + 1.
>   Example: If a figure moves one step from matrix 1 to matrix 2, it moves 2
>   steps from matrix 2 to matrix 3, then 3 steps, etc.
> - Figures cannot disappear or overlap.
> - Figures cannot leave the matrix. If they come up against an outer boundary,
>   they can EITHER bounce off OR move along the outer boundary.

| Mechanic | Label | Notes |
|---|---|---|
| Four matrices shown; predict the 5th and 6th | `officially_documented` | p. 7; solutions read "Image 1: Matrix n / Image 2: Matrix n" |
| Three options per image, two selections per item | `officially_documented` | pp. 13–16 |
| **4×4 grid** | `officially_documented` | Never stated in words, but unambiguous in every diagram — confirmed visually during the Phase 3 audit by rasterising pp. 10-12. Also implied by "the four middle fields" (p. 7). |
| Vertical / horizontal / diagonal movement | `officially_documented` | p. 7 |
| A diagonal mover may not switch movement type | `officially_documented` | p. 7 |
| Travel along the outer boundary | `officially_documented` | p. 8; Ex 3, 5 |
| Bounce off a boundary | `officially_documented` | p. 8; Ex 1, 2, 4, 6 |
| **A bounce reverses the figure along the same path** | `officially_documented` | Ex 2: "bounces off the upper boundary and returns to the starting position in the same way (diagonally downwards to the left)"; Ex 6 likewise. |
| Rotation about the figure's own axis, 90° | `officially_documented` | p. 7; Ex 3, 4, 5, 6 |
| Colour cycling, 2 colours | `officially_documented` | Ex 3: "changes its colour alternately from black to pink" |
| Colour cycling, 3 colours | `officially_documented` | Ex 5: "changes its colour from white to pink to yellow, and so on" |
| x+1 on movement | `officially_documented` | p. 8 rule and its own example; Ex 5 on border travel |
| x+1 on rotation | `officially_documented` | Ex 6: "always turns x + 1 times to the right by 90 degrees" |
| **x+1 on colour** | `reasonable_extrapolation` — **not generated** | The p. 8 rule names colour explicitly, but no exercise demonstrates it, and at the attested cycle lengths the mechanic has no usable form. The colour index runs `p(p+1)/2` = 0,1,3,6,10,15 across the six panels, which is `0,1,0,0,1,0` modulo 3: a **three-colour accelerating cycle never renders its third colour in any panel**, while the explanation still names it. All five such items in batch b1 carry that defect. Two colours reduce to an alternation. Do not generate. |
| **1 to 4 symbols** | `officially_documented` | Ex 1-2 show 1, Ex 3 shows 2, **Ex 4 shows 3**, **Ex 5 and Ex 6 show 4** — verified visually from the diagrams, pp. 10-12. |
| Repeating direction cycle | `officially_documented` | Ex 5: "The sequence of directions in which the symbol moves is: down, …"; also the p. 7 instructions example, "moves one field clockwise within the four middle fields" |
| Figures cannot disappear, overlap, or leave the matrix | `officially_documented` | p. 8 |
| Border travel at 1 or 2 fields per step | `officially_documented` | Ex 3 ("two squares at a time"), Ex 5 |
| Linear/diagonal movement at more than one field per step, other than x+1 | **not attested** | Every official linear/diagonal example moves "one field at a time". Do not generate it — **including as a distractor**. The Phase 3 audit found 30 of 180 committed distractors showing a two-field linear or diagonal step, which puts a movement on screen that the exam never uses. |
| A sequence whose four shown matrices admit more than one legal continuation | **forbidden** | Not a mechanic but a property, and the one the old validator could not see. See §2.5. |

#### The boundary question that is genuinely open

The rule reads "If they come up against an outer boundary, they can EITHER bounce
off OR move along the outer boundary." In all six exercises, border travel is a
symbol's *own movement rule* from matrix 1 — never a response to hitting a wall
mid-sequence. Our generator models it the same way.

Whether a linear mover can reach a wall and then start following the perimeter is
**unresolved**. Do not generate it. If it is ever added, label it `uncertain` and
flag it for human review.

### 2.2 Difficulty model

**Difficulty is not symbol count.** The official exercises escalate by stacking
transformations onto a single symbol; symbol count rises alongside but never past
three.

**Symbol counts corrected 3 September 2026.** The table below previously recorded
Ex 4 as 2 symbols and Ex 5/Ex 6 as 3, and derived from that a hard cap of three
symbols enforced in the generator and in `verify-bank`. The Phase 3 audit
rasterised the exercise pages and counted the diagrams directly: **Ex 4 has 3
symbols and Ex 5 and Ex 6 have 4.** The old cap meant our high tier was built at
the official *medium* level.

| Official | Symbols | Composition |
|---|---|---|
| Ex 1 (low) | 1 | vertical movement + bounce |
| Ex 2 (low) | 1 | diagonal movement + bounce |
| Ex 3 (medium) | 2 | **one symbol: border travel + 2-colour cycle + 90° rotation**; one symbol: border travel |
| Ex 4 (medium) | **3** | linear + bounce + rotation; direction cycle (left, up, right, down); diagonal + bounce |
| Ex 5 (high) | **4** | border travel **x+1**; linear + bounce + rotation + 3-colour cycle; direction cycle + rotation + 2-colour cycle; diagonal + bounce |
| Ex 6 (high) | **4** | diagonal + bounce + **x+1 rotation**; vertical + bounce + rotation; border travel; border travel ×2 + 3-colour cycle |

Score each item on **transformation load** — the number of simultaneous rules the
candidate must hold — and set difficulty from that, not from the symbol count:

```
load(symbol) = 1 (movement)
             + 1 if it rotates
             + 1 if it cycles colour
             + 1 if any of those accelerate by x+1
             + 1 if it interacts with a boundary within the shown panels

peakLoad  = max load over the item's symbols
totalLoad = sum of loads
```

**Symbol count is an independent dimension, not the difficulty lever.** The tiers'
ranges overlap deliberately, so a 3-symbol item may be medium or high depending on
what is stacked on its busiest symbol. Before the Phase 3 fixes, symbol count was
100% determined by tier (low=1, medium=2, high=3 across all 45 items), which is
precisely what §2.3 forbids — and it made the tier readable off the picture.

| Difficulty | Symbols | Requirement |
|---|---|---|
| **low** | 1 | `peakLoad ≤ 2`. Movement only, plus its boundary behaviour. No rotation, no colour. |
| **medium** | **2-3** | **`peakLoad = 3`** — at least one symbol must stack movement with rotation and/or colour. This is the Ex 3 / Ex 4 standard. |
| **high** | **3-4** | `peakLoad ≥ 4`. Reachable by accelerating, *or* by stacking movement + rotation + colour on a symbol that also meets a wall. Prefer compound rules over extra symbols. |

**On x+1 and high difficulty.** Both official high exercises use x+1 and neither
medium one does. That is a calibration observation from two examples, **not a
documented rule** — the materials nowhere say high items must accelerate. Treat
x+1 as a strong high-difficulty signal, but a high item built from a genuinely
deep compound rule without x+1 is legitimate. Batch b1 put x+1 in **15 of 15**
high items, which made the tier guessable; the generator now targets roughly half
and the `peakLoad ≥ 4` gate is satisfied either way.

### 2.3 Generation constraints

- **Never exceed 4 symbols** — the ceiling the official high exercises reach.
  Five would exceed anything the material shows.
- **Never use extra symbols to manufacture difficulty.** If an item is not hard
  enough, stack another transformation onto an existing symbol.
- Only `triangle` and `arrow` may rotate — a rotating circle or square is
  unanswerable, not difficult.
- **Do not generate accelerating colour cycles at all.** With three colours the
  third is never rendered (see §2.1); with two the pattern degenerates. The
  mechanic is `reasonable_extrapolation` and has no usable form at attested
  lengths.
- **Every colour in a cycle must be visible in the four shown matrices.** A
  candidate cannot infer a colour they have never seen; official Ex 5 shows all
  three of white→pink→yellow within the shown panels.
- Keep `white` out of colour cycles: it needs a stroke to read on a light panel.
- Reject any sequence where a symbol visits fewer than 3 distinct cells, where
  two consecutive panels are identical, or where nothing moves.
- Maintain a spread across movement families. Do not let single-symbol linear
  movement dominate the low tier as it did before this spec existed.

### 2.5 The shown matrices must imply exactly one continuation

This is the property the old validator could not see, and the one that matters
most. `verify-bank` used to re-simulate the *stored rules* and confirm the marked
panel matched — which is circular. It can only catch a rule/panel mismatch, never
an item whose shown panels admit a second legal reading.

The Phase 3 audit inverted the documented rule space over the committed bank and
found **7 of 45 items admitting more than one legal continuation**, and **2 of
those offering the alternative reading as a distractor**, marked wrong. Every case
had one cause:

> **Border travel and linear movement are observationally identical while a
> symbol runs along an edge without turning a corner.**

`scripts/lib/fs-inversion.mjs` is now the authoritative gate, applied at
generation *and* in `verify-bank`. For each symbol it enumerates every documented
movement, rotation and colour rule consistent with the four shown panels and
requires exactly one surviving continuation. The three aspects evolve
independently in `stepSymbol`, so the continuation set factorises and each aspect
is inverted separately — cheap, and it names which aspect is ambiguous.

Rules:

- **More than one legal continuation ⇒ reject the item.** Never pick one
  arbitrarily, and never use the stored rule to break the tie.
- Never "fix" ambiguity by changing what the official mechanics allow.
- The cheap structural predicate — all four shown cells on the perimeter with an
  unchanging heading — is kept as an early reject, but the inversion is the gate.

### 2.4 Distractor policy

Wrong panels must encode a **specific misreading**, and the note must name it.
Required distribution across an item's four distractors (two per image): at least
two distinct error families where the rule set allows.

| Error family | Applies when |
|---|---|
| `movement-step` | wrong step size — one field short or long |
| `movement-direction` | continued instead of bouncing, or bounced early |
| `boundary` | reflected rather than reversed at a wall |
| `rotation` | rotated the wrong way, or not at all |
| `colour` | advanced the colour cycle wrongly, or held it |
| `acceleration` | applied a constant step where the rule is x+1 |

A distractor that differs only by moving a symbol to an arbitrary neighbouring
cell is acceptable only when no rule-based error is available for that item.

---

## 3. Mathematical Equations

### 3.1 Official mechanics

Verbatim (p. 17):

> In this task, you are supposed to solve systems of equations in such a way that
> all requirements are met. One system of equations always consists of several
> single equations.
>
> Your task is to find out which numbers must be used for the unknowns (letters)
> in the equations so that all equations are correct.
>
> There is always only one solution for each letter, in which all requirements
> are met.
>
> Each letter can be an integer between 1 and 20.

| Mechanic | Label |
|---|---|
| Letters are integers 1–20 inclusive | `officially_documented` |
| Exactly one solution per letter | `officially_documented` |
| A system consists of several single equations | `officially_documented` |
| Operators `+ − × ÷`, written with `×` and `÷` | `officially_documented` — observed in every official exercise |
| Two to four letters | `officially_documented` — Ex 1–2 use two, Ex 3–4 three, Ex 5–6 four |
| Alternating-sign combining equation (`A − B + C − D = 2`) | `officially_documented` — Ex 5, 6 |
| Combining equation over a **subset** of the letters (`C + D − A = 1`, leaving B out) | `officially_documented` — Ex 6 |
| Bare pin (`B = 6`) | `officially_documented` — Example 1 |
| Two unknowns equal to a constant (`A + C = 8`) | `officially_documented` — Ex 3 |
| Multiple multiplicative terms (`2 × A + 2 × C = B`) | `officially_documented` — Ex 3 |
| Compound coefficient plus offset (`3 × C − 1 = B`) | `officially_documented` — Ex 6 |
| **Star topology** — several letters each defined from one root (`10 × B = C`, `5 × B = A`, `11 + B = D`) | `officially_documented` — Ex 5; Ex 6 is a star on C |
| **Asking for one letter, with four options** | `reasonable_extrapolation` — the exam is single-choice, but the materials present these exercises with no options at all, and the task text says "find out which numbers must be used for the unknowns" (plural). Keep this flagged `unconfirmed` in the section guide. |
| Numeric constants above 18 | `reasonable_extrapolation` — no official constant exceeds 18 |
| Operators beyond `+ − × ÷` | **not attested** — do not generate |
| Negative or zero values, fractions | **excluded** by the 1–20 integer rule |

The six official exercises, with published answers, are the solver's regression
fixtures and must keep passing:

| # | System | Answer |
|---|---|---|
| 1 | `7 + A = 14`, `B − 3 = A` | A=7, B=10 |
| 2 | `B ÷ 2 = A`, `B − A = 8` | A=8, B=16 |
| 3 | `3 × C = A`, `A + C = 8`, `2 × A + 2 × C = B` | A=6, B=16, C=2 |
| 4 | `18 − B = A`, `3 × A = C`, `B ÷ 2 = A` | A=6, B=12, C=18 |
| 5 | `A − B + C − D = 2`, `10 × B = C`, `5 × B = A`, `11 + B = D` | A=5, B=1, C=10, D=12 |
| 6 | `C + D − A = 1`, `5 × C = D`, `13 − C = A`, `3 × C − 1 = B` | A=11, B=5, C=2, D=10 |

### 3.2 Difficulty model

**Difficulty is reasoning depth, not variable count.** A four-letter system whose
asked letter falls out of the first equation is easier than a three-letter system
whose asked letter sits two substitutions down.

Define `reasoningDepth` as the number of substitution steps a competent solver
must perform *before the asked letter's value is known*:

```
1. Find every equation with exactly one unknown; solving one costs 1.
2. Substitute known values; repeat.
3. If no equation has a single unknown, collapsing a combining equation costs
   1 + (the number of definitions pushed into it).
4. reasoningDepth = total cost when `asked` becomes known.
```

**On step 3.** Collapsing a combining equation is not one move, and costing it as
one put a three-equation collapse at depth 1 — in the *low* tier. Official Ex 5
pushes three definitions into `A − B + C − D = 2` and simplifies
`5B − B + 10B − (11 + B) = 2` before B falls out, and both exercises that work
this way are graded high. Under the corrected model the six official exercises
measure: Ex 1 (low) 1-2, Ex 2 (low) 2-3, Ex 3 (medium) 3-5, Ex 4 (medium) 3-5,
Ex 5 (high) 4-7, Ex 6 (high) 4-7.

**Letter count and depth are independent dimensions.** Batch b1 tied them
exactly — low=2 letters, medium=3, high=4, in 45/45 items — and every low item
asked for the root letter, so the whole tier was one template. The generator now
draws a letter count, builds a system, *measures* the depth of every letter, and
asks one whose depth lands in the tier's band. Which letter plays the root is
drawn too, so the asked letter is no longer almost always `A`.

| Difficulty | reasoningDepth | Additional requirement |
|---|---|---|
| **low** | 1 | Asked letter is reachable from one equation. |
| **medium** | 2 | |
| **high** | ≥ 3 | The asked letter must **not** be the first letter determined. |

The last requirement matters: without it, a four-variable system whose asked
letter is the root of the chain is labelled high but answered in one step.

### 3.3 Operation diversity

Official Exercises 2 and 4 lean on `B ÷ 2 = A` and `3 × A = C`. A bank of purely
additive systems does not prepare for them, and it wastes the divisibility
filtering the section guide teaches.

Per difficulty tier, **at least half the items must contain two or more
multiplicative operations** (`×` or `÷`), and every tier must contain at least
one item using division as the step that determines the asked letter.

### 3.4 Distractor policy

Each item has three distractors. Every one must correspond to a nameable error:

| Error family | Value |
|---|---|
| `wrong-variable` | another letter's value — the reasoning was right, the letter wrong |
| `off-by-one` | correct ± 1 |
| `inverted-operation` | double or half, from multiplying where the equation divides |
| `sign-error` | the value obtained by flipping a sign during substitution |
| `stopped-early` | an intermediate value from partway down the chain |

Rules:

- **At most one `off-by-one` distractor per item.** They previously accounted for
  42.5% of the bank.
- **At least one `wrong-variable` distractor** whenever the system has a letter
  whose value is in range and distinct.
- **Reject the item if a distractor's value satisfies two contradictory error
  families** — for example a letter whose value is also `correct + 1`. The option
  then diagnoses nothing, and the note has to pick one explanation arbitrarily.
  This is what made `me-medium-012` (letters 12/13/14) an unusable item.

---

## 4. Latin Squares

### 4.1 Official mechanics

Verbatim (p. 24):

> Each letter can only appear once in each row and each column. Only the letters
> that are shown as response options can appear in the grid.

| Mechanic | Label |
|---|---|
| 5×5 grid, letters A–E | `officially_documented` |
| Each letter once per row and once per column | `officially_documented` |
| Only response-row letters appear | `officially_documented` |
| Exactly one marked cell per task | `officially_documented` — every example shows a single question mark |
| Solvable by exclusion without guessing | `officially_documented` — all six solution paths are deductive |

### 4.2 Deduction techniques — both are official

This is the part most easily got wrong. The official material demonstrates **two
distinct techniques**, and a bank that trains only the first is incomplete.

**Technique A — naked single (cell-based).** Four of the five letters already
appear in a cell's row and column, so the fifth belongs there.

> "'B' needs to replace the red question mark, because all other letters D, A, C,
> and E already appear in this column." — Example 1, p. 24

**Technique B — line-based pair elimination (position-based).** A line is missing
exactly two letters; one of them is blocked from one of the two open cells by its
row or column, so it must take the other, and the second letter follows.

> "In column β, C and D are missing. C is already in row 4, so D must be inserted
> in β4. Consequently, C must be inserted in the place of the question mark."
> — Solution to Exercise 1
>
> "A and D are missing in the first row. A can only be inserted at position α1,
> since it is already in column γ. Consequently, D must be in position γ1."
> — Solution to Exercise 4

Technique B reasons about *which cell a letter must occupy*; Technique A reasons
about *which letter a cell must take*. **Four of the six official solution paths
lead with Technique B.**

#### Technique B is a faster search, not a more powerful one

**Corrected 3 September 2026.** This section previously required the generator to
build items that "genuinely **require** Technique B — items where no naked single
is available at the point where the candidate is stuck". That requirement is
**unsatisfiable**, and not for want of trying.

On a line missing exactly two letters — the only form the official material
demonstrates — pair elimination is the *logical dual* of a naked single at the
partner cell. If letter L fits only one of the two open cells, the other cell has
exactly one remaining candidate, which is a naked single by definition. The
official examples have exactly this shape:

> "In column β, C and D are missing. C is already in row 4, so D must be inserted
> in β4. Consequently, C must be inserted in the place of the question mark."

The Phase 3 audit confirmed it empirically: **all 45 committed items and all 145
in a dry run fall to naked singles alone, in no more rounds than the stored path.**
25 of the 45 were nonetheless presented as pair-elimination items, with
walkthroughs telling the candidate that a two-missing line was "the way in".

What Technique B actually is: a **quicker way to find the same placement**. That
is why four of the six official paths lead with it — spotting a line short of two
letters is faster than testing cells one at a time. Teach it that way.

Requirements:

- A step may only be labelled `pair-elimination` if the solver actually took that
  route. Never label a technique the solver did not use.
- **Never claim an item requires it.** Walkthrough copy says "a quicker way in",
  not "the way in".
- No tier may consist entirely of one technique.
- **Do not introduce hidden singles** (a letter with one possible cell in a line
  missing three or more) to manufacture a genuine requirement. That technique is
  not demonstrated anywhere in the official material, and reaching for it to
  satisfy a spec requirement would be exactly the unsupported-mechanic drift this
  document exists to prevent.

### 4.3 Difficulty model

Deduction depth alone is insufficient. Score on four dimensions:

| Dimension | Meaning |
|---|---|
| `deductionDepth` | placements required before the target is forced, target included |
| `clueDensity` | givens as a fraction of the 24 non-target cells |
| `techniques` | which of A / B the path requires |
| `targetDistance` | how many of the prerequisite placements lie outside the target's own row and column |

| Difficulty | Depth | Techniques | Clue density |
|---|---|---|---|
| **low** | 1–2 | A, or a single B step | 0.30 – 0.60 |
| **medium** | 3–4 | at least one requiring a prerequisite | 0.20 – 0.50 |
| **high** | 5–7 | must include at least one B step | 0.20 – 0.45 |

Official calibration: Example 2 (low) is a direct read; Exercise 1 (low) needs
one prerequisite; Exercise 6 (high) lists roughly six sequential placements. A
depth of 7 is the ceiling — beyond that the chain stops being holdable without
notes, which the exam forbids.

**`targetDistance` is a generation constraint, not just a statistic.** It was
defined here from the start but never constrained on, so batch b1's entire low
tier and 11 of 15 medium items had *every* prerequisite sitting on the target's
own lines. It is now part of the structural fingerprint.

**Clue-density control.** A depth-1 item with 4 givens and a depth-1 item with 21
givens are not the same task: one has its relevant cells alone on an empty grid,
the other buries them in a nearly complete square. Keep density inside the band
for the tier so the label means one thing.

### 4.4 Distractor policy

Structurally determined and already strong: the four wrong letters are the four
that genuinely clash, and each note names the exact clashing cell.

Two rules:

- A note may cite a cell the candidate cannot yet see **only** if it also says the
  clash becomes visible after the forced placements. Decide the caveat from
  whether **the cited cell** is a given — not from whether any step touched the
  target's lines.
- Prefer citing a given cell where one exists, so the note is checkable
  immediately.

---

## 5. The generation pipeline is deterministic, not generative

**A model is never the authority on whether a question is correct.** Language
models are used to shape prose — explanations, hints, notes — and nothing else.
Every logical and mathematical claim is decided by code.

Required order, for every item, with no step skippable:

```
1. construct        build a candidate from the rules in this spec
2. solve            re-derive the answer with an independent solver
3. validate         check every invariant for the subtest
4. uniqueness       prove exactly one answer exists
                    ME: exhaustive search over 1..20
                    LS: exhaustive completion count per candidate letter
                    FS: rule-space inversion — the four shown matrices must
                        admit exactly one legal continuation (§2.5). Checking
                        that one option panel matches the simulated result is
                        NOT sufficient; that is the circular check.
5. distractors      every wrong option has a named error family and a note;
                    no distractor is also correct; no two options identical
6. explanation      re-derive the stated solution path and compare
7. difficulty       measure it; never inherit the label the constructor intended
8. metadata         patternType, dmatAlignment, reasoningDepth, distractorTypes
9. publish          only if every step above passed
```

`npm run verify:bank` re-runs steps 2–7 against the committed JSON, re-parsing
rendered equation strings, re-propagating and strictly replaying Latin-square
paths, and re-simulating *and inverting* figure panels rather than trusting
in-memory state. A bank that passes has been checked, not asserted.

The per-question checks live in `scripts/lib/verify.mjs` and are called by both
`verify-bank` and the generator, so a candidate that would fail the bank check can
never reach the bank. Generation and verification cannot drift apart.

**Generation is append-only.** `scripts/generate-batch.mjs` is the only supported
way to add questions. Each slot is seeded from
`hash(generator, section, tier, batchId, index, attempt)`, so enlarging a batch
adds slots without perturbing earlier ones, and a new batch cannot touch an older
one. Full-bank regeneration has been removed: it mutated 34/45, 36/45 and 40/45
items under their existing ids when a quota changed, which silently corrupts the
attempt and exposure records keyed to those ids.

---

## 6. Before generating a batch: write a `generation_plan`

Never generate a batch of questions without stating the plan first. The plan
exists to stop successive batches from re-producing the same easy pattern.

```
generation_plan:
  section:              figure-sequences | mathematical-equations | latin-squares
  count:                how many
  difficulty targets:   low / medium / high split
  current coverage:     pattern counts in the existing bank
  overrepresented:      patterns to avoid
  gaps being filled:    patterns to prefer
  constraints:          spec sections that bound this batch
  expected distribution: pattern → count after generation
```

Derive "current coverage" from the bank itself (`node scripts/audit-bank.mjs`),
not from memory.

---

## 7. Per-question quality bar

An item ships only if all eight hold:

1. **Correctness** — exactly one valid answer, proven by an independent solver.
2. **Fidelity** — every mechanic is `officially_documented`, or labelled
   `reasonable_extrapolation`. Nothing `uncertain` ships without human review.
3. **Difficulty** — the measured difficulty matches the label.
4. **Diversity** — it is not a structural duplicate of an existing item.
5. **Distractors** — each encodes a nameable error; no two error families
   collide on one value.
6. **Explanation** — teaches the search, not just the derivation: how to find the
   rule, not only what the rule was.
7. **Hints** — three levels that narrow the search without revealing the answer.
8. **No accidental ambiguity** — nothing about the item admits a second reading.

---

## 8. Hint authoring rules

Hints are generated from the solved structure, so they are always consistent with
the answer. They escalate:

| Level | Job | Figure Sequences | Mathematical Equations | Latin Squares |
|---|---|---|---|---|
| 1 | point at where to look | name which symbol to track first | say which equation to start from, without naming it | say whether the target is settled directly or needs a prerequisite |
| 2 | narrow the search | name the aspect that decides it — movement, rotation or colour | quote the starting equation | name the row or column that does the work |
| 3 | procedural nudge | describe the operation to apply | describe the rearrangement to perform | name the cell to fill first |

**A hint must never state the answer**, and never a value that trivially yields
it. `"Divide both sides by 2"` is a hint. `"A = 8"` is not. For Latin Squares,
level 3 may name the prerequisite *cell* but never the letter that goes in the
target.

Hints are validated mechanically: `verify-bank` fails any item whose hint text
contains the answer value or the answer letter as a standalone token.

---

## 9. The mechanics contract

Added 3 September 2026, from the Phase 3 audit. This is the gate every generated
question passes through. It is mirrored in machine-readable form in
`scripts/lib/contract.mjs`, and enforced at generation and in `verify-bank`.

**A generator must be structurally incapable of producing a FORBIDDEN mechanic.**
Not discouraged from it — incapable. Where a check cannot be structural, it is a
hard error in the shared verifier, which generation also runs.

### Figure Sequences

**ALLOWED** — generate freely.

- Linear and diagonal movement at one field per step, with bounce-as-reversal
- x+1 on movement or rotation
- Border travel, clockwise or counter-clockwise, at 1, 2 or x+1 fields
- Four-step repeating direction cycles
- Rotation of 90°, either direction
- Colour cycles of 2 or 3 colours, every colour visible in the shown matrices
- **1 to 4 symbols**

**REVIEW REQUIRED** — label `reasonable_extrapolation`, sign off per batch.

- A static symbol that only rotates (Ex 3 and Ex 6 each carry a rotation clause
  with no movement clause; the reading is genuinely ambiguous from the text)
- 180° / 270° rotation
- `white` in a colour cycle — documented in Ex 5, excluded only for legibility
- Rotation on shapes beyond triangle and arrow

**FORBIDDEN.**

- Wrap-around or teleportation
- Billiard reflection as the *correct* boundary behaviour (fine as a distractor)
- Linear or diagonal movement above one field per step other than x+1 —
  **including in distractors**
- Figures disappearing, overlapping, or leaving the matrix
- More than 4 symbols
- A mid-sequence switch from one movement type to another
- **Shown matrices admitting more than one legal continuation** (§2.5)
- A colour cycle containing a colour never shown in the four given matrices
- Accelerating colour cycles — REVIEW-class in principle, but with no usable form
  at attested cycle lengths (§2.1)

### Mathematical Equations

**ALLOWED.**

- Integer letter values in 1..20, exactly one solution per letter
- Operators `+ − × ÷` only
- 2 to 4 letters
- Chain, star and mixed definition topologies
- Bare pins (`B = 6`), operated pins (`7 + A = 14`)
- Linear, multiplicative and compound definitions (`3 × C − 1 = B`)
- Two unknowns equal to a constant (`A + C = 8`)
- Multiple multiplicative terms (`2 × A + 2 × C = B`)
- Combining equations over all letters *or a subset*

**REVIEW REQUIRED.**

- Numeric constants above 18
- The one-letter/four-option question format — Example 1 does ask for a single
  letter, so the *asking* is documented; the four-option presentation is not.
  Keep it flagged `unconfirmed` in the section guide.

**FORBIDDEN.**

- Operators beyond `+ − × ÷`
- Quadratic or higher-power terms, including a letter multiplied by a letter
- Non-integer, zero or negative letter values; anything outside 1..20
- Systems without exactly one solution
- An `inverted-operation` distractor note blaming an operator the system does not
  contain
- A level-2 hint quoting an equation that contains only the asked letter

### Latin Squares

**ALLOWED.**

- 5×5 grid, letters A–E, each once per row and column
- Exactly one marked cell
- Naked single (Technique A)
- Pair elimination on a line missing exactly two letters (Technique B)
- Prerequisite placements before the target
- Deduction depth 1–7

**REVIEW REQUIRED.**

- Deduction depth 6–7 — beyond that the chain stops being holdable without notes,
  which the exam forbids
- Clue density below 0.20

**FORBIDDEN.**

- Hidden singles — a letter with one possible cell in a line missing three or
  more. Not demonstrated anywhere in the official material
- Any path requiring a guess or trial and error
- Grids where more than one letter completes the target
- Invalid row or column structure
- Any claim that an item *requires* Technique B (§4.2)

---

## 10. Batch acceptance criteria

Every batch is checked against these before it is committed. They are the
standing bar; a batch that misses one is not shipped with a note, it is fixed.

| Criterion | Gate |
|---|---|
| **Content fidelity** | 100% of mechanics ALLOWED, or REVIEW with sign-off. Zero FORBIDDEN, enforced structurally. |
| **Correctness** | 100% independently verified. ME exhaustive over 1..20; LS exhaustive completion at the target plus strict path replay; FS rule-space inversion. |
| **Validity** | Official invariants hold in every panel the candidate sees, distractors included. |
| **Uniqueness** | 0 exact duplicates; ≤2 items per structural fingerprint across the whole bank; symmetry-equivalent figure items collide. |
| **Difficulty** | Measured, never inherited. Symbol count and letter count must not be readable off the tier. |
| **Diversity** | Every ALLOWED mechanic represented; no family above its cap. |
| **Explanations** | Re-derived and compared; every claim true of *that* item. |
| **Hints** | Three levels, no answer value or letter, and no level-2 hint one step from the answer. |
| **Walkthroughs** | Independently reflect the solution; no technique claimed that the item does not need. |
| **Reproducibility** | Same coordinates → identical output; per-item seed recorded; **existing items byte-identical after the batch**. |
