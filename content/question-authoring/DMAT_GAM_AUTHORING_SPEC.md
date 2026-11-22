# dMAT Subject Module (General Academic Module) — Authoring Specification

**Status: specification only. No GAM content has been generated.**

This is the source of truth for Module B, as
`DMAT_QUESTION_AUTHORING_SPEC.md` is for Module A. Read it before writing or
generating anything for the subject module.

**Primary authority:** g.a.s.t. *dMAT — Preparatory Materials for Test Takers,
General Academic Module*, 04.08.2026 build, **pp. 4–6 and 34–58**. Fetch from
the `www.` host (the bare `d-mat.de` certificate has expired) and extract with
`node scripts/extract-pdf.mjs`.

Every statement below is labelled:

| Label | Meaning |
|---|---|
| **OFFICIAL** | Stated in the material, or directly observable in its four worked exercises. |
| **INFERENCE** | Derived from the official material by observation across the exercises. Legitimate, must stay labelled. |
| **PROPOSED** | Our engineering decision. The official material is silent. Never present as an exam fact. |

---

## 0. What this module actually is

**OFFICIAL (p. 6).** The dMAT has two parts: a Core Module measuring general
study aptitude, and subject-specific modules. The exam runs *"about three hours
with a break of 30 minutes between the two parts"*.

**OFFICIAL (p. 6), verbatim and load-bearing:**

> The examination tasks are knowledge-based and consist of a combination of a
> typical subject-related problem (**input**) and corresponding **single-choice
> questions**. The dMAT therefore requires subject knowledge and application
> skills, but **not memorized factual knowledge**.

That sentence is the whole design brief. The unit of content is not a question —
it is an **input plus its questions**. "General Academic Module" is the name of
this particular subject module, and it is the one the preparation PDF documents.

---

## 1. Officially documented mechanics

**OFFICIAL, p. 34, verbatim:**

> In this task type you see a **text** and a number of questions which you have
> to answer. There are **4 answer options** for each question. For each question,
> there is only **one correct solution**. The text, the questions and the answer
> options **may contain figures, tables and formulas**. For working on the entire
> subject test in the exam, you have **90 minutes in total**. If you do not know
> an answer, please guess which answer might be correct. You are not allowed to
> take notes in the exam.

| Mechanic | Label |
|---|---|
| One shared source ("text") with several questions attached | OFFICIAL |
| Exactly **4** answer options per question | OFFICIAL |
| Exactly **one** correct option | OFFICIAL |
| Single choice (one selection per question) | OFFICIAL |
| Source **may** contain figures, tables, formulas | OFFICIAL |
| **Questions and answer options** may also contain figures, tables, formulas | OFFICIAL |
| 90 minutes for the whole subject test | OFFICIAL |
| Candidates are told to guess when unsure | OFFICIAL |
| No notes, at any point | OFFICIAL (pp. 6, 34) |
| Requires subject knowledge + application, **not** memorised facts | OFFICIAL (p. 6) |
| Topics span mathematics, computational sciences, natural sciences, engineering, business administration, economics, social sciences, humanities | OFFICIAL (p. 34) |

**OFFICIAL caveats the material states about itself (p. 34):** the four sample
exercises *"do not necessarily reflect the difficulty level of the questions on
the actual test"*, and *"represent only a selection of the possible topics"*.
**Do not calibrate difficulty from the samples and claim it is exam-accurate.**

**OFFICIAL (p. 4):** detailed task instructions exist *only* in the preparation
materials; in the exam candidates see only short reminders.

### 1.1 The four official exercises, as observed

**OFFICIAL** (structure counted directly from pp. 35–58):

| Ex | Domain | Source composition | Questions |
|---|---|---|---|
| 1 | Mathematics — vector calculus | text + Figure 1 + Table 1 | **8** |
| 2 | Natural sciences / engineering — hydrostatics | text + Figure 1 + Figure 2 + inline formula; **three questions carry their own sketch** | **6** |
| 3 | Business administration — optimal order quantity | text + bulleted assumptions + formula + one figure used by Q7 | **7** |
| 4 | Social sciences — research strategies | **text only** | **6** |

27 questions across 4 sources. Answer keys are a single letter A–D followed by a
short worked justification. **Exercise 4's solutions cite the source by
paragraph** — *"see paragraphs 1 and 2"*, *"see paragraphs 4 and 6"* — which is
the official material demonstrating source-to-answer traceability. §5 makes that
machine-checkable.

### 1.2 What the official material does NOT specify

Recording this explicitly so nothing here gets invented later:

- **How many questions the real subject module contains.** Only "90 minutes
  total" is given. The samples range 6–8 per source; that is a sample property,
  not a rule.
