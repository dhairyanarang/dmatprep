# Phase 4 — Factory Fix Implementation Report

**Scope:** fix the generation architecture and the defects the Phase 3 audit
identified, so a 15-question-per-section pilot can run safely. **No pilot and no
bulk questions were generated.**

**Result:** the bank went from 135 active items to **133** — the two mandated
retirements — with everything else byte-for-byte intact except one explicitly
approved wording correction.

---

## 1. Changes made

### Critical fix #1 — append-only, item-seeded generation

The old runner shared one RNG stream per section and advanced it once per
*candidate*, so any quota change shifted every later item. Measured cost: 34/45,
36/45 and 40/45 items rewritten **under their existing ids**.

Every generation slot is now addressed by `(section, tier, batchId, index)` and
seeded independently:

```
seed = SHA-256(generator, section, tier, batchId, index, attempt)[0..4]
```

Rejection sampling walks the `attempt` dimension rather than a shared stream, so
slot 7 draws the same numbers no matter how many candidates slots 1–6 rejected,
and no matter how large the batch is.

- `scripts/lib/seed.mjs` — seeding, batch-id validation, batch-scoped ids
- `scripts/lib/batch.mjs` — the slot driver, diversity caps, stamping
- `scripts/lib/bank.mjs` — read/append/retire, snapshot + diff, id reservation
- `scripts/generate-batch.mjs` — the CLI; refuses to write if anything existing
  would change
- `scripts/generate-all.mjs` — **removed**; it now errors and points at the
  batch runner. Full-bank regeneration is no longer a supported operation.

Ids: b1 keeps `fs-low-001`; new batches are namespaced `fs-low-b2-001`, so a
positional index can never collide with an existing id. Retired ids are reserved
permanently in `content/sections/*/retired.json` and `appendToBank` throws if one
is ever reused.

`GeneratorStamp` now records `batchId`, `seed`, `seedCoordinates` and `config`
alongside name/version/verifiedAt — enough to rebuild one question in isolation.

### Critical fix #2 — Figure Sequence disambiguation

`scripts/lib/fs-inversion.mjs` enumerates the documented rule space, keeps every
rule consistent with the four shown matrices, and requires exactly one surviving
continuation. The stored rule is never consulted to break a tie.

Because movement, rotation and colour evolve independently in `stepSymbol`, the
continuation set factorises and each aspect is inverted separately — ~56
simulations per symbol instead of ~5000, and it names *which* aspect is ambiguous.

Applied at generation **and** in `verify-bank`. Run against the pre-change bank it
independently rediscovered all 7 audit-identified ambiguous items, exactly.

### Critical fix #3 — retirement

`fs-medium-007` and `fs-high-004` moved to
`content/sections/figure-sequences/retired.json`, with the full question payload
and a stated reason. They are not served (`registry.ts` reads only
`questions.json`), and their ids can never be reassigned.

### Critical fix #4 — Figure Sequence calibration

The spec recorded official Ex 4 as 2 symbols and Ex 5/Ex 6 as 3, and derived a
hard cap of three symbols enforced in the generator and `verify-bank`. The audit
verified visually that **Ex 4 has 3 and Ex 5/Ex 6 have 4**. Corrected everywhere;
the ceiling is now 4.

Symbol count is decoupled from difficulty with deliberately overlapping ranges
(low 1, medium 2–3, high 3–4). Difficulty gates on measured `peakLoad`: low ≤ 2,
medium = 3, high ≥ 4.

### High-priority fixes

| # | Fix |
|---|---|
| 5 | **ME coverage** — added all four missing official shapes (bare pin `B = 6`, two-unknown constant `A + C = 8`, multi-term `2 × A + 2 × C = B`, compound `3 × C − 1 = B`), plus star and mixed topologies and subset-spanning combining equations |
| 6 | **ME decoupling** — letter count and depth drawn independently; the generator measures every letter's depth and asks one that lands in the tier's band. Root role is drawn too, so the asked letter is no longer almost always `A` |
| 7 | **ME dedup** — skeleton is sorted before hashing, so a reordered system is the same key |
| 8 | **ME distractors** — `inverted-operation` is only offered when the system contains that operator |
| 9 | **LS spec correction** — Technique B documented as a faster search, not a stronger technique; walkthrough copy changed from "the way in" to "a quicker way in" |
| 10 | **FS tier ratio** — capacity measured per tier rather than assumed (see §13) |
| 11 | **LS strict replay** — `replayPath` wired into `verify-bank`, replacing a check that only asked whether the letter *fit* |
| 12 | **Generation plan** — `GENERATION_PLAN.md` template plus `scripts/lib/plan.mjs` validation; `--plan` required above 20 items |

### Medium fixes

- ME level-2 hints no longer quote an equation containing only the asked letter;
  they name the operation to undo instead. Validated by `hintRevealsAnswer`.
- FS `movement-step` distractors are border-only — no unattested two-field linear
  or diagonal movement on screen.
- Diversity caps are absolute (2 per fingerprint, 6 per family), not the old
  `ceil(count/3)` which loosened as batches grew.
