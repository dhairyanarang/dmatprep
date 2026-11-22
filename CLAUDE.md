# dMAT Prep Hub

Personal preparation hub for the **dMAT (Digital Master Assessment Test)**.
Next sittings **16 January 2027** (applications close 4 Jan) and **13 March 2027**
(close 1 Mar) · registration opened 28 Oct 2026 · single user (Dhairya).
The first ever sitting was 26 September 2026 and is now history, not a deadline.

## Rule zero: never state a dMAT fact from memory

The dMAT was announced in mid-2026 and first sat on 26 September 2026 — after most model
training cutoffs. **Every factual claim about the exam must trace to a live fetch of an
official source.** If it cannot be sourced, it ships with a confidence badge saying so,
never as a plausible-sounding guess.

- Official sources only: `d-mat.de` (g.a.s.t.) and `aps-india.de`.
- Third-party dMAT guides contain known errors — wrong item counts, incomplete topic
  lists. Do not cite them, ever, even to corroborate.
- The prep PDF is **re-dated whenever g.a.s.t. updates it**. Current version:
  `www.d-mat.de/wp-content/uploads/2026/09/260902_dMAT_General-Academic-Module_Preparatoy-Materials_EN.pdf`
  (02.09.2026, 57 pages). It is linked from the **India page**, not the English preparation
  page. Re-check the URL before any content work — third-party sites still cite a July build.
  Use the `www.` host; the bare `d-mat.de` certificate has expired.
- **The 04.08.2026 build (58 pages) was superseded on 02.09.2026.** Both were downloaded and
  compared on 5 September 2026: **no substantive rule changed.** Every statement this
  repository relies on — the Core task rules, the 25 min / 20 item timings, the 1–20 integer
  range, the 5×5 A–E grid, the Subject Module's 4 options and 90 minutes, the topic list —
  is present and unaltered in the new build. The differences are typography, line-breaking
  and layout. A future re-date must be diffed the same way before anything is assumed.

### How a fact is known

Every dMAT claim in this repository carries one of four grades, and the grade is part of the
fact. `content/exam/claims.ts` records them for the exam pages; the same vocabulary applies
to anything the generators encode.

| Grade | Meaning |
|---|---|
| **stated** | The official material says it in words. |
| **demonstrated** | The official examples or worked solutions show it, without stating it. |
| **inferred** | We concluded it from what is stated or shown. It may be wrong. |
| **unknown** | The official material does not settle it. Never fill this with an assumption. |

Two live consequences of that grading, both found by the 5 September audit:

- **Mathematical Equations: single-choice is `stated`, the option count is `unknown`.**
  Updated 14 Nov 2026 on new official evidence, and only this far. The d-mat.de FAQ for
  Indian graduates now says "All questions are single-choice questions", in a passage whose
  two preceding sentences describe the Core Module and the GAM — so the **kind** of answer
  is settled for this subtest. The **number** of options is not: the preparatory material
  presents these exercises open-response with no options at all. Our four-option form stays
  **inferred** and must not be presented otherwise. The two claims are recorded separately
  as `provenance.answerFormat` and `provenance.answerOptionCount`; either being unsettled
  keeps an item at `reasonable_extrapolation`. Caution: that FAQ sentence is a summary
  written for candidates, on a page that still prints the superseded 2026 cycle.
- **Both question forms are `demonstrated`.** Official Example 1 asks for one letter;
  Example 2 asks "What numbers do A and B correspond to?", and every exercise solution
  reports a value for every letter. The earlier note that this was unconfirmed is resolved.
- These PDFs use subset font encodings; naive text extraction returns mojibake and
  `pdftotext` is not installed. Use `node scripts/extract-pdf.mjs <file.pdf>`.
- **Never commit the source PDFs or images extracted from them.** They carry an explicit
  g.a.s.t. copyright notice and this repository is public. Keep official wording to short
  attributed quotes; paraphrase the rest.

## Verified facts