- **How many source packs a real exam uses**, or how many domains appear in one sitting.
- **Any difficulty tiering.** No low/medium/high labels exist for this module,
  and the material warns the samples are not difficulty-representative.
- **Topic weighting** across the eight named areas.
- ~~**Negative marking.**~~ **RESOLVED 22 Nov 2026 — it is officially stated and
  this is no longer an unknown.** g.a.s.t. writes, under "Tips for taking the
  exam", that no points are deducted for wrong answers; the sentence appears on
  both the preparation page and the current dMAT-in-India page. See the entry in
  CLAUDE.md. What remains unknown is how the score is computed beyond being a
  conversion of correct answers, and whether an unanswered item is treated
  differently from a wrong one.
- **Source length limits**, register, or whether an input may be non-expository
  (all four samples are expository).
- **Ordering of questions within a pack** (by difficulty or otherwise).
- **Whether one question may depend on another's answer.** No sample does.

---

## 2. Why GAM must not reuse the Module A architecture

Module A's central guarantee is that **code decides every answer**: an
independent solver re-derives the result, uniqueness is proven exhaustively, and
a model only ever shapes prose. That guarantee is available because the subject
matter is closed and formal.

**It is not available here, and pretending otherwise would be the single most
dangerous thing we could do.** A hydrostatics scenario or a research-methods
classification has no solver. The honest position:

> **GAM cannot inherit Module A's correctness proof. It replaces "code proves the
> answer" with "every claim is traceable to a span of the source, and the
> traceability is machine-checked" — plus an adversarial re-answer pass and a
> mandatory human gate.** That is weaker, and the spec says so rather than
> dressing it up.

Structural differences that follow:

| | Module A (Core) | Module B (GAM) — PROPOSED |
|---|---|---|
| Unit of content | one standalone question | **source pack → N linked questions** |
| Answer authority | independent solver, exhaustive | source traceability + blind re-answer + human review |
| Origin | deterministically generated from seed | **authored** (model-drafted, human-reviewed) |
| Reproducibility | same seed → same bytes | content-addressed, immutable once reviewed |
| Difficulty | measured by code | measured proxies, but **PROPOSED**, never claimed official |
| Exposure | per question | **per pack** — seeing one question burns the source |
| Uniqueness | proven | argued, refuted per distractor, checked by ablation |

Do not force packs through `lib/types/question.ts`'s `Question` union or
`scripts/lib/verify.mjs`. They encode assumptions (a code-derivable answer, a
seeded generator stamp) that do not hold.

---

## 3. Content model — PROPOSED

### 3.1 Source pack

```ts
export type GamDomain =
  | 'mathematics' | 'computational-sciences' | 'natural-sciences' | 'engineering'
  | 'business-administration' | 'economics' | 'social-sciences' | 'humanities'
// exactly the eight areas named on p. 34; no others may be added

/** Every block carries a stable id — the anchor for dependency tracking (§5). */
export type SourceBlock =
  | { kind: 'heading';   id: string; text: string }
  | { kind: 'paragraph'; id: string; text: string }
  | { kind: 'list';      id: string; ordered: boolean; items: string[] }
  | { kind: 'formula';   id: string; latex: string; caption?: string
      legend?: { symbol: string; meaning: string }[] }
  | { kind: 'table';     id: string; caption: string; columns: string[]; rows: string[][] }
  | { kind: 'figure';    id: string; caption: string; spec: GamFigureSpec }

export type SourcePack = {
  id: string                       // e.g. 'gam-mathematics-vectors-001'
  domain: GamDomain
  title: string
  blocks: SourceBlock[]
  /** Terms the pack itself defines, so §5.2 can tell "defined here" from "assumed". */
  defines: string[]
  provenance: {
    originality: 'original'        // never an excerpt — see §4.6
    draftedBy: string              // generator or author id
    reviewedBy?: string
    reviewedAt?: string            // required before publish
  }
  contentHash: string              // packs are immutable once reviewed
}
```

**`GamFigureSpec` renders as SVG from structured state — no image assets, ever**,
matching the Module A rule in `CLAUDE.md`. This also keeps figures inspectable by
the validators rather than opaque bitmaps.

### 3.2 Linked question