- `targetDistance` added to the LS fingerprint as a real constraint.
- **Accelerating colour cycles removed entirely.** New finding, not in the audit:
  the colour index runs `p(p+1)/2` = 0,1,3,6,10,15, which is `0,1,0,0,1,0` mod 3
  — a three-colour accelerating cycle **never renders its third colour in any
  panel** while the walkthrough names it. Two colours degenerate. The mechanic was
  only ever `reasonable_extrapolation`, so it has no usable form at attested
  lengths.

### Also

`app/prepare` and `app/test` said "N questions each", derived from the first
section. Sections can now differ, so both report the total instead.

---

## 2. Files changed

**New (12):** `scripts/lib/{seed,batch,bank,verify,contract,fingerprint,fs-inversion,plan}.mjs`,
`scripts/generate-batch.mjs`, `scripts/test/*` (5 files),
`content/question-authoring/GENERATION_PLAN.md`,
`content/sections/figure-sequences/retired.json`.

**Modified (13):** the three generators, `verify-bank.mjs`, `generate-all.mjs`,
`lib/types/question.ts`, `package.json`, `CLAUDE.md`,
`DMAT_QUESTION_AUTHORING_SPEC.md`, `app/prepare/page.tsx`, `app/test/page.tsx`,
and the two question banks (retirement + approved wording only).

Per-question verification moved out of `verify-bank.mjs` into
`scripts/lib/verify.mjs`, so generation and verification run **the same code** and
cannot drift.

---

## 3–4. Critical and high-priority fixes completed

All four CRITICAL and all eight HIGH items from the audit's §15 list are done.
Items 13–17 (MEDIUM) and 18–21 (LOW) are also complete except where noted in §13.

---

## 5–6. Tests run and results

| Suite | Result |
|---|---|
| `npm test` (77 tests, 13 suites) | **77 pass, 0 fail** |
| `npm run verify:bank` | **133 checked, 0 failed**, 44 legacy warnings |
| `node scripts/audit-bank.mjs` | 0 technical failures across all three sections |
| `npm run lint` | clean |
| `npm run build` | compiles; 34/34 static routes, unchanged |

Test coverage added: append-only invariance, batch-growth extension,
id-reservation, determinism, single-item reproduction, seed purity, FS
disambiguation (including that the gate rejects *both* readings of an ambiguous
sequence), colour observability, symbol-count decoupling, x+1 non-universality,
six ME structural families, ME correctness invariants, dedup order-independence,
distractor and hint rules, LS strict replay (valid / non-forced / wrong target),
mechanics contract enforcement, and fingerprint symmetry collision.

---

## 7. Existing bank preservation

Verified at the **byte level** against a pre-change snapshot:

```
figure-sequences file is EXACTLY baseline-minus-two-items:            true
latin-squares file is EXACTLY baseline with only the approved
  wording substituted:                                               true
mathematical-equations file byte-identical to baseline:              true
```

| | |
|---|---|
| byte-identical | **108 / 135** |
| removed | **2** — `fs-medium-007`, `fs-high-004`, exactly the mandated retirements |
| content changed | **25** — all Latin Squares, all confined to `walkthrough.keyInsight` and `walkthrough.takeaway` (50 scalar fields), the Phase 12 approved correction |
| retired archive preserves full payload | true |
| active bank contains a retired id | false |

No question data — no grid, answer, option, equation, panel or rule — was
modified anywhere.

---

## 8. Append-only regression

Hypothetical future batches against the current bank. Nothing written.

| Section | +5 | +20 | +100 |
|---|---|---|---|
| figure-sequences | 5 produced, **0 mutated** | 20, **0 mutated** | 100, **0 mutated** |
| mathematical-equations | 5, **0 mutated** | 20, **0 mutated** | 100, **0 mutated** |
| latin-squares | 5, **0 mutated** | 20, **0 mutated** | refused (capacity — §13) |

0 new items failed verification in any run. Batch-growth is a pure extension:
per-tier prefixes are byte-identical when a batch is enlarged.

---

## 9. Determinism

| Property | Result |
|---|---|
| same coordinates → identical output | ✅ all three sections |
| different `batchId` → different content | ✅ 0 items repeat |
| single item reproduced from its own stamp | ✅ byte-identical, all three sections |
| `itemSeed` pure in each coordinate | ✅ index, attempt, batchId, tier all change it |
| incomplete coordinates rejected | ✅ |

---

## 10. Figure Sequence disambiguation

Run against the pre-change bank, the gate independently found **exactly the 7
items** the audit identified, with the same single cause (border travel versus
linear movement along an edge). It also found **5 items the audit missed** — the
accelerating-colour defect above.

Every newly generated item passes. Post-fix distributions across an 88-item dry
run:

- symbol count no longer predicts tier: medium 29×2 / 11×3, high 36×3 / 4×4
- x+1 in high: **52%**, down from 100%
- movement families balanced: border 68, direction-cycle 57, linear 52, diagonal 46
- distractor families: no family above 28%; `position` fallback down from 31 to 6
- zero accelerating colour cycles

