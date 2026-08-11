# dMAT Prep Hub

A personal preparation hub for the **dMAT (Digital Master Assessment Test)** — exam date
**26 September 2026**, registration closing **15 September 2026**.

The dMAT is new: the September 2026 sitting is its first ever, and several third-party
"guides" already circulating contain factual errors. So every fact in this app is sourced
directly from g.a.s.t. (`d-mat.de`) or APS India (`aps-india.de`), and anything that could
not be confirmed from an official source is labelled as such rather than stated as fact.

## What's in it

- **Dashboard** — countdowns to both fixed dates plus your own key dates, and a progress snapshot
- **Study Plan** — a week-by-week roadmap with checkable milestones
- **The Exam** — format, exam-day rules, scoring, logistics, and a source ledger for every claim
- **Module A** — the Core Module's three subtests, each with Learn, Tips & Tricks and Practice:
  - Figure Sequences · Mathematical Equations · Latin Squares
- **Module B** — the General Academic Module; placeholder for now

Practice questions are original, generated programmatically and verified by a solver
before use: no question ships unless it has exactly one valid solution, an explanation,
and a note on why each wrong option is wrong.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Vercel.
No backend, database or auth — it's a single-user tool and progress lives in
`localStorage`, behind an interface that can be swapped for a real backend later.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build; also runs the type check
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
