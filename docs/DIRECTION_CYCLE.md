# `direction-cycle`: why 86 questions were quarantined

Decided 14 November 2026.

## What it was

A Figure Sequences movement mechanic in which a symbol changes its direction of
travel every panel, following a fixed repeating order — left, up, right, down,
tracing a small closed loop.

It was listed in `FS_CONTRACT.allowed.movementTypes`, which in that file means
**stated in the official rules, or demonstrated in a worked exercise**. It was
neither.

## Why that is wrong

The official rule list for Figure Sequences, from the GAM preparatory materials
pp. 7–8, names exactly these:

- colour change;
- rotation about the symbol's own axis;
- vertical, horizontal or diagonal movement;
- a diagonal mover cannot switch to another movement type;
- `x+1` acceleration;
- symbols cannot disappear or overlap;
- at a boundary, a symbol either bounces off it or travels along it.

A symbol that cycles through directions is not on that list, and nothing in the
six worked exercises demonstrates one. It is an invention.

It also sat badly beside this contract's own `forbidden` entry — *"a mid-sequence
switch from one movement type to another"*. Whether changing direction counts as
changing movement type is arguable; that the mechanic was never attested is not.

## Scope

| | |
|---|---|
| Questions affected | **86 of 173** Figure Sequences items |
| Symbol-level rule instances | **103** |
| By difficulty | low 11 · medium 34 · high 41 |
| Items where every symbol used it | 14 |
| Items where it was mixed with attested movement | 72 |
| In the free set | **22 of 50** |

## What was done

1. **`direction-cycle` removed from `FS_CONTRACT.allowed.movementTypes`** and
   added to `forbidden`. The generator no longer emits it.
2. **The 86 items marked `meta.quarantined`** and re-graded
   `dmatAlignment: 'uncertain'`. Nothing else about them changed — verified
   field by field against the previous commit: 173 ids before and after, exactly
   86 touched, zero other differences.
3. **`lib/content/registry.ts` splits `ALL` from `BANKS`.** `getQuestions`
   serves only non-quarantined items; `getQuestion` still resolves by id, so a
   stored attempt can always name what it was an attempt at.
4. **The 22 free-set entries replaced**, keeping the approved 17/17/16 spread
   and avoiding ids that carry a `verify-bank` warning. 45 distinct structural
   fingerprints across the 50.
5. **The teaching catalogue entry deleted.** `components/exam/diagrams.tsx` listed
   "Repeating direction cycle" under a heading reading *"Every movement you can
   be shown"*, sourced to the official rules. That taught an invented mechanic as
   fact, which is the most serious part of this defect: a candidate could have
   walked into the exam expecting it.
6. **Two worked examples repointed.** `fs-low-001` and `fs-medium-001` were both
   retired and had been rendering nothing at all. They now point at `fs-low-007`
   and `fs-medium-005`, both live and non-quarantined.

## Quarantine, not retirement

Retirement reserves an id forever and archives the payload. Quarantine leaves
the question in place, unserved. If a future re-date of the preparatory PDF
documents the mechanic — the PDF has been re-dated twice already — these come
back by deleting one field. If it does not, they can be retired properly later.
Retiring 86 items on an inference would have been the irreversible choice.

## What this cost, measured

**Figure Sequences can now generate at most one new low-difficulty item per
batch.**

The low tier stacks a single transformation, `MAX_PER_FINGERPRINT` caps
structural repeats at two, and removing `direction-cycle` took out roughly a
third of the movement space. Asking for two low items now fails at the second
slot.

This is not the fingerprint budget being crowded by the quarantined items.
Generating against the 87 live questions and against all 173 including the
quarantined ones fail identically — so the ceiling is structural, and excluding
quarantined items from the budget would buy nothing.

`scripts/test/determinism.test.mjs` asserts the ceiling directly, so that
lowering a quota cannot quietly hide it.

**Consequence for planning:** the Figure Sequences low tier is effectively
closed to growth. Low is also the tier a new candidate meets first. Options, in
order of honesty:

1. Accept 21 low items as the ceiling and spend effort on medium and high.
2. Raise `MAX_PER_FINGERPRINT` for the low tier only — a deliberate decision
   about acceptable structural repetition, not a gate to relax quietly.
3. Find a documented mechanic the generator does not yet produce. The `review`
   list has candidates — `staticRotatingSymbol` is attested in Exercises 3 and 6
   and is not currently generated.

Option 3 is the only one that adds genuine variety, and it is the only one
grounded in the official material. It should be costed before either of the
others.

## How to lift this

A future re-date of the preparatory PDF must be diffed the way the 04.08 → 02.09
builds were. If a re-date documents direction cycling:

1. restore it to `FS_CONTRACT.allowed.movementTypes` and drop the `forbidden` entry;
2. delete `meta.quarantined` from the 86 items and re-grade their `dmatAlignment`;
3. restore the catalogue entry in `components/exam/diagrams.tsx`;
4. re-run `npm run verify:bank` — the 86 should pass with no other change.

Until then, the mechanic is not ours to teach.
