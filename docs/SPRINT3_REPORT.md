# Sprint 3 — release-candidate report

Branch `sprint3/release-candidate`, five commits on top of Sprint 2. Nothing
pushed, nothing merged to `main`, no Supabase project created or connected, no
production schema, Auth setting, RLS policy or record touched, no payments
activated, no unapproved content published.

**The product is not release-ready.** Three items block it, and none has a
technical fix. They are listed in §9 and the approvals they need are in §10.

Throughout, three kinds of evidence are kept apart and never conflated:
**automated validation**, **independent model review**, and **human sign-off** —
of which there is still none.

---

## 1. Changes and commits

| Commit | What |
|---|---|
| `d3b8388` | Four official quotations paraphrased; all 18 Core warnings dispositioned |
| `3214e29` | `gam-econ-pt-001-q4` withdrawn; Module B review package; re-authoring proposal; option self-disclosure gate |
| `49c5f17` | Static-rotator review sheet; auth QA procedure and isolation guard; payment scope narrowed |
| `c03930a` | `npm run release:check` — six containment checks over the production build |
| `71f3fca` | Unused imports removed from the two review generators |

29 files, +2,983 / −402. New commands: `review:package`, `release:check`,
`qa:assert-isolated`. 341 tests, 340 passing, one `todo` (Module B exposure).

## 2. Module B review status and handoff

**All five packs remain blocked. Nothing was signed off or published.**

`npm run review:package` generates `content/gam/review/HUMAN_REVIEW.md` — 1,017
lines, generated from the packs so it cannot drift. For every active question:
the full source text it draws on, every option, the key, the explanation, the
refutation for each wrong option, which blocks and which phrases it rests on,
its provenance and validation row, and every finding on record. Withdrawn
questions appear with their reasons.

| | |
|---|---|
| Active packs | 5 |
| Active questions | **16** (was 17) |
| **Answerable with no source at all** | **10 of 16** |
| Carrying a recorded coupling | 7 of 16 |
| **Signed off by a person** | **0 of 5** |

The ten that need no source, each with what actually settles it:
`gam-cs-cp-001-q1` (textbook LRU), `gam-cs-cp-001-q4` (the standard caching
caveat), `gam-econ-pt-001-q2` (the word *minimum*, which its own stem supplies),
`gam-econ-pt-001-q3` (universal port practice), `gam-math-tsi-001-q2` (a changed
process voids a measured rate), `gam-math-tsi-001-q3` (a share is
scale-invariant), `gam-ns-lox-001-q2` (the etymology of *thermocline*),
`gam-ns-lox-001-q3` (textbook overturn), `gam-ss-ca-001-q2` (mutual exclusivity),
`gam-ss-ca-001-q4` (independence is constitutive of inter-coder agreement).

**Independent model review, which is not approval.** The economics pack was
re-adjudicated blind after the withdrawal, both halves, on two different
models — Opus ablated, Sonnet re-answered. The blind half agreed with the key on
**3 of 3** with exactly one defensible option throughout.

## 3. The q4 withdrawal and the q1/q4 rebuild

`gam-econ-pt-001-q4` is **retired, not edited**. Two repair passes had been
spent on it and the second — rewording option (a)'s gloss — imported q1's own
verb into the key and made one leg worse. No key was wrong: two independent
blind rounds agreed with it.

**The withdrawal removed q4's leaks and nothing else.** The re-ablation of the
three survivors found both findings previously recorded against q1 intact and
verbatim, plus a new weak coupling now running q1 → q2:

- **q1 still discloses its own rate.** Options 480, 481.60 and 484 against a
  stem tonnage of 120.4 are 120 × 4, 120.4 × 4 and 121 × 4, and 481.60 ÷ 120.4
  is exactly 4.0000. The per-tonne rate the item exists to test is in the option
  set. Only the rounding rule still requires reading.
- **q2's stem still eliminates q1's 200 option**, once that rate is known.
- **q1 → q2 is new:** q1's flat 200 option, offered as a complete fee,
  structurally endorses q2's key over its rival.

**The rebuild requires both questions redesigned together**, because the two
legs live in different questions:

1. **q1 must stop establishing the fee trigger in its stem.** It spends a clause
   on *is landed* while assuming a fee is owed, which lexically underwrites
   q4's key. That is a new stem.
2. **q4's options (b) and (c)** need real textual footing, so eliminating them
   requires the source rather than plausibility.
3. **q4's option (d)** must not be a claim q2's stem already settles.
4. **`p4`, the transhipment paragraph, is now an orphan** — no surviving
   question depends on it. A rebuilt q4 would use it, which argues for
   rebuilding rather than dropping the idea.

Recorded in `drafts/gam-reauthoring-2026-11-18/PROPOSAL.md`. Nothing authored.

**A new gate for the pattern that kept escaping.** q1's self-disclosure is not
cross-question leakage — the question gives itself away alone — so no gate saw
it, and two ablation rounds had to find it by hand. Now mechanical: a **rate
cluster** (two or more options being one rate under different roundings) and a
**composition** (an option being the product of two others over a stem number).
It independently rediscovered `gam-cs-oc-001-q7`, in a pack retired in September
for exactly this.