| Fact | Source |
|---|---|
| Core Module: 3 subtests, each **25 min / 20 items** | GAM PDF pp. 8, 18, 25 |
| Figure Sequences: **4×4 grid**, 4 matrices shown, predict the **5th and 6th**, **3 options each** | GAM PDF pp. 7–8, 13–16; confirmed visually from the embedded diagrams |
| Figure rules: colour change; rotation about own axis; vertical/horizontal/diagonal movement; a diagonal mover cannot switch to another movement type; **x+1** acceleration; figures cannot disappear or overlap; at a boundary they **either bounce off or travel along it** | GAM PDF pp. 7–8 |
| Figure symbol counts per exercise: **1, 1, 2, 3, 4, 4** (Ex 1–6). Ex 4 (medium) has 3; Ex 5 and Ex 6 (high) have **4** | GAM PDF pp. 10–12, counted from the rasterised diagrams |
| Math Equations: exactly one solution per letter; **each letter is an integer 1–20**; operators `+ − × ÷` | GAM PDF p. 17 |
| Latin Squares: **5×5**, letters A–E, each once per row and column; only response-row letters may appear | GAM PDF p. 24 |
| Subject Module: **90 min total**, 4 options, exactly one correct | GAM PDF p. 34 |
| No notes at any point | GAM PDF p. 6; T&Cs |
| No calculators, phones, tablets, watches; only ID on the desk | T&Cs |
| Fee **€150**, paid to g.a.s.t. | aps-india.de/dmat |
| Score **0–200**, mean 100, plus percentile rank; certificate valid indefinitely | d-mat.de/en; T&Cs |
| 2027 cycles: registration opened 28 Oct 2026 · applications close **4 Jan 2027**, test **16 Jan 2027**, results 8 Feb 2027 · second cycle closes 1 Mar, test **13 Mar 2027**, results 5 Apr 2027 | d-mat.de/en/dmat-in-india (read 14 Nov 2026) |
| Affected fields (APS India, revised **5 Nov 2026**): Engineering/Technology; Commerce/Accounting/Finance/Economics; Business/Management; **Tourism, Travel & Hospitality**; **integrated & dual-degree programmes**. Guidance only, **not exhaustive**, and does not confirm formal recognition | aps-india.de/dmat (read 14 Nov 2026). The old "field list v1.0" PDF is **404** — do not cite it |
| GAM holds **approximately 60 questions** — "an average; the actual number may be higher or lower" | d-mat.de FAQ for Indian graduates |
| **All questions are single-choice.** Settles the KIND of answer, not the NUMBER of options | d-mat.de FAQ for Indian graduates |

## Known discrepancies — do not silently resolve

- **Duration.** GAM PDF p. 6 says *"about three hours with a break of 30 minutes"*;
  d-mat.de says *"three and a half hours"*. Computed from the parts: 75 + 30 + 90 =
  **195 min (3h15m)**. Show the breakdown and cite both.
- **No negative marking — RESOLVED 22 Nov 2026. It IS officially stated.** This entry
  previously read "NOT officially stated" and required `confidence: 'inferred'`. That is
  now wrong, and the old note shipped on `/exam/scoring` was itself the inaccurate claim:
  it told candidates "no negative marking is nowhere written down". It is written down, in
  those words, under the heading **"Tips for taking the exam"** on two official pages:
  *"If you do not know the solution to a task, take a guess: no points will be deducted for
  wrong answers."* — `www.d-mat.de/en/preparation-for-the-exam/` and
  `www.d-mat.de/en/dmat-in-india/`, both fetched and the sentence matched on both,
  22 Nov 2026. The India page is the current one (it carries the 2027 cycle). The claim is
  now graded **stated** in `content/exam/claims.ts` and rendered `confidence: 'official'`.
  **Still unknown, and not to be filled in:** how the score is computed beyond being a
  conversion of correct answers, and whether an unanswered item is treated differently
  from a wrong one. Neither page says.
- **Mathematical Equations phrasing — RESOLVED 5 Sep 2026, and now a coverage gap.**
  It is no longer unconfirmed: the official material *demonstrates both forms*. Example 1
  asks "What number does A correspond to?"; Example 2 asks "What numbers do **A and B**
  correspond to?"; and all six exercise solutions report a value for every letter. The bank
  is 175/175 single-letter, so an officially demonstrated form is absent. The schema
  supports the multi-letter form (see `docs/ME_MULTI_LETTER.md`); adding items is deferred
  to a later pass by decision, not by uncertainty.