---

## 11. Mathematical Equations coverage

All four previously-unreachable official shapes now generate, verified by test
and by sampling 42 items:

| Shape | Source | Before | After |
|---|---|---|---|
| bare pin `B = 6` | Example 1 | never | ✅ |
| two unknowns = constant `A + C = 8` | Ex 3 | never | ✅ |
| compound `3 × C − 1 = B` | Ex 6 | never | ✅ |
| multi-term `2 × A + 2 × C = B` | Ex 3 | never | ✅ |
| star topology | Ex 5, Ex 6 | 0 / 127 | ✅ |
| subset combining | Ex 6 | never | ✅ |

Difficulty is decoupled: low now spans 3–4 letters, medium 2–4, high 3–4. Asked
letter distribution A=12, B=9, C=8, D=13 (was A=16, B=15, D=9, C=5).

**Depth model corrected.** Adding combining equations exposed a flaw: costing a
combining-equation collapse as one step put a three-equation collapse at depth 1,
in the *low* tier — while official Ex 5 does exactly that and is graded high. A
collapse now costs one move per definition pushed into it. Under the corrected
model the official exercises measure Ex 1 → 1-2, Ex 2 → 2-3, Ex 3 → 3-5,
Ex 4 → 3-5, Ex 5 → 4-7, Ex 6 → 4-7, which matches their published labels.

---

## 12. Latin Square validation

- Strict `replayPath` wired in; the committed bank passes it (the weak check was
  not masking an actual defect, but the hole is closed).
- Technique B corrected in spec, generator and the 25 affected walkthroughs.
- `targetDistance` now a constraint, not just a statistic.
- Contract rejects hidden singles, undocumented techniques and depth > 7.
- **Hidden singles were not added.** They would create a genuine Technique-B
  requirement but are unattested, which is exactly the drift being guarded against.

---

## 13. Remaining issues

**None block the pilot.** All are recorded rather than quietly carried.

**A. Latin Squares cannot reach +100 in one batch.** Measured ceilings for a
single new batch on top of the current bank:

| Section | low | medium | high |
|---|---|---|---|
| figure-sequences | 25 | 90+ | 90+ |
| mathematical-equations | 36 | 36 | 90+ |
| **latin-squares** | **16** | **19** | **18** |

LS tops out around **53 new items**. This is not the fingerprint cap — the 19
medium items it does produce occupy 19 *distinct* buckets. The generator itself
converges on a narrow set of deduction shapes: `carveToDensity` plus `solvePath`
plus the depth/density bands is a tight intersection, and the existing 45 items
already occupy much of the reachable space. Reaching +100 needs targeted
generator work — steering target selection to force out-of-line prerequisites,
and varying how the grid is carved. **The pilot needs 15; LS produces 15 in
38ms.** FS and ME both reach +100 today.

**B. 44 legacy warnings on batch b1**, printed on every `verify-bank` run. Each
is a real defect the current gates would reject, in an item that is nonetheless
correctly keyed and uniquely answerable. Left untouched because the brief holds
b1 byte-identical apart from the two retirements. Each needs an approved
wording-or-retire decision:

| Count | Issue |
|---|---|
| 15 | ME level-2 hints one step from the answer (`"Look at A ÷ 3 = 3."`) |
| 8 | ME distractor notes blaming an operator the system does not contain |
| 5 | FS accelerating colour cycles naming a colour never rendered |
| 5 | FS items admitting two legal continuations (the ones whose distractors do *not* include the alternative reading — the two that did were retired) |
| 11 | structural fingerprint clusters above the cap of 2 |

**C. Four-symbol FS items are ~10% of the high tier.** Four symbols on a 4×4 grid
with no overlap across six panels is genuinely constrained. The mechanic is
available and exercised; the pilot should confirm the rate is acceptable.

**D. ME low items still ask the root letter.** Depth 1 under a position-ordered
model implies it. The *systems* now vary substantially (3–4 letters, compound and
multi-term definitions, bare pins), so this is much weaker than the old
one-template tier, but a per-letter dependency-chain depth model would fix it
properly. Deferred as out of scope for this phase.

---

## 14. Verdict

> # READY FOR 15-QUESTION PILOT

Every critical and high-priority item from the audit is fixed and tested. The
existing bank is provably intact at the byte level. Append-only generation holds
at every batch size tried, determinism and single-item reproducibility are
proven, the circular Figure Sequence validation is replaced by a gate that asks
the question the candidate is actually asked, and the mechanics contract is
enforced in code at both generation and verification.

The pilot should be **5 low / 5 medium / 5 high per section**, with a written
generation plan per section. All three sections produce that comfortably and with
zero verification failures.

Two things to watch in the pilot, neither a blocker: the four-symbol Figure
Sequence rate, and whether the Latin Square deduction shapes feel varied enough
to justify the +100 target before investing in generator work.

**Do not proceed to +100 for Latin Squares** without either that generator work or
a revised target of roughly +50.