```ts
export type GamReasoningType =
  | 'retrieve'              // locate a stated fact          (Ex 4 Q1, Q2)
  | 'read-exhibit'          // read a figure or table        (Ex 1 Q1, Ex 3 Q7)
  | 'apply-formula'         // substitute into a given rule  (Ex 1 Q4/Q6, Ex 3 Q4)
  | 'qualitative-inference' // reason from stated principles (Ex 2 Q3/Q4/Q5)
  | 'comparative'           // rank or compare cases         (Ex 2 Q6)
  | 'sensitivity'           // effect of changing an input   (Ex 3 Q5/Q6)
  | 'generalisation'        // what holds in all cases       (Ex 1 Q8)
  | 'classify-scenario'     // map a scenario onto the model (Ex 4 Q4/Q5/Q6)
// INFERENCE: these eight are abstracted from the 27 official questions.

export type GamQuestion = {
  id: string
  packId: string
  stem: string
  /** Official: a question may carry its own figure/table/formula (Ex 2 Q5/Q6). */
  stemBlocks?: SourceBlock[]
  options: [GamOption, GamOption, GamOption, GamOption]   // exactly four
  correctOptionId: string
  reasoning: GamReasoningType

  /** Source blocks the answer genuinely requires. Non-empty, validated by ablation. */
  dependsOn: string[]
  /** Verbatim spans backing the answer; each quote must occur in its block. */
  supportSpans: { blockId: string; quote: string }[]
  /** Machine-checkable arithmetic, where the answer is computable. */
  computation?: { expression: string; expected: number; unit?: string }

  explanation: string
  distractorNotes: Record<string, string>
  distractorTypes: Record<string, GamDistractorFamily>
  /** Why each wrong option is wrong, cited to a block. */
  refutations: Record<string, { blockId: string; reason: string }>
  hints: [Hint, Hint, Hint]

  difficulty: Difficulty          // PROPOSED — see §3.4
  meta: {
    stepCount: number
    blockSpan: number
    transferDistance: 0 | 1 | 2
    requiresExhibit: boolean
  }
}
```

### 3.3 Distractor families — PROPOSED, abstracted from the official keys

`misapplied-formula` · `swapped-quantities` · `wrong-direction-of-effect`
(Ex 3 Q2/Q6 turn on exactly this) · `right-concept-wrong-scope` ·
`plausible-but-unstated` · `contradicts-source` · `arithmetic-slip`

### 3.4 Difficulty — PROPOSED, and deliberately humble

The official material gives **no** difficulty model for this module and warns
its samples are not difficulty-representative. So difficulty here is ours, it is
measured rather than asserted, and it is never described to the candidate as
official calibration:

```
stepCount        distinct inference or computation steps to the answer
blockSpan        number of distinct source blocks the answer depends on
transferDistance 0 = stated in source · 1 = direct application · 2 = novel scenario
requiresExhibit  whether a figure or table must be read
```

| Tier | Requirement |
|---|---|
| low | `stepCount ≤ 1`, `transferDistance = 0`, `blockSpan = 1` |
| medium | `stepCount 2–3`, or `transferDistance = 1` |
| high | `stepCount ≥ 3` and `transferDistance = 2`, or `blockSpan ≥ 3` |

---

## 4. Content rules

**4.1 Allowed (OFFICIAL).** One shared source; 4 options; exactly one correct;
figures/tables/formulas in source, stem or options; the eight named domains;
reasoning that applies supplied knowledge.

**4.2 The knowledge line (OFFICIAL, p. 6).** The exam *"requires subject
knowledge and application skills, but not memorized factual knowledge"*. So a
question may require a candidate to reason like someone educated in the field —
Ex 2 Q6 expects them to see that a narrow hull has less restoring moment — but it
may **never** require a remembered constant, date, name or formula that the pack
does not supply. Every quantity and rule needed for the arithmetic must be in the
pack or the stem.

**4.3 Forbidden.**
- Requiring a fact, constant or formula not in the pack (violates 4.2).
- More or fewer than 4 options; more than one defensible answer; no correct answer.
- A distractor that is defensible under a legitimate reading of the source.
- "None of the above" as a correctness dodge (Ex 3 Q2 shows the form is legal when
  it is the genuine answer, but it must never be a filler).
- A question answerable **without** the pack (see the ablation test, §5.6).
- Dependence on another question's answer — no official sample does this.
- Reproducing or paraphrasing the official exercises or any copyrighted source.
- Contested or non-consensus claims presented as settled.

**4.4 Uniqueness.** Exactly one option must be defensible from the pack. Each of
the other three must have a `refutation` naming the block that rules it out.

**4.5 Explanations and hints.** The explanation must cite the blocks it relies on,
and every cited block must appear in `dependsOn`. Three hints, escalating —
point at the region of the source, name the relevant rule or exhibit, then
describe the operation — and none may state the answer or a value that trivially
yields it. Same ladder discipline as Module A §8.