- **Mathematical Equations option count — `unknown`.** No official source states how many
  options the subtest offers. Four is our inference. See the grading note above.
- **Affected fields — the two official sources disagree, and the gap widened.** d-mat.de
  names three groups; APS India named five on 5 Nov 2026, adding Tourism/Travel/Hospitality
  and an integrated/dual-degree rule. Both read 14 Nov 2026; neither page acknowledges the
  other. The FAQ says APS India determines eligibility, so the product shows APS India's
  list **and says plainly that the two differ**. Do not reconcile them.
- **The FAQ is stale against its own site.** It still prints the 2026 cycle in full while
  the India page carries 2027. Cite both; present the India page as current.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 ·
shadcn/ui as owned source in `components/ui/` · Vercel · GitHub ·
**Supabase (optional)** for accounts and cross-device progress.

**Guest mode is a supported mode, not a degraded one.** With no Supabase
environment variables set the app builds and runs exactly as it always has —
every route static, progress in `localStorage`, and no sign-in affordance
rendered anywhere. Signing in adds durability across devices and nothing else;
nothing is ever gated behind it. See `docs/SUPABASE.md` before touching
`lib/progress/`, `lib/supabase/` or `supabase/migrations/`.

Repo: `github.com/dhairyanarang/dmatprep`, branch `main`.

**Almost every route is static.** The exception is ten server routes: the eight
under `app/api/` (checkout, entitlement, solutions, Module B marking, the
Razorpay webhook, reconciliation) and `/auth/callback`. Everything a candidate
reads or practises is prerendered; a server is needed only to take money, to
decide what a signed-in account may download, and to complete a sign-in. This
line used to read "every route is static" and stopped being true when payments
landed on 18 November 2026.

### Commerce — built, env-gated, and off by default

Payments and entitlements are **implemented**, not planned: `lib/payments/`
(13 modules), `supabase/migrations/20261118120000_payments.sql`, and the API
routes above. Razorpay is the provider; Cashfree is the documented fallback.

- **One price, one place.** `PRICE_MINOR = 99_900` (₹999, one-time, lifetime)
  in `lib/payments/config.ts`. The pricing page, the sidebar card, the Terms,
  the refund policy and the order the server creates all read it from there, so
  a price shown to a buyer and a price charged to a card cannot disagree. Never
  take an amount from the browser.
- **`COMMERCE_ENABLED` (`NEXT_PUBLIC_COMMERCE_ENABLED=1`) gates the whole
  commercial surface.** Unset, the product behaves exactly as it always has:
  everything free, nothing for sale, no checkout affordance. This is a supported
  mode, like guest mode.
- **The Free/Pro split is enforced in two places, never one.** `build:solutions`
  publishes only the free 150 to `public/solutions/` when the split is on, and
  `/api/content/solutions` performs its own entitlement check. A cached
  entitlement driving the interface is good UI; a cached entitlement releasing
  content is a bug.
- Read `docs/PAYMENTS.md`, `docs/RAZORPAY.md` and `docs/ENTITLEMENT.md` before
  touching any of it. **Attempts and entitlements are immutable and additive** —
  see the conventions below.

### The public website

Since 22 November 2026 the deployment serves two experiences on one domain:

- **The public site** — `/` (landing), `/exam/*`, `/faq`, `/guides/*`,
  `/about`, `/general-academic`, `/pricing`. Public header and footer, indexed,
  in `sitemap.xml`.
- **The application** — `/dashboard` and everything a candidate works in.
  Sidebar and top bar, `noindex`, disallowed in `robots.txt`.

`components/layout/chrome.tsx` decides which shell a route gets, in one place.
Its default matters: **an unknown path gets the product shell, never the public
one**, because `usePathname` returns null during prerender and the public
branch would drop the independence statement. See the SEO conventions below.

### Visual feedback loop

`agentation` renders a dev-only annotation toolbar, and `agentation-mcp` is
registered in `.mcp.json` so annotations reach the agent. It is imported through
`components/dev/annotations.tsx`, **not** directly in the layout: a static import
behind a `NODE_ENV` guard still ships the whole ~500KB package because it has CSS
side effects. Putting the dynamic import inside a branch the compiler proves false
removes it from the production graph. Verify with
`grep -rl agentation .next/static` after a build — it must return nothing.

