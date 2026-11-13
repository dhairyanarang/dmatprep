# Static rotator pilot — 14 November 2026

**DRAFT. NOT IN THE BANK. NOT APPROVED.** Six Figure Sequences items piloting the
`staticRotatingSymbol` mechanic. They are here, not in
`content/sections/figure-sequences/questions.json`, because automated gates and
an independent blind round are evidence, not sign-off.

## Why this mechanic

The low tier has been closed to growth since `direction-cycle` was quarantined:
Figure Sequences can place at most one new low item per batch, measured, and the
limit is structural rather than a crowded fingerprint budget
(`docs/DIRECTION_CYCLE.md`). `staticRotatingSymbol` was named there as the only
one of the three options grounded in the official material — Exercises 3 and 6
each carry a rotation clause with no movement clause, so a symbol that holds its
cell and turns is attested.

It is filed under `FS_CONTRACT.review`, not `allowed`, so every item built on it
rolls up to `reasonable_extrapolation`. That is enforced from the question
itself by `scripts/lib/provenance.mjs`, not asserted by the generator.

## What had to change to make it possible

Three things, and the first two matter beyond this pilot.

1. **`scripts/lib/fs-inversion.mjs` now enumerates `{ type: 'static' }`.** It did
   not, which meant a static item could not be proven to admit exactly one
   continuation. The candidate space is deliberately a superset of what the
   generator emits — it must consider every reading a candidate could defend —
   and a symbol that visibly has not moved is such a reading. Adding it makes the
   gate strictly stricter: re-run against the committed bank, all 473 still pass.

2. **A legibility gate in `scripts/lib/verify.mjs`.** A static symbol's only
   readable cue is its facing. On a square, circle, diamond or hexagon a 90° turn
   is invisible or indistinguishable from no turn, and the item is unanswerable
   rather than hard. Static symbols are now restricted to arrow and triangle at
   verification time, not merely by generator convention.

3. **The movement-legibility guard is skipped for static symbols.** The generator
   required every symbol to visit at least three distinct cells across the six
   panels. A static symbol visits exactly one, by definition, so that guard
   rejected the mechanic outright. It tests whether *movement* is readable; a
   symbol with no movement has none to read, and its rotation carries the rule.

## Visual legibility, measured

The concern with a static rotator is that any rendering jitter becomes the only
positional cue and could be misread as movement. Both the production renderer
(`components/render/figure-matrix.tsx`) and the review renderer rotate about the
cell centre — `translate(cx cy) rotate(r)`. The arrow polygon is slightly
asymmetric about its origin, so its bounding-box centre does shift under
rotation: **0.5px on a 34px cell, 1.5%, at every one of the four orientations.**
Nowhere near a one-cell move. Measured, not eyeballed.

## Evidence

| Gate | Result |
|---|---|
| Rule-space inversion | 6/6 admit **exactly one continuation** |
| `verifyQuestion` | 6/6 clean — 0 errors, 0 warnings |
| Provenance | 6/6 `reasonable_extrapolation`, derived not asserted |
| Shapes | 5 arrow, 1 triangle — rotation legible on both |
| Independent blind re-answer | **12/12 continuations agreed with the key** |
| Blind `exactlyOneDefensibleContinuation` | true on all six |

The blind round ran on Claude Sonnet 5 — a different model from the author,
which is stronger independence than the author's own model in a fresh context.
It was given the four shown matrices and the three options per image as
structured data, with keys, rules and explanations withheld, and verified
separately that the key-bearing fields were absent before dispatch.

It checked and ruled out, in its own words, a second direction reading, an
accelerating reading, a moved-and-returned reading, and a reflection reading. It
rated all six **easy**, which is what the low tier is for.

## What is still missing

**Human sign-off.** Nothing above substitutes for it. Two models agreeing is
evidence about the items; it is not a person taking responsibility for putting
them in front of a candidate.

Also outstanding before these ship:
- a decision on whether `reasonable_extrapolation` content belongs in the free
  set, which is currently all-`officially_documented` for Figure Sequences;
- the teaching catalogue in `components/exam/diagrams.tsx` does not mention a
  symbol that holds its cell, so a candidate meeting one has not been taught it.
  That is a content change, and it should land with the questions or before them.

## Looking at them

```bash
node scripts/preview-drafts.mjs --dir drafts/static-rotator-2026-11-14
open drafts/static-rotator-2026-11-14/preview.html
```
