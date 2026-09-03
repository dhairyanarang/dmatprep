# Phase 3 — Generation Fidelity & Scalability Audit

**Scope:** can the current Module A generation architecture produce +100 original
questions per section (145 / 145 / 145) that are faithful to the documented dMAT?

**Method:** repository read; official source re-fetched and re-extracted; independent
probes written against the committed bank and against a 435-item dry run. Nothing was
written to `content/sections/*/questions.json`. No new mechanics were introduced.

**Official source re-verified live for this audit** (rule zero). The PDF at
`www.d-mat.de/wp-content/uploads/2026/08/260804_dMAT_General-Academic-Module_Preparatoy-Materials_EN.pdf`
is still the current build (04.08.2026) and is still linked from the India page. Note
the bare host `d-mat.de` now serves an **expired certificate**; use `www.d-mat.de`.
The document is **58 pages**, not the ~34 implied by the page references in the spec —
the Latin Squares exercises and solutions sit on pp. 27–33.

---

## 1. Executive verdict

> ## NOT READY

Not because the factory is unsound — the correctness machinery is genuinely good, and
better than most of what this kind of pipeline usually ships with. It is NOT READY
because three things are true at once, and each is on your own automatic-CRITICAL list:

1. **Two published Figure Sequence items are genuinely ambiguous**, and each offers a
   distractor that is a defensible correct answer under the official rules. Both
   validators pass them, because Figure Sequences validation is circular in exactly the
   way §11 of your brief warned about.
2. **The Figure Sequences difficulty model is miscalibrated against the official
   material**, and I verified this visually, not by inference. Official Exercise 4
   (medium) has 3 symbols; Exercises 5 and 6 (high) have **4**. The spec records 2/3/3
   and turns that into a hard cap of three symbols enforced in both the generator and
   `verify-bank`. Our "high" tier is built at the official *medium* level.
3. **Scaling the bank with the current runner destroys it.** Enlarging the quotas
   mutates 34/45 Figure Sequence, 36/45 Mathematical Equation and 40/45 Latin Square
   items **under their existing IDs**. Progress history, exposure tracking and any human
   review keyed to those IDs would silently decay.

The fix list is bounded and mostly small — five required changes, none of which is a
redesign. The one genuine capacity finding is that the **Figure Sequences low tier is
inherently small** (26 distinct reasoning tasks exist; the current ratio wants 38), so
the tier mix has to change rather than the tier definition.

**What the audit did *not* find**, and this matters: no invented mechanics, no wrong
answers, no non-unique equation systems, no invalid Latin squares, no answer leakage of
the kind `verify-bank` screens for. The bank is not padded with aptitude-test folklore.
The dominant fidelity problem is the opposite of the one you were guarding against —
**the generator under-reaches the official material, it does not over-reach it.**

---

## 2. Official dMAT fidelity assessment

The repo's transcription of the official rules is **accurate**. I re-extracted the PDF
and compared verbatim: the Figure Sequences rule list (pp. 7–8), the Mathematical
Equations constraints (p. 17) and the Latin Squares instructions (p. 24) all match
`CLAUDE.md` and the authoring spec word for word. The six ME exercises and their
published answers match. The Latin Squares pair-elimination quotes in spec §4.2 are
real and correctly transcribed from pp. 29–32 — I initially could not find them and was
wrong; they exist.

So the *sourcing discipline* is working. The problems are in the layer above it: two
inferences drawn from the source are wrong, and several documented structures are
recorded in the spec but never reach the generator.

| | Verdict |
|---|---|
| **Format fidelity** | Strong. 4×4 grid, four shown matrices, 5th and 6th predicted, three options each; 5×5 A–E with one marked cell; systems of equations over integers 1–20. All correct. |
| **Mechanic fidelity** | Strong on what it generates — every mechanic traces to the source. Weak on **coverage**: 4 of 5 official equation shapes and the official 4-symbol figure items are never produced. |
| **Cognitive fidelity** | Mixed. ME and LS ask for the documented reasoning. FS asks for a *narrower* version of it. |
| **Difficulty fidelity** | **Fails for Figure Sequences.** Difficulty is manufactured by symbol count in lockstep (low=1, medium=2, high=3, 100% of items), which is the one thing spec §2.3 tells you not to do — and the ceiling is set one symbol below the official high exercises. |

---

## 3. Figure Sequences audit

### 3.1 Mechanic-by-mechanic

Every mechanic checked against the re-extracted source. Nothing unsupported is generated.

