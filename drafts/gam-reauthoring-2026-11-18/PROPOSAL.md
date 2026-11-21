# Module B re-authoring — proposal

**A proposal, not a plan of record, and nothing in it is authored yet.** No
question here exists, none is in the bank, and none should be written until the
diagnosis below is accepted.

Written 18 November 2026, against the state after `gam-econ-pt-001-q4` was
withdrawn: 5 active packs, 16 questions, 0 signed off.

## The finding

**10 of the 16 active questions can be answered with no source at all.**

Not "a clever candidate might guess". An adjudicator shown the stem and options
with the source withheld answered each of these confidently, and said why:

| Question | What actually settles it |
|---|---|
| `gam-cs-cp-001-q1` | Textbook LRU. The stem also telegraphs it: it tracks state in the policy's own currency and interposes a request that matters under no other policy. |
| `gam-cs-cp-001-q4` | "Hit rates are workload-dependent" is the standard caching caveat. |
| `gam-econ-pt-001-q2` | The word *minimum*, which the stem itself supplies. Option (a) is self-refuting on its face. |
| `gam-econ-pt-001-q3` | Universal port practice: dangerous goods top every real tariff. The option order even escalates to it. |
| `gam-math-tsi-001-q2` | A measured rate describes the process that was measured; changing the process voids it. |
| `gam-math-tsi-001-q3` | A share is scale-invariant by definition. |
| `gam-ns-lox-001-q2` | The etymology of *thermocline*. |
| `gam-ns-lox-001-q3` | Autumn and winter overturn is textbook limnology. |
| `gam-ss-ca-001-q2` | Mutually exclusive categories forbid double-coding and forbid balancing. |
| `gam-ss-ca-001-q4` | Independence is constitutive of an inter-coder agreement rate. |

### The structural cause

Each pack carries roughly one lookup item and two or three "according to the
text" items — and the "according to the text" items ask about **principles a
well-prepared candidate already holds**. Prefixing a standard caveat with
"according to the text" does not make it a comprehension question. It makes it a
knowledge question wearing a comprehension label.

The six that survive are not all healthy either. `gam-math-tsi-001-q1` is
defeated by its own option arithmetic, and `gam-econ-pt-001-q1` hands over the
tariff rate it is meant to test (below).

## The repair principle

> **Key the question on a choice the source actually made, and that a reasonable
> practitioner might have made differently.**

A candidate cannot know, in advance, which tie-break *this* coding frame uses,
which threshold *this* line re-measures at, or what *this* tariff does with a
consignment spanning two classes. They can only read it. That is the whole test.

Three corollaries, each of which one of the ten above violates:

1. **Never key on a definition.** If the answer is what a word means, the
   dictionary is the source.
2. **Never key on a convention the field already agrees on.** If every real port
   charges hazardous highest, asking which is highest tests the field.
3. **Never let the stem supply the discriminating vocabulary.** If the stem says
   "less than the minimum", the stem has conceded what a minimum is.

Every replacement must be checkable against one question: *remove the source
entirely — can a domain-literate candidate still answer?* If yes, it is not a
replacement.

## Replacement directions, per pack

Concepts only. None is authored, and the count deliberately does not restore 16.

**Computational sciences — cache policy.** Replace `q1` with a trace under a
policy the source *stipulates and that is not LRU* — say, evict the record
admitted longest ago regardless of use, with the source saying so plainly. A
candidate who assumes LRU then gets it wrong, which is the point. Replace `q4`
with a question about a limitation the source names explicitly and that is not
the standard caveat.

**Economics — port tariff.** Replace `q2` with the threshold tonnage at which
the class minimum stops binding: it needs both the rate and the floor from the
table, and the word "minimum" gives none of it away. Replace `q3` with a
comparison the table settles and convention does not — which two classes share a
rate, or a class the table prices *counter-conventionally*, which a candidate
must read rather than assume.

**Mathematics — two-stage inspection.** `q2` and `q3` both turn on the
scale-invariance of a rate. Keep at most one, and key it on something the source
stipulates: a re-measurement threshold, or a stated rule about which rate
survives which kind of change.

**Natural sciences — lake oxygen.** `q2` is a vocabulary item; withdraw it.
`q3`'s mechanism is textbook; key it instead on a figure the chart shows and
intuition does not — a mid-depth oxygen minimum, say, which is real, common, and
contradicts the monotone profile a candidate would assume. That also gives the
pack back the quantitative item it lost when `gam-ns-lox-001-q1` was withdrawn.

**Social sciences — coding agreement.** `q2` and `q4` are both standard methods
doctrine. Key on this frame's specific procedure: what it does with an answer
that fits two categories equally, where in the round the frame is revised, which
answers are excluded from the denominator.

## The `q1`/`q4` rebuild, recorded

`gam-econ-pt-001-q4` is withdrawn. Rebuilding it **is not an edit to q4**, and
this is recorded so nobody attempts one again — two passes have been spent and
the second made it worse.

The leak had two legs, and they live in *different questions*:

1. **`q2`'s stem** stipulates that a consignment below the class minimum is
   still charged, which falsifies q4's option (d) with no reference to the
   source.
2. **`q1`'s stem** establishes that the cargo "is landed" while assuming a fee
   is owed, which lexically underwrites q4's key.

So a rebuild requires, together and not separately:

- **`q1` must stop establishing the fee trigger in its stem.** It does not need
  to: it can ask for a fee on a consignment already stipulated as chargeable
  without spending a clause on *landed*. That is a new stem.
- **`q4`'s options (b) and (c)** must be given real textual footing, so that
  eliminating them requires the source rather than ordinary plausibility.
- **`q4`'s option (d)** must not be a claim `q2`'s stem already settles.
- And `p4` — the transhipment paragraph — is now an **orphan**: no surviving
  question depends on it. A rebuilt q4 would use it, which is an argument for
  rebuilding rather than dropping the idea.

That is two questions and a changed relationship to the source. It belongs here,
not in a repair script.

## A hygiene rule worth adopting

One pattern caught `gam-econ-pt-001-q1` in **both** ablation rounds and is not
cross-question leakage, so no existing gate sees it:

> **No option set may share a common factor that reconstructs an undisclosed
> rate.**

q1's options are 200, 480, 481.60, 484 against a stem tonnage of 120.4. Three of
them are the same rate under three roundings — 120 × 4, 120.4 × 4, 121 × 4 — and
481.60 ÷ 120.4 is exactly 4.00. The general-cargo rate the item exists to test is
recoverable from the options alone. All that survives is the rounding rule.

`gam-math-tsi-001-q1` has the same shape: {6, 60, 400, 750} against 5,000 items
exposes the pair {15%, 8%}.

This is mechanical and worth automating — see `scripts/gam/lib/validate.mjs`.

## What happens next, in order

1. **Accept or reject the diagnosis.** If the ten are acceptable as they are,
   nothing below follows.
2. **Decide the module's shape.** Five packs of three or four thin questions, or
   fewer packs that genuinely test reading? The official module holds roughly 60
   questions; 16 is a labelled pilot either way, and pretending otherwise was
   already corrected once this month.
3. **Author replacements into `drafts/`**, never into `content/gam/packs/`.
4. **Blind-adjudicate each draft before it is promoted**, both halves, on a
   model that is not the author's.
5. **Then** a person signs off — which is the step none of this replaces.