### Stack gotchas already hit

- **shadcn here uses Base UI, not Radix** (style `base-nova`). Compose with the
  **`render={<Button/>}` prop, not Radix's `asChild`** — `asChild` is a type error.
- Tailwind v4 resolves `@theme inline` at parse time, so font tokens must be **literal
  family names**; `var(--font-geist-sans)` from next/font never resolves there.
- `turbopack.root` is pinned in `next.config.ts` because a stray `package-lock.json` in
  the home directory makes Turbopack infer `~/` as the workspace root.
- Next 16 typed routes: use `LayoutProps<'/route'>` / `PageProps<'/route'>`, and
  **`params` is a Promise** — always `await params`.

## Conventions

- **Content never lives in components.** All of it sits in `content/` as typed TS/JSON.
  The one exception is the seven exam reference pages: they are bespoke visual
  layouts, so their facts sit in the page files, and
  **`content/exam/claims.ts` is the audit record that feeds `/exam/sources`**.
  Change a fact on one of those pages and change it there too — that file exists
  precisely so there is no second prose copy to drift.
- **There is no `/module-a` landing route.** It only relisted the three sections
  the sidebar already carries, one level deeper. The sections are the nav; the
  dashboard links straight to practice.
- **Each Module A section has exactly two pages: Overview and Practice.** Learn and
  Tips were merged — they restated each other. The Overview is a single ordered
  `SectionGuide.blocks` list: stats → what an item looks like → the rules →
  difficulty → method → strategy → mistakes → worked examples. Diagrams are named
  in content (`{ type: 'diagram', kind: 'fs-bounce' }`) and drawn by
  `components/exam/diagrams.tsx`, so content stays data-only.
- **All progress access goes through `ProgressStore`.** Only the localStorage adapter may
  touch `window.localStorage`; read through `useProgress()` (built on
  `useSyncExternalStore`) — direct reads cause hydration mismatches.
- **The local store is the render source, signed in or not.** The cloud layer
  writes *into* it rather than replacing it, so no component knows where the
  data came from and answering a question never waits on the network. Writes go
  local-first and queue in an outbox; every attempt carries a client-minted id
  and every push is an upsert, so a retry can never count an answer twice.
- **Aggregates are never stored** — accuracy, readiness and hint rate are always
  derived from attempts, in both the browser and the cloud read path.
- **Attempts are immutable.** There is no update policy on the table, and the
  merge is a set union by id. Rewriting one would change every derived figure.
- **A reload must never silently cost work.** Mocks keep a restore point and ask
  before resuming; practice restores itself silently. Session timing is an
  absolute `stageEndsAt`, never a remaining-seconds counter — a counter is a lie
  the moment the browser is closed.
- **Question exposure is tracked per context** — `practice`, `diagnostic`,
  `mock` — so the pools never consume each other. A question met in the
  diagnostic is not disqualified from a mock; it is only ranked below fresh
  material.
- **The mock runner uses the same `PageContainer` as every other route.** The
  reading measure is an *inner* constraint (`ReadingMeasure`), never a narrower
  page — narrowing the page is what made the mock sit 100px inside every other
  screen.
- **Motion answers a question or it does not ship** — did my action register,
  what changed, where did I go, is something being worked on. 150ms for
  controls, 200ms for panels, and `prefers-reduced-motion` is honoured globally
  in `app/globals.css` as well as per call site.
- **Every question stores an `explanation` plus a `distractorNotes` entry for every wrong
  option.** Enforced by the types and re-checked by `verify-bank`.
- **No question ships unverified.** A solver must confirm a unique solution and all
  invariants before it enters `questions.json`.
- **Never generate dMAT questions from intuition.** Read
  `content/question-authoring/DMAT_QUESTION_AUTHORING_SPEC.md` first — it is the
  source of truth for what the exam actually documents, and for each subtest's
  difficulty model. The contract is below.
- **`direction-cycle` is forbidden, and 86 Figure Sequences questions are quarantined
  because of it.** A symbol that changes its direction of travel every panel is not in the
  official rule list and never was; it sat in `FS_CONTRACT.allowed` without support, and the
  movement catalogue taught it under a heading reading "Every movement you can be shown".
  Both are gone. The 86 are **quarantined, not retired** — they stay in the file, resolvable
  by id so stored attempts still name their question, and excluded from every pool by
  `lib/content/registry.ts`. If a future PDF re-date documents the mechanic this lifts by
  deleting one field. See `docs/DIRECTION_CYCLE.md`. **Consequence:** the Figure Sequences
  low tier can place at most one new item per batch, measured and asserted by a test.