| Mechanic | Generated? | Official? | Evidence |
|---|---|---|---|
| 4×4 grid | yes | documented (visual) | confirmed visually, pp. 10–12 |
| Four matrices shown; predict 5th and 6th | yes | documented | p. 7; solution keys pp. 13–16 |
| Three options per image, two selections | yes | documented | pp. 10–12 |
| Vertical / horizontal movement, 1 field | yes | documented | Ex 1, 4, 5, 6 |
| Diagonal movement, 1 field | yes | documented | Ex 2, 4, 5, 6 |
| Diagonal mover may not switch movement type | enforced | documented | p. 7 |
| Bounce = **full reversal** along the same path | yes | documented | Ex 2: "returns to the starting position in the same way" |
| Second bounce off the opposite wall | yes | documented | Ex 2, 5, 6 |
| Border travel, clockwise / counter-clockwise | yes | documented | Ex 3, 5, 6 |
| Border travel at 1 or 2 fields | yes | documented | Ex 3 "two squares at a time"; Ex 6 |
| Border travel at x+1 | yes | documented | Ex 5 |
| Repeating direction cycle (4-step closed loop) | yes | documented | p. 7 "one field clockwise within the four middle fields"; Ex 4 "left, up, right, down"; Ex 5 "down, right, up, left" |
| Rotation 90°, left and right | yes | documented | Ex 3, 4, 5, 6 |
| Rotation at x+1 | yes | documented | Ex 6 |
| Colour cycle, 2 colours | yes | documented | Ex 3 black/pink; Ex 5 orange/black |
| Colour cycle, 3 colours | yes | documented | Ex 5 white→pink→yellow; Ex 6 yellow→green→orange |
| Colour cycle at x+1 | yes, labelled | **reasonable extrapolation** | p. 8 names colour in the x+1 rule; no exercise demonstrates it. Correctly labelled in `meta.dmatAlignment`. |
| Cannot disappear / overlap / leave the matrix | enforced | documented | p. 8 |
| **Wrap-around / teleportation** | **never** | — | correctly absent. `border` uses modular arithmetic on the perimeter ring, which is travel *along* the boundary, not wrap-around. |
| **Billiard reflection at a wall** | **only as a distractor** | correctly rejected | the `boundary` error family exists precisely to punish this misreading |
| **4 symbols** | **never — capped at 3** | **documented, and we forbid it** | Ex 5 and Ex 6 both have 4 |
| Linear/diagonal at 2 fields/step | not as answers; **yes in 30/180 distractors** | not attested | see 3.4 |
| Static (non-moving) symbol | never | possibly documented | Ex 3 and Ex 6 each contain a "The symbol … rotates 90°…" clause with no movement. Ambiguous from text; the spec reads it as a second clause on another symbol. **Leave as REVIEW.** |
| `white` in a colour cycle | never (excluded for rendering) | documented | Ex 5 uses white→pink→yellow |
| Rotating shapes beyond triangle/arrow | never | documented | Ex 5/6 rotate crescents and corner-shapes |

### 3.2 CRITICAL — the four shown matrices do not always determine the answer

I enumerated the space of officially-legal rules and asked, for each symbol, how many
distinct 5th matrices are consistent with the four matrices the candidate is shown.

| | committed bank (45) | dry run (145) |
|---|---|---|
| items admitting more than one legal continuation | **7 (15.6%)** | 24 (17%) |
| items where a **distractor is itself a legal continuation** | **2** | 8 (6%) |

There is exactly **one cause**, in every case: **border travel and linear movement are
indistinguishable while a symbol runs along one edge without turning a corner.**

Concretely, `fs-medium-007`: a triangle occupies R4C4 → R3C4 → R2C4 → R1C4. The bank's
rule is border travel counter-clockwise. But "moves vertically up column 4, bouncing off
the boundary" fits all four matrices equally well and is equally official. The two rules
diverge exactly at the 5th matrix — and the panel the linear reading produces **is
offered as option `matrix3`**, marked wrong, with this note:

> "The triangle is travelling the wrong way round. Its direction is set in the first two
> matrices and never changes."

That note is false. The candidate reasoned correctly and is told they did not.
`fs-high-004` is the same defect with a hexagon.

**Why both validators miss it:** `verify-bank` re-simulates the *stored rule* and checks
the marked panel matches. It can only ever catch a rule/panel mismatch. It never asks
whether the shown panels *imply* that rule. That is the circular validation your brief
asked about, and Figure Sequences is the only section where it bites.

**The fix is cheap and precise.** A structural predicate catches it without any solver:

> Reject any item in which a symbol's four shown cells all lie on the perimeter **and**
> its heading never changes across those three transitions.

Cost measured: 4 of 34 border symbols and 3 linear symbols in the committed bank; 25
symbols across the 145-item dry run. Ten to fifteen percent of candidates rejected, and
30 of 34 border symbols already round a corner in the shown window and are unaffected.

### 3.3 CRITICAL — difficulty is miscalibrated against the official exercises

Spec §2.2's calibration table is wrong. I verified by rendering the exercise pages.

| Exercise | Difficulty | Spec says | **Actually (verified visually)** |
|---|---|---|---|
| 1 | low | 1 | 1 ✓ |
| 2 | low | 1 | 1 ✓ |
| 3 | medium | 2 | 2 (or 3) |
| 4 | medium | 2 | **3** — white hexagon, pink square, green triangle |
| 5 | high | 3 | **4** — orange arc, corner-shape, hexagon, yellow triangle |
| 6 | high | 3 | **4** — orange arrow, corner-shape, diamond-cross, triangle |

From that error the spec derives "**Never exceed 3 symbols** … exceed anything the
official materials show", which the generator enforces and `verify-bank` hard-errors on
(`"${symbolCount} symbols; the official exercises never exceed 3"`). The official
materials show four.

Consequences, measured on the committed bank:

- Symbol count is **100% determined by tier** — low=1 (12/12), medium=2 (18/18),
  high=3 (15/15). Symbol count is exactly the lever spec §2.3 forbids using, and it is
  the *only* lever actually varying between tiers.
- x+1 appears in **15/15 high and 0/30 low+medium**. Spec §2.2 explicitly says x+1 is a
  calibration signal, "**not** a documented rule", and that a high item without it is
  legitimate. In practice the correlation is total, so the tier is guessable.
- Our high tier (3 symbols) sits at the official **medium** level. A candidate who
  masters our high tier has not seen anything as dense as official Ex 5 or Ex 6.

### 3.4 Other findings

- **MEDIUM — unattested mechanic shown in distractors.** 30 of 180 committed distractors
  (17%) show a linear or diagonal symbol moving **2 fields in one step**, a step size the
  spec correctly records as not attested. As a wrong answer this is defensible, but it
  teaches a false prior about what the exam displays. Prefer perturbing direction,
  rotation or colour where those are available.
- **LOW — `position` distractors outnumber `acceleration`.** In the dry run the
  last-resort arbitrary nudge fires 31 times vs 26 for `acceleration`. 5% of distractors
  encode no nameable error.
- **LOW — documented colours and shapes never appear.** `white` is excluded from cycles
  for rendering reasons though Ex 5 uses it; rotation is limited to triangle and arrow
  though the official items rotate crescents and corner-shapes. Both are reasonable
  product decisions; both narrow the visual vocabulary against the real thing.