**4.6 Originality and copyright.** `CLAUDE.md` forbids committing the official
PDFs; the same spirit binds the content. Every pack is **original prose written
for this project**. Never excerpt or lightly paraphrase g.a.s.t. material, a
textbook, or a web source. Domains and mechanics come from the official
material; sentences never do. Validated in §5.7.

---

## 5. Validation strategy

Seven gates. **1, 4, 5, 6, 7 are fully mechanical. 2 is a heuristic that
escalates. 3 is mechanical plus a mandatory human decision.**

**5.1 The answer follows from the source.** Every `supportSpans[].blockId`
resolves to a block in the pack, and every `quote` occurs verbatim in that block.
`dependsOn` must be non-empty. Where `computation` is present, evaluate the
expression and require it to equal `expected` and to match the correct option's
value — this restores Module-A-grade certainty for the computable subset
(roughly the `apply-formula` and `read-exhibit` types).

**5.2 No unsupported outside knowledge.** Extract candidate technical terms and
every numeric constant from stem and options. Each must be traceable to the pack
(`defines`, or occurring in a block), be present in an allow-listed
general-academic lexicon, or be introduced by the stem itself. Anything else is
flagged for review. **This is a heuristic, not a proof** — it catches an
unexplained "Reynolds number" or a bare `9.81`, and it will not catch every
subtle appeal to background knowledge. It escalates; it does not certify.

**5.3 Exactly one defensible answer.** Three layers, all required:
1. every wrong option carries a `refutation` whose `blockId` resolves (mechanical);
2. an **adversarial blind re-answer**: a second model, given the pack and the
   question but not the key, must select the intended option. Disagreement, or a
   defensible argument for a second option, rejects the item;
3. **human review before publish** — non-negotiable, and the reason this module
   cannot be scaled as freely as Module A.

**5.4 Distractors are wrong for source-supported reasons.** Each refutation must
cite a block and name a family from §3.3. A refutation citing no block, or citing
a block the pack does not contain, fails.

**5.5 Explanations reflect the source.** Every block cited in the explanation
must be in `dependsOn`; every `dependsOn` entry should be reachable from the
explanation. Divergence means the explanation is describing a different route
than the one recorded.

**5.6 Linked questions genuinely depend on the source — the ablation test.**

> **CORRECTED 4 September 2026, after the first pilot.** This section previously
> said that any question answerable without the pack "must be rejected". Applying
> that rule honestly to the pilot would have failed roughly half of it — and it
> would also fail official Exercise 2 Question 6, the ship-stability item, which
> any reader with mechanics knowledge can reason through. The rule contradicted
> the official description of the module, which is explicit that it "requires
> subject knowledge and **ap plication skills**, but not memorized factual
> knowledge" (GAM PDF p. 6). A pure reading-comprehension test would be the wrong
> instrument for this module.
>
> **PROPOSED — the three classes below are our engineering scheme for judging
> source dependency. They are not an official dMAT classification, and must never
> be presented as one.**

Two ablations, of very different strength.

- **Targeted ablation — mechanical and decisive.** Remove the blocks a question
  declares in `dependsOn`. If the evidence backing the answer is still available
  from the remaining blocks, `dependsOn` is wrong or incomplete: fix the metadata
  or reject. This is fully automated in `scripts/gam/lib/ablation.mjs`.

- **Full ablation — a classification, not a pass/fail.** Present the stem and
  options alone, with no pack, and judge which of three classes the question
  falls into:

| Class | Meaning | Verdict |
|---|---|---|
| **source-determined** | The question cannot be answered without the pack. The quantities, rules or framework it turns on are specific to the pack. | Accept |
| **source-supported** | A candidate already literate in the domain could reason to the answer, but the pack supplies the relevant framework and information, and **no memorised outside fact is required**. | **Accept** — this is the zone the official module is aimed at |
| **source-independent** | The pack contributes nothing material: the answer follows from the stem and options alone, or from general knowledge the pack neither supplies nor engages. | **Reject** |

Only `source-independent` is a defect. A bank made entirely of `source-determined`
items would be a reading test; a bank drifting towards `source-independent` would
be a general-knowledge quiz. Both miss what this module measures.

**Two cautions the pilot exposed.**

1. `source-supported` is the easy class to over-use, because it is the one an
   author reaches for when a question is hard to make genuinely dependent. The
   first pilot's author-side round claimed 12 `source-determined` items; the
   independent round found **none**, and reclassified all twelve as
   `source-supported`. An author is not a reliable judge of this.

   **No fixed percentage is imposed here, and none should be invented before
   there is evidence to calibrate it against.** What is required instead is that
   **pack-level dependency quality is demonstrated, per pack, by an independent
   round, before any scaling decision.** A pack whose questions are all
   `source-supported` is not automatically wrong — the module is a
   knowledge-and-application test — but it must be shown that the pack is doing
   real work rather than decorating questions that would stand without it.
   Calibration targets follow the repaired pilot, not this document.
