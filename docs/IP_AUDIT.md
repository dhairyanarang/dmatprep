# Intellectual-property audit

Repository-wide, 18 November 2026. Every row is a measurement or a reading, not
an assumption.

**This is a technical audit, not a legal opinion.** It records what the material
is and where it came from. It does not conclude that any use is lawful, and §6
lists what a lawyer still has to decide.

## 1. Summary by category

| Category | Finding | Risk |
|---|---|---|
| Question text and explanations | Original, generated to documented formats, solver-verified | **Low** |
| Figures and diagrams | Original; Figure Sequences has no image assets at all | **Low** |
| Tables and datasets | Invented; no real-world dataset is reproduced | **Low** |
| Guide text | Paraphrased 18 Nov 2026; zero official 8-grams remain | **Low**, see §6.1 |
| Official PDF references | Cited by URL and page; never committed | **Low** |
| Icons | `lucide-react`, ISC | **Low** |
| Fonts | Manrope, JetBrains Mono — Google Fonts, SIL OFL | **Low** |
| UI libraries | `@base-ui/react` MIT, `sonner` MIT | **Low** |
| Brand assets (logo, banner, icons) | From the operator's own Figma | **Needs confirmation**, §4.2 |
| Open Graph image | Contains a third-party device mockup | **Needs confirmation**, §4.3 |
| Scaffold SVGs | Vercel and Next.js marks, unreferenced | **FIXED** — removed |
| Examination branding | No official logo or mark is used anywhere | **Low** |
| Marketing copy | No endorsement or outcome claim found | **Low** |

## 2. Question content — original

**384 active Core questions.** Every one carries
`meta.provenance.originality = 'original-generated'`. Zero missing. They are
produced by `scripts/generate/*` from mechanics documented in the official
preparatory materials, and each is proved by a solver to have exactly one
correct answer before it can enter the bank.

**16 active GAM questions**, in 5 packs, each carrying `originality: 'original'`
at pack level. Each is written against an invented source text — a port tariff,
four production lines, a lake oxygen profile, four coder pairs, four caches.
None reproduces an official exhibit.

**Nothing derives from a sat examination.** No question in this repository
originates from a recollection, a reconstruction or a candidate report. The
authoring spec forbids recollection as an input and no pipeline accepts one.

**Measured against the official text.** 99,791 8-grams of Core explanations,
hints and distractor notes were hashed and compared against 14,656 8-grams drawn
from both builds of the official preparatory materials:

| Section | Overlapping 8-grams |
|---|---|
| Figure Sequences | 0 |
| Mathematical Equations | 0 |
| Latin Squares | 4 |

The four are the same solver-generated phrase — "in row 3 A and D are missing" —
which is where any description of a two-missing line lands. A collision, not
copying.

**What is NOT claimed.** That any of it has been reviewed or approved. Every GAM
pack sits at `reviewStatus: automated-pass` and none is signed off by a person.
"Independently developed" describes origin, not endorsement, and the public
copy is worded accordingly.

## 3. Official material — what we reproduce, and what we do not

**The PDFs are never committed.** `CLAUDE.md` forbids it and the tree confirms
it: zero tracked files match a PDF or extraction pattern. The preparatory
materials are fetched to a session scratchpad and never leave it.

**The originality corpus contains no recoverable text.** 14,656 entries, each a
16-character truncated SHA-256 of a normalised 8-gram. A hash does not invert.

**Four quotations were paraphrased on 18 November 2026** — GAM PDF pp. 7, 17, 24
and 25. Each was restructured rather than reworded, each keeps its page citation
so the fact stays attributed, and all four moved out of `quote` blocks because
that renderer labels its content "Official wording". The three guides held 83
overlapping 8-grams before and hold **zero** after, verified in the rendered
page as well as the source.

**Two fragments are retained deliberately**, both in `content/exam/claims.ts`:
"about three hours with a break of 30 minutes" against "three and a half hours".
The claim being made *is* that those two official wordings conflict, so a
paraphrase would destroy the evidence for it. Nine words from each source, side
by side, to report a discrepancy. See §6.1.

**No official logo, wordmark or visual branding appears anywhere.** The only use
of the examination's name is nominative — identifying which examination this
resource prepares for — and the footer states that "dMAT" is a trademark of
g.a.s.t.

## 4. Third-party assets

### 4.1 Licensed dependencies — clear

| Asset | Source | Licence |
|---|---|---|
| Icons | `lucide-react` 1.31.0 | ISC |
| UI primitives | `@base-ui/react` 1.7.0 | MIT |
| Toasts | `sonner` 2.0.8 | MIT |
| Manrope | Google Fonts, via `next/font` | SIL Open Font License 1.1 |
| JetBrains Mono | Google Fonts, via `next/font` | SIL Open Font License 1.1 |

