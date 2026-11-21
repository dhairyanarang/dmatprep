# dMAT Prep Hub

An independent preparation hub for the **dMAT (Digital Master Assessment Test)**.

dMAT Prep is not affiliated with, endorsed by, or sponsored by g.a.s.t. (Gesellschaft für
Akademische Studienvorbereitung und Testentwicklung e. V.) or APS India. The examination
name is used only to identify the examination this resource prepares candidates for.

Two sittings are listed for 2027 — **16 January** and **13 March** (application deadlines
4 January and 1 March). Registration opened 28 October 2026. Those dates were verified
against `d-mat.de/en/dmat-in-india/` on 14 November 2026; see `audit/source-register.md`
for every claim, its source and its verification date, including the discrepancies that
are **not** resolved.

The dMAT is new, and several third-party "guides" in circulation contain factual errors.
Every fact in this app is sourced directly from g.a.s.t. (`d-mat.de`) or APS India
(`aps-india.de`), and anything that could not be confirmed from an official source is
labelled as such rather than stated as fact.

## What's in it

- **Home** — countdowns, recommended next step, and a progress snapshot
- **About the Exam** — format, exam-day rules, scoring, logistics, and a source ledger for
  every claim
- **Prepare** — the Core Module's three subtests, each with an Overview and Practice:
  Figure Sequences · Mathematical Equations · Latin Squares
- **Test** — timed subtests and a full Core simulation
- **Module B** — the General Academic Module, pilot material under review

## On the practice questions

Core questions are generated programmatically from a documented rule space and verified
by a solver before use: no question ships unless it has exactly one valid solution, an
explanation, and a note on why each wrong option is wrong. An independent re-derivation of
all 473 on 14 November 2026 reproduced every stored answer (`audit/question-register.csv`).

**That establishes correctness, not originality.** The Core bank carries no originality
field and no originality gate, so this repository does not currently evidence that its
Core questions are independently authored, and the README no longer claims it. The GAM
packs are different: they carry a recorded provenance block, an n-gram originality screen
against the official corpus, and independent blind adjudication — and they are still
labelled pilot material until a person signs each pack off.

Provenance and originality status for every question is tracked in
`audit/question-register.csv`, where those columns currently read `REVIEW REQUIRED`.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 · shadcn/ui ·
Vercel.

**Supabase is optional infrastructure.** With no Supabase environment variables set the app
runs fully as a guest: every route static, progress in `localStorage`, and no sign-in
affordance rendered anywhere. With them set, the app additionally offers Google sign-in and
cross-device progress sync, and stores a profile (display name, avatar), practice attempts,
sessions, question exposure and study-plan state in Postgres behind row level security.
See `docs/SUPABASE.md` and `/privacy` for what is stored and why.

Microsoft Clarity behavioural analytics loads on production deployments only.

## Development

```bash
npm install
npm run dev           # http://localhost:3000
npm run build         # production build; also runs the type check
npm test              # generator, solver, contract and regression tests
npm run verify:bank   # re-verify every committed question independently
npm run verify:gam    # GAM pack validation and review gates
npm run calibrate     # measured difficulty against stored labels
```

## Source material

The official preparatory PDFs are copyrighted by g.a.s.t. and are **not committed**. To
re-audit a claim, download the current PDF and read it with the included extractor — the
PDFs use subset font encodings that defeat ordinary text extraction:

```bash
node scripts/extract-pdf.mjs <file.pdf> --pages 7-16
node scripts/extract-pdf.mjs <file.pdf> --images ./out 9 10
```

See `CLAUDE.md` for the verified-fact table, known source discrepancies, and conventions.
