# Legal brief — for a qualified lawyer

Prepared 18 November 2026 for review by a lawyer qualified to advise on German
copyright law and on Indian consumer and contract law.

**Nothing in this brief is a legal conclusion.** It sets out facts, quotes the
clauses verbatim, and asks precise questions. Where it would be easy to assert
that fair dealing, quotation or attribution makes a use lawful, it deliberately
does not. The product is **not** described as legally cleared and must not be
launched on the strength of this document alone.

---

## 1. The parties and the posture

| | |
|---|---|
| **The operator** | An individual based in **India**, operating dMAT Prep as a sole individual. No registered company or LLP at the time of writing. |
| **The product** | `dmatprep.vercel.app` — a web application offering independently developed practice material for the dMAT examination. Currently free; a paid tier is planned. |
| **The counterparty** | **g.a.s.t.** (Gesellschaft für Akademische Studienvorbereitung und Testentwicklung e.V.), Bochum, **Germany**, which owns and administers the dMAT. **APS India** administers the surrounding documentation process. |
| **Governing law of g.a.s.t.'s terms** | **German.** GTC 12: *"All legal relations are governed exclusively by the laws of the Federal Republic of Germany."* No court-venue clause appears on the page. |

**A fact we do not have, and which changes the analysis.** We do not know whether
the operator has personally registered for, or sat, the dMAT. If he has, he
accepted the terms below and is bound by them as a participant. If he has not,
the contractual route is materially weaker against him, and the binding
constraint is copyright law rather than contract. **This must be established
before the questions in §6 are answered.** It is listed in §8.

## 2. The clauses, verbatim

Read from `d-mat.de/en/terms-conditions/` on **18 November 2026**. The page shows
no effective or last-updated date. "GTC" is the General Terms and Conditions;
"SpTC" the Special Terms and Conditions.

### GTC 9.1 — copyright and reproduction

> "All working documents issued or information provided to the participant are
> protected by copyright. Without written permission from g.a.s.t., no
> participant or third party may reproduce these documents or information in any
> form, **including for the purposes of teaching**, and in particular process,
> duplicate, distribute, use for public reproduction, pass on to third parties or
> make them available to the public using electronic systems."

> "The disclosure, publication and making available to third parties of any test
> items and test materials issued in the examination, as well as their posting on
> social networks, internet forums, websites and similar media is prohibited."

### SpTC 6.15 and 6.16 — examination confidentiality

> **6.15** "You are not allowed to record any information about the content of
> the dMAT and take it with you after the examination."

> **6.16** "You are not allowed to discuss content of the exam with other test
> takers, to pass it on to third parties or to make it available to the public.
> The contents of the test items and test documents may not be posted on social
> networks, internet forums and similar media."

> **6.16** "Any breach of this clause will be brought to legal prosecution."
> **SpTC 8** "In serious cases, criminal charges will be filed."

### GTC 12 — governing law

> "All legal relations are governed exclusively by the laws of the Federal
> Republic of Germany."

### What the terms do *not* say

Searched specifically and not found: any provision imposing separate use or
reproduction restrictions on the **preparatory materials** as distinct from
examination content. GTC 9.1 is framed around *"working documents issued or
information provided to the participant"*. SpTC 5 mentions only that
*"preparation materials are available that include model tasks and detailed task
instructions."*

**This distinction may matter and we have not resolved it.** The preparatory
materials are published openly on `d-mat.de` and downloadable by anyone without
registering. Whether an openly published PDF is a *"working document issued or
information provided to the participant"* within GTC 9.1 is a question of
construction, and it is the hinge of §6.1.

## 3. What we actually reproduce

### 3.1 Nothing from the examination itself

No question, exhibit, passage or figure in this repository derives from a sat
examination, a recollection or a reconstruction. The authoring specification
forbids recollection as an input and no pipeline accepts one. **SpTC 6.15 and
6.16 are not engaged by our content.** They are quoted above because they show
how seriously the counterparty treats examination content, which bears on
posture.

### 3.2 Four passages, now paraphrased

Until 18 November 2026 the section guides reproduced four passages of the
preparatory materials verbatim, each inside a block labelled "Official wording"
with a page citation. All four are now paraphrased: restructured rather than
reworded, with the page citation kept so the *fact* remains attributed while the
*expression* is ours.

