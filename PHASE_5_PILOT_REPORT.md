# Phase 5 — Pilot Batch b2 Report

**Scope:** 45 new questions (5 low / 5 medium / 5 high per section) as batch `b2`.
Nothing beyond the 45 was generated.

---

## 1. Pilot generation summary

| | |
|---|---|
| **batchId** | **`b2`** |
| Generator versions | figure-sequences 3.0.0, math-equations 3.0.0, latin-squares 3.0.0 |
| Bank before | 133 active (43 / 45 / 45), 2 retired |
| Bank after | **178 active** (58 / 60 / 60), 2 retired |
| Generated | 45 / 45 requested |
| Rejected by the verifier during generation | 0 |
| Rejected as structural duplicates during generation | 5 (Latin Squares) |
| Existing items mutated | **0** |

Attempts per accepted item ranged 0–39; the highest were `fs-high-b2-003` (36),
`fs-high-b2-005` (35) and `ls-medium-b2-004` (39) — rejection sampling working
against the gates, not a sign of strain.

A dry run of all three sections was run first and produced the same 45 items with
zero verifier rejections before anything was written.

## 2. Generation plan

Three plans, one per section, written against **measured** coverage
(`node scripts/audit-bank.mjs`, 3 September 2026) rather than from memory, and
validated by `scripts/lib/plan.mjs`:

- `content/question-authoring/plans/b2-figure-sequences.json`
- `content/question-authoring/plans/b2-mathematical-equations.json`
- `content/question-authoring/plans/b2-latin-squares.json`

Each records batchId, section, tier counts, generator version, current coverage
with its measurement note, overrepresented patterns, gaps being filled, the
allowed/review/forbidden mechanics, the difficulty model, distractor constraints,
structural-diversity constraints, the seed strategy and the expected
distribution. All three validate PASS.

## 3–4. Counts by section and tier

| Section | low | medium | high | total |
|---|---|---|---|---|
| figure-sequences | 5 | 5 | 5 | 15 |
| mathematical-equations | 5 | 5 | 5 | 15 |
| latin-squares | 5 | 5 | 5 | 15 |
| | | | | **45** |

Ids `fs-low-b2-001` … `ls-high-b2-005`. No id collides with an active or retired
id; `fs-medium-007` and `fs-high-004` remain reserved and absent from the bank.

## 5. Official mechanic coverage

**Figure Sequences** — all documented, nothing else:

| | |
|---|---|
| symbols by tier | low 1×5; medium 2×3, **3×2**; high 3×5 |
| peakLoad by tier | low pl1×2, pl2×3; medium pl3×5; high pl4×5 |
| x+1 by tier | low 0/5, medium 0/5, **high 2/5** |
| movement families | border 13, diagonal 7, direction-cycle 7, linear 5 |
| rotation used | 10/15 items |
| colour cycles | 2-colour ×13, 3-colour ×5 |
| accelerating colour cycles | **0** |
| >4 symbols | **0** |
| 2-field linear/diagonal | **0** |

Two three-symbol medium items — the official Ex 4 shape, absent from b1 — are the
clearest evidence the corrected calibration reached production.

**Mathematical Equations** — of the six structures added in Phase 4, **three**
appear: two-unknown constant `C + D = 8` (×3), compound `4 × D − 4 = A` (×6), and
**star topology** (×3, e.g. `me-high-b2-002`: `16 − A = B`, `2 + A = D`,
`6 + A = C` — the official Ex 5 shape). Bare pins, multi-term equations and
subset-spanning combining equations did not appear (see §15).

**Latin Squares** — 5×5 A–E throughout; naked single and pair elimination only;
depth 1–7; no hidden singles, no guessing.

## 6. Difficulty distribution

| Section | reasoning-depth spread |
|---|---|
| figure-sequences | d1×2, d2×3, d4×1, d5×1, d6×1, d7×4, d8×3 |
| mathematical-equations | d1×5, d2×5, d4×2, d5×1, d6×2 |
| latin-squares | d1×2, d2×3, d3×5, d5×2, d6×1, d7×2 |

Every measured difficulty matched its label — the generator re-measures and
rejects on mismatch, so a label can never be inherited from intent.

Letter count by tier (ME): low v2×3/v3×1/v4×1, medium v2×3/v3×1/v4×1, high v4×5.
Decoupling is real at low and medium; the high tier came out uniformly 4-letter in
this sample.

## 7. Structural diversity

| | FS | ME | LS |
|---|---|---|---|
| exact duplicates within the pilot | 0 | 0 | 0 |
| distinct structural fingerprints | **15/15** | 14/15 | 14/15 |
| distinct families | 14/15 | 11/15 | 8/15 |
| largest cluster within the pilot | 1 | 2 | 2 |
| largest cluster across the full bank | 2 (cap) | 3 | 3 |
| **pilot items in an over-cap cluster** | **0** | **0** | **0** |