---

## 4. Mathematical Equations audit

**This section's correctness machinery is the strongest of the three and needs no
correctness work.** Uniqueness is proven by exhaustive search over the documented 1–20
domain for every item, and `verify-bank` re-parses the rendered equation strings rather
than trusting the in-memory AST — so a rendering bug cannot hide behind a correct
internal state. The solver reproduces all six official worked exercises as a regression
gate before it is trusted on our own items. Nothing here is circular.

Measured: **0 systems without a unique solution** in 145 dry-run items; 0 in the
committed 45. No quadratics, no polynomials, no operators beyond `+ − × ÷`, no negative
or fractional values, no letter outside 1–20. The over-reach you were guarding against
is simply not present.

### 4.1 HIGH — four of five official equation shapes are never generated

The problem is coverage, not correctness. Across all 190 items I examined (committed +
dry run):

| Official shape | Source | Generated? |
|---|---|---|
| `A + C = 8` — two unknowns summing to a constant | Ex 3 | **never** |
| `2 × A + 2 × C = B` — two multiplicative terms | Ex 3 | **never** |
| `3 × C − 1 = B` — coefficient plus offset | Ex 6 | **never** |
| `B = 6` — bare pin | official Example 1 | **never** |
| `A − B + C − D = 2` — alternating combine | Ex 5, 6 | yes (27 instances) |

And the **topology is always a chain**: 0 star-topology systems out of 127 multi-variable
systems. `buildSystem` defines each letter strictly from its immediate predecessor.
But official Ex 5 (`10 × B = C`, `5 × B = A`, `11 + B = D`) is a pure star — three
letters all defined from B — and Ex 6 is a star on C. Our combining equation always
spans every letter; Ex 6's spans three of four (`C + D − A = 1`, with B a leaf).

A candidate drilled exclusively on this bank would meet **none** of the structures in
official Exercises 3, 5 or 6. This is the single largest fidelity gap in the project,
and it is invisible to every existing check because the checks test correctness, not
coverage.

### 4.2 HIGH — variable count is locked to difficulty

low=2 vars (15/15), medium=3 (15/15), high=4 (15/15). Spec §3.2 opens by insisting
"difficulty is reasoning depth, not variable count" and then `SHAPES` hard-codes the
correlation. Further, **all 15 low items ask for the root letter at depth 1** — one
template, fifteen times. The equation-skeleton clustering at 145 confirms it: 9 items
share `A ÷ # = # ; A ÷ # = B`, 7 share `# × A = # ; # × A = B`. That is number
substitution, not question design.

### 4.3 MEDIUM — distractor notes that name an operation the item does not contain

The `inverted-operation` family always offers double or half the answer, with the note
"…which is what you get if you multiply where the equation divides." It is pushed for
every item regardless of whether the system contains a division.

| | false notes | rate |
|---|---|---|
| committed (135 distractors) | **8** | 6% |
| dry run (435 distractors) | **53** | **12%** |

The rate roughly doubles at scale. Gate the family on the operator actually being present.

### 4.4 MEDIUM — hint level 2 gives the answer away in the entire low tier

`verify-bank` correctly rejects a hint containing the answer *numeral*. It cannot catch
a hint that hands over a one-step equation. All 15 low items do exactly this:

> `me-low-001` (A = 9) — level 2: *"Look at A ÷ 3 = 3."*
> `me-low-002` (A = 5) — level 2: *"Look at 3 × A = 15."*

The three-level ladder collapses to two for the whole tier. The generator is following
spec §8 ("level 2: quote the starting equation"); the spec needs the extra condition —
do not quote it when the starting equation is also the finishing equation.

### 4.5 MEDIUM — the dedup key misses reordered systems

`generateMathEquations` fingerprints on `q.equations.join(' | ')`, but `buildSystem`
**shuffles** the equations before rendering. The same system in a different display
order is a different fingerprint. At 45 items this costs nothing; at 145 it produced
**2 exact duplicate systems**. Sort before hashing.

### 4.6 Distractor distribution

| family | dry run (435) | share |
|---|---|---|
| misapplied-constant | 146 | 34% |
| inverted-operation | 104 | 24% |
| wrong-variable | 103 | 24% |
| stopped-early | 47 | 11% |
| off-by-one | 35 | **8%** |

The spec's off-by-one intervention **worked** — down from the 42.5% it records to 8%.
But `misapplied-constant` has quietly taken the vacated slot at 34%, and it is the family
whose note is most often wrong (4.3). Good news: **0 of 435 distractor values are
readable as more than one error family** — the conflict filter in `buildDistractors` is
doing its job exactly as specified.

---

## 5. Latin Squares audit

Correctness is **strong**. `viableTargetLetters` tries every candidate letter at the
target and searches the rest of the square exhaustively, accepting only a single
survivor. That is a real uniqueness proof, independent of the deduction path. 0 failures
across 45 committed and 145 dry-run items. Grid validity, letter set, target emptiness
and the A–E response row are all enforced. No invalid squares.

### 5.1 HIGH — no item requires Technique B, but 55% are presented as if they do

| | committed (45) | dry run (145) |
|---|---|---|
| labelled / presented as pair-elimination | 25 (55%) | 81 (56%) |
| **solvable by naked singles alone** | **45 / 45** | **145 / 145** |
| genuinely requiring Technique B | **0** | **0** |
| A-only route needing more rounds than the stored depth | 0 | 0 |

This is not a generator bug — it is **mathematically unavoidable**, and the spec asks for
something impossible. `pairEliminations` fires only on a line missing exactly two letters
across exactly two empty cells. In that configuration, if letter L fits only one of the
two cells, the *other* cell has exactly one remaining candidate — it **is** a naked
single. Technique B over a 2-missing line is always the logical dual of a naked single
at the partner cell.

And the official Technique B examples have precisely this structure:

> "In column β, C and D are missing. C is already in row 4, so D must be inserted in β4.
> Consequently, C must be inserted in the place of the question mark." — Solution Ex 1

So the official material never claims B solves anything A cannot. It presents the same
deduction from the other end. Spec §4.2's requirement — "construct items that genuinely
**require** Technique B — items where no naked single is available at the point where the
candidate is stuck" — **cannot be satisfied** for this class of line, and the generator
silently does not satisfy it.

The consequence is a **truthfulness problem in the teaching copy**, not a correctness
one. 25 committed items tell the candidate:

> *"Nothing is forced at R3C2 yet. The way in is a line that is missing only two
> letters…"*

when a naked single was available all along.

**Recommended resolution:** correct the spec to say what is true — B is a faster *search
heuristic* over the same logic, and four of six official paths lead with it because it is
often quicker to spot, not because it is more powerful. Keep generating and labelling
both. Reword the walkthrough from "the way in" to "a quicker way in". **Do not** reach
for hidden singles (a letter with one possible cell in a line missing 3+) to manufacture
a genuine requirement: that technique is **not demonstrated anywhere in the official
material**, and adding it would be exactly the unsupported-mechanic drift this audit
exists to prevent.

### 5.2 MEDIUM — `verify-bank`'s pair-elimination replay is weaker than the library's

`verifyLatinSquare` checks only that the letter *fits* the cell:

```js
if (step.technique === 'pair-elimination') {
  if (!cands.includes(step.letter)) { errors.push(...) }   // fits — not forced
}
```

Meanwhile `replayPath` in `scripts/lib/latin.mjs` does the strict check (re-derives the
pair elimination and confirms the step was forced) — and is never called by
`verify-bank`. A non-forced intermediate placement that happens to lead to the right
target would pass. The final target check and the uniqueness gate limit the blast radius,
but the strict function already exists; wire it in.

### 5.3 MEDIUM — structural diversity is the thinnest of the three sections

Only **37% distinct** signatures on (tier, depth, given-count, techniques) at 145 items,
with a largest cluster of 10 items sharing `high | depth 5 | 8 givens |
naked-single+pair-elimination`. Depth is locked to tier by the bands, given-count varies
over a narrow window, and the technique flag is binary — so the signature space is small
by construction. Add `targetDistance` (spec §4.3 defines it and the generator computes it
for `generationNotes` but never constrains on it) as a fourth spread dimension.

### 5.4 Distractors

**Structurally sound and the strongest of the three.** The four wrong letters are the
four that genuinely clash; each note names the exact clashing cell; `verify-bank`
independently confirms the cited cell holds that letter in the completed square, and
enforces the "only becomes visible" caveat exactly when the cited cell is not a given.
These are realistic row/column deduction errors by construction. No change needed.

---

## 6. Existing 135-question bank audit

`npm run verify:bank` → 135 checked, 0 failed. `node scripts/audit-bank.mjs` → 0
technical failures, 0 warnings across all three sections. Everything below is what those
harnesses do not look at.

| Severity | Finding | Count |
|---|---|---|
| **CRITICAL** | FS items offering a distractor that is a legal continuation | **2** (`fs-medium-007`, `fs-high-004`) |
| **CRITICAL** | FS items admitting more than one legal 5th matrix | **7** (15.6%) |
| **CRITICAL** | FS high tier built one symbol below the official high exercises | 15 (all) |
| **HIGH** | LS items presented as requiring Technique B that do not | **25** (55%) |
| **HIGH** | ME items where variable count is the only difficulty lever | 45 (all) |
| **HIGH** | ME low items answered in one step from the root letter | 15 (all) |
| **MEDIUM** | ME `inverted-operation` notes naming an absent operator | **8** (6%) |
| **MEDIUM** | ME low items whose level-2 hint is one step from the answer | **15** (all low) |
| **MEDIUM** | FS distractors displaying an unattested 2-field linear step | **30** (17%) |
| **LOW** | FS distractors encoding no nameable error (`position`) | ~8 |

**"Technically valid but not useful preparation"** — the category you flagged as most
important:

1. **All 15 ME low items.** Identical shape: pin the root, ask for the root. The hint
   ladder collapses. They drill arithmetic, not the search that the subtest actually
   tests.
2. **The 15 FS high items**, as calibration. They are correct and well-built, but they
   train at official-medium density while being labelled high — which will produce
   misplaced confidence going into the real thing.
3. **The 25 pair-elimination LS items**, as pedagogy. The questions are fine; the
   teaching copy around them asserts a necessity that does not exist.

No answer leakage, no accidental ambiguity in ME or LS, no duplicate options, no
accidentally-correct distractors, and every explanation re-derives the answer it claims.

---

## 7. Generator scalability audit

All three generators reach 145 items in under a second. Raw count is not the constraint —
**structural diversity is**.

| Section | items | distinct structural signatures | largest cluster | exact dupes |
|---|---|---|---|---|
| Figure Sequences | 145 | 128 / 145 (88%) on full rule signature; 72 (50%) on family signature | 4 | 0 |
| Mathematical Equations | 145 | 80 / 145 (55%) on equation skeleton | **9** | **2** |
| Latin Squares | 145 | 53 / 145 (37%) | **10** | 0 |

### 7.1 The one hard capacity limit: the FS low tier

I enumerated the low tier exhaustively — 1 symbol, movement only, no rotation, no
colour, `peakLoad ≤ 2`, which is faithful to official Ex 1 and Ex 2.

- 178 legal (movement, start-cell) configurations
- 150 distinct six-panel tracks
- **26 genuinely distinct reasoning tasks** after reducing by the 8 symmetries of the
  square (a symbol running up column 1 and one running down column 4 are the same task)

Shape and colour are cosmetic multipliers, not diversity. The current 12:18:15 ratio
scaled to 145 asks for **38 low items from 26 available structures** — 1.5× reuse, i.e.
structural duplication by construction.

