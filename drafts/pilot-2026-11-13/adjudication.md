# Blind adjudication — pilot batch P1

## Method

Each item was given to a **separate isolated agent in a fresh context**. Each
received only the stem, the options, and — for the GAM item — the source
material. None received the answer key, the intended solution, the author's
notes, the intended difficulty, or any part of this conversation. Each was asked
for an independent answer, a confidence, its full reasoning, a uniqueness
judgement and an ambiguity assessment. **The key was compared only after the
response was complete.**

This is not a self-solve described as adjudication. The adjudicators are
separate processes that could and did reach their own conclusions, and the
reasoning they returned is their own.

**What this does not establish.** Agreement between an author and one blind
reader is evidence, not proof. Both are the same model family. A disagreement
would be strong evidence of a defect; agreement is weaker evidence of soundness,
and none of it substitutes for human review.

## Results

| Item | Key | Blind answer | Confidence | Verdict |
| --- | --- | --- | --- | --- |
| `fs-high-p1-004` | matrix2 / matrix2 | matrix2 / matrix2 | high / high | **agree** |
| `fs-high-p1-007` | matrix3 / matrix3 | matrix3 / matrix3 | high / high | **agree** |
| `ls-high-p1-004` | D | D | high | **agree** |
| `ls-high-p1-014` | A | A | high | **agree** |
| `gam-ba-bc-p1-q1` | c (5.60%) | c | high | **agree** |

## Findings that changed a draft

**`gam-ba-bc-p1-q1`** — the adjudicator identified a *second* route to the 4.80%
distractor: reading the gross return of 4,800 euros straight off as a percentage,
a units slip, rather than the band misapplication the note described. The
refutation was broadened to name both. The key did not change.

## Findings recorded for human review, no change made

**`fs-high-p1-004`** — the adjudicator reached both answers with high confidence
and judged the continuation unique, but flagged four assumptions it had to make:

- Symbol identity has to be keyed on **shape, not colour**, since the triangle
  changes colour every matrix and the square alternates. Forced by the roster,
  but only implied.
- **Acceleration is per-symbol, not global.** Three symbols accelerate and the
  square does not. A solver who assumes one global acceleration mis-predicts the
  square. Internally consistent, worth a reviewer's eye.
- **Bounce semantics** — walking the steps one cell at a time and reversing on
  contact, versus reflecting the overshoot arithmetically. Both give the same
  answer here; the official material does not state which applies.
- **Mid-flight overlap** is treated as permitted; only resting positions are
  checked for collision.

**`ls-high-p1-014`** — three completions of the whole grid exist, and the target
cell is **A in all three**. That is correct for a task that asks for one cell
rather than the whole square, and the adjudicator reached A by forced placements
without relying on whole-grid uniqueness. Flagged because it looks wrong at a
glance and a reviewer should know it is intended.

**`fs-high-p1-007`** — agreed with both keys, but raised the sharpest finding of the
round. It reverse-engineered the blue triangle's movement as a travel direction
that turns 90° each step and flagged that this *"is not one of the movement rules
the official material documents"*.

It is right that the official table names only vertical, horizontal and diagonal
movement. What it reconstructed is the project's `direction-cycle` mechanic —
already used by **103 of the committed bank's 429 symbol rules** and a
first-class member of the inversion harness's rule space. So this is not
something the pilot introduced; it is a standing question about the bank, and it
is a good catch. **Escalated for your decision: is `direction-cycle` officially
documented, or is it an inference the bank has been relying on?**

It also judged that matrices 1–4 alone do not pin a unique continuation and that
the option set does part of the work. Against the rule space the project treats
as documented, `fs-inversion` reports **exactly one continuation** for both FS
items — the readings the adjudicator weighed (border travel for the triangle)
sit outside that space. Worth knowing that a careful reader who does not share
our rule space can reach a different reading.

**Both Latin Squares items** — the blind prompt presented a plain 5×5 completion
and omitted the response-row constraint the real task type carries. One
adjudicator noticed and said it did not need it. The answers are unaffected, but
the next round's prompts should include the response row so the adjudication
matches the task as a candidate meets it.

## Not adjudicated

The three Mathematical Equations drafts were **not** sent for adjudication. They
fail the project's `ME_CONTRACT` gate, so their correctness is not the live
question — whether they are permissible at all is. Adjudicating them would imply
they were candidates for the bank.