- **`staticRotatingSymbol` is the one `review` mechanic the generator may emit**, and only
  on an arrow or triangle, where the facing is legible. A static symbol that does not rotate
  carries no readable rule and the contract refuses it. Six pilot items exist in
  `drafts/static-rotator-2026-11-14/` with a clean blind round; **none is in the bank** and
  none should be until a person signs them off.
- **Provenance is derived, never asserted.** All three generators used to hardcode
  `dmatAlignment: 'officially_documented'`, so 473 of 473 questions claimed the exam
  documents them. `scripts/lib/provenance.mjs` now computes it from the question, and
  `verifyQuestion` rejects any stored grade that is not the one the question earns. One
  string was doing four jobs; `meta.provenance` separates them — `format`, `answerFormat`,
  `answerOptionCount`, `mechanics`, `originality` — and `dmatAlignment` is the conservative
  roll-up, so a question can never claim more than its weakest ground.
- **Answers are not shipped with the page.** Pages serve `getPublicQuestions`; solutions are
  fetched from `public/solutions/<section>.json` and merged client-side. This is hygiene,
  not protection — those assets are public URLs, which is right for a free bank and wrong
  for anything sold. See `docs/CONTENT_EXPOSURE.md`.
- **Latin Squares difficulty is measured, never assigned** — `forcedPlacementDepth`,
  computed by constraint propagation. **depth ≤ 2 → low, 3–4 → medium, ≥ 5 → high.**
  Corrected 18 Nov 2026: this line read "1 → low, 2–3 → medium, 4+ → high", which
  no committed item has ever followed. `docs/DIFFICULTY_CALIBRATION.md` carries the
  real bands and the bank matches them exactly, with no tier overlap — low holds
  depth 1–2, medium 3–4, high 5–7. **Depth bands the item; sparsity does not.**
- **Pair elimination is a faster search, not a stronger technique.** On a
  two-missing line it is the logical dual of a naked single at the partner cell,
  so no item can require it — every committed item falls to naked singles alone.
  Label it, teach it as a shortcut, never claim an item needs it. Do **not** add
  hidden singles to manufacture a requirement; they are unattested.
- **A Figure Sequences item must admit exactly one continuation.** The four shown
  matrices are inverted against the documented rule space
  (`scripts/lib/fs-inversion.mjs`) at generation and in `verify-bank`. Checking
  that the stored rule reproduces the marked panel is circular and was how two
  genuinely ambiguous items shipped. Border travel and linear movement are
  identical while a symbol runs an edge without turning a corner.
- **Generation is append-only.** `scripts/generate-batch.mjs` is the only way to
  add questions; each slot is seeded from its own coordinates. Full-bank
  regeneration was removed because a quota change rewrote most of the bank under
  unchanged ids, which corrupts attempt and exposure records. Retired ids
  (`content/sections/*/retired.json`) are reserved forever and never reassigned.
- **Figure Sequences renders as SVG from state.** No image assets, ever.
- **No timers in practice.** Timed mode is a later addition: keep `durationMs` recorded
  and the runner's `timing` prop optional so it stays a drop-in.
- Mobile and laptop are both first-class.

- **The exam reference exists at two routes over one set of components.**
  `/exam/*` is the public site's copy — indexed, in the sitemap, carrying the
  canonicals. `/dashboard/exam/*` is the same seven pages inside the
  application, `noindex`, reached from the sidebar. The app pages **import** the
  public page components rather than restating them, so there is one set of
  facts. A link between pages of the reference goes through `ExamLink`, which
  rebases the canonical `/exam/...` path from the pathname — a hardcoded
  `/exam/format` is correct on the public site and walks a student out of the
  product.