2. **Text-only packs in familiar domains are structurally the hardest to make
   `source-determined`**, because they have no pack-specific quantities to turn
   on. The pilot's humanities pack came out entirely `source-supported`. That is
   not by itself a defect, but it is the case where the line between
   `source-supported` and `source-independent` is thinnest and where independent
   adjudication matters most.

**The classification must be made by someone other than the author** — see §5.3
and §5.8. An author already knows the answer and cannot judge whether it is
reachable without the source.

**5.10 The source must materially contribute. MANDATORY.**

> Written 4 September 2026, **corrected 5 September 2026** against the official
> exercises. The first version of this section was wrong, and it is worth saying
> plainly how, because the error cost a compliant pack.

### What the earlier version got wrong

It required the pack to contribute a *materially non-generic* relationship, and
failed any question a domain-literate candidate could answer with the source
removed. **The official material does not work that way, and could not survive
that test.**

Official Exercise 3 is the optimal order quantity model — a textbook formula,
`Q* = √(2DS/H)` — and its seven questions are: identify a stated assumption;
comparative statics; why the model uses `Q/2`; **a pure plug-in with D = 1800,
S = 50, H = 2**; two further comparative statics; and which line of a plotted
chart shows total ordering costs. Official Exercise 2 explains `p = ρgh`,
standard hydrostatics, then asks what happens to a flooded compartment when
trapped air compresses. Official Exercise 1 is vector algebra: a
vector-literate reader answers much of it unaided.

Under the earlier rule, all three would fail. **A rule the exam's own material
fails is not a standard; it is a bug.** It retired a break-even pack that matched
Exercise 3 question for question.

### The corrected principle

**A question passes when the supplied source materially contributes to solving
that specific task, and the task requires the candidate to do something with it
— apply, transfer, interpret, calculate, compare, test sensitivity, classify or
reason — rather than merely recall a fact.**

**The governing academic relationship may be entirely standard.** A formula every
candidate knows, applied to values only this source supplies, is a legitimate GAM
question, because it is what the official material does. p. 6 is explicit that the
Subject Module is *knowledge-based* and asks for "developed transfer and
application skills, rather than memorised factual knowledge" — the discriminator
is **transfer**, not novelty of the relationship.

### What a question may legitimately depend on

Any of these, alone or combined:

| Contribution | Example from the official exercises |
|---|---|
| **data** | Ex 3 Q4 plugs D, S and H, all given in the source, into the stated formula |
| **rule** | Ex 2 states pressure rises ~1 bar per 10 m; Q1 applies it to 10,000 m |
| **framework** | Ex 4 defines deductive and inductive strategies; every question classifies against them |
| **assumption** | Ex 3 Q1 asks which stated assumption the model rests on |
| **definition** | Ex 1's legend fixes what the scalar, vector and triple products return; Q3 turns on it |
| **exhibit** | Ex 3 Q7 asks which plotted line is which; Ex 1 Q1 reads vectors off a diagram |

### The one thing that fails

**A question whose answer is unchanged when the source is removed entirely** —
needing none of its data, none of its rules, none of its exhibits — is not a GAM
question. It is a general-knowledge question with a passage attached. **That is
the whole of the bar**, and it is much lower than the bar this section used to
set.

> **Recall does not fail. Corrected the same day, for the same reason.**
>
> A first draft of this section also failed any question that asked the candidate
> to find something in the source rather than do something with it. Applied to the
> pilot it flagged five questions — and every one of them turned out to match a
> form the official material demonstrates:
>
> - **Assumption identification.** Official Ex 3 Q1: *"Which statement correctly
>   describes a central assumption of the optimal order quantity model?"*, with
>   four plausible rival assumptions as options.
> - **Exhibit reading.** Official Ex 3 Q7: *"Which line shows the total fixed
>   ordering costs?"*, answered with bare line labels. Official Ex 1 Q1 reads
>   vectors off a diagram.
> - **Definition discrimination.** Official Ex 4 Q1 and Q2 ask which statement
>   applies to the deductive and inductive strategies.
>
> A rule that fails what the exam's own exercises do is wrong, however
> reasonable it sounds — which is the lesson of this whole section. `retrieve`
> and `read-exhibit` are legitimate GAM reasoning types.

`requiresApplication` is still recorded per question, and a false lands as a
review flag rather than a failure. **Balance is the reviewer's judgement**: the
official exercises mix computation, application, classification, assumption
identification and exhibit reading, and a pack made *entirely* of lookups would
be a reading test even though no single lookup is a defect. There is no
officially stated ratio, so none is imposed here. <span>UNKNOWN</span>