**This is a tier-mix problem, not a tier-definition problem. Do not loosen the low tier
to hit a number.** The official material has exactly two low exercises out of six; a
33% low tier is already more generous than the source. Rebalance to roughly 20 low /
60 medium / 65 high and the constraint disappears.

### 7.2 Independent generation dimensions available

| Section | dimensions genuinely in play today | available but unused |
|---|---|---|
| FS | movement family (4), start cell, rotation on/off, colour cycle length (2–3), x+1 on movement/rotation/colour, symbol count (1–3) | **4th symbol** (documented), static rotator (review), rotation on more shapes, `white` in cycles, 180°/270° rotation |
| ME | variable count (2–4), pin vs combine, depth (1–4), operator mix, asked-letter position | **star topology**, two-unknown constants, compound terms, subset combining equations, bare pins, depth ≥3 at 2–3 variables |
| LS | depth (1–7), clue density, technique flag, target position | **`targetDistance`** (computed, never constrained), target on/off the main diagonal, given-pattern shape |

Every "unused" entry in the middle column is either officially documented or already
computed. **There is more legitimate headroom in unused documented structure than the
+100 per section requires** — for ME and LS certainly, and for FS in the medium and high
tiers.

### 7.3 The FS diversity guard weakens as counts grow

```js
const cap = Math.max(2, Math.ceil(count / 3))
```

At count=12 the cap is 4. At count=58 it becomes 20 — one third of the tier may share a
single pattern signature. The guard should be an absolute cap, not a proportional one.

---

## 8. Difficulty audit

| Section | What actually makes an item harder | Measured? | Reliable? |
|---|---|---|---|
| Figure Sequences | **symbol count**, in lockstep with tier (100%), plus x+1 in high (100%) | measured then re-checked, but the tier gates require the symbol count | **No** — see §3.3 |
| Mathematical Equations | substitution depth to the asked letter, measured by replaying propagation and rejecting on mismatch | **yes, properly** | Yes, within the tier — but depth is confounded with variable count (100%) |
| Latin Squares | forced-placement depth via constraint propagation, banded 1–2 / 3–4 / 5–7, with clue density checked | **yes, properly** | Yes |

The measurement machinery is real in all three — `buildQuestion` re-measures and returns
`null` when the measurement disagrees with the intended label. That part is well built and
should not be touched. The problem is that in FS and ME the *generation plan* varies only
one parameter per tier, so the measurement can only ever confirm what the plan built.

**Proposed correction — no new machinery, just decoupling:**

- **FS**: keep `peakLoad` as the tier gate; make symbol count a *free* parameter within a
  tier (low 1; medium 2–3; high 3–4). Require `peakLoad ≥ 4` for high independently of
  count, so a 3-symbol high item must carry a genuinely deeper compound rule. Drop x+1
  from ~100% to ~70% of high, which is what spec §2.2 already says.
- **ME**: allow depth ≥ 3 at 2 and 3 variables (reachable today via star topology and
  two-unknown constants), and 4-variable items at depth 1–2. Then variable count and
  depth vary independently and the label means what it says.
- **LS**: already sound. Add `targetDistance` as a band constraint to widen the signature.

---

## 9. Distractor audit

**Figure Sequences** — you asked specifically whether one error type dominates. It does
not: movement errors total 52% but split across two families, and no single family
exceeds 27%.

| family | dry run (580) | share |
|---|---|---|
| movement-direction | 154 | 27% |
| movement-step | 148 | 26% |
| rotation | 101 | 17% |
| colour | 81 | 14% |
| boundary | 39 | 7% |
| position (last resort) | 31 | 5% |
| acceleration | 26 | 4% |

Healthy. Two caveats: `boundary` and `acceleration` are thin because they require a
diagonal mover and an accelerating rule respectively; and `position` — which encodes no
nameable error — outnumbers `acceleration`.

**Mathematical Equations** — see §4.6. Numerical error patterns are **not** overused:
off-by-one is at 8% (down from 42.5%), and 0 of 435 values are readable as two error
families. `misapplied-constant` at 34% is the new concentration, and its note is wrong
12% of the time at scale.

**Latin Squares** — realistic row/column deduction errors by construction, each citing a
verified clashing cell. No change needed. Best of the three.

Across all three sections: no answer collisions, no duplicate options, no accidentally
correct options, and every wrong option carries a note (enforced).

---

## 10. Solver / validation audit

| Section | Independent? | Exhaustive? | Assessment |
|---|---|---|---|
| Mathematical Equations | **Yes** — `verify-bank` re-parses the rendered strings and re-solves from scratch | **Yes** — full search over 1..20 | **Genuinely independent.** Gated on reproducing all 6 official exercises first. |
| Latin Squares | **Yes** — `viableTargetLetters` tries every letter and completes the square by backtracking | **Yes** at the target | **Genuinely independent** for the answer. Path replay is weaker than it should be (§5.2). |
| Figure Sequences | **No** | n/a | **Circular.** Re-simulates the *stored rules* and confirms the marked panel matches. Never asks whether the shown panels imply those rules — which is the actual question the candidate faces. |

The FS gap is the root cause of §3.2, and it is the one architectural change worth making.
Two options, in increasing cost:

1. **Structural predicate** (cheap, catches 100% of observed cases): reject a symbol whose
   four shown cells are all on the perimeter with an unchanging heading. Implement now.
2. **Rule-space inversion** (thorough): at generation time, enumerate legal rules
   consistent with panels 0–3 and require exactly one distinct (panel4, panel5) pair. My
   probe does this in ~2s for 145 items, so it is affordable as a generation-time gate and
   as a `verify-bank` check. Implement for the +100 batch.

Option 2 turns FS validation from "the stored rules produce the marked panel" into "the
shown panels admit exactly one continuation", which is the property the item actually
needs.

---

## 11. Determinism / reproducibility audit