All permissive and all compatible with commercial use. The fonts are
self-hosted by `next/font` at build time, which the OFL permits.

### 4.2 Brand assets — operator's own, needs written confirmation

`public/brand/logo.png`, `public/brand/banner-pattern.png`, `app/icon.png`,
`app/apple-icon.png`. Git traces all of them to the commit *"Migrate to the
PrepdMAT design system from Figma"* — the operator's own Figma file.

Inspected: the logo is an abstract geometric mark with no resemblance to any
examination branding; the banner is an abstract gradient with rounded
rectangles. Both read as original design work.

**What needs confirming:** that the Figma source is the operator's own original
work, rather than a purchased template, a Figma Community file with its own
licence, or a generated asset whose terms were not read. This is a question only
the operator can answer, and it should be answered in writing.

`public/brand/logo.png` is referenced nowhere in the codebase — a dead asset.
Harmless, and worth removing when someone is next in that directory.

### 4.3 The Open Graph image — a real finding

`app/opengraph-image.jpeg` is the social preview: every share of this site on
WhatsApp, LinkedIn or X displays it.

It shows a **laptop device mockup in a styled scene**, with a screenshot of our
own dashboard composited onto the screen. The screenshot is ours. The mockup is
almost certainly not: scene mockups of this kind come from stock libraries,
Figma Community files or mockup generators, each with its own licence, and some
forbid commercial use or require attribution.

It also depicts a **MacBook**, which is Apple trade dress.

**Two things to confirm before launch**, both in §7:

1. Where the mockup came from and what its licence permits, specifically for
   commercial use by a paid product.
2. Whether depicting the device is consistent with the manufacturer's
   guidelines.

If neither can be answered, the cheapest fix is to replace the image with a flat
composition built from the design system — which owes nobody anything.

A secondary, non-IP point: the dashboard in the image shows "45 Days to the
Exam" and "34 Days to Register", which match no current cycle. Cosmetic, but it
is the first thing anyone sees.

### 4.4 Removed

`public/file.svg`, `vercel.svg`, `next.svg`, `globe.svg`, `window.svg` —
untouched `create-next-app` scaffolding. Two are Vercel and Next.js trademarks.
All five were unreferenced in both source and build, and all five were being
served from a domain whose legal position depends on not implying anyone's
endorsement. Removed 18 November 2026.

## 5. Marketing and promotional claims

Swept every candidate-facing string for superlatives, endorsement words and
outcome claims. Every occurrence of "official" either cites the official
material as a source or explicitly disclaims — "not official dMAT papers",
"not official examination questions". No instance of "best", "proven",
"certified", "accredited", "partner", "authorised" or "guaranteed" survives in a
promotional sense.

One factual-accuracy defect found and fixed: the Test and Module B pages
hard-coded "17 questions" for the GAM while the registry held 16 after a
withdrawal. Both now derive the figure from the registry, so the claim cannot go
stale again.

## 6. What this audit does not settle

### 6.1 The §9.1 question — open, and the reason the legal brief exists

The Terms and Conditions forbid reproducing official material "in any form,
**including for the purposes of teaching**", without written permission, and
bind "any participant or third party". Paraphrasing the four guide quotations
narrowed what we reproduce to two nine-word fragments used to report a
discrepancy between sources.

**That is risk reduction. It is not clearance, and this audit does not say the
position is sound.** See `docs/legal/LEGAL_BRIEF.md`.

### 6.2 Nominative use of the examination name

The product's name, domain, page titles and metadata all contain "dMAT". The
footer states it is a trademark of g.a.s.t. and that the name identifies the
examination only. Whether that use is defensible is a trademark question in two
jurisdictions and is in the brief.

### 6.3 Asset provenance

§4.2 and §4.3 cannot be closed from inside the repository. They need the
operator's answer and, for the mockup, possibly a replacement.

## 7. Actions

| # | Action | Owner | Status |
|---|---|---|---|
| 1 | Remove unreferenced third-party scaffold assets | — | **Done** |
| 2 | Derive GAM counts from the registry | — | **Done** |
| 3 | Confirm the Figma brand assets are original work | Operator | Open |
| 4 | Identify the OG image's device mockup and its licence | Operator | Open |
| 5 | Replace the OG image if the licence cannot be established | Operator | Conditional |
| 6 | Remove the unreferenced `public/brand/logo.png` | — | Deferred, harmless |
| 7 | Refresh the OG image's stale countdown figures | Operator | Cosmetic |
| 8 | Resolve §9.1 and nominative use | Lawyer | Open — see the brief |