### How it is judged

Not mechanically, and it cannot be. The independent adjudicator of §5.8 answers
each question with the source in hand and records:

- **`sourceMateriallyContributes`** — did the source supply data, a rule, a
  framework, a definition or an exhibit that this task actually used? Set false
  only when the answer would be identical with the source removed entirely.
- **`contributionTypes`** — which of `data`, `rule`, `framework`, `definition`,
  `exhibit`, `other` were used.
- **`requiresApplication`** — did the task require doing something with the
  material, rather than repeating it?

A question fails §5.10 when `sourceMateriallyContributes` is false. That is the
only failure. `requiresApplication` is recorded and flagged for the reviewer but
does not fail an item on its own — see below. Both are judgements, and both are
recorded per question so a reviewer can disagree with a specific one rather than
with a score.

### What is no longer required

- **Not required:** that the governing relationship be invented for the pack.
- **Not required:** that a domain expert be unable to answer without the source.
- **Not required:** that every question apply some single non-generic element,
  or that such an element exist at all.

The pack-level test that a contribution be "load-bearing across more than one
question" is withdrawn with the rule that created it. Coverage and balance across
a pack remain a matter for the human reviewer.

### What the earlier rule got right, and keeps

Two findings from the strict period survive it, because they were never about
genericity:

- **§5.9 cross-question leakage** stands unchanged. A question settled by a
  sibling is broken regardless of where its content comes from.
- **Recall-only items are still weak.** The official exercises ask the candidate
  to *use* what the source says. An item that only asks them to find it again is
  thin, and is recorded as `recognitionNotTransfer` for the reviewer to weigh.

**5.7 Originality.** N-gram overlap (proposed: any shared 8-gram) against the
extracted official PDF text and any reference corpus used while drafting. Any hit
fails. Packs are content-hashed and immutable once reviewed.

**A round records who judged it, and a figure from a round is never quoted
without them.** Adjudicators are not interchangeable, and the pilot proved it at
first hand: when a rate limit forced one round's two halves onto different
models, the weaker half answered 11 of 19 questions correctly with no source at
all where the stronger had answered 17 of 19 on near-identical content — and
rated more couplings as leaks while doing it. Both were independent of the
author, which is all this section requires of them, and their evidence is still
worth having. But a round whose halves were not equally strong **must carry a
`caveat` saying so**, and every figure drawn from it — the blind agreement rate
included — must be reported with that caveat attached. `verify:gam` prints it
under the round rather than in a footnote, for exactly this reason.

**And three things stay apart, in the tooling and in the prose.**

| | What it is | What it is not |
|---|---|---|
| **Automated validation** | mechanical and exhaustive: coherence, traceability, originality, arithmetic leakage | any evidence that an answer is right |
| **Independent adjudication** | evidence from adjudicators who are not the author and never saw the key | proof — it varies with who adjudicates |
| **Human review** | a person taking responsibility for the pack | substitutable by either of the above |

Blurring them is how *it passed validation* comes to sound like *it is right*.
`npm run review:gam` writes the handoff a reviewer works from, and states the
three separately at the top of it.

A round certifies **the content it actually saw**. It therefore records the
content hash of every pack it judged, and stops counting the moment one of them
changes. Without that, repairing a pack in response to a review leaves the review
in force over content that no longer exists — which in the first pilot briefly
produced three "the adjudicator disagrees with the key" errors on questions the
adjudicator had never been shown. Superseded rounds are kept as the record of
what was found and count for nothing.

**5.9 Cross-question leakage — a SOURCE-PACK-LEVEL gate. PROPOSED, mandatory.**

> **Added 4 September 2026, after the first independent adjudication round.**

Every check in §5.1–§5.5 inspects one question at a time. **That is not enough,
and the first pilot proved it.** In this module the candidate is shown the source
and *all* of its questions together, so the questions are not independent items:
each one is part of the others' visible context. A pack can therefore be composed
entirely of individually sound questions and still be broken as a whole.

The first pilot's independent ablation round found **0 of 26 questions genuinely
undeterminable without the source**, and the cause was not weak sources. It was
sibling questions giving each other away:

- a distractor equal to the exact product of two table values, and another equal
  to their exact sum, which together pinned both values;
- a sibling option that stated another question's answer in words
  (*"It stays at 6,000 units"*, where 6,000 was the answer next door);
- the pack's three governing figures reconstructable from three different
  sibling stems and options.

**No question may become answerable, or materially easier, because a sibling
question exposes its answer or an intermediate value it depends on.**