## 4. The four quotations

| Source | Was | Now |
|---|---|---|
| GAM PDF p. 7 | Figure Sequences task description, quoted | Paraphrased, page still cited |
| GAM PDF p. 17 | One solution per letter, integers 1–20, quoted | Paraphrased |
| GAM PDF p. 24 | Latin Squares constraint, quoted | Paraphrased |
| GAM PDF p. 25 | A worked solution the candidate cannot see | Paraphrased as the principle it demonstrates |

Each is restructured rather than reworded, each keeps its page citation, and all
four moved from `quote` to `prose` — the quote renderer labels its content
"Official wording", and a paraphrase under that label would be a
misrepresentation.

**Measured: the three guides held 83 overlapping 8-grams against the official
corpus and now hold zero.** Verified in the rendered page as well as the source.

**Two fragments remain, deliberately.** `content/exam/claims.ts` carries "about
three hours with a break of 30 minutes" against "three and a half hours". The
claim being made *is* that those two wordings conflict, so a paraphrase would
destroy the evidence for it. Nine words from each source, side by side, to
report a discrepancy. Annotated at the site.

### Remaining legal questions

**Paraphrasing is risk reduction, not legal clearance.** T&Cs §9.1 forbids
reproducing official material "in any form, including for the purposes of
teaching", without written permission, and binds "any participant or third
party". Narrowing what we reproduce narrows the exposure; it does not answer the
question. Still open:

1. Whether the two retained duration fragments are defensible as reporting a
   conflict between sources.
2. Whether **citing** official page numbers for paraphrased facts raises any
   separate issue. I see no reason it would, and I am not the right judge of it.
3. Whether the position is affected by the contract being with a German
   counterparty while the operator is in India.

## 5. Static-rotator findings

Six pilot items, **still out of the bank**. `node scripts/build-rotator-review.mjs`
generates `drafts/static-rotator-2026-11-14/review.html`: the rule in words, the
complete six-panel sequence with keyed continuations shown faded in place, every
option with its facing and cell labelled, and eight machine checks per item.

**All six pass all eight.** Exactly one continuation under the documented rule
space; shape legible and consistent across all six panels (5 arrow, 1 triangle);
colour constant; **cell constant**, which is the mechanic under test; all four
facings shown, so the rotation direction cannot be read two ways; no verify-bank
errors or warnings; `reasonable_extrapolation` provenance.

**Legibility, measured not eyeballed.** Both the production renderer and the
review renderer rotate about the cell centre. The arrow polygon is asymmetric
about its origin, so its bounding box shifts under rotation — by **1.47% of a
cell**, half a pixel on 34, at every orientation. That is the only positional
artefact and it is nowhere near a one-cell move.

**Independent model review, which is not approval.** A different model chose
**12 of 12** continuations in agreement with the keys, judged exactly one
defensible continuation on all six, and reported ruling out a second direction
reading, an accelerating reading, a moved-and-returned reading and a reflection
reading. It rated all six *easy*, which is what the low tier is for.

**Isolation re-verified:** 0 of 6 ids in the Core bank, 0 anywhere in the
production build, 0 explanations in the build, 0 solutions published.

## 6. The 18 Core warnings

No threshold was weakened and no gate removed.

| Count | Disposition | Items |
|---|---|---|
| **12** | **Harmless** | `direction-cycle` findings on questions already quarantined. The warning *is* the quarantine reason. Verified: 0 of the 12 are served. |
| **3** | **Corrected — quarantined** | `me-low-008`, `me-low-012`, `me-high-002` |
| **3** | **Harmless** | Two Latin Squares fingerprint collisions (`ls-low-005`, `ls-low-015`) |

**The three corrected.** Each repeats a left-hand side across two equations,
which `verify.mjs` rejects because *"No official system repeats a left-hand
side."* That makes it a **fidelity** defect, not a style preference: a candidate
meets a construction the real subtest does not use, and one of the two equations
is decorative for the asked letter. No key is wrong and each answer is uniquely
determined — the *form* is wrong.

Quarantined rather than rewritten, because rewriting equations under an
unchanged id would corrupt the attempt and exposure records already filed
against it. Quarantined rather than retired, so the ids stay resolvable. None
was in the free set. Mathematical Equations now serves **172**.

**The three harmless fingerprint findings.** Three items share a coarse bucket
of tier, depth, density, technique and target distance against a cap of two.
Checked the grids: different givens, different targets, different answers.
Retiring two sound questions to satisfy a variety cap would be the wrong trade,
and loosening the cap would weaken a real gate.

**Nothing was left unresolved.** All 18 are classified.

## 7. Auth and cloud-sync QA

**Not run. Prepared and stopped, as instructed.**

A disposable Supabase project was not available and all three routes were closed:

| Route | Status |
|---|---|
| Local stack (`supabase start`) | **Docker not running**; `supabase/` holds only migrations, no `config.toml` |
| New cloud project via CLI | CLI present (2.114.0) but holds no access token; creating one spends quota and is outward-facing |
| The existing project | **This is production** — `.env.local` points at it and signing in creates a real user record |