| Source | Original wording | Replaced with |
|---|---|---|
| GAM PDF p. 7 | "The figures in the matrices can change their position, colour, and/or orientation from one matrix to the next according to specific rules. It is your task to continue the series logically and to determine what the next two matrices look like." | "Between one matrix and the next a symbol may move to a different cell, take a different colour, or face a different way — any of those, or several at once. None of it is arbitrary: each symbol follows a rule that holds for the whole sequence. Work the rules out from the four matrices you are given, then apply them twice to arrive at the fifth and the sixth." |
| GAM PDF p. 17 | "There is always only one solution for each letter. Each letter can be an integer between 1 and 20." | "Each letter stands for exactly one value — never two of them, and never none — and every value is a whole number somewhere in the range 1 to 20." |
| GAM PDF p. 24 | "Each letter can only appear once in each row and each column. Only the letters that are shown as response options can appear in the grid." | "A letter appears at most once along any row and at most once down any column. The grid uses no letters beyond the ones offered as response options, so there is never a sixth letter hiding in it." |
| GAM PDF p. 25 | "In the second example, you first need to fill in "B" in the first row of the last column. Then you can replace the question mark with "D", because it is the only letter that does not appear in the last column." | "The official worked solution for the second example takes this same order. It places a forced letter into another cell first; once that letter is down, the marked cell's column is short of exactly one letter, and that letter is the answer." |

**Measured:** the three guides contained 83 overlapping 8-grams against the
official text before, and **zero** after. Verified in the rendered pages as well
as the source.

The underlying *facts* — that letters resolve to one value, that a Latin square
admits each letter once per line — are facts about the examination's rules, not
expression. Whether restating a fact and citing its page is safe is for the
lawyer; we have not assumed it.

### 3.3 Two fragments retained, deliberately

In `content/exam/claims.ts` and on the exam format page:

> The preparatory materials say **"about three hours with a break of 30 minutes"**;
> d-mat.de says **"three and a half hours"**.

Nine words from each source, placed side by side. **The claim being made is that
the two official sources conflict**, so a paraphrase would destroy the evidence
for the claim. The purpose is reporting a discrepancy to candidates who would
otherwise be misled by whichever source they happened to read.

We have **not** concluded that this is permissible. It is question §6.2.

### 3.4 Use of the examination's name

"dMAT" appears in the product name, the domain, page titles, metadata and
throughout the copy. The footer on every page states that dMAT is a trademark of
g.a.s.t. and that the name is used only to identify the examination the resource
prepares for. **No official logo, wordmark, colour scheme or visual branding is
used anywhere.**

## 4. The disclaimer, as it now stands

Short form, in the footer of all 36 prerendered pages:

> **dMAT Prep is an independent preparation resource.** It is not affiliated
> with, endorsed by, or sponsored by g.a.s.t. (Gesellschaft für Akademische
> Studienvorbereitung und Testentwicklung e.V.) or APS India. The examination
> name is used only to identify the examination this resource prepares
> candidates for.
>
> Practice questions here are independently developed study exercises. They are
> not official examination questions and are not reproduced from the live
> examination; the real examination may differ in content, difficulty and
> structure. Using dMAT Prep guarantees no examination result or admission
> outcome. dMAT is a trademark of g.a.s.t.

The full form is at `/about` and adds: that nobody connected with the
examination has reviewed, approved or licensed anything; how the material is
made; that official sources govern where they disagree with us; that Module B is
an unreviewed pilot; and how to report claimed infringement.

**Every claim in it is supported by the provenance records** — 384 of 384 active
Core questions carry `originality: 'original-generated'`, all five GAM packs
carry `originality: 'original'`, and the originality corpus finds no meaningful
overlap. See `docs/IP_AUDIT.md` §2.

**The disclaimer is not a defence to copyright infringement and is not offered
as one.**

## 5. Commercial context

A paid tier is planned: domestic INR only, one-time purchase, with the existing
473 Core questions remaining **free** and payment buying access to additional
material and features. This matters because several copyright defences are
narrower for commercial use than for private study, and because the existing
free material has been publicly available in a public Git repository since
August 2026.

## 6. The questions for counsel

### 6.1 Does GTC 9.1 reach an openly published preparatory PDF, and does it reach us?

Two parts, and both need answering.

**(a) Scope.** GTC 9.1 protects *"working documents issued or information
provided to the participant"*. The preparatory materials are published on a
public website and downloadable without registration. Does the clause cover
them, or only documents issued in connection with an examination?

**(b) Privity.** GTC 9.1 purports to bind *"no participant or third party"*. A
contract ordinarily binds its parties. If the operator is not a participant
(see §1), on what basis would a contractual term bind him — and is the operative
constraint instead German copyright law (UrhG), which binds everyone regardless
of contract?

**The decision that depends on this:** whether to seek written permission from
g.a.s.t. for the two retained fragments, to remove them, or to proceed.

### 6.2 Are the two retained duration fragments defensible?