Four classes must be checked across every pair of questions in a pack:

| Class | What it means |
|---|---|
| **Literal answer leakage** | A question's answer — as a value or in words — appears in a sibling's stem or options. |
| **Sibling-stem leakage** | A fact or quantity a question must take from the pack is instead stated in a sibling's stem. |
| **Sibling-option leakage** | The same, but supplied by a sibling's options, including its distractors. Distractors leak as readily as keys. |
| **Reconstructable numeric leakage** | A value a question depends on is recoverable from numbers visible elsewhere in the pack's questions by an obvious derivation — sum, difference, product, quotient, doubling, halving. |

Distractors deserve particular suspicion. A distractor is usually built by
applying a plausible *wrong* operation to the right inputs, which means it
frequently encodes those inputs exactly. The pilot's `240 x 1054` and
`240 + 1054` distractors were both constructed that way, and between them they
gave away the two table values the pack existed to supply.

`scripts/gam/lib/leakage.mjs` implements this gate and `verify:gam` runs it.
Literal leakage is an error. Arithmetic reconstruction is an error where the
derivation is exact and the operands are non-trivial; the tool reports the
derivation it found so the author can judge.

**No amount of question-level validation substitutes for this.** A pack must be
validated as a pack.

**And the mechanical gate is not the whole gate.** It reads numbers. The first
repaired pilot passed it with zero errors and an independent adjudicator, shown
each pack's questions side by side with no source at all, still found twelve
questions given away — by *concepts* and by *option-set structure*:

- one question's four options between them defined every term the pack's other
  five questions applied, so the framework the source existed to supply sat in a
  single option list;
- two questions asking for the same wall's heat flow in watts cross-checked each
  other: only one option of the first, halved as the second question's scenario
  requires, landed inside the second's option set;
- two questions asking which routine was fastest constrained each other by what
  their option sets did *not* offer — no option of the first entertained a
  possibility, which retired that possibility in the second for free.

None of this is arithmetic and none of it can be caught by string processing.
**The independent adjudicator under §5.8 is therefore given the pack's questions
without its source and asked specifically whether any sibling gives another
away, and asked to rate what it finds.** A sibling that *settles* a question is
as fatal as a wrong key and fails the round. A sibling that only *narrows* the
choice is a real fault and a real cost to the item, but whether it sinks the item
is a judgement rather than a rule, so it blocks the pack from shipping without
failing validation. An unrated finding is treated as decisive. Two rules follow for
authors, both learned the hard way:

- a distractor must not be a correct statement of something another question
  turns on — this is how definitions leak;
- two questions about the same object should not both be answered in the same
  units, because their option sets will then constrain each other. Ask one for a
  quantity and the other for a factor;
- a stem must not assert a fact that another question's answer turns on. This is
  the trap a repair walks into: closing a coupling by moving the fact into a
  stem opens it wider in the other direction, and the pilot did exactly that
  once and had to be reverted.

**There is a floor here, and it is a fact about pack size rather than a fault
that can be repaired away.** Seven questions built on one small table read the
same nine numbers; six questions applying three named checks apply the same three
definitions. Some mutual constraint is intrinsic to a coherent pack, and pushing
against it trades leakage for source-independence — a question rewritten to state
its own figures cannot leak them, and also cannot need the source for them. Where
that line sits is a calibration question the repaired pilot exists to inform, and
**pack size is one of the levers**: it may be that fewer questions per source is
the answer rather than cleverer questions.

**5.8 Independent adjudication — PROPOSED, and a hard gate.**

Self-adjudication does not count. An author who has just written a question knows
its answer and cannot judge blind. The pilot's own adjudication round was
performed by the authoring model and is recorded as such; it is useful evidence
and it is **not** review.

Adjudication rounds live in `content/gam/review/adjudications.json`. Each round
records its `kind` (`self` or `independent`) and an `adjudicator` block, and each
per-question record carries, separately from any author or reviewer field:

| Field | Meaning |
|---|---|
| `dependency` | one of the three classes in §5.6 |
| `requiresOutsideKnowledge` | whether answering needs a fact the pack does not supply |
| `sourceMateriallyContributes` | whether the source supplied something this task used — data, a rule, a framework, a definition or an exhibit. False only when the answer is unchanged with the source removed entirely (§5.10) |
| `contributionTypes` | which of those the task actually used |
| `requiresApplication` | whether the task asked the candidate to do something with the material, rather than repeat it (§5.10) |
| `exactlyOneDefensibleOption` | whether a second option can be argued for |
| `chosenOption` | the option picked blind, before seeing the key |
| `rationale` | why, in the adjudicator's own words |
| `adjudicator` | identity and model, and whether independent of the author |
| `adjudicatedAt` | ISO date |

