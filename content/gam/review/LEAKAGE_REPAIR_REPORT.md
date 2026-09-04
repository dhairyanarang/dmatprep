# GAM pilot — cross-question leakage repair

**4 September 2026.** Nothing committed, nothing deployed, no UI or route touched,
Core banks byte-identical.

---

## 1. What was wrong

The first independent adjudication round found **0 of 26 questions undeterminable
without their source**. The cause was not weak sources. It was sibling questions
giving each other away, which no question-level gate can see because it inspects
one item at a time while the candidate is shown the whole pack.

## 2. The gate (spec §5.9)

`scripts/gam/lib/leakage.mjs`, run by `verify:gam`, checks four classes across
every pair of questions in a pack:

| Class | Severity |
|---|---|
| literal answer leakage — an answer written out in a sibling's stem or options | error |
| sibling-stem leakage — a value the question must read is stated by a sibling's stem | error |
| sibling-option leakage — the same, via a sibling's options, distractors included | error |
| reconstructable numeric leakage — recoverable by one arithmetic step | error when the derivation walks the question's own working; warning otherwise |

Two refinements keep the signal clean, both principled rather than tuned:
`computation.expected` counts only when the correct option displays it (an answer
nobody can see cannot leak), and an exhibit's axis labels are excluded (a table's
column headings enumerate the choice space; they are not data).

**On the original packs: 19 errors across 3 packs. Now: 0.**

## 3. Every leak, and how it was closed

### Computational sciences — 8 errors
`q1` published SPLIT's whole table row as its option set, and `q5` and `q7` both
needed cells from that row; `q7` additionally carried `q1`'s answer (240) and
`q5`'s answer (1,294) among its own distractors.
→ `q1` moved to the PAIR row, whose values nothing else consumes. `q7` moved to
n = 4096, so it needs SPLIT's 340 rather than the 240 that `q5` needs.

### Business administration — 7 errors
`q3` and `q6` both restated the pack's 90,000 euros of fixed costs in their stems,
and `q5`'s options spelled out the 40 and the 25 — between them handing over every
figure `q2` exists to make the candidate find. `q3` and `q6` each stated `q2`'s
answer of 6,000 units in words.
→ `q3` became proportional and carries no figures at all. `q5` moved to a workshop
of its own whose figures it states itself. `q6` inverts the formula to a target
profit instead of repeating `q2`'s calculation with different numbers, which also
answers the redundancy finding.

### Engineering — 4 errors
`q1` asked for the brick layer's thickness and offered the four parameters of
Figure 2 as its options — the exact set `q2` needs. Every numeric read of that
figure has the same problem, because `q2` consumes all of it.
→ `q1` moved off the figure onto the formula legend, where the pack's own
distinction between `R` (one layer) and `R_total` (the wall) lives.

### Humanities — 0 errors
No figures to leak. Its faults were of a different kind; see §5.

## 4. What the mechanical gate cannot see

With the gate at zero, an independent adjudicator shown each pack's questions and
**no source at all** still found sibling couplings — *conceptual* and *structural*
rather than arithmetic. Three rounds of repair followed:

- one question's four options between them defined every term the pack's other
  five applied — the framework sat in a single option list;
- two questions about the same wall answered in watts cross-checked each other:
  only one option of the first, scaled as the second's scenario requires, landed
  in the second's option set;
- two "which routine is fastest" questions constrained each other by what their
  option sets did *not* offer;
- and one repair made it worse — moving a fact into a stem to close a coupling
  opened a wider one in the other direction, and had to be reverted.

The adjudicator now rates what it finds. A sibling that **settles** a question
fails the round; one that only **narrows** the choice blocks the pack from
shipping without failing validation, because severity is a judgement. An unrated
finding is treated as decisive.

**There is a floor here.** Seven questions on one small table read the same nine
numbers; six questions applying three named checks apply the same three
definitions. Pushing further trades leakage for source-independence — a question
rewritten to state its own figures cannot leak them, and also cannot need the
source for them. Spec §5.9 records this, and names pack size as the lever.

## 5. The finding that matters most (spec §5.10)

The four packs split cleanly under independent adjudication, and the line was not
domain, exhibit type or question style. It was whether the governing relationship
was **invented for the pack** or **taught everywhere**. §5.10 records the evidence
and is now a mandatory gate; what follows is what applying it did.

**Two dependencies, not one.** A question can need the source for its *data* or
for its *reasoning*. A question with neither is source-independent and fails. A
question with data alone is legitimate — reading a source and applying knowledge
is what a subject module is for — but a pack made only of those has contributed
numerals and nothing else. So the gate sits at two levels: every question needs
one of the two dependencies, and every pack needs a non-generic contribution that
more than one of its questions applies.

## 6. Disposition of the four packs

