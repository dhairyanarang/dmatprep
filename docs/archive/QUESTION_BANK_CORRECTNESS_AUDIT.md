# Question-bank correctness audit

**Audited** 21 November 2026 · **Scope** every active question in the three Core
subtests · **Method** independent re-derivation, not comparison against the
stored key.

Re-run with:

```bash
node scripts/audit/run.mjs              # the audit itself, JSON on stdout
node scripts/audit/negative-control.mjs # proof the detectors work
```

---

## 1. What "independent" means here

`npm run verify:bank` already proves the bank is internally consistent. An
internally consistent bank can be uniformly wrong, so none of it was trusted.

Three solvers were written for this audit. Each reads **only the question** —
the equations, the grid and its givens, or the four shown matrices — and
derives the answer from first principles. The stored `correctOptionId`,
`solution`, `solutionSteps` and `explanation` are read at the **end** of each
check, solely to compare against a conclusion already reached.

| Subtest | File | What it derives, and how |
|---|---|---|
| Mathematical Equations | `scripts/audit/me-solver.mjs` | Parses the equations and searches all assignments of 1–20 to every letter. Division must be exact. Reports the set of values the asked letter can take. |
| Latin Squares | `scripts/audit/ls-solver.mjs` | Enumerates completions of the grid under row/column uniqueness and collects every letter that can legally stand in the marked cell. |
| Figure Sequences | `scripts/audit/fs-checker.mjs` | Inverts each symbol's four shown states against the documented rule space, then projects the surviving rule to panels five and six and matches the result against the offered options. |

Figure Sequences is checked by **inversion, not replay**. Applying the stored
rule and confirming it reproduces the marked panel is circular: it shows the
rule and the key agree, not that a candidate could get there. What matters is
whether the four shown matrices admit exactly one continuation — border travel
and linear movement are indistinguishable while a symbol runs an edge without
turning a corner, which is how two genuinely ambiguous items shipped before
anyone inverted anything.

### The audit's own detectors were tested first

A clean report is worthless unless it can be shown to report a defect when one
exists. `scripts/audit/negative-control.mjs` plants eleven specific faults in
copies of real questions and asserts each is caught. **All eleven pass.**

| Control | Result |
|---|---|
| ME: the solver reaches the real answer without reading the key | pass |
| ME: a flipped key is caught | pass |
| ME: an unsatisfiable system is caught | pass |
| ME: an under-determined system is caught | pass |
| LS: the solver reaches the real letter without reading the key | pass |
| LS: an emptied grid is reported as ambiguous | pass |
| LS: a contradictory given is caught | pass |
| FS: the derivation reaches the real option without reading the key | pass |
| FS: a flipped key is caught | pass |
| FS: a corrupted fourth matrix breaks the derivation | pass |
| FS: two identical options are caught | pass |

**One real defect in the audit tooling was found this way.** The first version
of the ME solver stopped after three solutions. Variables are enumerated in
order, so when the asked letter came first every early solution shared its
value — an under-determined system would have been reported as having a unique
answer. The solver now enumerates the asked letter outermost and terminates on
*two distinct values of it*, never on a solution count. Every figure below was
produced after that fix.

---

## 2. Results

| Subtest | In file | Quarantined | Active | Audited | Pass | Issues |
|---|---:|---:|---:|---:|---:|---:|
| Figure Sequences | 173 | 86 | 87 | 87 | **87** | 0 |
| Mathematical Equations | 175 | 3 | 172 | 172 | **172** | 0 |
| Latin Squares | 125 | 0 | 125 | 125 | **125** | 0 |
| **Total** | **473** | **89** | **384** | **384** | **384** | **0** |

**No question with an incorrect answer key was found.**
**No ambiguous or under-specified question was found.**
**No question is marked active while quarantined or retired.**

### What each question had to survive

Every active question was checked for all of the following. A failure on any
one of them is reported as an issue with its id; there were none.

**Mathematical Equations (172)**
- the system is parseable under the documented grammar
- at least one assignment of 1–20 satisfies every equation
- the asked letter takes exactly one value across all solutions
- the stored key equals the derived value
- no two options share the derived value
- the stored full solution matches the derived one, letter by letter
- the explanation states the derived value
- an explanation of 20+ characters and a distractor note for every wrong option

**Latin Squares (125)**
- the givens contain no repeated letter in any row or column
- at least one valid completion exists
- exactly one letter can stand in the marked cell
- the stored key equals the derived letter
- every option is one of the grid's own letters
- the explanation names the derived letter
- an explanation of 20+ characters and a distractor note for every wrong option