A round counts as independent only when **all** of the following hold:

- `kind === 'independent'`;
- `adjudicator.independentOfAuthor === true`;
- `adjudicator.identity` differs from every `provenance.draftedBy` in the packs it
  covers — an author cannot certify their own work by relabelling the round;
- it covers every question in the pack.

A pack becomes production-ready only after an independent round agrees with every
key, finds no `source-independent` item, and a **person** has signed the pack off
(`reviewStatus: 'human-reviewed'` with a named reviewer and a date). Automated
validation alone yields `automated-pass`, which is not the same thing and must
never be described as if it were.

---

## 6. Integration with the existing app — PROPOSED, not yet built

Three real consequences, flagged rather than acted on:

1. **`SectionId` is Core-only** (`lib/sections.ts`) and is baked into
   `AttemptRecord`, `ActiveSessionStage` and `lib/practice/selection.ts`.
   Introduce a separate `moduleId: 'core' | 'gam'` with a `GamPackId` rather than
   widening `SectionId`, which would leak into progress typing and the Supabase
   schema everywhere.
2. **Exposure must be tracked per pack, not per question.** Seeing one question
   burns the source for every other question attached to it. Sessions should draw
   **whole packs**.
3. **Attempts stay immutable and aggregates stay derived** — both `CLAUDE.md`
   rules hold unchanged.

No UI work is specified here, and none has been done.

---

## 7. Pilot plan — PROPOSED

**4 source packs, 24–28 questions. Nothing generated until this spec is approved.**

| Pack | Domain | Source format | Questions |
|---|---|---|---|
| 1 | mathematics or computational-sciences | text + formula + table | 7 |
| 2 | natural-sciences or engineering | text + 2 figures + formula | 6 |
| 3 | business-administration or economics | text + assumptions list + formula + figure | 7 |
| 4 | social-sciences or humanities | **text only** | 6 |

This mirrors the official spread across domains and exercises every allowed
exhibit type at least once, including the text-only case.

Difficulty: record the §3.4 proxies for every question, and **do not publish tier
labels in the pilot**. The official material says its own samples are not
difficulty-representative; we have no calibration yet either.

**The pilot must prove, before any scaling:**

1. all validators run and produce actionable output;
2. the **full ablation test discriminates** — pilot questions survive it, and
   deliberately-planted general-knowledge questions are caught. If ablation
   cannot tell them apart, the whole validation strategy is unproven and scaling
   stops;
3. blind re-answer agrees with the key on **100%** of items;
4. zero unresolved outside-knowledge flags;
5. zero originality hits;
6. **zero cross-question leakage errors under §5.9**, and an independent
   adjudicator, given a pack's questions without its source, finds no question
   given away by a sibling;
7. **a completed independent adjudication round under §5.8 that clears every
   item** — not the author's own judgement, and not an earlier round: the round
   must be bound to the content it saw, so any repair made in response to it
   retires it and a fresh round is required. The first pilot round was
   *supposed* to be a formality and instead rewrote the pack's classification
   entirely, which is the reason this is a criterion rather than a courtesy;
8. human review passes every item;
9. an honest estimate of **authoring cost per pack**, since this module cannot be
   mass-generated the way Module A can.

Criteria 6 and 7 are the two the first pilot failed. It passed every mechanical
gate on the first attempt and still had to be rebuilt in nine of its
twenty-six questions.

**What three rounds of leakage repair taught about pack size.** Coupling scales
with questions per source, not with how carefully a question is written. Every
leak the pilot had to repair was the same source read one time too many: a table
read five ways, a framework applied twice, one invariance fact asked from two
sides. Rewording never fixed one of them; what fixed them was changing what a
question asks, or moving it onto data of its own. Where a question genuinely
needs a scenario the source does not carry, giving it self-contained figures is a
legitimate repair rather than a retreat — the official material does the same in
Exercise 3, where the source supplies the rule and the question supplies the
case. **Fewer questions per source is the cheaper lever than cleverer questions,
and the count in the table above is a ceiling rather than a target.**

**Explicitly out of scope for the pilot:** difficulty calibration, question-count
targets for a full exam, and any UI.

---

## 8. Standing prohibitions

- Never state a GAM fact from memory — re-fetch the official PDF (`CLAUDE.md`, rule zero).
- Never present a PROPOSED decision as an official rule.
- Never generate a pack whose answer cannot be traced to its own blocks.
- Never publish without human review.
- Never reproduce official or third-party text.
- Never let a model be the authority on whether an answer is correct — it drafts
  and it challenges; a human decides.