| Pack | Disposition |
|---|---|
| Computational sciences | **Kept.** 7 questions. Blocked at the pack level: see below. |
| Humanities | **Kept.** 6 questions, and the strongest of the four — its three-check framework is required by all six. |
| Engineering | **Repaired, and blocked.** Rebuilt around a stipulated U-value limit its subject naturally carries. |
| Business administration | **Retired.** Textbook cost-volume-profit end to end. |

**Engineering — repaired.** Its three failing questions read sentences stating
universal truths: resistances in series add, a sum exceeds its terms, R means one
layer. The new p4 supplies a U-value and an adequacy limit of 0.28 W/m²K, which is
a convention no candidate can derive, and q1, q5 and q6 now apply it. The two
general laws survive where §5.10 says generic knowledge belongs: order-
independence and area-independence each refute an option in q6, and neither is an
answer. q2's distractors were rebuilt at the same time — 90 and 144 were exactly
one half and four fifths of the key, and q4 named those fractions.

**Business administration — retired, not repaired.** Engineering was half working
already: q2, q3 and q4 turn on *this wall's* conductivity ratio of twelve to one
against a thickness ratio of three to one, which is a fact about the pack. Break-
even had no such half — every block is standard, and its surviving questions
substitute numerals into a formula the candidate brings. Making it depend on its
source would mean adding a governing rule the subject does not carry, which §5.10
calls replacement dressed as repair. The pack stays in the repository marked
`rejected`, as the evidence for §5.10, and counts for nothing.

## 7. Where the pilot stands

> ### ⚠ The independent round's two halves were not equally strong
>
> A session rate limit forced them onto different models: the blind re-answer was
> run by Claude Sonnet 5, the full ablation by Claude Haiku 4.5. Both are
> independent of the author, which is what §5.8 requires. But the ablation half
> answered **11 of 19** correctly with no source at all, where the stronger model
> had answered **17 of 19** on near-identical content — while rating more
> couplings as leaks. Its three decisive findings are one coupling that two
> earlier Sonnet rounds rated *narrowing*.
>
> **Every figure below comes from that round, the 19/19 blind agreement rate
> included. None of them should be quoted without this.** The caveat is recorded
> on the round itself, printed by `verify:gam` under the round rather than in a
> footnote, and carried verbatim into the reviewer's handoff.

| | |
|---|---|
| Active packs / questions | **3 / 19** (plus 1 pack retired) |
| Mechanical leakage errors | **0** |
| Blind re-answer vs the key | **19/19 agree** |
| Questions with neither dependence | **0** |
| Ambiguous items | **0** |
| Outside-knowledge failures | **0** |
| Originality hits | **0** |
| source-determined / supported / independent | **8 / 11 / 0** |
| Packs production-ready | **0 of 3** — all blocked on a person |

`npm run review:gam` writes `content/gam/review/handoff.json` and prints it: the
caveat first, then the three gates stated apart, then each pack's open decisions
with what follows from each answer. It is derived, never hand-edited, so it cannot
outlive the content it describes.

**The three gates are not the same thing, and the handoff keeps them apart.**
Automated validation is mechanical and exhaustive and proves nothing about
whether an answer is right. Independent adjudication is evidence from people —
here, models — who are not the author and never saw the key; it is strong
evidence and not proof, as the caveat above shows. Human review is a person
taking responsibility, and nothing substitutes for it.

Two blocks stand beyond human review, and both are recorded rather than argued
away:

- **Engineering — 3 decisive sibling findings.** q3 asks which layer carries the
  resistance; q4 and q6 both turn on the answer. It is one coupling seen from
  three sides. Two earlier and stronger ablation rounds rated the same coupling
  *narrowing*; this one rated it decisive.
- **Computational sciences — a thin §5.10 contribution.** The adjudicator credited
  the pack with one stipulated composition convention that one question applies,
  and did not credit the invented operation-count formulas the whole pack rests
  on — which §5.10's own table names as a contribution. The gate blocks on the
  recorded judgement; a reviewer should resolve which reading is right.

## 8. Known residuals, named rather than buried

- **Pack size is the lever.** Six or seven questions on one small source will
  couple: the CS pack's five narrowing findings are all the same table read five
  ways, and the humanities pack's two are its framework applied twice. Fewer
  questions per source is more likely to fix this than cleverer questions.
- **Adjudicator strength varies the answer.** A session rate limit forced the
  final round's two halves onto different models. The ablation half scored 11 of
  19 with no source, against 17 of 19 by the stronger model on near-identical
  content, while rating more couplings as leaks. The caveat is on the round.
- One standing warning in the retired pack, and `gam-eng-tr-001-q5` describes a
  ratio of 1.79 as "nearly twice" — the adjudicator called this a wording
  looseness rather than a defect.
- The pilot is now three packs, so the four-shape spread of §7 is short one
  text-plus-assumptions-plus-formula-plus-figure pack. A replacement should be
  built on a scheme its source defines — a stated costing or allocation rule —
  rather than on a formula the candidate can be assumed to know.
