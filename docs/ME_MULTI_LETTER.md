# Mathematical Equations: the multi-letter form

**Status: not implemented. Documented so the decision is deliberate, not forgotten.**

## What the official material shows

Both question forms are **demonstrated** (GAM PDF pp. 17–19, 02.09.2026 build):

- **Example 1** — *"What number does A correspond to so that the equations are
  solved correctly?"* Solution: `A = 4`.
- **Example 2** — *"What numbers do **A and B** correspond to so that the equations
  are solved correctly?"* Solution: `A = 4, B = 8`.
- **All six exercises** report a value for **every** letter in their solutions:
  Ex 1 `A = 7, B = 10`; Ex 3 `A = 6, B = 16, C = 2`; Ex 5 `A = 5, B = 1, C = 10,
  D = 12`.

The bank is **175 of 175 single-letter**. An officially demonstrated form is
absent.

This resolves what `CLAUDE.md` previously recorded as unconfirmed. It is now a
coverage gap, not an open question.

## What the schema supports today

`asked: string` — one letter — in `lib/types/question.ts`. Three places assume it:

| Place | Assumption |
|---|---|
| `requiredSelectionCount` | returns `1` for anything that is not a figure sequence |
| `isCorrect` | compares `selection.answer` against a single `correctOptionId` |
| `question-view.tsx` | renders the stem as "What number does {asked} correspond to?" |

**The precedent already exists in the codebase.** Figure Sequences is a
two-answer item: it carries `images[]`, each with its own `options` and
`correctOptionId`, `requiredSelectionCount` returns `2` for it, and `isCorrect`
requires *every* image to match. A multi-letter Mathematical Equations item is
the same shape with a different label — `asked` becomes a list, each asked letter
carries its own option set, and correctness is conjunctive.

So the schema does **not** support it today, and the path to supporting it is a
known one rather than a new design.

## Why it is not being added now

Adding it is a **question-volume and UX change**, and this pass is a content
repair with an explicit instruction not to add volume and not to touch the
interface. Two of the three touch points above are renderer changes.

## What a later pass would need

1. `asked: string | string[]`, or an `askedLetters` array, kept backward
   compatible so all 175 existing items stay valid.
2. `requiredSelectionCount` and `isCorrect` generalised over an item's answer
   slots — Figure Sequences already does this and the two should converge rather
   than each keep its own rule.
3. A stem that names every asked letter, and one option set per letter.
4. A generator plan target, so multi-letter items are drawn deliberately rather
   than left to chance, and a share to aim for.

## The share is unknown

The official material demonstrates both forms and **states no ratio between
them**. Two of the two worked examples split one and one; all six exercises
report every letter. That is not enough to infer a target proportion, and
inventing one would be exactly the kind of assumption Rule Zero forbids. Pick a
share as a product decision and record it as ours, not as the exam's.
