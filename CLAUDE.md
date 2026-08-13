# dMAT Prep Hub

Personal preparation hub for the **dMAT (Digital Master Assessment Test)**.
Exam **26 September 2026** · registration closes **15 September 2026** · single user (Dhairya).

## Rule zero: never state a dMAT fact from memory

The dMAT was announced in mid-2026 and first sat on 26 September 2026 — after most model
training cutoffs. **Every factual claim about the exam must trace to a live fetch of an
official source.** If it cannot be sourced, it ships with a confidence badge saying so,
never as a plausible-sounding guess.

- Official sources only: `d-mat.de` (g.a.s.t.) and `aps-india.de`.
- Third-party dMAT guides contain known errors — wrong item counts, incomplete topic
  lists. Do not cite them, ever, even to corroborate.
- The prep PDF is **re-dated whenever g.a.s.t. updates it**. Current version:
  `d-mat.de/wp-content/uploads/2026/08/260804_dMAT_General-Academic-Module_Preparatoy-Materials_EN.pdf`
  (04.08.2026). It is linked from the **India page**, not the English preparation page.
  Re-check the URL before any content work — third-party sites still cite a July build.
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
| Math Equations: exactly one solution per letter; **each letter is an integer 1–20**; operators `+ − × ÷` | GAM PDF p. 17 |
| Latin Squares: **5×5**, letters A–E, each once per row and column; only response-row letters may appear | GAM PDF p. 24 |
| Subject Module: **90 min total**, 4 options, exactly one correct | GAM PDF p. 34 |
| No notes at any point | GAM PDF p. 6; T&Cs |
| No calculators, phones, tablets, watches; only ID on the desk | T&Cs |
| Fee **€150**, paid to g.a.s.t. | aps-india.de/dmat |
| Score **0–200**, mean 100, plus percentile rank; certificate valid indefinitely | d-mat.de/en; T&Cs |
| Registration opened 29 Jun 2026 · closes **15 Sep 2026** · exam **26 Sep 2026** · certificates 12 Oct 2026 | d-mat.de/en/dmat-in-india; aps-india.de |
| Affected fields: Engineering; Commerce/Accounting/Finance/Economics; Business/Management — guidance only, **not exhaustive**, and does not confirm formal recognition | APS India field list v1.0, 29 Jun 2026 |

## Known discrepancies — do not silently resolve

- **Duration.** GAM PDF p. 6 says *"about three hours with a break of 30 minutes"*;
  d-mat.de says *"three and a half hours"*. Computed from the parts: 75 + 30 + 90 =
  **195 min (3h15m)**. Show the breakdown and cite both.
- **No negative marking is NOT officially stated.** Supported only indirectly by
  *"If you do not know an answer, please guess which answer might be correct"* (GAM PDF
  pp. 8, 25, 34) and score = *"a conversion of the total number of correct answers"*
  (d-mat.de). Always render with `confidence: 'inferred'`, never as a rule.
- **Mathematical Equations phrasing** — whether the exam asks for one letter or all is
  unconfirmed. Modelled as one asked letter, flagged `inferred`.

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

Repo: `github.com/dhairyanarang/dmatprep`, branch `main`. Every route is static;
nothing needs a server at request time.

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
  The one exception is the four exam reference pages: they are bespoke visual
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
- **Latin Squares difficulty is measured, never assigned** — `forcedPlacementDepth`,
  computed by constraint propagation. 1 → low, 2–3 → medium, 4+ → high.
- **Figure Sequences renders as SVG from state.** No image assets, ever.
- **No timers in practice.** Timed mode is a later addition: keep `durationMs` recorded
  and the runner's `timing` prop optional so it stays a drop-in.
- Mobile and laptop are both first-class.

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
5. **Write a `generation_plan` before generating a batch** (spec §6): count,
   difficulty split, current coverage, gaps being filled, expected distribution.
   This is what stops successive batches from re-producing the same easy pattern.
6. Generate only within documented mechanics, preferring underrepresented ones.
7. Run the solver, prove uniqueness, validate distractors, validate the
   explanation, and **measure** difficulty rather than inheriting the label.
8. `npm run verify:bank` must pass before anything is committed.

Difficulty is measured in all three sections, never assigned:

| Section | Metric |
|---|---|
| Figure Sequences | transformation load — rules stacked on one symbol, **not** symbol count. Max 3 symbols. |
| Mathematical Equations | substitution depth to the asked letter, **not** variable count. |
| Latin Squares | deduction depth × clue density × technique. |

Both official Latin Squares techniques must stay represented: naked single, and
line-based pair elimination. Four of the six official solution paths lead with
the latter, and a step may only be labelled `pair-elimination` when the solver
could not reach it with a naked single.

## Scope

**Module A only** — Figure Sequences, Mathematical Equations, Latin Squares.
Module B (General Academic Module) is a "coming soon" placeholder; do not build it out.

**Four primary destinations, and no more**: Home, About the Exam, Prepare, Test.
Review was removed from the public-beta IA — its data model, calculations and
components all remain, and mistakes now surface at the end of a practice set,
which is when they are worth looking at. `/review` redirects to Home. Do not
re-add a fifth destination without evidence that someone asked for it.

**`content/exam/updates.ts` is the only update surface**, and it is a content
file on purpose: nothing can publish to it except a commit, so there is no path
by which unverified news reaches a candidate. Every entry carries the official
source it was fetched from. An empty list renders "No new official updates" —
never a placeholder.

## Commands

```bash
npm run dev      # local dev server
npm run build    # production build (also the type check)
npm run lint
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