Nine words from each of two sources, quoted side by side for the purpose of
reporting that they conflict. German law has a quotation right (UrhG §51) and
India has fair dealing (Copyright Act §52). Is either engaged here, and does the
express contractual prohibition "including for the purposes of teaching" change
the answer where it would otherwise apply?

**The decision:** keep, paraphrase (destroying the evidential point), or seek
permission.

### 6.3 Is restating a fact and citing its page safe?

The paraphrases in §3.2 convey facts about the examination's rules in our own
words and cite the page the fact came from. Copyright protects expression and
not fact — but the paraphrases were made *from* the protected expression. Is
there a residual derivative-work risk, and does the citation help or hurt?

**The decision:** whether paraphrase-plus-citation is a sustainable long-term
policy for this product, which is what `docs/legal/CONTENT_POLICY.md` currently
assumes.

### 6.4 Is the nominative use of "dMAT" defensible in both jurisdictions?

The mark appears in the product name, the domain and throughout. We do not use
any logo or visual branding, and we disclaim affiliation on every page. Is that
sufficient under German trade mark law and under the Indian Trade Marks Act,
1999 — and does using it in a **domain name** and a **product name** (rather
than only in descriptive body copy) change the analysis?

**The decision:** whether the product can keep its name at launch.

### 6.5 Which law and which forum would actually govern a dispute?

The operator is in India. The counterparty is in Germany. GTC 12 chooses German
law for "all legal relations", but binds only its parties. The product is
delivered worldwide from a US-hosted platform.

**The decision:** where advice is needed, and whether Indian counsel alone is
sufficient or German counsel must be instructed.

### 6.6 Does the planned commercial tier change any of the above?

Specifically §6.2 and §6.4, where commercial use is treated differently.

### 6.7 How long may payment records outlive a deleted account?

*Added 18 November 2026, arising from the entitlement design rather than from
the copyright question. It is here because it is the only question for counsel
this sprint produced that is not about copyright.*

Two legitimate requirements point opposite ways, and the schema cannot satisfy
both.

- **Keep.** A payment record is the evidence in a refund dispute or a
  chargeback. Razorpay allows normal refunds for six months
  (`docs/RAZORPAY.md` §9) and a card chargeback window can be longer. Deleting
  the record when the user deletes their account destroys the only local
  evidence while the liability is still live.
- **Erase.** The Digital Personal Data Protection Act, 2023 gives a data
  principal rights over erasure, and every other table in this product cascades
  on account deletion by design.

`docs/ENTITLEMENT.md` §3.1 proposes `on delete restrict` on
`payments.user_id` — retention wins — which is a choice made by a developer
about a legal obligation, and that is the wrong person to be making it.

**The decisions:** what the lawful retention period is for a payment record
after account deletion; whether the record may be pseudonymised rather than kept
whole; and what the privacy policy must say about it, since the current live
page describes a product that takes no payments at all.

Ordered by how much they reduce exposure per unit of effort. **None is a
substitute for the advice sought in §6.**

1. **Answer §1** — has the operator registered for or sat the dMAT? One sentence,
   and it determines whether §6.1(b) is live.
2. **Decide §6.2.** If the fragments cannot be kept, the discrepancy can be
   reported without quoting — at the cost of the reader having to take our word
   for it.
3. **Consider writing to g.a.s.t.** for permission covering the two fragments
   and the citation practice. GTC 9.1 describes written permission as the route,
   and a short request costs little. A refusal is itself useful information.
4. **Resolve the asset provenance** in `docs/IP_AUDIT.md` §4.2 and §4.3 —
   particularly the Open Graph image's device mockup, which is the single most
   widely distributed asset we have.
5. **Publish the terms, privacy and refund policies** before any payment is
   accepted. Drafts exist in `docs/legal/`, all marked DRAFT and all requiring
   review.
6. **Publish the takedown route** described in `docs/legal/CONTENT_POLICY.md`.
7. **Do not describe the product as legally cleared**, internally or publicly,
   on the strength of this brief.

## 8. Facts only the operator can supply

| # | Question | Blocks |
|---|---|---|
| 1 | Has the operator registered for, or sat, the dMAT? | §6.1(b) |
| 2 | Is the PrepdMAT Figma brand work his own original work, or derived from a template, Community file or generator? | IP audit §4.2 |
| 3 | Where did the Open Graph device mockup come from and what does its licence permit commercially? | IP audit §4.3 |
| 4 | What legal entity will take payments, and in which name? | Terms, refund policy, provider onboarding |
| 5 | What address and contact will be published for grievances? | Consumer-law disclosures, takedown route |