- **SEO metadata belongs in `lib/seo.ts`, never at the call site.** `canonical()`
  for URLs, `social()` for Open Graph and Twitter *together*, and
  `NOT_A_LANDING_PAGE` for any working screen. Two traps, both already sprung:
  a page that exports its own `openGraph` **replaces** the parent's rather than
  merging, so it silently loses the `opengraph-image` file convention unless it
  spreads `social()`; and `robots.txt` is a request, not a boundary — a
  disallowed URL can still be indexed from a link elsewhere, so every working
  screen carries `noindex` as well.
- **`SITE_ORIGIN` is a constant, not an environment variable.**
  `https://dmatprep.vercel.app` has been shared in applications and must keep
  working; a misconfigured deployment must not be able to change it underneath
  the canonicals.
- **No public page may state a dMAT fact that `content/exam/claims.ts` does not
  record.** Rule zero applies to marketing copy exactly as it applies to the
  exam pages, and `npm run release:check` asserts the independence disclaimer is
  on every prerendered page.

## Design system — PrepdMAT (Figma is the source of truth)

Figma: `LjpnjICgqimazVDo1Tw9IB` (PrepdMAT), Home at node `61:1781`. Values come
from `get_variable_defs` / `get_design_context`, never estimated off a
screenshot. **One theme: light.** The dark palette, the theme toggle and next-themes were
removed — there is no theme switching and no system detection. Tokens live in
`app/globals.css` — change values there, never at the call site. The
`@custom-variant dark` line survives only because the shadcn components still
carry inert `dark:` utilities; nothing sets `.dark`, so they never match.

- **Surfaces** ladder: Void `#08090a` → Carbon `#0f1011` → Obsidian `#161718` →
  Slate `#23252a`. Separation comes from **hairline borders**, never shadows.
- **Acid lime `#e4f222` is the only chromatic action colour**, and it plays
  exactly two roles: the single primary button per view, and the active nav
  marker. Never decoration, never a second button, never a progress fill.
- **Section hues are tags, not actions** — Iris Violet (Figure Sequences),
  Lavender (Mathematical Equations), Signal Teal (Latin Squares). They appear as
  dots, eyebrows and tab underlines only.
- **Type**: Inter Variable with `cv01`/`ss03`/`zero` on; JetBrains Mono stands in
  for Berkeley Mono and is reserved for equations, grid letters and IDs.
  **Weights cap at 590** — nothing is bold; `font-semibold` is remapped to 590
  and `font-medium` to 510 in the base layer.
- **Tracking** tightens as type grows: −0.011em body, −0.012em at 20–32px.
  Tailwind's `tracking-tight` is overridden to the system value.
- **Three radii, no more**: 4px badges, 6px buttons/inputs, 12px cards. Every
  radius token above 12 is capped at 12.
- Spacing ladder 4/8/12/16/20/24/32; card padding 20–24.
- **Never use a chromatic colour as text.** Acid lime as type measures **1.23:1**
  on the light card — it reads fine on dark, which is exactly why it slips
  through. Chromatic colours are fills with a dark foreground on top. This has
  already been fixed twice; check both themes before shipping a coloured label.
- Icons in a grid gap must be **narrower than the gap** — a 14px arrow in a 12px
  gap overlaps the cards either side.

Two documented deviations from DESIGN.md, both deliberate:

- Pulse Green and Coral Red are used **as status** (correct/incorrect), which the
  reference discourages. A practice app needs a real right/wrong signal.
- The reference has no caution colour, so "inferred" renders as a **neutral
  marked state** rather than introducing an amber — this keeps the accent count
  where the system wants it. "Unconfirmed" uses Coral Red.

## Question generation contract

A model is never the authority on whether a question is correct. It shapes prose —
explanations, hints, notes. Every logical and mathematical claim is decided by code.

Before generating questions for any section:

1. Read `content/question-authoring/DMAT_QUESTION_AUTHORING_SPEC.md`.
2. Read that section's `guide.ts`.
3. Run `node scripts/audit-bank.mjs` to see the **actual** current distribution —
   never assume it from memory.
4. Identify which patterns are already overrepresented.
5. **Write a `generation_plan` before generating a batch** (spec §6) — see
   `content/question-authoring/GENERATION_PLAN.md`. `generate-batch.mjs` requires
   `--plan` above 20 items and validates its shape.
6. Generate only within documented mechanics, preferring underrepresented ones.
7. Run the solver, prove uniqueness, validate distractors, validate the
   explanation, and **measure** difficulty rather than inheriting the label.