| Property | Result |
|---|---|
| same seed + same config → identical output | ✅ **PASS**, all three sections, byte-identical |
| committed bank reproducible from `SEED = 20260926` | ✅ **PASS**, all three hash-match the files on disk |
| different seed → meaningful variation | ✅ **PASS**, 0/45 items repeat at the same index |
| failed generation cannot enter the bank | ✅ **PASS** — `buildQuestion` returns `null` on any invariant failure and the runner throws rather than under-delivering |
| **adding a batch does not mutate existing questions** | ❌ **FAIL — CRITICAL** |
| per-item metadata sufficient to reproduce it | ❌ **FAIL** |

**The additivity failure, measured.** Increasing each tier's quota by 5 and regenerating:

| section | byte-identical | **mutated under the same ID** | ID vanished |
|---|---|---|---|
| figure-sequences | 11 / 45 | **34** | 0 |
| mathematical-equations | 9 / 45 | **36** | 0 |
| latin-squares | 5 / 45 | **40** | 0 |

`fs-low-003` after the expansion is a **different question** wearing the same ID. Cause:
one RNG stream per section consumed by rejection sampling, so any quota change shifts the
entire stream; and IDs are positional (`fs-low-001` = first accepted low item).

Per `CLAUDE.md`, attempts are immutable and question exposure is tracked per ID per
context. Mutating an ID's content silently corrupts both. **Generating +100 with the
current runner would invalidate every attempt record and every review decision attached
to the existing 135.**

**Fix (required before any generation):**

- Derive a per-item seed — `hash(section, tier, batchId, index)` — so each item's stream
  is independent of every other item's.
- Make IDs batch-scoped (`fs-low-b2-001`) or content-addressed.
- Make the runner **append-only**: a `--batch` mode that reads the existing bank, keeps it
  verbatim, and adds new items.
- Record `{ seed, batchId, generatorVersion, config }` on `GeneratorStamp` so any single
  item can be regenerated and diffed in isolation. Today the stamp carries only
  `{ name, version, verifiedAt }`.

Separately: spec §6 requires a written `generation_plan` before every batch. **No
`generation_plan` artifact exists in the repository.** The three batches that produced the
current bank left no record of their intent.

---

## 12. Structural uniqueness audit

Current dedup keys are structural, not textual — better than ID or text matching, but each
has a gap:

| Section | key | gap |
|---|---|---|
| FS | `JSON.stringify([given, rules])` | catches exact repeats only; positional variants of one structure pass freely |
| ME | `equations.join(' | ')` | **equations are shuffled before rendering**, so reordered duplicates pass → 2 exact dupes at 145 |
| LS | `JSON.stringify([grid, target])` | catches exact repeats only |

Applying the four-tier classification to the 145-item dry runs:

| | FS | ME | LS |
|---|---|---|---|
| **exact duplicate** | 0 | **2** | 0 |
| **near duplicate** (same skeleton, numbers/positions differ) | 17 | **65** | 92 |
| **structural duplicate** (same family signature) | 73 | 89 | 92 |
| **legitimate variation** | 128 (88%) | 80 (55%) | 53 (37%) |

**Recommended fingerprints for the +100 batch** — hash these, cap reuse at 2–3 per bank:

- **FS**: `tier | sorted(movement family + step class per symbol) | rotation count |
  colour-cycle lengths | acceleration site | bounce present` — plus the symmetry-canonical
  track, so mirrored items collide.
- **ME**: `tier | sorted(equation skeletons with numerals blanked) | topology (chain/star/
  combine) | depth | asked-letter position`. **Sort before hashing.**
- **LS**: `tier | depth | given-count band | technique set | targetDistance | target on/off
  diagonal`.

---

## 13. Official-fidelity matrix

Consolidated. Category 1 = officially documented; 2 = reasonable but not explicitly
documented; 3 = unsupported.

### Figure Sequences

| Mechanic | Generated | Category | Evidence | Keep? |
|---|---|---|---|---|
| 4×4 grid, 4 shown, predict 5th/6th, 3 options | yes | 1 | pp. 7, 10–16 | keep |
| Linear movement, 1 field, bounce | yes | 1 | Ex 1, 4, 6 | keep |
| Diagonal movement, 1 field, bounce as full reversal | yes | 1 | Ex 2, 5, 6 | keep |
| Border travel cw/ccw at 1, 2, or x+1 | yes | 1 | Ex 3, 5, 6 | keep |
| 4-step repeating direction cycle | yes | 1 | p. 7; Ex 4, 5 | keep |
| Rotation 90° cw/ccw | yes | 1 | Ex 3–6 | keep |
| Rotation at x+1 | yes | 1 | Ex 6 | keep |
| Colour cycle, 2 or 3 colours | yes | 1 | Ex 3, 5, 6 | keep |
| Movement at x+1 | yes | 1 | p. 8; Ex 5 | keep |
| **4 symbols** | **no** | **1** | **Ex 5, Ex 6 (verified visually)** | **ADD** |
| Colour cycle at x+1 | yes, labelled | 2 | p. 8 names colour; no exercise shows it | keep, keep the label |
| Static rotating symbol | no | 2 | ambiguous clause, Ex 3 / Ex 6 | **REVIEW** |
| `white` in a colour cycle | no | 1 | Ex 5 | optional |
| Linear/diagonal at 2+ fields (not x+1) | distractors only | **3** | every official instance is "one field at a time" | **remove from distractors** |
| Wrap-around / teleport / reflection-as-answer | no | 3 | contradicts p. 8 | keep forbidden |
| 5+ symbols | no | 3 | beyond anything shown | keep forbidden |

### Mathematical Equations