### Isolation evidence

`npm run qa:assert-isolated` stands in front of any such run. It hardcodes
nothing: production is whatever `.env.local` points at, QA is whatever
`.env.qa.local` points at, and it refuses if they are the same project.
Exercised against four cases:

| Case | Result |
|---|---|
| No `.env.qa.local` | Refuses, and says how to make one |
| Pointed at production | **Refuses** — "The QA project (phkj…) is the SAME project as the one in .env.local" |
| Separate project, service-role key present | **Refuses** — such a key bypasses RLS, so the RLS tests would prove nothing |
| Separate project, publishable key only | Passes, printing both refs truncated |

`.env.qa.local` is covered by `.env*` in `.gitignore`. No ref or key is printed
in full. `docs/AUTH_QA_PROCEDURE.md` carries the setup steps and an 18-row test
matrix, each row saying what would count as a failure.

### What is verified, and by what

**Automated, 11 tests** over `lib/progress/merge.ts`: union by id, idempotent
retry, order-independence, an empty side never erasing the other, exposure
taking the maximum rather than the sum, exposure keyed per context,
last-write-wins on an active session, and the whole guest-to-account journey
twice over.

**Probed against a running server:** `/auth/callback` with no code → `307` to
`/?auth-error=1`; `?next=https://evil.example.com/` refused rather than
followed.

**Verified by nothing:** registration, login, logout, session handling, RLS
isolation between two real accounts, guest-to-account migration as a journey,
cloud sync, retry, and recovery from network interruption. The merge logic being
correct is **not** evidence that the app invokes it correctly, that RLS is
enforced on the live schema, or that the outbox drains after a real
interruption.

## 8. Payments

**Scope narrowed to domestic INR only.** Nepal and all cross-border deferred —
which removes the unanswerable questions rather than answering them. The RBI
purpose-code carve-out could not be read from any machine-readable source, and a
scope that does not depend on it is worth more than a guess that does.

Recorded honestly: the dMAT has a Kathmandu test centre, so Nepali candidates
are a real audience. What they lose is the ability to *pay*; everything free —
which, after the Core bank was made free, is the whole Core product — still
works.

**Nothing implemented.** Confirmed: no payment package in `package.json`, no
`app/api` directory, two migrations unchanged, no entitlement table, no
credentials.

**Remaining decisions:** entity choice (individual vs proprietorship); four
provider facts that are undocumented or contradictory and must be got in writing
(MDR on refund, chargeback fee in rupees, contracted settlement cycle,
instant-settlement pricing); a CA on GST and the OIDAR direction question; the
price, still a hypothesis; and approval for the `entitlements` table, its RLS
policy and a server-scoped service-role key.

## 9. Release blockers

**Blocking.**

1. **No GAM pack is signed off by a person.** 0 of 5. Two models agreeing is
   evidence about the questions; it is not responsibility for them.
2. **10 of 16 GAM questions need no source at all.** A comprehension module
   whose questions test what a candidate already knows is not a comprehension
   module. No distractor editing reaches this; it needs re-authoring.
3. **The §9.1 quotation question is unresolved.** Paraphrasing narrowed the
   exposure. It did not answer whether the position is sound.

**Serious, not blocking.**

4. **Auth and cloud sync unverified end to end** (§7).
5. **`gam-econ-pt-001-q1` discloses its own rate** and `gam-math-tsi-001-q1`
   composes its two-stage pair. Both now flagged mechanically; both still
   present.
6. **The Figure Sequences low tier is closed to growth** at 21 items unless the
   static-rotator pilot is approved.
7. **Module B still ships its answers** in the page payload — 38 keys at peak.
   It is a labelled pilot and is not sold, so this is a known gap rather than a
   defect.

## 10. Approvals and sign-offs required

| # | Decision | Who | Blocks |
|---|---|---|---|
| 1 | **Sign off, or reject, each of the five GAM packs.** Start at `content/gam/review/HUMAN_REVIEW.md` | You | Module B entirely |
| 2 | **Accept or reject the re-authoring diagnosis** in `drafts/gam-reauthoring-2026-11-18/PROPOSAL.md`, and decide the module's shape | You | Whether Module B is rebuilt or stays a pilot |
| 3 | **The §9.1 quotations** — seek written permission, accept the paraphrases, or take advice on the two retained duration fragments | A lawyer | Launch |
| 4 | **Approve or reject the six static-rotator items** for the bank. `drafts/static-rotator-2026-11-14/review.html` | You | Figure Sequences low-tier growth |
| 5 | **Authorise a disposable Supabase project** for the auth QA run, or accept those journeys as unverified at launch | You | §7 |
| 6 | **Entity, price, and the four provider facts** in writing | You, plus a CA | Any payment work |
| 7 | **Approve the `entitlements` schema** when items 6 are answered | You | Payment implementation |

Nothing in this report is a legal opinion, and no green check in it is a
clearance. The automated gates say what is contained; the model rounds say what
two readers thought; neither is a person taking responsibility.