**Figure Sequences (87)**
- every symbol appears in all four given matrices
- a rule exists that explains all four
- exactly one movement, one rotation and one colour rule survives inversion
- the derived fifth and sixth panels each match exactly one offered option
- that option is the stored key, for both images
- no two options in an image are the same panel
- an explanation of 20+ characters and a distractor note for every wrong option

**Registry (all three)**
- no duplicate ids
- no id both active and listed in `retired.json`
- every question declares the section it is filed under

---

## 3. Explanations read by hand

Machine checks confirm an explanation *states* the right number. They cannot
confirm the reasoning. Nine questions — three per subtest, spanning low, medium
and high — were worked through independently and their explanations read line
by line.

| Id | Difficulty | Verdict |
|---|---|---|
| `me-low-005` | low | Pass. A ÷ 2 = 4 → A = 8; B = 1. Both steps correct. |
| `me-medium-b5-007` | medium | Pass. D + D/6 = 7 → D = 6, B = 1; D + B = 7 checks. See the note below. |
| `me-low-b9-001` | low | Pass. D = 9 → B = 1 → A = 4. Every step correct. |
| `ls-low-001` | low | Pass. Column 3 missing A and C; C blocked in row 4; A follows at the target. Verified cell by cell. |
| `ls-high-b4-001` | high | Pass. R4C2 = D, then column 5's pair, then R2C2, R2C4, R4C4 — every intermediate claim verified. |
| `ls-high-b5-018` | high | Pass. Column 3's pair, then R4C2, R1C1, R4C1 — all verified; target is D. |
| `fs-low-004` | low | Pass. Border counter-clockwise, step 1: R3C1 then R4C1, as stated. |
| `fs-medium-b5-005` | medium | Pass. Two symbols, step 2, with rotation and a two-colour cycle. All four stated positions verified. |
| `fs-high-b6-005` | high | Pass. Three symbols including `x+1` acceleration and a diagonal bounce off a corner. All six stated positions verified. |

**No logical or mathematical error was found in any explanation read.**

### Two quality observations — not correctness defects

1. **`me-medium-b5-007` states a result without showing the algebra.**
   "Substituting the definition of B into D + B = 7 leaves D as the only
   unknown, which gives D = 6" skips the step `D + D/6 = 7 → 7D/6 = 7`. The
   answer is right; a candidate who could not do that step is not helped by
   being told it was done. Worth a look across the combining-equation family.
2. **Every Latin Squares explanation ends with the same sentence** about pair
   elimination being a shortcut rather than a requirement. It is accurate and
   the rule behind it matters, but 125 identical closings is a lot of repeated
   text. Consider moving it to the subtest guide and dropping it from the item.

Neither was changed. Nothing in the bank was changed by this audit.

---

## 4. Coverage and limits

**Audited in full.** All 384 active Core questions, by independent derivation.

**Audited by sample.** Explanation *reasoning*, at nine questions. The other
375 had their explanations checked mechanically — present, long enough, and
stating the derived answer — but no machine read them for sense. A full prose
review is a human task and remains outstanding.

**Not audited: rendering.** Figure Sequences and Latin Squares are drawn as SVG
from the stored state, so a question's data being correct does not prove the
drawing is legible. Spot checks during interface testing showed grids,
matrices and equations rendering correctly in practice, timed and review
screens on desktop and at 390px, but no systematic per-question visual review
was done.

**Not audited: Module B.** The General Academic Module holds 16 pilot
questions across 5 source packs. It has **not** been through human review, it
is **not** part of the paid offering, and it was deliberately left alone. Its
existing status is recorded in `content/gam/review/HUMAN_REVIEW.md`. One
separate pre-existing issue stands: `/module-b/timed` ships answer keys in its
page payload (19 occurrences), which the test suite carries as a known `todo`.
That is a content-exposure defect in Module B only; no Core route is affected.

**The quarantined 89 were not audited.** 86 Figure Sequences items are held
back because `direction-cycle` is not in the documented rule space, and 3
Mathematical Equations items are quarantined separately. None is served to
anyone. If a future official re-date documents the mechanic, those 86 need this
same audit before they are released.

---

## 5. Recommendation

The active Core bank passes an independent correctness audit with zero defects,
and the audit's own detectors are demonstrated to work. On correctness grounds
there is nothing blocking launch of the Core product.

Two things should still happen before launch, neither of which this audit can
do:

1. **A human reads the explanations.** 375 of them have been checked only
   mechanically.
2. **Module B stays out of the paid offering** until it has had a review of its
   own, and its page-payload exposure is fixed.