| Mechanic | Generated | Category | Evidence | Keep? |
|---|---|---|---|---|
| Integers 1–20, unique solution per letter | yes | 1 | p. 17 | keep |
| Operators `+ − × ÷` only | yes | 1 | p. 17, all exercises | keep |
| 2–4 letters | yes | 1 | Ex 1–6 | keep |
| Chain definitions (`k × A = B`) | yes | 1 | Ex 4 | keep |
| Alternating combining equation over all letters | yes | 1 | Ex 5 | keep |
| **Star topology** | **no** | **1** | **Ex 5, Ex 6** | **ADD** |
| **Two unknowns = constant (`A + C = 8`)** | **no** | **1** | **Ex 3** | **ADD** |
| **Compound term (`3 × C − 1 = B`)** | **no** | **1** | **Ex 6** | **ADD** |
| **Two multiplicative terms (`2×A + 2×C = B`)** | **no** | **1** | **Ex 3** | **ADD** |
| **Bare pin (`B = 6`)** | **no** | **1** | **Example 1** | **ADD** |
| Combining equation over a *subset* of letters | no | 1 | Ex 6 (`C + D − A = 1`) | **ADD** |
| Asking one letter with four options | yes | 2 | Ex Example 1 asks one letter; the 4-option format is not shown in prep material | keep, keep `unconfirmed` in the guide |
| Constants above 18 | yes (up to 40) | 2 | no official constant exceeds 18 | **REVIEW** — tighten |
| Quadratics, polynomials, other operators | no | 3 | — | keep forbidden |
| Zero, negatives, fractions as letter values | no | 3 | excluded by p. 17 | keep forbidden |

### Latin Squares

| Mechanic | Generated | Category | Evidence | Keep? |
|---|---|---|---|---|
| 5×5, A–E, once per row and column | yes | 1 | p. 24 | keep |
| Exactly one marked cell | yes | 1 | Examples 1–2 | keep |
| Naked single (Technique A) | yes | 1 | Example 1, Example 2, Ex 2, Ex 4 | keep |
| Line-based pair elimination on a 2-missing line (Technique B) | yes | 1 | Ex 1, 3, 4, 5 | keep — but stop claiming necessity |
| Prerequisite placements before the target | yes | 1 | p. 24 "fill in other fields in your mind"; Ex 3, 5 | keep |
| Deduction depth up to 7 | yes | 2 | Ex 5/6 show ~6 placements | keep |
| **Hidden single** (letter with one cell in a 3+-missing line) | no | **3** | **not demonstrated anywhere** | **keep forbidden** |
| Guessing / trial-and-error paths | no | 3 | all official paths are deductive | keep forbidden |

---

## 14. Allowed / review / forbidden contract

To be added to `DMAT_QUESTION_AUTHORING_SPEC.md` and enforced as a **generation-time
gate**, not a review convention — a generator must not be *able* to emit a FORBIDDEN
mechanic.

### ALLOWED — generate freely

- **FS**: linear/diagonal at 1 field with bounce-as-reversal; border travel cw/ccw at 1,
  2 or x+1; 4-step direction cycles; 90° rotation either way; 2- and 3-colour cycles;
  x+1 on movement or rotation; **1 to 4 symbols**.
- **ME**: integers 1–20; `+ − × ÷`; 2–4 letters; chain **and star** topologies; two-unknown
  constant equations; compound terms (`k × X ± c = Y`); multi-term multiplicative
  equations; combining equations over **all or a subset** of letters; bare pins.
- **LS**: 5×5 A–E; single marked cell; naked single; pair elimination on a 2-missing line;
  depth 1–7; prerequisite placements.

### REVIEW REQUIRED — human sign-off per batch, label `reasonable_extrapolation`

- **FS**: colour cycle at x+1; static rotating symbol; `white` in a cycle; rotation on
  shapes beyond triangle/arrow; 180°/270° rotation.
- **ME**: numeric constants above 18; the one-letter/four-option question format (already
  flagged `unconfirmed` in the guide — keep it there).
- **LS**: deduction depth 6–7; clue density below 0.20.

### FORBIDDEN — generator must be structurally incapable

- **FS**: wrap-around or teleportation; reflection-as-correct at a boundary; linear or
  diagonal movement at more than one field per step other than x+1 (**including in
  distractors**); symbols disappearing, overlapping or leaving the matrix; more than 4
  symbols; a mid-sequence switch from linear movement to border travel; **any item whose
  four shown matrices admit more than one legal continuation**.
- **ME**: operators beyond `+ − × ÷`; quadratics or higher powers; non-integer, zero or
  negative letter values; letters outside 1–20; systems with more than one solution.
- **LS**: hidden singles; any path requiring a guess; grids with more than one viable
  target letter; notes citing a cell that does not hold the letter.

---

## 15. Required changes

### CRITICAL — before generating anything

1. **Make FS generation append-only and item-seeded.** Per-item seeds, batch-scoped IDs,
   `--batch` append mode, and `{seed, batchId, generatorVersion, config}` on
   `GeneratorStamp`. Without this the +100 destroys the existing 135. *(§11)*
2. **Add the FS disambiguation gate.** Reject any symbol whose four shown cells are all on
   the perimeter with an unchanging heading. Then add the rule-space inversion check to
   `verify-bank`. *(§3.2, §10)*
3. **Retire or repair `fs-medium-007` and `fs-high-004`.** They are ambiguous, and their
   distractor notes tell a correct candidate they were wrong. *(§3.2)*
4. **Correct spec §2.2's symbol counts to 1/1/2/3/4/4 and raise the cap to 4 symbols**, in
   the spec, `figure-sequences.mjs` and `verify-bank.mjs`. Decouple symbol count from tier.
   *(§3.3)*

### HIGH — before bulk generation

5. **Add the four missing official ME equation shapes and star topology.** This is the
   largest fidelity gain available and it is pure coverage work. *(§4.1)*
6. **Decouple ME variable count from difficulty.** *(§4.2)*
7. **Fix the ME dedup key** — sort equations before hashing. *(§4.5)*
8. **Gate `inverted-operation` distractors** on the operator being present. *(§4.3)*
9. **Correct spec §4.2's Technique B claim** and reword the 25 affected LS walkthroughs
   from "the way in" to "a quicker way in". *(§5.1)*
