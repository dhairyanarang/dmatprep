# Difficulty, measured

Difficulty is a measurement, not a label chosen at authoring time. `scripts/lib/calibrate.mjs`
reads a question and reports what it measured and what tier those measurements
suggest. `npm run calibrate` runs it over everything committed.

**Nothing in this tooling changes a question.** Where the stored label and the
measurement disagree, that is a finding for a person. The rubric is young and the
bank was built against an older reading of difficulty, so a disagreement is as
likely to mean the rubric needs refining as it is to mean the label is wrong.

## Why four rubrics and not one

What makes a figure sequence hard has nothing in common with what makes a Latin
square hard. A shared scale would flatten exactly the distinctions this exists to
draw, so each section is calibrated on its own terms and the tiers are not
comparable across sections.

## Figure Sequences

| Measure | What it is |
| --- | --- |
| `symbols` | How many figures must be tracked |
| `activeRules` | Transformations in play across the whole item |
| `peakLoad` | The most rules riding a **single** symbol |
| `rotating`, `colourCycling` | How many symbols turn, how many change colour |
| `accelerating` | Rules whose step grows (`x+1`) |
| `boundaryInteracting` | Symbols that bounce off an edge or travel along one |
| `movementKinds` | Distinct kinds of movement in one item |

`peakLoad` is peaked, not summed, on purpose: three rules riding one symbol is a
different kind of hard from three symbols carrying one rule each, and only the
first asks a candidate to hold several properties of the same object in mind.

- **low** — ≤ 2 symbols, peak load ≤ 2, ≤ 3 active rules
- **high** — ≥ 4 symbols, **or** peak load ≥ 4, **or** ≥ 3 symbols with ≥ 7 rules at peak 3
- **medium** — everything else

Only the documented mechanics are measured: movement, rotation, colour, `x+1`
acceleration, boundary bounce and border travel. **Reflection and changes in symbol
count are not measured, because neither is attested in the official material** — and
the material states explicitly that figures cannot disappear.

## Mathematical Equations

| Measure | What it is |
| --- | --- |
| `substitutionSteps` | Waves of deduction before the asked letter falls out |
| `requiresElimination` | Substitution alone never reaches it; the system must be solved whole |
| `effectiveSteps` | `substitutionSteps`, or `letters − 1` when elimination is required |
| `nonlinear` | A variable multiplied or divided by a variable |
| `variableProduct`, `quadratic`, `variableDivisor` | Which nonlinear shape |
| `interactingConstraints` | Equations naming three or more letters |
| `operations`, `largestValue` | Calculation burden |

Steps are counted, not letters. A four-letter system solved by one substitution is
easier than a three-letter system that will not come apart at all.

- **low** — ≤ 2 letters, ≤ 1 effective step, no interacting constraint
- **high** — any nonlinear relation, **or** ≥ 3 effective steps, **or** ≥ 4 letters with ≥ 2
- **medium** — everything else

**On nonlinearity and honesty.** The official material states the operator set
(`+ − × ÷`) and that letters are integers 1–20. It does **not** state which operands
are permitted, so whether the examination uses variable-by-variable products is
`unknown`. The detector exists so such items can be measured when we author them.
Any item we write of that kind is **our** calibration and must not carry
`dmatAlignment: 'officially_documented'`.

## Latin Squares

| Measure | What it is |
| --- | --- |
| `givens`, `density` | Cells supplied, and as a share of the grid |
| `forcedPlacementDepth` | Placements forced before the target is determined |
| `offLinePrerequisites` | Placements the chain needed outside the target's own row and column |
| `techniques` | Which official techniques the solution path used |

- **low** — depth ≤ 2 with ≥ 10 givens
- **high** — depth ≥ 5 with ≤ 9 givens
- **medium** — everything else

Sparsity is a consequence, never a lever. A puzzle is not made harder by removing
cells; it is made harder by needing a longer chain, and the solver must still prove
the target is uniquely determined. An item whose target is not forced is not an
item.

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
always raises a warning, whatever tier is measured.

## Using it

```bash
npm run calibrate                           # summary and disagreements
node scripts/calibrate-report.mjs --all     # every question, measured
node scripts/calibrate-report.mjs --section latin-squares
```

The report prints a confusion matrix per section — stored label against measured
tier — and then groups the disagreements. It writes nothing.