8. `npm run verify:bank` must pass before anything is committed.

Difficulty is measured in all three sections, never assigned:

| Section | Metric |
|---|---|
| Figure Sequences | transformation load — rules stacked on one symbol, **not** symbol count. 1–4 symbols, ranges overlapping across tiers. |
| Mathematical Equations | substitution depth to the asked letter, **not** letter count. A combining-equation collapse costs one step per definition pushed into it. |
| Latin Squares | deduction depth × clue density × technique × target distance. |

Both official Latin Squares techniques must stay represented: naked single, and
line-based pair elimination. Four of the six official solution paths lead with
the latter, and a step may only be labelled `pair-elimination` when the solver
could not reach it with a naked single.

## Scope

**Module A is the product** — Figure Sequences, Mathematical Equations, Latin
Squares. 543 committed questions, 89 quarantined and not served, 150 free.

**Module B (General Academic) is a live pilot, not a placeholder.** This line
read "a coming-soon placeholder; do not build it out" until 22 November 2026,
by which time it had nine original source packs carrying 26 linked questions,
practice routes, a timed session and a slot in the Core + GAM sample sitting.

What governs it is honesty rather than scope: the packs have cleared automated
validation, a leakage gate and independent adjudication, and **none has been
signed off by a person**. `GamPilotNotice` and `/general-academic` both read
that count from the registry at build time, so neither can overstate it. Read
`content/question-authoring/DMAT_GAM_AUTHORING_SPEC.md` before adding any.
Module B still must not grow a sidebar row.

**Five sidebar rows, in two groups** — Home, Prepare, Test under "Main menu";
About the Exam and Information under "The exam". This was four until 21 Nov
2026, when Information stopped being a dropdown in the sidebar's footer and
became a section with its own landing page and internal sidebar, matching the
v2 prototype. The rule's point was never the number: the sidebar must not grow
quietly, so a sixth row takes a decision and an edit to
`scripts/test/gam-product.test.mjs`, which pins the count.

Review was removed from the public-beta IA — its data model, calculations and
components all remain. Mistakes surface at the end of a practice set and at
`/practice/mistakes`, which is reachable from the dashboard and from a result,
and is not a sidebar row. `/review` redirects to `/dashboard` — it pointed at
`/` until `/` became the public landing page, and a saved link from inside the
product should come back inside the product.

**The Study Plan was removed on 21 Nov 2026**, by decision. `/study-plan`
redirects to `/prepare`. Milestones survive because the pre-exam checklist uses
the same store; only the plan content, its page and its component went.

**`content/exam/updates.ts` is the only update surface**, and it is a content
file on purpose: nothing can publish to it except a commit, so there is no path
by which unverified news reaches a candidate. Every entry carries the official
source it was fetched from. An empty list renders "No new official updates" —
never a placeholder.

## Commands

```bash
npm run dev      # local dev server
npm run build    # production build. THIS is the type check — `tsc --noEmit`
                 # alone fails on a clean tree, because Next generates the
                 # PageProps/LayoutProps route types into .next during a build.
npm run lint
npm test         # generator, solver, contract, navigation and regression tests

# Before shipping anything
npm run release:check   # 6 containment checks over the BUILD: no quarantined or
                        # draft question reaches it, no answers ship with a
                        # question, exam facts trace to a source, and the
                        # independence disclaimer is on every prerendered page
npm run verify:bank     # re-verify every committed question independently
npm run verify:content  # THE content workflow: solutions, bank, GAM, lint, build, tests
npm run verify:gam      # the three GAM gates — validation, adjudication, sign-off
npm run verify:rls      # Supabase row-level security policies
npm run build:solutions # split the banks into public and solution halves
npm run calibrate       # re-measure difficulty across the bank
npm run register        # regenerate audit/content-register.{json,md}

# Adding questions — append-only, never regenerates:
node scripts/generate-batch.mjs --batch b2 --section figure-sequences \
     --low 5 --medium 5 --high 5 [--plan <path>] [--dry-run]
```

**Where to start reading.** `docs/README.md` indexes every document and says
what each is for. Historical reports live in `docs/archive/` and are records,
not instructions — never follow them.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