10. **Rebalance the FS tier ratio** to roughly 20/60/65. *(§7.1)*
11. **Wire `replayPath` into `verify-bank`** for LS pair steps. *(§5.2)*
12. **Write the `generation_plan`** spec §6 has always required. *(§11)*

### MEDIUM

13. Suppress ME level-2 hints that quote a one-step equation; add the check to
    `verify-bank`. *(§4.4)*
14. Stop generating 2-field linear/diagonal distractors. *(§3.4)*
15. Make the FS diversity cap absolute rather than proportional. *(§7.3)*
16. Add `targetDistance` as an LS band constraint. *(§5.3)*
17. Adopt the §12 structural fingerprints as generation-time gates.

### LOW

18. Allow `white` in FS colour cycles behind a stroke.
19. Widen the rotatable shape set.
20. Reduce reliance on the `position` fallback distractor.
21. Tighten ME numeric constants toward the official ≤18.

---

## 16. Proposed distribution for the next +100 per section

Contingent on changes 1–12. Difficulty targets follow the official 2:2:2 exercise split,
adjusted for the low tier's real capacity.

### Figure Sequences +100 → 145

| Tier | now | add | total | Composition |
|---|---|---|---|---|
| low | 12 | **+8** | 20 | 1 symbol, movement only. **Capped by the 26 available structures** — 20 keeps reuse below 1× |
| medium | 18 | **+42** | 60 | 2–3 symbols, `peakLoad ≥ 3`; ≥40% at 3 symbols (the official Ex 4 standard) |
| high | 15 | **+50** | 65 | **3–4 symbols**, `peakLoad ≥ 4`; ~30 at 4 symbols; x+1 in ~70%, not 100% |

Movement mix per tier: linear ≤30%, diagonal ≥20%, border ≤30% (currently 37%),
direction-cycle ≥15%. Every item must pass the disambiguation gate.

### Mathematical Equations +100 → 145

| Tier | now | add | total | Composition |
|---|---|---|---|---|
| low | 15 | **+30** | 45 | depth 1; **2–3 variables** (not 2 only); ≤50% asking the root; ≥8 bare pins |
| medium | 15 | **+35** | 50 | depth 2; **2–4 variables**; ≥12 star topology; ≥10 two-unknown constants |
| high | 15 | **+35** | 50 | depth ≥3; **3–4 variables**; ≥15 combining (incl. ≥5 subset); ≥10 compound terms |

Across the batch: ≥55% multiplicative per tier (keep); every official shape from §13
represented at least 10 times; `misapplied-constant` capped at 25% of distractors.

### Latin Squares +100 → 145

| Tier | now | add | total | Composition |
|---|---|---|---|---|
| low | 15 | **+30** | 45 | depth 1–2, density 0.30–0.60; ≥12 at depth 1 (currently 5 of 15) |
| medium | 15 | **+35** | 50 | depth 3–4, density 0.20–0.50; ≥15 with `targetDistance ≥ 1` (currently 4 of 15) |
| high | 15 | **+35** | 50 | depth 5–7, density 0.20–0.45; ≤15 at depth 7; ≥20 with `targetDistance ≥ 3` |

Technique split ~60/40 A-led / B-led per tier, presented as a search heuristic.

**Total: 435 items.** All three sections can reach these numbers within documented
mechanics — the FS low tier is the only place where the target had to be reduced to
respect real capacity, and I have set it at 20 rather than 38 for that reason.

### Acceptance criteria for the batch

| Criterion | Gate |
|---|---|
| **Content fidelity** | 100% of mechanics in ALLOWED, or in REVIEW with `reasonable_extrapolation` and sign-off. Zero FORBIDDEN, enforced structurally. |
| **Correctness** | 100% independently verified. ME exhaustive over 1–20; LS exhaustive completion at the target; **FS exactly one legal continuation from the shown panels**. |
| **Validity** | 100% valid task structures; official invariants hold in every panel the candidate sees, distractors included. |
| **Uniqueness** | 0 exact duplicates; 0 symmetry-equivalent FS items; ≤3 items per structural fingerprint (§12). |
| **Difficulty** | Measured, never inherited. Symbol count and variable count must **not** correlate above 0.8 with tier. |
| **Diversity** | Every ALLOWED mechanic represented; no family above its §16 cap. |
| **Explanations** | Re-derived and compared; every claim true of *that* item (no absent-operator notes). |
| **Hints** | 3 levels, no answer value or letter, **and no level-2 hint one step from the answer**. |
| **Walkthroughs** | Independently reflect the solution; no technique claimed that the item does not need. |
| **Reproducibility** | Same seed → identical output; per-item seed recorded; **existing items byte-identical after the batch**. |

---

## 17. Final go / no-go

**NO-GO on generation today. GO on the fix list.**

Sequence, as you framed it:

1. **Fix the factory** — CRITICAL 1–4 first (append-only runner, FS disambiguation gate,
   two bad items, symbol-count recalibration), then HIGH 5–12.
2. **Pilot** — 15 items per section under the new gates. Verify: existing 135 byte-identical
   afterwards; 0 ambiguous FS items; ≥1 four-symbol FS high item; ≥1 of each newly added ME
   shape; structural fingerprints inside cap.
3. **Then generate** the full +100 per section against §16.

The encouraging finding is that this is a coverage and calibration problem, not a
contamination one. Nothing in the bank came from an IQ-test template or a competitor
guide; the sourcing discipline held. What the audit found is a generator that has been
**more conservative than the official material**, plus one real ambiguity class and one
scaling defect. All of it is fixable without inventing a single mechanic.

---

*Audit performed 3 September 2026 against commit `3f4179b`. Official source re-fetched
and re-extracted the same day. No production question bank files were modified.*
