# Documentation index

Start here. This file says what each document is for, so you can find the one
you need without reading all of them.

**`CLAUDE.md` in the repository root is the authority**, not this folder. It
carries the rules that govern day-to-day work: rule zero on dMAT facts, the
conventions, the question-generation contract, the design system and the
commands. Everything here is the reasoning behind a decision, a standing audit,
or a procedure — the detail that would bloat CLAUDE.md but that you need before
changing the thing it describes.

Three things to know before trusting any document here:

1. **A document's banner can go stale even when its reasoning does not.** Four
   payment and access documents were written before the code existed and said
   so at the top; each now opens with a corrected status block. The design
   reasoning in their bodies is still the authority.
2. **`docs/archive/` is history, not instruction.** Never follow it.
3. **Nothing here is legal, tax or financial advice**, and nothing here says
   the product is compliant or cleared. Several documents say this themselves,
   and they mean it.

---

## If you are picking the project back up

Read `CLAUDE.md`, then `docs/INFRASTRUCTURE.md` for what is deployed and what
is only built, then `docs/LEGAL_READINESS.md` for what is still waiting on a
person. Those three answer "where is this?" faster than anything else.

---

## How the product works

| Document | What it is for |
|---|---|
| **`SUPABASE.md`** | Accounts, cross-device sync and persistence. **Read before touching `lib/progress/`, `lib/supabase/` or `supabase/migrations/`.** Explains why guest mode is a supported mode and not a degraded one. |
| **`CONTENT_EXPOSURE.md`** | What leaks from a static build, what a server fixes and what it cannot. The measurements behind the public/premium solution split. Every number came from a command, and the commands are given. |
| **`ACCESS_POLICY.md`** | What Free gets and what Pro gets, and why the line is drawn there. Implemented. |
| **`ENTITLEMENT.md`** | The entitlement architecture — schema, RLS, the server-side functions, the rollback plan. The longest document here and the one to read before any change to who may download what. Implemented. |
| **`PAYMENTS.md`** | The payment decision: providers compared, compliance requirements, what Indian regulation demands. Implemented. |
| **`RAZORPAY.md`** | The provider document — the verified webhook contract, the API surface, the onboarding requirements. Read §13 before relying on any provider fact; provider docs change without a changelog. |
| **`MONETISATION.md`** | The freemium model and the arithmetic under it. |
| **`PRICING_DECISION.md`** | Why ₹999. Records both the recommendation (₹599) and the operator decision that overrode it, rather than being quietly edited to agree. |

## How the questions are made and judged

| Document | What it is for |
|---|---|
| **`DIFFICULTY_CALIBRATION.md`** | Difficulty is measured, never assigned. The metrics, the bands, and what `npm run calibrate` reports. |
| **`DIRECTION_CYCLE.md`** | Why 86 Figure Sequences questions are quarantined and not retired, and the one field that would lift it if a future official PDF documents the mechanic. |
| **`ME_MULTI_LETTER.md`** | The Mathematical Equations multi-letter form: officially demonstrated, deliberately not implemented. Documented so the gap stays a decision rather than an oversight. |
| **`COPYRIGHT_REVIEW.md`** | Technical review of the Core and GAM content against exam-confidentiality and copyright constraints. Not a legal opinion; one finding is explicitly referred out. |
| **`IP_AUDIT.md`** | Repository-wide intellectual-property audit — what each asset is, where it came from, and what licence governs it. |

## Running it as a business

| Document | What it is for |
|---|---|
| **`BUSINESS_SETUP.md`** | Business and tax requirements, and what only the operator can decide. Not advice; some of it must go to a chartered accountant. |
| **`INFRASTRUCTURE.md`** | Infrastructure, privacy and operational readiness, with a status legend per item. The fastest answer to "is this actually deployed?" |
| **`LEGAL_READINESS.md`** | What is cleared, what is drafted, and what is blocked on a qualified person. A status report rather than another brief. |
| **`WEBSITE_READINESS.md`** | What a visitor and a paying customer must be able to find, against what is actually there. Predates the public website built in November 2026, so read it as requirements rather than as a description. |
| **`AUTH_QA_PROCEDURE.md`** | The end-to-end auth and sync QA procedure. **Prepared and deliberately not run** — it needs an isolated project. This is what makes it runnable. |

## Subfolders

| Folder | What it holds |
|---|---|
| **`legal/`** | Policy drafts — privacy, terms, refunds, content policy — plus a brief prepared for a lawyer. **All drafts, none reviewed.** `content/legal/documents.ts` names these as the fuller source behind the published pages, so they are load-bearing, not scratch. |
| **`design-reference/`** | The v2 interactive prototype the current interface was built against. |
| **`archive/`** | Point-in-time reports. History, not instructions — see its own README. |
