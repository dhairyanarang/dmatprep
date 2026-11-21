# Difficulty, measured

Difficulty is a measurement, not a label chosen at authoring time. `scripts/lib/calibrate.mjs`
reads a question and reports what it measured and what tier those measurements
suggest. `npm run calibrate` runs it over everything committed.

**Nothing in this tooling changes a question.** Where the stored label and the
measurement disagree, that is a finding for a person.

## Why four rubrics and not one

What makes a figure sequence hard has nothing in common with what makes a Latin
square hard. A shared scale would flatten exactly the distinctions this exists to
draw, so each section is calibrated on its own terms and the tiers are not
comparable across sections.

## Agreement with the committed bank

| Section | Agreement | Residual |
| --- | --- | --- |
| Latin Squares | 125/125 (100%) | — |
| Mathematical Equations | 167/175 (95%) | 8 high measuring medium |
| Figure Sequences | 157/173 (91%) | 16 high measuring medium — see below |
| GAM | 12/19 (63%) | 7, on a sample too small to tune against |

Agreement is not the goal and should not be chased to 100%. See the Figure
Sequences note.

## Figure Sequences

| Measure | What it is |
| --- | --- |
| `symbols` | How many figures must be tracked |
| `activeRules` | Transformations in play: movement, rotation, colour **cycling** |
| `totalLoad` | `activeRules` plus acceleration and wall interactions |
| `peakLoad` | The most load riding a **single** symbol |
| `rotating`, `colourCycling`, `accelerating`, `boundaryInteracting` | Which mechanics, and how often |
| `movementKinds` | Distinct kinds of movement in one item |

**Load is not a count of rule slots.** A symbol has three — movement, rotation,
colour — so counting only those caps load at 3 and makes the high band
unreachable. The generator's own model is explicit that high is *"reachable
either by accelerating or by stacking movement + rotation + colour on a symbol
that also interacts with a wall"*, so acceleration and a wall interaction each
add load. Peak load therefore runs 1–5.

`colour: constant` is the **absence** of a colour rule, not a rule. Counting it
as one inflated `activeRules` on 202 of the bank's 429 symbols.

- **low** — peak load ≤ 2
- **high** — peak load ≥ 5, or peak load ≥ 4 with ≥ 4 symbols
- **medium** — everything else

**Why this will not reach full agreement, and must not be tuned until it does.**
The generator overlaps the symbol ranges on purpose (`medium [2,3]`, `high
[3,4]`) and deliberately keeps acceleration out of some high items, so that the
tier cannot be read off the picture — spec §2.3. Sixteen medium and sixteen high
items sit at load 4 with three symbols and are **not separable by anything in the
record**. Splitting them would be fitting noise, and would undo a property the
bank was designed to have.

Only documented mechanics are measured. **Reflection and changes in symbol count
are not**, because neither is attested — and the material states that figures
cannot disappear.

## Mathematical Equations

| Measure | What it is |
| --- | --- |
| `resolutionRounds` | Rounds of deduction **on the path to the asked letter** |
| `requiresElimination` | Some round had to solve equations together rather than one at a time |
| `largestEliminationCluster` | The most letters resolved simultaneously |
| `nonlinear` | A variable multiplied or divided by a variable |
| `variableProduct`, `quadratic`, `variableDivisor` | Which nonlinear shape |
| `interactingConstraints` | Equations naming three or more letters |
| `operations`, `largestValue` | Calculation burden |

**Letters are not counted; work is.** A four-letter system whose answer falls out
of one equation is one step of work, whatever else is on the page. An earlier
version gated the low band at two letters and triggered high at four, which
misplaced 56 items for carrying letters the question never needed.

**Elimination is found, not guessed.** Where no equation has a single unknown,
the rubric looks for the smallest set of *k* equations with exactly *k*
unresolved letters and resolves it as one round. An earlier version approximated
this as `letters − 1`, which scored simple two-letter simultaneous systems as
trivially low and deep ones as merely medium.

- **low** — ≤ 1 round and no elimination
- **high** — any nonlinear relation, or ≥ 3 rounds, or an elimination cluster of
  ≥ 3 letters, or elimination followed by further rounds
- **medium** — everything else

**On nonlinearity and honesty.** The official material states the operator set
(`+ − × ÷`) and that letters are integers 1–20. It does **not** state which
operands are permitted, so whether the examination uses variable-by-variable
products is `unknown`. The detector exists so such items can be measured when we
author them. Any item we write of that kind is **our** calibration and must not
carry `dmatAlignment: 'officially_documented'`.

## Latin Squares

| Measure | What it is |
| --- | --- |
| `forcedPlacementDepth` | Placements forced before the target is determined |
| `givens`, `density` | Cells supplied, and as a share of the grid |
| `offLinePrerequisites` | Placements the chain needed outside the target's own row and column |
| `techniques` | Which official techniques the solution path used |

- **low** — depth ≤ 2
- **high** — depth ≥ 5
- **medium** — depth 3–4

**Depth bands the item; sparsity does not.** An earlier version required few
givens for the high band, which demoted five genuinely deep puzzles for being
generously filled. Few givens is a thing to *aim for* when authoring, not
evidence that a puzzle was hard to solve — and the solver must still prove the
target is uniquely determined. An item whose target is not forced is not an item.

## GAM

| Measure | What it is |
| --- | --- |
| `reasoningSteps`, `blocksToCombine` | Steps, and how many source blocks must be joined |
| `transferDistance` | How far the reasoning travels from what the source states |
| `sourceBlocksCited`, `supportSpans` | Declared dependence on the source |
| `sourceMateriallyContributes`, `recognitionNotTransfer` | From the qualifying adjudication round |
| `ablationDeterminable` | An adjudicator answered it **without** the source |

- **low** — ≤ 1 step, ≤ 1 block
- **high** — ≥ 3 steps, ≥ 2 blocks, and judged transfer rather than recall
- **medium** — everything else

A long passage is not a hard question; it is a long passage. `ablationDeterminable`
always raises a warning, whatever tier is measured. Nineteen active questions is
too small a sample to tune thresholds against, and these have not been.

## Using it

```bash
npm run calibrate                           # summary and disagreements
node scripts/calibrate-report.mjs --all     # every question, measured
node scripts/calibrate-report.mjs --section latin-squares
```

The report prints a confusion matrix per section — stored label against measured
tier — and then groups the disagreements. It writes nothing.