Every cluster above the cap of 2 is legacy b1 only. No pilot item participates in
one, in any section.

## 8. Distractor distribution

**Figure Sequences** (60 distractors): movement-direction 15, colour 12,
movement-step 11, rotation 8, boundary 7, position 6, acceleration 1. No item has
fewer than two distinct families.

**Mathematical Equations** (45): misapplied-constant **17**, wrong-variable 12,
inverted-operation 8, stopped-early 5, off-by-one 3. Off-by-one is well controlled
at 7%; misapplied-constant at 38% is the concentration — and the source of the
main finding in §16.

**Latin Squares** (60): direct-clash 36, derived-clash 24. Structurally determined
and each note cites a verified clashing cell.

## 9. Figure Sequence ambiguity results

Re-checked independently of the generator, by inverting the documented rule space
over the four shown matrices of each item:

```
items failing the disambiguation gate              : 0 / 15
items where any symbol has >1 legal continuation   : 0 / 15
independent re-simulation mismatches               : 0
every shown panel-set implies exactly one continuation : true
```

The border-versus-linear ambiguity that produced the two retired b1 items did not
recur.

## 10. Mathematical Equation correctness results

```
items with any correctness issue                   : 0 / 15
total solutions across all 15 systems (exhaustive
  search over the full 1..20 domain)               : 15  (exactly one each)
distractor note structural issues                  : 0
quadratic terms / unsupported operators            : 0
values outside 1..20 / non-integer / zero / negative: 0
hints containing the answer                        : 0
```

## 11. Latin Square correctness and path results

```
items with any correctness issue                   : 0 / 15
targets admitting more than one letter             : 0
strict replayPath failures                         : 0
undocumented techniques                            : 0
distractor notes citing a cell that does not hold
  the named letter                                 : 0
labelled pair-elimination                          : 9 / 15
solvable by naked singles alone                    : 15 / 15  (expected)
walkthroughs claiming pair elimination is required : 0
targetDistance spread                              : dist0×10, dist1×1, dist2×3, dist3×1
```

## 12. Reproducibility results

```
a) re-running batch b2 reproduces the committed pilot   : IDENTICAL (all 3 sections)
b) each item rebuilds from its GeneratorStamp alone     : 15/15, 15/15, 15/15
c) future batch b3 (sizes 3, 15, 28) mutates the pilot  : 0 mutations (all 3 sections)
```

## 13. Existing-bank preservation

```
existing items mutated : 0
existing items removed : 0
new items added        : 45
prefix byte-identical  : figure-sequences 43→58 true
                         mathematical-equations 45→60 true
                         latin-squares 45→60 true
retired ids still reserved : fs-medium-007, fs-high-004
a retired id reappeared    : false
```

## 14. Test results

| | |
|---|---|
| `npm test` | **77 pass, 0 fail** |
| `npm run verify:bank` | **178 checked, 0 failed**, 44 warnings |
| `node scripts/audit-bank.mjs` | 0 technical failures in all three sections |
| `npm run lint` | clean |
| `npm run build` | compiles, 34/34 static routes |

## 15. Warnings

The 44 `verify-bank` warnings are **unchanged in count and identity** from before
the pilot — every one is on a legacy b1 item. **The pilot contributed zero
warnings.**

Coverage shortfalls against the plans, none of which is a validation failure:

- **No four-symbol Figure Sequence item** (plan expected 1–2 of 5). There are now
  none in the 58-item bank. The Phase 4 report predicted a ~10% yield; at 5 high
  items, zero is unsurprising but it means the headline capability of the
  corrected calibration is still unproven in production.
- **Three of six new ME structures unexercised**: bare pins, multi-term equations
  and subset-spanning combining equations did not appear.
- **ME high tier was uniformly 4-letter** (5/5), so depth/letter-count decoupling
  is demonstrated only at low and medium.
- **ME low tier still always asks the root letter** — the known Phase 4 residual.
  The surrounding systems do vary (2–4 letters, compound definitions), so this is
  much weaker than b1's single template, but it is not fixed.

## 16. Questions that should be rejected or retired

Found by reading the questions, not by the validators. **None is incorrect** —
every answer is right and uniquely determined — but each is poor preparation.

### HIGH — `misapplied-constant` notes are inaccurate (affects ~17 ME distractors)

Two distinct faults in the largest ME distractor family:

**(a) The note points at the wrong equation.** It says "…when rearranging **the
first equation**", but the determining equation is shuffled into a random display
position. **9 of 17** such distractors cite "the first equation" when the constant
lives elsewhere:

> `me-low-b2-002` — note blames "the constant 2 … the first equation", but
> equation 1 is `18 − D = C`; the 2 is in equation 2, `D ÷ 2 = 7`.

**(b) The stated mechanism does not produce the value.** The value is
`correct ± determining.constant`, but no misapplication of the determining
equation yields it:

> `me-low-b2-005` — `A ÷ 4 = 3`, so A = 12. Distractors 8 and 16 are 12∓4, and the
> note calls them "applying the constant 4 the wrong way round". Misapplying that
> equation gives 3÷4, 3×4=12, 3+4=7 or 3−4 — never 8 or 16.

So 38% of ME distractors are off-by-constant nudges carrying a fabricated
rationale. This is the same defect class the spec fixed for `off-by-one` and
Phase 4 fixed for `inverted-operation`; it simply migrated to the third family.

**Fix:** derive the value from an actual misapplication of the determining
equation, or reclassify the family as an unexplained nudge and cap it like
`off-by-one`. Name the equation by its rendered text, never by position.

### MEDIUM — `fs-low-b2-002`: explanation describes a direction never shown

The hexagon starts at R1C1 with rule direction `up-left`. That is out of bounds
immediately, so it reverses before panel 1 is drawn and visibly travels
**down-right** in every shown transition. The explanation says it "moves diagonally
**upwards to the left**". The item is correct and unambiguous; the explanation
contradicts what the candidate sees.

`describeRule` reports the rule's internal initial heading rather than the heading
actually observed. Present in **1 pilot item** and **6 legacy items**
(`fs-medium-006`, `fs-medium-017`, `fs-high-002`, `fs-high-006`, `fs-high-009`,
`fs-high-015`). Linear movers are unaffected — their description is
direction-neutral.

**Recommend: retire `fs-low-b2-002`** and fix `describeRule` to use the observed
heading.

### MEDIUM — two FS images offer only arbitrary distractors

`fs-low-b2-002` image 1 and `fs-low-b2-003` image 1 have **both** wrong options as
the `position` fallback, which encodes no nameable error. Both are single-symbol
movement-only items where the rule-based families are largely unavailable. The
per-item check passed because the *other* image supplied different families; the
constraint should apply per image.

### MEDIUM — `me-low-b2-005` is structurally degenerate

`A ÷ 4 = 3` and `A ÷ 4 = D` share an identical left-hand side, so the second
equation just restates D = 3. No official exercise repeats a left-hand side; it
reads like a typo. **Pre-existing pattern** — 4 b1 items do the same
(`me-low-003`, `me-low-008`, `me-low-012`, `me-high-002`). **Recommend: retire
`me-low-b2-005`** and forbid duplicate left-hand sides in the generator.

## 17. Did the generator behave as expected?

**Yes, structurally — and the pilot did its job by finding what statistics could
not.**

What worked exactly as designed: append-only generation (0 mutations, prefix
byte-identical, proven again against future b3 batches); per-item seeding and
single-item reproduction (45/45); the disambiguation gate (0 ambiguous items, and
the border/linear failure mode did not recur); exhaustive ME uniqueness; strict LS
replay; the mechanics contract (no forbidden mechanic anywhere); structural
fingerprinting (43/45 distinct, no pilot item in an over-cap cluster); and the
capacity refusals staying silent because 5/5/5 is comfortably inside every tier's
measured ceiling.

What the pilot exposed: **the correctness machinery is sound but the teaching copy
is not yet held to the same standard.** Every defect in §16 is in an explanation,
a hint or a distractor note — text that asserts a mechanism the item does not
exhibit. The validators check that notes exist, open with the right value, name a
real cell and avoid the answer; they do not check that the *reason* a note gives
is the reason that value arises. That gap is now the weakest part of the pipeline,
and at +100 per section it would multiply roughly sevenfold.

The two coverage shortfalls (no four-symbol figure item, three ME structures
unexercised) are sampling, not capability — all are demonstrably reachable — but
they mean the pilot has not yet proven the corrected calibration end to end.

---

# VERDICT

> ## PILOT PASSED WITH ISSUES — FIX BEFORE SCALING

45/45 generated, 0 correctness defects, 0 ambiguity, 0 forbidden mechanics, 0
existing items touched, full reproducibility. The factory's structural guarantees
all hold under real use.

Scaling is blocked on distractor-note and explanation accuracy, because those
defects are systematic rather than incidental — one affects 38% of Mathematical
Equations distractors.

**Before +100 per section:**

1. Fix `misapplied-constant` (both faults) — HIGH.
2. Fix `describeRule` to report the observed heading — MEDIUM.
3. Enforce ≥2 distinct distractor families **per image** in Figure Sequences — MEDIUM.
4. Forbid duplicate left-hand sides in equation systems — MEDIUM.
5. Retire `fs-low-b2-002` and `me-low-b2-005`, and regenerate their slots.
6. Add a validator for note-mechanism accuracy, so this class cannot recur.

**Then re-pilot** — a second 15-per-section batch would confirm the fixes and give
the four-symbol figure items and the three unexercised ME structures another
chance to appear. Only after that should +100 proceed, and Latin Squares should
still target ~+50 rather than +100 (Phase 4, §13A).

Nothing beyond the 45 pilot questions was generated.
